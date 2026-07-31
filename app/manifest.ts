import type { MetadataRoute } from "next";

/**
 * Web App Manifest, served by Next at `/manifest.webmanifest`.
 *
 * Using the typed App Router convention (rather than a static JSON file) means
 * the manifest is type-checked at build time and can never drift out of sync
 * with the icon files on disk.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "CalibiAI — Verified Applied-AI Engineers",
    short_name: "CalibiAI",
    description:
      "Build a verified applied-AI profile: personalized roadmaps, daily learning, AI-reviewed projects, and a community that connects you with startups hiring on proof.",
    id: "/",
    start_url: "/dashboard",
    scope: "/",
    display: "standalone",
    // Graceful degradation for browsers that do not support `standalone`.
    display_override: ["standalone", "minimal-ui", "browser"],
    orientation: "portrait-primary",
    theme_color: "#111c38",
    background_color: "#f5f9ff",
    lang: "en",
    dir: "ltr",
    categories: ["education", "productivity", "business"],
    icons: [
      { src: "/icons/favicon-16.png", sizes: "16x16", type: "image/png" },
      { src: "/icons/favicon-32.png", sizes: "32x32", type: "image/png" },
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-256.png", sizes: "256x256", type: "image/png", purpose: "any" },
      { src: "/icons/icon-384.png", sizes: "384x384", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      // Maskable icons let Android crop to any device shape without clipping.
      { src: "/icons/icon-maskable-192.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    // Long-press the home screen icon to jump straight to a destination.
    shortcuts: [
      {
        name: "Today's Learning",
        short_name: "Learn",
        description: "Jump into today's roadmap day",
        url: "/roadmap",
        icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }],
      },
      {
        name: "Community",
        short_name: "Community",
        description: "See what other engineers are building",
        url: "/community",
        icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }],
      },
      {
        name: "Learning Hub",
        short_name: "Hub",
        description: "Browse phases and modules",
        url: "/learning-hub",
        icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }],
      },
    ],
    prefer_related_applications: false,
  };
}
