import Home from './Home';
import { JsonLd, pageMetadata, WINDOWS_DOWNLOAD } from './seo';
import { SITE_URL } from './site-url';

const title = 'Free Online Video Downloader for YouTube, TikTok & More | Grabbit';
const description = 'Download eligible videos from Facebook, Instagram, YouTube, TikTok, and X as MP4. Paste a public link to use the free Grabbit online video downloader.';

export const metadata = pageMetadata('/', title, description);

export default function HomePage() {
  return (
    <>
      <Home />
      <JsonLd data={{
        '@context': 'https://schema.org',
        '@graph': [
          {
            '@type': 'Organization',
            '@id': 'https://lmlogics.com/#organization',
            name: 'LM Logics',
            url: 'https://lmlogics.com',
          },
          {
            '@type': 'WebSite',
            '@id': SITE_URL + '/#website',
            name: 'Grabbit',
            url: SITE_URL + '/',
            publisher: { '@id': 'https://lmlogics.com/#organization' },
          },
          {
            '@type': 'WebApplication',
            '@id': SITE_URL + '/#web-app',
            name: 'Grabbit Online Video Downloader',
            url: SITE_URL + '/',
            applicationCategory: 'MultimediaApplication',
            description,
            offers: { '@type': 'Offer', price: 0, priceCurrency: 'USD' },
            publisher: { '@id': 'https://lmlogics.com/#organization' },
          },
          {
            '@type': 'SoftwareApplication',
            '@id': SITE_URL + '/#windows-app',
            name: 'Grabbit',
            url: SITE_URL + '/',
            downloadUrl: WINDOWS_DOWNLOAD,
            operatingSystem: 'Windows 10, Windows 11',
            applicationCategory: 'MultimediaApplication',
            description: "Free Windows app for downloading eligible videos and audio.",
            offers: { '@type': 'Offer', price: 0, priceCurrency: 'USD' },
            publisher: { '@id': 'https://lmlogics.com/#organization' },
          },
        ],
      }} />
    </>
  );
}
