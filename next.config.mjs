import { fileURLToPath } from "node:url";

const projectRoot = fileURLToPath(new URL(".", import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // This app is nested inside a workspace with another lockfile. Without an
  // explicit root, Turbopack walks up to the parent workspace and can hit
  // inaccessible folders while bundling or loading Vitest's config.
  turbopack: { root: projectRoot },
  experimental: {
    serverActions: { allowedOrigins: ["localhost:3000"] }
  }
};
export default nextConfig;
