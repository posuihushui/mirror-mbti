import type { NextConfig } from "next";

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
];

const nextConfig: NextConfig = {
  output: "standalone",
  outputFileTracingIncludes: {
    "/*": ["./src/fonts/**", "./src/assets/**"],
  },
  reactCompiler: true,
  cacheComponents: true,
  poweredByHeader: false,
  compress: true,
  images: {
    formats: ["image/avif", "image/webp"],
    qualities: [75, 82, 90],
    minimumCacheTTL: 60 * 60 * 24 * 30,
  },
  experimental: {
    optimizePackageImports: ["@phosphor-icons/react"],
    inlineCss: true,
    // Pages live under `app/[lang]`, so unmatched URLs need a layout-free 404 (`app/global-not-found.tsx`).
    globalNotFound: true,
  },
  async headers() {
    return [
      { source: "/(.*)", headers: securityHeaders },
      ...["/s/:path*", "/t/:path*", "/compare/:path*", "/my/shares/:path*", "/en/s/:path*", "/en/t/:path*", "/en/compare/:path*", "/en/my/shares/:path*", "/zh/s/:path*", "/zh/t/:path*", "/zh/compare/:path*", "/zh/my/shares/:path*"].map((source) => ({ source, headers: [
        { key: "Referrer-Policy", value: "no-referrer" },
        { key: "Cache-Control", value: "private, no-store" },
        { key: "X-Robots-Tag", value: "noindex, nofollow" },
      ] })),
    ];
  },
};

export default nextConfig;
