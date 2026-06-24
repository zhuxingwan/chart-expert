import type { NextConfig } from "next";
import WebpackObfuscator from "webpack-obfuscator";

const nextConfig: NextConfig = {
  output: "standalone",
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  // ECharts and Mermaid are loaded from CDN via <script> tags.
  // @antv/infographic is bundled directly. In production builds, obfuscate
  // the license verification code.
  webpack: (config, { isServer, dev }) => {
    if (!isServer) {
      config.externals = config.externals || [];
      (config.externals as Array<Record<string, string>>).push({
        echarts: "echarts",
        mermaid: "mermaid",
      });
    }
    if (!dev && !isServer) {
      config.plugins = config.plugins || [];
      config.plugins.push(
        new WebpackObfuscator(
          {
            include: [/src\/lib\/license\//, /src\/components\/license\//],
            compact: true,
            controlFlowFlattening: true,
            controlFlowFlatteningThreshold: 0.75,
            stringArray: true,
            stringArrayEncoding: ["base64"],
            stringArrayThreshold: 0.75,
            selfDefending: true,
          },
          [],
        ),
      );
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
