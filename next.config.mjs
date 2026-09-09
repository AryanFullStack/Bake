import { fileURLToPath } from "node:url";
import tempoNextjsPlugin from "tempo-sdk/nextjs/plugin";

const root = fileURLToPath(new URL(".", import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  images: {
    qualities: [60, 70, 75, 80, 85, 90],
    formats: ["image/avif", "image/webp"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 2592000,
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "*.supabase.co" },
      { protocol: "https", hostname: "ik.imagekit.io" },
    ],
  },
  outputFileTracingRoot: root,
};

export default process.env.TEMPO ? tempoNextjsPlugin()(nextConfig) : nextConfig;
