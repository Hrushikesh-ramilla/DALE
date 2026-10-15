import type { NextConfig } from "next";

const config: NextConfig = {
  output: "standalone",
  outputFileTracingRoot: process.cwd(),
  poweredByHeader: false,
  agentRules: false,
  images: {
    formats: ["image/avif", "image/webp"],
    maximumRedirects: 2,
    maximumResponseBody: 10_000_000,
    dangerouslyAllowLocalIP: false,
    minimumCacheTTL: 31536000,
    maximumDiskCacheSize: 512 * 1024 * 1024,
    deviceSizes: [360, 640, 750, 1080],
    imageSizes: [64, 128, 256, 384, 512, 600],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "upload.wikimedia.org",
      },
      {
        protocol: "https",
        hostname: "thumb.wikimedia.org",
      },
      {
        protocol: "https",
        hostname: "cdn.shopify.com",
      },
      {
        protocol: "https",
        hostname: "www.franciskurkdjian.com",
      },
      {
        protocol: "https",
        hostname: "assets2.oakley.com",
      },
      {
        protocol: "https",
        hostname: "images2.ray-ban.com",
      },
      {
        protocol: "https",
        hostname: "www.tissotwatches.com",
      },
      {
        protocol: "https",
        hostname: "media.rolex.com",
      },
      {
        protocol: "https",
        hostname: "cdsassets.apple.com",
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
