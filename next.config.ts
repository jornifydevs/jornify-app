import { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

// Covers whichever Supabase the env points to, including the local one.
const supabaseStoragePatterns = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? [
      new URL(
        "/storage/v1/object/public/**",
        process.env.NEXT_PUBLIC_SUPABASE_URL
      ),
    ]
  : [];

const nextConfig = {
  pageExtensions: ["ts", "tsx", "mdx"],
  images: {
    // Local Supabase serves storage from 127.0.0.1, which Next blocks by default.
    dangerouslyAllowLocalIP: process.env.NODE_ENV === "development",
    remotePatterns: [
      { protocol: "https", hostname: "*.supabase.co" },
      { protocol: "https", hostname: "pbs.twimg.com" },
      ...supabaseStoragePatterns,
    ],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains; preload",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
        ],
      },
    ];
  },
} satisfies NextConfig;

export default withNextIntl(nextConfig);
