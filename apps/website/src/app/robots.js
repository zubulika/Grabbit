import { SITE_URL } from './site-url';

export default function robots() {
  const baseUrl = SITE_URL;
  return {
    rules: {
      userAgent: '*',
      allow: '/',
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
