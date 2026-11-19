import { pageMetadata } from '../seo';

export const metadata = pageMetadata(
  '/docs',
  'Grabbit Documentation | Setup, Features & API',
  'Learn how to set up Grabbit for Windows, download in your browser, and build the project or use its metadata API.',
);

export default function DocsLayout({ children }) {
  return children;
}
