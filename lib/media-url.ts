/**
 * Centralized Media URL Resolver Utility
 * 
 * Normalizes image paths and URLs across the application so that VPS-hosted
 * product media is consistently served via the dedicated media API route (`/api/media/serve/...`).
 */

export const DEFAULT_FALLBACK_IMAGE = "/placeholder-bake.svg";

/**
 * Resolves any image path, relative storage reference, or full URL to a canonical display URL.
 * 
 * Examples:
 * - "/uploads/products/product_1788856725_9a177d.webp" -> "/api/media/serve/products/product_1788856725_9a177d.webp"
 * - "uploads/products/product_1788856725_9a177d.webp"  -> "/api/media/serve/products/product_1788856725_9a177d.webp"
 * - "products/product_1788856725_9a177d.webp"          -> "/api/media/serve/products/product_1788856725_9a177d.webp"
 * - "/api/media/serve/products/product_...webp"       -> "/api/media/serve/products/product_...webp"
 * - "https://images.unsplash.com/photo-..."           -> "https://images.unsplash.com/photo-..."
 * - "/bakery.png" (static public asset)                -> "/bakery.png"
 * - null / undefined / ""                              -> "/placeholder-bake.svg"
 */
export function resolveMediaUrl(
  path: string | null | undefined,
  fallback: string = DEFAULT_FALLBACK_IMAGE
): string {
  if (!path || typeof path !== "string") {
    return fallback;
  }

  let clean = path.trim();
  if (!clean) {
    return fallback;
  }

  // Preserve data URLs and blob URLs
  if (clean.startsWith("data:") || clean.startsWith("blob:")) {
    return clean;
  }

  // Handle absolute HTTP/HTTPS URLs
  if (/^https?:\/\//i.test(clean)) {
    try {
      const parsed = new URL(clean);
      // If it contains /uploads/ or /api/media/serve/, extract the pathname to normalize
      if (parsed.pathname.includes("/api/media/serve/") || parsed.pathname.includes("/uploads/")) {
        clean = parsed.pathname;
      } else {
        // Third-party external URL (e.g. Unsplash, CDN)
        return clean;
      }
    } catch {
      // Invalid URL format fallback
    }
  }

  // Already canonical API route
  if (clean.startsWith("/api/media/serve/")) {
    return clean;
  }
  if (clean.startsWith("api/media/serve/")) {
    return `/${clean}`;
  }

  // Normalize /uploads/ or uploads/ prefix
  if (clean.startsWith("/uploads/")) {
    clean = clean.substring("/uploads/".length);
  } else if (clean.startsWith("uploads/")) {
    clean = clean.substring("uploads/".length);
  }

  // Check if this is a static public root file (e.g. /bakery.png, /placeholder-bake.svg, /WD.jpeg)
  // If clean started with '/' and was NOT /uploads/ or /api/media/serve/, it's a public static file
  if (path.startsWith("/") && !path.startsWith("/uploads/") && !path.startsWith("/api/media/serve/")) {
    return path;
  }

  // Remove leading slashes after cleaning
  clean = clean.replace(/^\/+/, "");

  if (!clean) {
    return fallback;
  }

  // If clean is already an SVG/PNG/JPG/etc placeholder filename at root
  if (clean === "placeholder-bake.svg" || clean === "bakery.png" || clean === "logobake-01.png") {
    return `/${clean}`;
  }

  // Otherwise, construct canonical VPS media API URL
  return `/api/media/serve/${clean}`;
}

/**
 * Normalizes an array of image paths, filtering out empty ones and deduplicating results.
 */
export function resolveMediaUrls(
  paths: (string | null | undefined)[] | null | undefined,
  fallback: string = DEFAULT_FALLBACK_IMAGE
): string[] {
  if (!paths || !Array.isArray(paths) || paths.length === 0) {
    return [fallback];
  }

  const resolved = paths
    .map((p) => resolveMediaUrl(p, fallback))
    .filter((url) => Boolean(url) && url !== fallback);

  if (resolved.length === 0) {
    return [fallback];
  }

  return Array.from(new Set(resolved));
}

/**
 * Checks if a given media URL is served from VPS persistent storage.
 */
export function isVpsMediaUrl(url: string | null | undefined): boolean {
  if (!url || typeof url !== "string") return false;
  const clean = url.trim();
  return clean.startsWith("/api/media/serve/") || clean.startsWith("/uploads/") || clean.includes("/api/media/serve/");
}
