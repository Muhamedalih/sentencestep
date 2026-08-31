import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // kokoro-js resolves its voice weight files (voices/<code>.bin) with
  // path.resolve(__dirname, "../voices/...") relative to its own installed
  // location. Left to webpack, the server bundle rewrites __dirname to
  // .next/server/ instead of node_modules/kokoro-js/dist/, so every
  // generate() call fails with ENOENT looking for .next/server/voices/*.bin.
  // Excluding it (and its native/runtime deps) from bundling makes Next load
  // it via real Node require() at runtime, keeping __dirname correct.
  serverExternalPackages: ["kokoro-js", "onnxruntime-node", "@huggingface/transformers"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
