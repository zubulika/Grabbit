import Link from 'next/link';
import { notFound } from 'next/navigation';
import { platforms } from '../../platforms';
import { JsonLd, pageMetadata, WINDOWS_DOWNLOAD } from '../../seo';
import { SITE_URL } from '../../site-url';

export const dynamicParams = false;

export function generateStaticParams() {
  return platforms.map(({ slug }) => ({ platform: slug }));
}

export async function generateMetadata({ params }) {
  const { platform } = await params;
  const guide = platforms.find(({ slug }) => slug === platform);
  if (!guide) notFound();

  return pageMetadata(
    `/video-downloader/${guide.slug}`,
    `Free ${guide.name} Video Downloader Online | Grabbit`,
    `Save ${guide.media} as MP4 in your browser. Learn where to find the video link and what to try if it fails.`,
  );
}

export default async function PlatformGuide({ params }) {
  const { platform } = await params;
  const guide = platforms.find(({ slug }) => slug === platform);
  if (!guide) notFound();

  const title = `${guide.name} video downloader`;
  const url = `${SITE_URL}/video-downloader/${guide.slug}`;

  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-12 sm:py-20 text-gb-text-dim">
      <Link href="/" className="underline underline-offset-4">Grabbit video downloader</Link>
      <article className="mt-8 space-y-7">
        <header className="space-y-4">
          <h1 className="font-display text-4xl font-bold tracking-tight text-white sm:text-5xl">{title}</h1>
          <p className="leading-relaxed">
            Use Grabbit to download {guide.media} from an eligible public link.
            The free online downloader saves an available MP4 up to 50 MiB.
          </p>
          <Link href="/#download" className="inline-block rounded-gb bg-gb-accent px-5 py-3 font-bold text-white hover:bg-gb-accent-hover">
            Open the online downloader
          </Link>
        </header>
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-white">How to download {guide.media} from a link</h2>
          <ol className="list-decimal space-y-2 pl-6 leading-relaxed">
            <li>{guide.copyLink}</li>
            <li>Paste the link into Grabbit and select Download MP4.</li>
            <li>When the video is ready, find it in your browser downloads.</li>
          </ol>
          <p>Save content only when you have permission and the platform allows downloading.</p>
        </section>
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-white">Why isn’t my {guide.name} link working?</h2>
          <p className="leading-relaxed">{guide.troubleshooting}</p>
        </section>
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-white">Can I choose the video quality or download audio?</h2>
          <p>
            The browser downloader saves an available MP4.
            <a href={WINDOWS_DOWNLOAD} className="underline underline-offset-4">Get Grabbit for Windows</a> to choose a video quality or save MP3 audio when available.
          </p>
        </section>
      </article>
      <nav aria-label="Other video download guides" className="mt-10 border-t border-gb-border pt-6">
        <h2 className="mb-3 text-lg font-bold text-white">Other video download guides</h2>
        <ul className="flex flex-wrap gap-x-5 gap-y-2">
          {platforms.filter(({ slug }) => slug !== guide.slug).map(({ slug, name }) => (
            <li key={slug}><a className="underline underline-offset-4" href={`/video-downloader/${slug}`}>{name}</a></li>
          ))}
        </ul>
      </nav>
      <JsonLd data={{
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Grabbit', item: SITE_URL + '/' },
          { '@type': 'ListItem', position: 2, name: title, item: url },
        ],
      }} />
    </main>
  );
}
