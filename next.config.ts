import type { NextConfig } from "next";

const imageHostnames = (process.env.NEXT_PUBLIC_IMAGE_HOSTS || 'prgassets.pgf-asu2nd.com,github.com,media.api-sports.io')
  .split(',')
  .map(hostname => hostname.trim())
  .filter(Boolean);

const nextConfig: NextConfig = {
  output: 'standalone',
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: imageHostnames.map(hostname => ({
      protocol: 'https',
      hostname,
    })),
  },
};

export default nextConfig;
