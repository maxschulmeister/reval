import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@reval/core'],
  experimental: {
    esmExternals: 'loose'
  }
};

export default nextConfig;
