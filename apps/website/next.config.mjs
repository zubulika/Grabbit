/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      {
        source: '/downloads/Grabbit-Setup.exe',
        destination: 'https://github.com/zubulika/Grabbit/releases/latest/download/GrabbitSetup.exe',
        permanent: false,
      },
      {
        source: '/downloads/GrabbitSetup.exe',
        destination: 'https://github.com/zubulika/Grabbit/releases/latest/download/GrabbitSetup.exe',
        permanent: false,
      },
      {
        source: '/download',
        destination: 'https://github.com/zubulika/Grabbit/releases/latest/download/GrabbitSetup.exe',
        permanent: false,
      },
      {
        source: '/downloads/windows',
        destination: 'https://github.com/zubulika/Grabbit/releases/latest/download/GrabbitSetup.exe',
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
