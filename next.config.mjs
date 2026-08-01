import { fileURLToPath } from "node:url";

const projectRoot = fileURLToPath(new URL(".", import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // This app is nested inside a workspace with another lockfile. Without an
  // explicit root, Turbopack walks up to the parent workspace and can hit
  // inaccessible folders while bundling or loading Vitest's config.
  turbopack: { root: projectRoot },
  async headers() {
    return [
      {
        // User uploads are immutable once written: let the CDN and browser
        // reuse them instead of downloading the same community media again.
        source: "/uploads/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
    ];
  },
  experimental: {
    cpus: 1,
    workerThreads: true,
    serverActions: { allowedOrigins: ["localhost:3000", "app.calibiai.com", "calibiai.com", "www.calibiai.com"] }
  }
};
export default nextConfig;
