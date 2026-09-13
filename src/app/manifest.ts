import type { MetadataRoute } from "next";

/**
 * Drives the browser's "Install as app" icon/name for the desktop and
 * Android home-screen shortcut. Without this file (and the PNG icons it
 * points at — the SVG favicon alone isn't enough for Chrome's installer),
 * Chrome falls back to a screenshot of the page as the shortcut's icon
 * instead of the actual SentenceStep mark.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "SentenceStep — Learn English, letter by letter",
    short_name: "SentenceStep",
    description:
      "Hear a sentence, type it letter by letter, and build fluency through Normal, Stories, and Conversation lessons.",
    start_url: "/",
    display: "standalone",
    background_color: "#f5f3fa",
    theme_color: "#4F3FE0",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-512-maskable.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
