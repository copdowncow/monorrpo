/** @type {import('next').NextConfig} */
const nextConfig = {
  images: { unoptimized: true },
  // output: 'standalone' not needed - express custom server handles it
};
module.exports = nextConfig;
