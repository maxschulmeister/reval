import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@reval/core"],
  env: {
    REVAL_PROJECT_ROOT: process.env.REVAL_PROJECT_ROOT,
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Ignore warnings about dynamic requires
      config.ignoreWarnings = [
        /Critical dependency: the request of a dependency is an expression/,
      ];
    }
    config.resolve.alias.canvas = false;
    return config;
  },
};

export default nextConfig;
