This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.js`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Browser downloads in production

The homepage sends an eligible public post URL to `POST /api/download` and saves the MP4 returned by the service. The Node.js process needs a current yt-dlp executable, FFmpeg on PATH for separate video and audio streams, and writable temporary storage. Set `GRABBIT_YTDLP_PATH` to the executable's absolute path when it is outside PATH or when deploying without the local Windows app. Use a Node host that supports streamed files and long-running requests.

Before making the endpoint public, run extraction in an isolated service or container with outbound private, loopback, link-local, and cloud metadata destinations blocked at the network layer. Apply ingress rate limits and verify download success on each advertised platform from that host. The built-in two-job limit is per process. Keep yt-dlp patched and monitor failures, transfer volume, and free temp space. Configure proxy timeouts for the 90-second extraction limit plus file transfer. If using the existing Vercel frontend with a separate service, route requests through a deployment configuration that preserves streaming and verify a transfer larger than 4.5 MB.

Reference: [Vercel function payload guidance](https://vercel.com/kb/guide/how-to-bypass-vercel-body-size-limit-serverless-functions).
