'use client';

import { useState } from 'react';

export default function WebDownloader() {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  async function download(event) {
    event.preventDefault();
    const { url } = Object.fromEntries(new FormData(event.currentTarget));
    setBusy(true);
    setMessage('Preparing your video…');

    try {
      const response = await fetch('/api/download', { method: 'POST', headers: { 'X-Grabbit-Download': '1' }, body: url });
      if (!response.ok) throw new Error((await response.json()).error);

      const fileUrl = URL.createObjectURL(await response.blob());
      const link = document.createElement('a');
      link.href = fileUrl;
      link.download = 'grabbit-video.mp4';
      document.body.append(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(fileUrl), 30_000);
      setMessage('Your download has started. Check your browser’s downloads.');
    } catch (error) {
      setMessage(error.message || 'The download failed. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={download} className="w-full max-w-2xl text-left">
      <label htmlFor="video-url" className="mb-2 block font-semibold text-white">Video link</label>
      <div className="flex flex-col gap-2 sm:flex-row">
        <input className="min-w-0 flex-1 rounded-gb border border-gb-border bg-gb-surface px-4 py-3 text-white"
          id="video-url" name="url" type="url" placeholder="https://…" required maxLength={2048} />
        <button disabled={busy} className="rounded-gb bg-gb-accent px-5 py-3 font-bold text-white disabled:opacity-60">
          {busy ? 'Preparing video…' : 'Download MP4'}
        </button>
      </div>
      <p className="mt-3 text-sm text-gb-text-dim">Free to use. Public videos with an eligible MP4 up to 50 MiB.</p>
      <p role="status" className="mt-2 text-sm text-white">{message}</p>
    </form>
  );
}
