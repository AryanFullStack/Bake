import { ALLOWED_FOLDERS } from "./media/constants";

export const DEFAULT_FALLBACK_IMAGE = "/placeholder-bake.svg";

/**
 * Resolves any image path, relative storage reference, or full URL to a canonical display URL.
 * 
 * Examples:
 * - "/uploads/products/product_1788856725_9a177d.webp" -> "/api/media/serve/products/product_1788856725_9a177d.webp"
 * - "/products/product_1788856725_9a177d.webp"         -> "/api/media/serve/products/product_1788856725_9a177d.webp"
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
      if (parsed.pathname.includes("/api/media/serve/") || parsed.pathname.includes("/uploads/")) {
        clean = parsed.pathname;
      } else {
        const firstSeg = parsed.pathname.replace(/^\/+/, "").split("/")[0];
        if (ALLOWED_FOLDERS.includes(firstSeg as any)) {
          clean = parsed.pathname;
        } else {
          return clean; // External third-party URL (e.g. Unsplash, CDN)
        }
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

  const relativeNoSlash = clean.replace(/^\/+/, "");
  const firstSegment = relativeNoSlash.split("/")[0];
  const isUploadFolder = ALLOWED_FOLDERS.includes(firstSegment as any);

  // If path starts with '/' and is NOT an upload folder, it's a static public file (e.g. /bakery.png, /WD.jpeg)
  if (path.startsWith("/") && !isUploadFolder && !path.startsWith("/uploads/") && !path.startsWith("/api/media/serve/")) {
    return path;
  }

  clean = relativeNoSlash;

  if (!clean) {
    return fallback;
  }

  // If clean has no folder component (e.g. "product_1788856725_9a177d.webp"), default to products folder
  if (!clean.includes("/")) {
    clean = `products/${clean}`;
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
  return (
    clean.startsWith("/api/media/serve/") ||
    clean.startsWith("api/media/serve/") ||
    clean.startsWith("/uploads/") ||
    clean.startsWith("uploads/") ||
    clean.includes("/api/media/serve/")
  );
}

