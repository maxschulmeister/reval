import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@reval/core"],
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Ignore warnings about dynamic requires
      config.ignoreWarnings = [
        /Critical dependency: the request of a dependency is an expression/,
      ];
    }
    return config;
  },
};

export default nextConfig;
