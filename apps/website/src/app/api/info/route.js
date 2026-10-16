import { NextResponse } from 'next/server';

const IMAGE_EXTENSIONS = new Set(['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg', 'avif', 'bmp']);

function normalizeUrl(raw) {
  let u = (raw || '').trim();
  if (u && !/^https?:\/\//i.test(u)) {
    u = 'https://' + u;
  }
  return u;
}

function isValidUrl(url) {
  const normalized = normalizeUrl(url);
  try {
    const parsed = new URL(normalized);
    return Boolean(parsed.hostname && parsed.hostname.includes('.'));
  } catch {
    return false;
  }
}

function getUrlExtension(url) {
  try {
    const pathname = new URL(url).pathname;
    const lastPart = pathname.split('/').pop() || '';
    const ext = lastPart.split('.').pop() || '';
    return ext.toLowerCase();
  } catch {
    return '';
  }
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const rawUrl = searchParams.get('url');

  if (!rawUrl) {
    return NextResponse.json({ success: false, error: 'URL parameter is required' }, { status: 400 });
  }

  const url = normalizeUrl(rawUrl);

  if (!isValidUrl(url)) {
    return NextResponse.json({ success: false, error: 'Please enter a valid link or URL' }, { status: 400 });
  }

  const ext = getUrlExtension(url);
  const isImage = IMAGE_EXTENSIONS.has(ext);

  // 1. Direct Image Link
  if (isImage) {
    const filename = url.split('/').pop()?.split('?')[0] || 'Image';
    return NextResponse.json({
      success: true,
      data: {
        title: decodeURIComponent(filename),
        thumbnail: url,
        duration: '',
        channel: new URL(url).hostname,
        formats: [
          { id: 'image', label: `Download Image (${ext.toUpperCase()})`, type: 'image' }
        ]
      }
    });
  }

  // 2. YouTube / YouTube Music URL
  const isYouTube = /youtube\.com|youtu\.be/i.test(url);

  try {
    if (isYouTube) {
      const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`;
      const response = await fetch(oembedUrl, { signal: AbortSignal.timeout(5000) });
      
      if (response.ok) {
        const info = await response.json();
        
        return NextResponse.json({
          success: true,
          data: {
            title: info.title || 'Untitled Video',
            thumbnail: info.thumbnail_url || 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?auto=format&fit=crop&w=800&q=80',
            duration: '0:00',
            channel: info.author_name || 'Creator',
            formats: [
              { id: '1080p', label: '1080p MP4', height: 1080, type: 'video' },
              { id: '720p', label: '720p MP4', height: 720, type: 'video' },
              { id: '480p', label: '480p MP4', height: 480, type: 'video' },
              { id: 'audio', label: 'Audio Only (MP3)', type: 'audio' }
            ]
          }
        });
      }
    }

    // 3. Universal Media / Social Media Link (Instagram Reels, TikTok, Twitter/X, Facebook, etc.)
    let domain = new URL(url).hostname.replace(/^www\./, '');
    let title = `${domain.charAt(0).toUpperCase() + domain.slice(1)} Media`;
    let channel = `${domain.charAt(0).toUpperCase() + domain.slice(1)} Creator`;
    let thumbnail = 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?auto=format&fit=crop&w=800&q=80';

    if (/instagram\.com/i.test(url)) {
      title = 'Instagram Reel / Media';
      channel = 'Instagram Creator';
      thumbnail = 'https://images.unsplash.com/photo-1611162616305-c69b3fa7fbe0?auto=format&fit=crop&w=800&q=80';
    } else if (/tiktok\.com/i.test(url)) {
      title = 'TikTok Video';
      channel = 'TikTok Creator';
    } else if (/twitter\.com|x\.com/i.test(url)) {
      title = 'X / Twitter Media';
      channel = 'X Creator';
    } else if (/facebook\.com|fb\.watch/i.test(url)) {
      title = 'Facebook Reel';
      channel = 'Facebook Creator';
    }

    return NextResponse.json({
      success: true,
      data: {
        title,
        thumbnail,
        duration: '0:00',
        channel,
        formats: [
          { id: 'best', label: 'Best Quality (MP4)', type: 'video' },
          { id: 'audio', label: 'Audio Only (MP3)', type: 'audio' }
        ]
      }
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Failed to retrieve media metadata. Please try again or download Grabbit desktop.'
    }, { status: 500 });
  }
}
