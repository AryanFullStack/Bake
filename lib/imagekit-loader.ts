/**
 * Custom Next.js image loader for ImageKit CDN.
 *
 * When the src is an ImageKit URL, this loader rewrites the ?tr= param so
 * ImageKit handles all resizing / format conversion itself — the browser hits
 * ImageKit directly and the slow /_next/image proxy is bypassed entirely.
 *
 * For every other URL (local public files, Supabase, Unsplash…) the src is
 * returned unchanged; Next.js / the browser handles them normally.
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

  // ── Everything else: return as-is ──────────────────────────────────────
  // Covers: /public static files, /api/media/serve/*, Supabase, Unsplash, etc.
  // Next.js will serve local files directly; unoptimized=true is set on those
  // components where needed (e.g. SafeImage for VPS media).
  return src;
}
