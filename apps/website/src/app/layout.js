import { Geist, Geist_Mono, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  subsets: ["latin"],
});

export const metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://grabbit.vercel.app'),
  title: "Grabbit — Grab anything from the internet",
  description: "A simple, lightning-fast app to download video, audio, and media from the internet. Paste a link and grab your files instantly, with zero configuration required.",
  authors: [{ name: "LM Logics", url: "https://lmlogics.com" }],
  creator: "LM Logics",
  publisher: "LM Logics",
  other: {
    "developer": "LM Logics",
    "developer-url": "https://lmlogics.com",
    "maintained-by": "LM Logics",
    "organization": "LM Logics",
  },
  alternates: {
    canonical: "./",
  },
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: "Grabbit — Grab anything from the internet",
    description: "A simple, lightning-fast app to download video, audio, and media from the internet. Paste a link and grab your files instantly, with zero configuration required.",
    url: "./",
    siteName: "Grabbit",
    type: "website",
    seeAlso: ["https://lmlogics.com"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Grabbit — Grab anything from the internet",
    description: "A simple, lightning-fast app to download video, audio, and media from the internet. Paste a link and grab your files instantly, with zero configuration required.",
  },
};

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": "https://lmlogics.com/#organization",
  "name": "LM Logics",
  "url": "https://lmlogics.com",
  "description": "Software engineering company creating high-performance digital tools, native desktop software, and cloud applications.",
  "sameAs": [
    "https://github.com/zubulika"
  ]
};

const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "Grabbit",
  "alternateName": ["Grabbit Downloader", "Grabbit App"],
  "url": process.env.NEXT_PUBLIC_APP_URL || "https://grabbit.vercel.app",
  "creator": {
    "@type": "Organization",
    "@id": "https://lmlogics.com/#organization",
    "name": "LM Logics",
    "url": "https://lmlogics.com"
  },
  "publisher": {
    "@type": "Organization",
    "@id": "https://lmlogics.com/#organization",
    "name": "LM Logics",
    "url": "https://lmlogics.com"
  }
};

const appJsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "Grabbit",
  "operatingSystem": "Windows, macOS, Linux, Android",
  "applicationCategory": "MultimediaApplication",
  "author": {
    "@type": "Organization",
    "@id": "https://lmlogics.com/#organization",
    "name": "LM Logics",
    "url": "https://lmlogics.com"
  },
  "creator": {
    "@type": "Organization",
    "@id": "https://lmlogics.com/#organization",
    "name": "LM Logics",
    "url": "https://lmlogics.com"
  },
  "publisher": {
    "@type": "Organization",
    "@id": "https://lmlogics.com/#organization",
    "name": "LM Logics",
    "url": "https://lmlogics.com"
  },
  "maintainer": {
    "@type": "Organization",
    "@id": "https://lmlogics.com/#organization",
    "name": "LM Logics",
    "url": "https://lmlogics.com"
  },
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "USD",
  },
  "description": "A simple, lightning-fast app to download video, audio, and media from the internet. Paste a link and grab your files instantly, with zero configuration required.",
  "softwareVersion": "1.0.2",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${plusJakarta.variable} h-full antialiased`}
    >
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(appJsonLd) }}
        />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
