import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  // Heavy client-only viz libraries are loaded from CDN via <script> tags
  // (see src/lib/viz-libs/cdn-loader.tsx). Keep them out of BOTH server and
  // client bundles: serverExternalPackages for server, webpack externals for
  // client (maps `import x from 'echarts'` → `window.echarts` at runtime).
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
  allowedDevOrigins: ["*"],
};

export default nextConfig;
