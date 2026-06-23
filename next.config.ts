import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  // Heavy client-only viz libraries — externalize to CDN globals so the
  // webpack bundle stays small and the dev server doesn't OOM.
  serverExternalPackages: [
    "mermaid",
    "echarts",
    "@antv/infographic",
    "@antv/layout",
    "@antv/hierarchy",
    "linkedom",
    "postcss",
    "d3",
    "roughjs",
    "culori",
    "html2canvas",
  ],
  // Map library imports to globals loaded from CDN scripts (see VizLibLoader).
  // `var echarts` → window.echarts, etc. Only applied to client bundles.
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.externals = config.externals || []
      config.externals.push({
        echarts: 'echarts',
        mermaid: 'mermaid',
        '@antv/infographic': 'Infographic',
      })
    }
    return config
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
  ],
};

export default nextConfig;
