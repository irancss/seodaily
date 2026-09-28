import type { NextConfig } from "next";

// Everything the site loads is its own: scripts, styles, fonts and uploaded
// images. Next.js bootstraps with inline scripts and React sets inline styles,
// hence 'unsafe-inline'; dev mode additionally needs eval for fast refresh.
// The Google hosts are what Google Tag Manager and GA4 need (Google's CSP
// guide); they are only contacted when a GTM ID is set in the admin.
const gtmScript = "https://www.googletagmanager.com";
const gaHosts = "https://*.google-analytics.com https://*.analytics.google.com https://*.googletagmanager.com";
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${process.env.NODE_ENV === "production" ? "" : " 'unsafe-eval'"} ${gtmScript}`,
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' data: blob: ${gaHosts}`,
  "font-src 'self' data:",
  `connect-src 'self' ${gaHosts}`,
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'self'",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  // Browsers honour this only over HTTPS; the site is HTTPS-only.
  { key: "Strict-Transport-Security", value: "max-age=31536000" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

const nextConfig: NextConfig = {
  // The Docker image runs the traced standalone server (see Dockerfile).
  output: "standalone",
  poweredByHeader: false,
  // Do not write AGENTS.md / CLAUDE.md into the repository during `next dev`.
  agentRules: false,
  compress: true,
  images: {
    // Uploaded pictures are served resized (WebP, per screen width) instead of
    // the original file, which may be a multi-megabyte screenshot.
    localPatterns: [{ pathname: "/uploads/**", search: "" }],
    // Upload names are never reused, so optimized copies never go stale.
    minimumCacheTTL: 31_536_000,
  },
  experimental: {
    serverActions: {
      // Images are uploaded through server actions (limit 5 MB + form fields).
      bodySizeLimit: "6mb",
    },
  },
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      {
        // Font files never change name, so they can be cached for a year.
        source: "/fonts/:file*",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
      { source: "/admin/:path*", headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }] },
    ];
  },
};

export default nextConfig;
