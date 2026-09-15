import { getImageKitStorageProvider } from "@/lib/media/imagekit-provider";
import { processAndOptimizeImage, validateImageMagicBytes } from "@/lib/media/sharp-processor";
import { getStorageProvider } from "@/lib/media/storage-provider";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export interface CakeUploadResult {
  url: string;
  filename: string;
  size: number;
}

/**
 * Validates, compresses with Sharp to WebP, and uploads to ImageKit.
 * Folder is typically "custom-cakes" or "payment-receipts".
 */
export async function uploadCakeImageToImageKit(
  file: File,
  folder: "custom-cakes" | "payment-receipts" = "custom-cakes"
): Promise<CakeUploadResult> {
  const arrayBuffer = await file.arrayBuffer();
  const rawBuffer = Buffer.from(arrayBuffer);

  // 1. Validate magic bytes and format
  const validation = validateImageMagicBytes(rawBuffer);
  if (!validation.valid) {
    try {
      const sharpModule = (await import("sharp")).default;
      const meta = await sharpModule(rawBuffer).metadata();
      if (!meta || !meta.format) {
        throw new Error(validation.error || "Invalid image file format. Supported formats: JPG, PNG, WebP.");
      }
    } catch {
      throw new Error(validation.error || "Invalid image file format. Supported formats: JPG, PNG, WebP.");
    }
  }

  // 2. Sharp compression to WebP (max 1600x1600, quality 85)
  const processed = await processAndOptimizeImage(rawBuffer, {
    folder,
    customWidth: 1600,
    customHeight: 1600,
    quality: 85,
  });

  const ik = getImageKitStorageProvider();

  if (ik.isConfigured()) {
    try {
      const uploadRes = await ik.uploadFile({
        folder,
        filename: processed.filename,
        buffer: processed.buffer,
        mimeType: "image/webp",
      });

      return {
        url: uploadRes.url,
        filename: uploadRes.filename,
        size: uploadRes.size,
      };
    } catch (err: any) {
      console.warn("[uploadCakeImageToImageKit] ImageKit upload warning, falling back to local storage:", err?.message || err);
    }
  }

  // Fallback to local storage provider if ImageKit is unavailable
  const storage = getStorageProvider();
  const localRes = await storage.saveFile(folder, processed.filename, processed.buffer);

  return {
    url: localRes.url,
    filename: localRes.filename,
    size: localRes.size,
  };
}

/**
 * Resolves any custom cake image path or URL to a canonical display URL.
 */
export function resolveCakeImageUrl(pathOrUrl: string | null | undefined): string {
  if (!pathOrUrl) return "/placeholder-bake.svg";
  const clean = pathOrUrl.trim();

  // 1. Direct ImageKit or external HTTP(S) URL
  if (clean.startsWith("http://") || clean.startsWith("https://")) {
    return clean;
  }

  // 2. Data / Blob URLs
  if (clean.startsWith("data:") || clean.startsWith("blob:")) {
    return clean;
  }

  // 3. Local media route
  if (clean.startsWith("/api/media/serve/")) {
    return clean;
  }
  if (clean.startsWith("api/media/serve/")) {
    return `/${clean}`;
  }

  // 4. Relative paths like custom-cakes/foo.webp
  return `/api/media/serve/${clean.replace(/^\/+/, "")}`;
}

