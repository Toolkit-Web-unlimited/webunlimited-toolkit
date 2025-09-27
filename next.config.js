/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
  images: { dangerouslyAllowSVG: true, contentDispositionType: 'attachment' }
};
module.exports = nextConfig;