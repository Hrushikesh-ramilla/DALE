import type { NextConfig } from "next";

const config: NextConfig = {
  output: "standalone",
  outputFileTracingRoot: process.cwd(),
  poweredByHeader: false,
  agentRules: false,
  images: {
    maximumRedirects: 0,
    maximumResponseBody: 5_000_000,
    dangerouslyAllowLocalIP: false,
    minimumCacheTTL: 86400,
    maximumDiskCacheSize: 256 * 1024 * 1024,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "assets2.oakley.com",
        pathname: "/prod-onecp-record-files/**",
      },
      {
        protocol: "https",
        hostname: "images2.ray-ban.com",
        pathname: "//prod-onecp-record-files/**",
      },
      {
        protocol: "https",
        hostname: "www.tissotwatches.com",
        pathname: "/on/demandware.static/**",
      },
      {
        protocol: "https",
        hostname: "media.rolex.com",
        pathname: "/image/upload/**",
      },
      {
        protocol: "https",
        hostname: "cdsassets.apple.com",
        pathname: "/live/**",
      },
    ],
  },
  serverExternalPackages: [
    "@electric-sql/pglite",
    "pg",
    "sharp",
    "tesseract.js",
    "tesseract.js-core",
    "@tesseract.js-data/eng",
  ],
  outputFileTracingIncludes: {
    "/*": [
      "./node_modules/tesseract.js/**/*",
      "./node_modules/tesseract.js-core/**/*",
      "./node_modules/@tesseract.js-data/eng/**/*",
      "./deploy/local-ocr.mjs",
    ],
  },
  async redirects() {
    return [
      {
        source: "/demo",
        destination: "/",
        permanent: false,
      },
    ];
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(self), microphone=(self), geolocation=()",
          },
        ],
      },
    ];
  },
};
export default config;
