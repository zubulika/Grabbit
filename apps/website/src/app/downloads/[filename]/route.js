import { NextResponse } from 'next/server';

/**
 * Dynamic fallback downloader route.
 * Redirects any request to /downloads/{filename} directly to the official latest GitHub Release asset.
 */
export async function GET(request, { params }) {
  const resolvedParams = await params;
  const filename = resolvedParams?.filename || 'GrabbitSetup.exe';

  // Direct redirect to the official latest release on GitHub
  const releaseUrl = 'https://github.com/zubulika/Grabbit/releases/latest/download/GrabbitSetup.exe';

  return NextResponse.redirect(releaseUrl, {
    status: 307,
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    },
  });
}
