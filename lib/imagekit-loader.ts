/**
 * Custom Next.js image loader for ImageKit CDN.
 *
 * When the src is an ImageKit URL, this loader rewrites the ?tr= param so
 * ImageKit handles all resizing / format conversion itself — the browser hits
 * ImageKit directly and the slow /_next/image proxy is bypassed entirely.
 *
 * Other raster images use the cached Next.js optimizer for actual resizing.
 */
export default function imagekitLoader({
  src,
  width,
  quality,
}: {
  src: string;
  width: number;
  quality?: number;
}): string {
  if (!src) return src;

  // ── ImageKit URLs: delegate transforms to ImageKit CDN ──────────────────
  if (src.includes("ik.imagekit.io") || src.includes("imagekit.io")) {
    try {
      const url = new URL(src);
      const q = quality ?? 80;
      // Replace any existing ?tr= to avoid stacking transforms
      url.searchParams.set("tr", `w-${width},q-${q},f-auto`);
      return url.toString();
    } catch {
      return src;
    }
  }

  // Static SVGs do not benefit from raster optimization.
  if (src.split(/[?#]/)[0].toLowerCase().endsWith(".svg")) return src;

  // Local and supported remote images need real resizing, not ignored ?w= params.
  // Keep ImageKit on its CDN above; use Next's cached optimizer for other sources.
  return `/_next/image?url=${encodeURIComponent(src)}&w=${width}&q=${quality ?? 75}`;
}
