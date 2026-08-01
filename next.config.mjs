import { fileURLToPath } from "node:url";

const projectRoot = fileURLToPath(new URL(".", import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  turbopack: { root: projectRoot },
  async headers() {
    return [
      {
        source: "/uploads/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
    ];
  },
  experimental: {
    // Cap build workers + use threads: shared hosts kill the build with
    // spawn EAGAIN (per-user process limit) otherwise.
    cpus: 1,
    workerThreads: true,
    serverActions: {
      allowedOrigins: ["localhost:3000", "app.calibiai.com", "calibiai.com", "www.calibiai.com"],
    },
  },
};
export default nextConfig;
