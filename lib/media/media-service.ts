import { getStorageProvider, ALLOWED_FOLDERS, StorageFileInfo } from "./storage-provider";
import { processAndOptimizeImage, validateImageMagicBytes, getImageMetadata } from "./sharp-processor";
import { isForbiddenExtension, sanitizeFilename } from "./security";

export interface UploadMediaOptions {
  folder: string;
  originalName?: string;
  customWidth?: number;
  customHeight?: number;
  quality?: number;
}

export interface UploadMediaResult {
  success: true;
  url: string;
  relativePath: string;
  folder: string;
  filename: string;
  width: number;
  height: number;
  size: number;
  originalSize: number;
  mimeType: string;
}

export class MediaService {
  private storage = getStorageProvider();

  public async uploadImage(
    buffer: Buffer,
    options: UploadMediaOptions
  ): Promise<UploadMediaResult> {
    const { folder, originalName, customWidth, customHeight, quality } = options;

    if (originalName && isForbiddenExtension(originalName)) {
      throw new Error(`File type extension '${originalName}' is forbidden.`);
    }

    const sanitizedFolder = ALLOWED_FOLDERS.includes(folder as any) ? folder : "products";

    // Magic byte & size pre-validation
    const validation = validateImageMagicBytes(buffer);
    if (!validation.valid) {
      throw new Error(validation.error || "Invalid image buffer.");
    }

    // Sharp optimization & conversion to WebP
    const processed = await processAndOptimizeImage(buffer, {
      folder: sanitizedFolder,
      customWidth,
      customHeight,
      quality,
    });

    // Save to persistent storage directory
    const saveResult = await this.storage.saveFile(
      sanitizedFolder,
      processed.filename,
      processed.buffer
    );

    return {
      success: true,
      url: saveResult.url,
      relativePath: saveResult.relativePath,
      folder: saveResult.folder,
      filename: saveResult.filename,
      width: processed.width,
      height: processed.height,
      size: processed.size,
      originalSize: processed.originalSize,
      mimeType: "image/webp",
    };
  }

  public async replaceImage(
    oldUrlOrPath: string,
    newBuffer: Buffer,
    options: UploadMediaOptions
  ): Promise<UploadMediaResult> {
    // 1. Upload new image first
    const uploadResult = await this.uploadImage(newBuffer, options);

    // 2. Safely delete old image if it exists and isn't identical
    if (oldUrlOrPath) {
      try {
        await this.deleteImage(oldUrlOrPath);
      } catch (err) {
        console.warn(`[MediaService] Note: Failed to delete replaced file ${oldUrlOrPath}:`, err);
      }
    }

    return uploadResult;
  }

  public async deleteImage(urlOrPath: string): Promise<boolean> {
    if (!urlOrPath) return false;
    return await this.storage.deleteFile(urlOrPath);
  }

  public async listMedia(folder?: string, search?: string): Promise<StorageFileInfo[]> {
    return await this.storage.listFiles(folder, search);
  }

  public async validateImage(buffer: Buffer) {
    const magic = validateImageMagicBytes(buffer);
    if (!magic.valid) return magic;

    const meta = await getImageMetadata(buffer);
    return {
      valid: true,
      detectedType: magic.detectedType,
      dimensions: meta,
      size: buffer.length,
    };
  }

  public async getStats() {
    return await this.storage.getFolderStats();
  }
}

export const mediaService = new MediaService();
