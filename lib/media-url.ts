import { ALLOWED_FOLDERS } from "./media/constants";

export const DEFAULT_FALLBACK_IMAGE = "/placeholder-bake.svg";

const KNOWN_STATIC_ASSETS = new Set([
  "/bakery.png",
  "/bakery.webp",
  "/baskets.webp",
  "/WD.webp",
  "/kicthens.webp",
  "/homeDisktop.webp",
  "/celebration-cakes.webp",
  "/homeItems.webp",
  "/placeholder-bake.svg",
  "/logobake-01.png",
  "/logomainficonocns-01.png",
  "/favicon.ico",
  "/icon.png",
  "/apple-icon.png",
  "/manifest.json",
  "/robots.txt",
  "/sitemap.xml",
]);

export interface ImageTransformOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: "auto" | "webp" | "avif" | "jpg" | "png";
  crop?: "maintain_ratio" | "force" | "pad_extract" | "extract";
}

/**
 * Appends or updates ImageKit URL transformation parameters for dynamic CDN optimization.
 */
export function getImageKitTransformedUrl(
  url: string,
  options: ImageTransformOptions = {}
): string {
  if (!url || typeof url !== "string") return url;
  if (!url.includes("imagekit.io") && !url.includes("ik.imagekit.io")) {
    return url;
  }

  const { width, height, quality = 80, format = "auto", crop } = options;

  const trParts: string[] = [];
  if (width && width > 0) trParts.push(`w-${Math.round(width)}`);
  if (height && height > 0) trParts.push(`h-${Math.round(height)}`);
  if (quality && quality > 0) trParts.push(`q-${Math.round(quality)}`);
  if (format) trParts.push(`f-${format}`);
  if (crop) trParts.push(`c-${crop}`);

  if (trParts.length === 0) return url;

  const trParam = trParts.join(",");

  try {
    const urlObj = new URL(url);
    const existingTr = urlObj.searchParams.get("tr");
    if (existingTr) {
      if (!existingTr.includes(trParam)) {
        urlObj.searchParams.set("tr", `${existingTr},${trParam}`);
      }
    } else {
      urlObj.searchParams.set("tr", trParam);
    }
    return urlObj.toString();
  } catch {
    const joinChar = url.includes("?") ? "&" : "?";
    return `${url}${joinChar}tr=${trParam}`;
  }
}

/**
 * Resolves any image path, relative storage reference, or full URL to a canonical display URL.
 */
export function resolveMediaUrl(
  path: string | null | undefined,
  fallback: string = DEFAULT_FALLBACK_IMAGE,
  transformOptions?: ImageTransformOptions
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

  // Handle ImageKit CDN URLs directly with optional transformations
  if (clean.includes("imagekit.io") || clean.includes("ik.imagekit.io")) {
    return transformOptions ? getImageKitTransformedUrl(clean, transformOptions) : clean;
  }

  // Known static public assets (e.g. /bakery.png, /WD.webp)
  if (KNOWN_STATIC_ASSETS.has(clean) || KNOWN_STATIC_ASSETS.has(`/${clean.replace(/^\/+/, "")}`)) {
    return clean.startsWith("/") ? clean : `/${clean}`;
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
        } else if (/\.(webp|jpg|jpeg|png|gif|avif|svg)$/i.test(parsed.pathname) && !clean.includes("unsplash.com")) {
          clean = parsed.pathname;
        } else {
          return clean; // External third-party URL (e.g. Unsplash, external CDN)
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
  if (!relativeNoSlash) {
    return fallback;
  }

  clean = relativeNoSlash;

  // If clean has no folder component (e.g. "2_Pcs_Set...webp" or "product_17888.webp"), default to products folder
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
  if (clean.includes("imagekit.io") || clean.includes("ik.imagekit.io")) {
    return false;
  }
  return (
    clean.startsWith("/api/media/serve/") ||
    clean.startsWith("api/media/serve/") ||
    clean.startsWith("/uploads/") ||
    clean.startsWith("uploads/") ||
    clean.includes("/api/media/serve/")
  );
}

/**
 * Formats a byte size into human-readable string (e.g., "124 KB", "1.2 MB").
 */
export function formatBytes(bytes?: number | null): string {
  if (!bytes || isNaN(bytes) || bytes <= 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}


