import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  // echarts (62MB) and mermaid (76MB) are loaded from CDN via <script> tags
  // (see src/lib/viz-libs/cdn-loader.tsx). @antv/infographic (17MB, compiles
  // to ~870KB) is small enough to bundle directly — its UMD build has hidden
  // external deps (lodash, graphlib) that make CDN loading fragile.
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.externals = config.externals || [];
      (config.externals as Array<Record<string, string>>).push({
        echarts: "echarts",
        mermaid: "mermaid",
      });
    }
    return config;
  },
  allowedDevOrigins: [
    "127.0.0.1",
    "localhost",
    "http://127.0.0.1",
    "http://localhost",
    "http://127.0.0.1:81",
    "http://localhost:81",
    "http://127.0.0.1:3000",
    "http://localhost:3000",
    "http://21.0.12.71:81",
    "http://21.0.12.71:3000",
    "https://*.space-z.ai",
    "http://*.space-z.ai",
  ],
};

export default nextConfig;
