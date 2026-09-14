/**
 * Custom Next.js image loader for ImageKit CDN.
 *
 * When the src is an ImageKit URL, this loader rewrites the ?tr= param so
 * ImageKit handles all resizing / format conversion itself — the browser hits
 * ImageKit directly and the slow /_next/image proxy is bypassed entirely.
 *
 * For every other URL (local public files, Supabase, Unsplash…) the loader
 * returns a URL with width & quality query params to satisfy Next.js's loader contract.
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

  // ── Non-ImageKit URLs (local public files, etc.) ─────────────────────────
  // Next.js requires custom loaders to return a URL that reflects the requested width.
  const join = src.includes("?") ? "&" : "?";
  return `${src}${join}w=${width}&q=${quality ?? 75}`;
}
