/** @type {import('next').NextConfig} */
const rawApiUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api/v1';

const apiBase = rawApiUrl.replace(/\/+$/, '');

const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  transpilePackages: ['@mui/material', '@mui/icons-material', '@mui/x-date-pickers'],
  async rewrites() {
    return [
      {
        source: '/api/v1/:path*',
        destination: `${apiBase}/:path*`,
      },
    ];
  },
};

export default nextConfig;
