import { fileURLToPath } from "node:url";

const projectRoot = fileURLToPath(new URL(".", import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  turbopack: { root: projectRoot },
  // Mermaid is a browser-only library (~1 MB) that touches `document` at
  // import time.  Without this it gets pulled into the server bundle by
  // Turbopack and the dynamic import silently fails in production, causing
  // flowcharts to fall back to raw source code.
  serverExternalPackages: ["mermaid"],
  async headers() {
    return [
      {
        source: "/uploads/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
    ];
  },
  webpack(config, { isServer }) {
    // Ensure mermaid is never bundled into the server chunk — it is
    // browser-only and crashes Node at import time.
    if (isServer) {
      config.externals = config.externals ?? [];
      if (Array.isArray(config.externals)) {
        config.externals.push("mermaid");
      }
    }
    return config;
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
