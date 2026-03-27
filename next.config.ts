import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // We deploy this app as a fully static site (no server runtime required).
  // This makes it compatible with Cloudflare Pages (and similar static hosts)
  // without requiring any special Next.js runtime adapter.
  output: "export",

  // Static export + next/image requires unoptimized mode.
  images: {
    unoptimized: true,
  },

  // Helps static hosts that map /route → /route/index.html.
  trailingSlash: true,
};

export default nextConfig;
