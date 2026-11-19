import { execFile } from 'node:child_process';
import { createReadStream } from 'node:fs';
import { mkdtemp, readdir, rm, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { Readable } from 'node:stream';
import { promisify } from 'node:util';

export const runtime = 'nodejs';
export const maxDuration = 120;

const run = promisify(execFile);
const maxBytes = 50 * 1024 * 1024;
const routes = [
  [/^(www\.|m\.)?youtube\.com$/, /^\/(watch|shorts\/[\w-]+)\/?$/],
  [/^youtu\.be$/, /^\/[\w-]+\/?$/],
  [/^(www\.)?instagram\.com$/, /^\/(reels?|p)\/[\w-]+\/?$/],
  [/^(www\.|m\.)?facebook\.com$/, /^\/(reels?\/\d+|watch\/?|share\/[vr]\/[\w-]+|[\w.-]+\/videos\/\d+)\/?$/],
  [/^fb\.watch$/, /^\/[\w-]+\/?$/],
  [/^(www\.)?tiktok\.com$/, /^\/@[\w.-]+\/video\/\d+\/?$/],
  [/^(vm|vt)\.tiktok\.com$/, /^\/[\w-]+\/?$/],
  [/^(www\.|mobile\.)?(x|twitter)\.com$/, /^\/(?:[\w]+|i\/web)\/status\/\d+(?:\/video\/\d+)?\/?$/],
];
let activeDownloads = 0;
const mp4 = 'best[ext=mp4][protocol=https][filesize<=?52428800]';
const video = 'bestvideo[ext=mp4][protocol=https][filesize<=41943040]';
const audio = 'bestaudio[ext=m4a][protocol=https][filesize<=8388608]';

function videoUrl(input) {
  if (typeof input !== 'string' || input.length > 2048) return null;

  try {
    const url = new URL(input.trim());
    if (url.protocol !== 'https:' || url.username || url.password || url.port) return null;
    if (!routes.some(([host, path]) => host.test(url.hostname) && path.test(url.pathname))) return null;

    // Keep only the identifiers used by the watch pages.
    const parameter = url.pathname.replace(/\/$/, '') === '/watch' ? 'v' : null;
    const id = parameter && url.searchParams.get(parameter);
    if (parameter && !/^[\w-]+$/.test(id ?? '')) return null;
    url.search = parameter ? new URLSearchParams({ [parameter]: id }).toString() : '';
    url.hash = '';
    return url.href;
  } catch {
    return null;
  }
}

function error(message, status) {
  return Response.json({ error: message }, { status, headers: { 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex' } });
}

export async function POST(request) {
  if (request.headers.get('X-Grabbit-Download') !== '1') {
    return error('Open Grabbit to start a download.', 403);
  }

  const reader = request.body?.getReader();
  if (!reader) return error('Enter a public video link.', 400);

  let input = '';
  let bytes = 0;
  const decoder = new TextDecoder();
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    bytes += value.byteLength;
    if (bytes > 8192) {
      await reader.cancel();
      return error('The link is too long.', 400);
    }
    input += decoder.decode(value, { stream: true });
  }

  const url = videoUrl(input + decoder.decode());
  if (!url) return error('Enter a public HTTPS video or post link from a supported platform.', 400);
  if (activeDownloads >= 2) return error('The downloader is busy. Try again shortly.', 429);

  const executable = process.env.GRABBIT_YTDLP_PATH ||
    (process.platform === 'win32' ? resolve(process.cwd(), '../windows/resources/bin/yt-dlp.exe') : 'yt-dlp');

  activeDownloads++;
  let directory;
  let streaming = false;
  try {
    directory = await mkdtemp(join(tmpdir(), 'grabbit-'));
    const output = join(directory, 'video.mp4');
    const job = run(executable, [
      '--ignore-config', '--no-cache-dir', '--no-playlist', '--no-progress', '--fixup', 'never', '--js-runtimes', 'node',
      '--use-extractors', 'default,-generic', '--socket-timeout', '10', '--retries', '0',
      '--max-filesize', String(maxBytes), '--match-filters', '!is_live',
      '--format', `${mp4}/${video}+${audio}`, '--merge-output-format', 'mp4',
      '--output', output, '--', url,
    ], { timeout: 90_000, maxBuffer: 256 * 1024, windowsHide: true, signal: request.signal });

    const abortOversize = setInterval(async () => {
      try {
        const names = await readdir(directory);
        const sizes = await Promise.all(names.map((name) => stat(join(directory, name))));
        if (sizes.some((file) => file.size > maxBytes)) job.child.kill();
      } catch {
        // yt-dlp can rename its temporary output while we check its size.
      }
    }, 250);

    try {
      await job;
    } finally {
      clearInterval(abortOversize);
    }

    const file = await stat(output);
    if (!file.size || file.size > maxBytes) return error('This video exceeds the 50 MiB download limit.', 422);
    const stream = createReadStream(output);
    const downloadDirectory = directory;
    stream.once('close', async () => {
      await rm(downloadDirectory, { recursive: true, force: true }).catch(() => {});
      activeDownloads--;
    });
    streaming = true;
    return new Response(Readable.toWeb(stream), {
      headers: {
        'Content-Type': 'video/mp4',
        'Content-Disposition': 'attachment; filename="grabbit-video.mp4"',
        'Cache-Control': 'no-store',
        'X-Robots-Tag': 'noindex',
      },
    });
  } catch (failure) {
    if (failure.code === 'ENOENT' && failure.path === executable) {
      return error('The download service is unavailable right now. Please try again later.', 503);
    }
    return error('No downloadable MP4 was found. Check that the video is public and try the original post link.', 422);
  } finally {
    if (!streaming) {
      if (directory) await rm(directory, { recursive: true, force: true }).catch(() => {});
      activeDownloads--;
    }
  }
}
