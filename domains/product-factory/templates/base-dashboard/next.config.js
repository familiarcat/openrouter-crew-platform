/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Enable standalone output for Docker deployment
  output: 'standalone',
  // Optimize images for production
  images: {
    unoptimized: process.env.NODE_ENV === 'development',
  },
  turbopack: {
    root: __dirname,
  },
};
module.exports = nextConfig;
