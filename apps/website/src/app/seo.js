import { SITE_URL } from './site-url';

export { WINDOWS_DOWNLOAD } from './site-url';

export function pageMetadata(path, title, description) {
  const url = new URL(path, SITE_URL).href;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { type: 'website', siteName: 'Grabbit', url, title, description },
    twitter: { card: 'summary', title, description },
  };
}

export function JsonLd({ data }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, '\\u003c') }}
    />
  );
}
