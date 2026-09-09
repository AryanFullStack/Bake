import { fileURLToPath } from "node:url";
import tempoNextjsPlugin from "tempo-sdk/nextjs/plugin";

const root = fileURLToPath(new URL(".", import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  images: {
    unoptimized: true,
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "*.supabase.co" },
      { protocol: "https", hostname: "ik.imagekit.io" },
    ],
  },
  outputFileTracingRoot: root,
};

export default process.env.TEMPO ? tempoNextjsPlugin()(nextConfig) : nextConfig;
