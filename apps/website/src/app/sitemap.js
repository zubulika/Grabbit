import { platforms } from './platforms';
import { SITE_URL } from './site-url';

export default function sitemap() {
  return [
    '/',
    '/docs',
    ...platforms.map(({ slug }) => `/video-downloader/${slug}`),
  ].map((path) => ({ url: path === "/" ? SITE_URL : new URL(path, SITE_URL).href }));
}
