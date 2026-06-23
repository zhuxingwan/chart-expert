import type { NextConfig } from "next";
import WebpackObfuscator from "webpack-obfuscator";

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
  webpack: (config, { isServer, dev }) => {
    if (!isServer) {
      config.externals = config.externals || [];
      (config.externals as Array<Record<string, string>>).push({
        echarts: "echarts",
        mermaid: "mermaid",
      });
    }
    // Obfuscate the license verification code in production builds only.
    // This protects the PRO validation logic from being easily reverse-engineered.
    if (!dev && !isServer) {
      config.plugins = config.plugins || [];
      config.plugins.push(
        new WebpackObfuscator(
          {
            // Only apply to the license module — keep the rest of the bundle
            // readable for debugging and source maps.
            exclude: [/node_modules/, /(?<!license)\.(ts|tsx)$/],
            include: [/src\/lib\/license\//, /src\/components\/license\//],
            // Medium obfuscation — balances protection vs performance
            compact: true,
            controlFlowFlattening: true,
            controlFlowFlatteningThreshold: 0.75,
            deadCodeInjection: true,
            deadCodeInjectionThreshold: 0.4,
            debugProtection: true,
            debugProtectionInterval: 2000,
            disableConsoleOutput: false,
            identifierNamesGenerator: "hexadecimal",
            log: false,
            numbersToExpressions: true,
            renameGlobals: false,
            selfDefending: true,
            simplify: true,
            splitStrings: true,
            splitStringsChunkLength: 5,
            stringArray: true,
            stringArrayCallsTransform: true,
            stringArrayCallsTransformThreshold: 0.75,
            stringArrayEncoding: ["base64"],
            stringArrayIndexShift: true,
            stringArrayRotate: true,
            stringArrayShuffle: true,
            stringArrayWrappersCount: 2,
            stringArrayWrappersChainedCalls: true,
            stringArrayWrappersParametersMaxCount: 4,
            stringArrayWrappersType: "function",
            stringArrayThreshold: 0.75,
            transformObjectKeys: true,
            unicodeEscapeSequence: false,
          },
          ["vendor.js"],
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
