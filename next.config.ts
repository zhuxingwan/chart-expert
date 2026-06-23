import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  // The three viz libraries are loaded from CDN via <script> tags
  // (see src/lib/viz-libs/cdn-loader.tsx). Externalize them so webpack
  // never tries to bundle 200MB+ of source — keeps the dev server light.
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.externals = config.externals || [];
      (config.externals as Array<Record<string, string>>).push({
        echarts: "echarts",
        mermaid: "mermaid",
        "@antv/infographic": "AntVInfographic",
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
  ],
};

export default nextConfig;
