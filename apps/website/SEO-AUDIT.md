# Grabbit search audit

## Production baseline

The branded homepage, browser demo, and docs returned HTTP 200. Their canonical tags and the sitemap pointed to the Vercel hostname. The Vercel hostname returned JavaScript for the homepage request. The Windows download URL on the branded site returned a 404. The Windows and Android release links are published on GitHub.

The Windows app uses yt-dlp and FFmpeg to save available formats. The production baseline exposed a simulated download flow. The updated homepage retrieves eligible MP4s through yt-dlp and FFmpeg. Search results commonly addressed platform-specific links and formats such as Reels, Shorts, and MP4. The search positioning focuses on free browser downloads by link, with Windows and Android installs available as alternatives.

## Search intent by page

| Page | Search intent |
| --- | --- |
| Homepage | Free online video downloader and how to download an MP4 from a link |
| Facebook | Copy a Facebook video or Reel link |
| Instagram | Save an Instagram Reel or video post |
| YouTube | Save an eligible YouTube video or Short |
| TikTok | Save a TikTok clip using a share link |
| X | Save a video from an X or Twitter post |
| Documentation | Set up and use Grabbit |

## Verification and rollout

The production build prerenders the homepage, platform guides and docs. Local Googlebot HTTP checks verified status 200, visible headings, unique titles, descriptions, matching sitemap and canonical URLs, crawlable guide links, and valid JSON-LD parsing. Unknown pages returned 404 with noindex. A local YouTube test returned a 29,973,170-byte MP4. Facebook, Instagram, TikTok, and X still need successful end-to-end tests from the production host. The old /app route redirects to the homepage downloader.

Deploy from the website project and verify the public URLs again. Configure the legacy Vercel production hostname to redirect to the branded domain, preserving paths where the two routes correspond. Check installer links after deployment. Submit the branded sitemap in Google Search Console and inspect the homepage and platform guides. Use the Search Console indexing and performance reports to identify excluded pages and queries earning impressions. Link to the branded homepage from LM Logics and the GitHub project and share a browser download walkthrough.

- [Google SEO Starter Guide](https://developers.google.com/search/docs/fundamentals/seo-starter-guide)
- [Google Search AI features](https://developers.google.com/search/docs/appearance/ai-features)
