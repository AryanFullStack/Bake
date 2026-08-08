import sharp from "sharp";
import crypto from "crypto";

export interface ImageProcessingOptions {
  folder: string;
  quality?: number;
  customWidth?: number;
  customHeight?: number;
}

export interface ProcessedImageResult {
  buffer: Buffer;
  filename: string;
  width: number;
  height: number;
  format: "webp";
  size: number;
  originalSize: number;
  mimeType: "image/webp";
}

export interface ImageDimensionResult {
  width?: number;
  height?: number;
  format?: string;
}

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

const FOLDER_DIMENSION_PRESETS: Record<string, { width: number; height: number }> = {
  products: { width: 1200, height: 1200 },
  "product-gallery": { width: 1200, height: 1200 },
  categories: { width: 800, height: 800 },
  brands: { width: 800, height: 800 },
  banners: { width: 1920, height: 800 },
  homepage: { width: 1920, height: 1080 },
  users: { width: 400, height: 400 },
  avatars: { width: 400, height: 400 },
  blog: { width: 1400, height: 900 },
  gallery: { width: 1600, height: 1600 },
  testimonials: { width: 600, height: 600 },
  "custom-cakes": { width: 1600, height: 1600 },
  "payment-receipts": { width: 1600, height: 1600 },
  temp: { width: 1200, height: 1200 },
};

/**
 * Validates image buffer using magic bytes (header signatures) to prevent malicious/executable uploads
 */
export function validateImageMagicBytes(buffer: Buffer): { valid: boolean; detectedType?: string; error?: string } {
  if (!buffer || buffer.length < 12) {
    return { valid: false, error: "Invalid or empty image buffer." };
  }

  if (buffer.length > MAX_FILE_SIZE_BYTES) {
    return { valid: false, error: "File size exceeds maximum allowed limit of 5 MB." };
  }

  // JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return { valid: true, detectedType: "image/jpeg" };
  }

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return { valid: true, detectedType: "image/png" };
  }

  // WEBP: RIFF .... WEBP
  if (
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46 &&
    buffer[8] === 0x57 &&
    buffer[9] === 0x45 &&
    buffer[10] === 0x42 &&
    buffer[11] === 0x50
  ) {
    return { valid: true, detectedType: "image/webp" };
  }

  return {
    valid: false,
    error: "Unsupported file type signature. Only JPG, JPEG, PNG, and WEBP images are allowed.",
  };
}

/**
 * Generates a clean, unique, collision-resistant WebP filename
 */
export function generateUniqueFilename(folder: string): string {
  const cleanFolder = folder.replace(/[^a-z0-9_-]/gi, "").toLowerCase();
  // Strip trailing 's' for singular prefix if applicable (e.g. products -> product)
  const prefix = cleanFolder.endsWith("s") && cleanFolder.length > 3
    ? cleanFolder.slice(0, -1)
    : cleanFolder;

  const timestamp = Math.floor(Date.now() / 1000);
  const randomHex = crypto.randomBytes(3).toString("hex");

  return `${prefix}_${timestamp}_${randomHex}.webp`;
}

/**
 * Inspects image metadata without full decoding
 */
export async function getImageMetadata(buffer: Buffer): Promise<ImageDimensionResult> {
  try {
    const meta = await sharp(buffer).metadata();
    return {
      width: meta.width,
      height: meta.height,
      format: meta.format,
    };
  } catch {
    return {};
  }
}

/**
 * Sharp Image Processing Pipeline:
 * - Rotates according to EXIF orient
 * - Resizes according to folder preset bounds
 * - Strips EXIF metadata
 * - Converts to WebP format with ~80 quality
 */
export async function processAndOptimizeImage(
  buffer: Buffer,
  options: ImageProcessingOptions
): Promise<ProcessedImageResult> {
  const magicValidation = validateImageMagicBytes(buffer);
  if (!magicValidation.valid) {
    throw new Error(magicValidation.error || "Image validation failed.");
  }

  const folderKey = options.folder.toLowerCase();
  const preset = FOLDER_DIMENSION_PRESETS[folderKey] || { width: 1200, height: 1200 };

  const maxWidth = options.customWidth || preset.width;
  const maxHeight = options.customHeight || preset.height;
  const quality = options.quality || 80;

  const sharpInstance = sharp(buffer)
    .rotate() // Auto-orient based on EXIF
    .resize(maxWidth, maxHeight, {
      fit: "inside",
      withoutEnlargement: true,
    })
    .webp({
      quality,
      alphaQuality: 80,
      effort: 4,
    });

  // Note: sharp strips metadata by default unless .withMetadata() is explicitly called

  const processedBuffer = await sharpInstance.toBuffer();
  const metadata = await sharp(processedBuffer).metadata();
  const filename = generateUniqueFilename(options.folder);

  return {
    buffer: processedBuffer,
    filename,
    width: metadata.width || 0,
    height: metadata.height || 0,
    format: "webp",
    size: processedBuffer.length,
    originalSize: buffer.length,
    mimeType: "image/webp",
  };
}
