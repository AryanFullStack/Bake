import ImageKit from "imagekit";
import { ALLOWED_FOLDERS, AllowedFolder } from "./constants";

export interface ImageKitUploadOptions {
  folder: string;
  filename: string;
  buffer: Buffer;
  mimeType?: string;
}

export interface ImageKitUploadResult {
  url: string;
  fileId: string;
  filename: string;
  relativePath: string;
  folder: string;
  size: number;
}

export class ImageKitStorageProvider {
  private client: ImageKit | null = null;
  private publicKey: string;
  private privateKey: string;
  private urlEndpoint: string;

  constructor() {
    this.publicKey =
      process.env.IMAGEKIT_PUBLIC_KEY ||
      process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY ||
      "";
    this.privateKey = process.env.IMAGEKIT_PRIVATE_KEY || "";
    this.urlEndpoint =
      process.env.IMAGEKIT_URL_ENDPOINT ||
      process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT ||
      "";

    if (this.isConfigured()) {
      try {
        this.client = new ImageKit({
          publicKey: this.publicKey,
          privateKey: this.privateKey,
          urlEndpoint: this.urlEndpoint,
        });
      } catch (err) {
        console.error("[ImageKitStorageProvider] Initialization error:", err);
      }
    }
  }

  public isConfigured(): boolean {
    return Boolean(
      (this.publicKey || process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY) &&
        this.privateKey &&
        (this.urlEndpoint || process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT)
    );
  }

  public getUrlEndpoint(): string {
    return this.urlEndpoint;
  }

  public async uploadFile(
    options: ImageKitUploadOptions
  ): Promise<ImageKitUploadResult> {
    if (!this.client) {
      // Re-try initialization if keys were loaded late
      if (this.isConfigured()) {
        this.client = new ImageKit({
          publicKey:
            this.publicKey ||
            process.env.IMAGEKIT_PUBLIC_KEY ||
            process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY ||
            "",
          privateKey: this.privateKey || process.env.IMAGEKIT_PRIVATE_KEY || "",
          urlEndpoint:
            this.urlEndpoint ||
            process.env.IMAGEKIT_URL_ENDPOINT ||
            process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT ||
            "",
        });
      }
    }

    if (!this.client) {
      throw new Error(
        "ImageKit credentials are not configured in environment variables."
      );
    }

    const sanitizedFolder = ALLOWED_FOLDERS.includes(
      options.folder as AllowedFolder
    )
      ? options.folder
      : "products";
    const folderPath = `/${sanitizedFolder}`;

    const response = await this.client.upload({
      file: options.buffer,
      fileName: options.filename,
      folder: folderPath,
      useUniqueFileName: false,
      isPrivateFile: false,
    });

    if (!response || !response.url) {
      throw new Error("ImageKit upload response missing URL.");
    }

    const relativePath = `${sanitizedFolder}/${options.filename}`;

    return {
      url: response.url,
      fileId: response.fileId,
      filename: response.name || options.filename,
      relativePath,
      folder: sanitizedFolder,
      size: response.size || options.buffer.length,
    };
  }

  public async deleteFile(fileIdOrUrl: string): Promise<boolean> {
    if (!this.client) return false;

    try {
      let fileId = fileIdOrUrl.trim();

      // If a full URL was provided, search for file by path/name to get fileId
      if (fileId.startsWith("http://") || fileId.startsWith("https://")) {
        const urlObj = new URL(fileId);
        const pathName = urlObj.pathname;
        const name = pathName.split("/").pop();

        if (name) {
          const searchResult = await this.client.listFiles({
            searchQuery: `name = "${name}"`,
            limit: 1,
          });

          if (
            Array.isArray(searchResult) &&
            searchResult.length > 0 &&
            searchResult[0].fileId
          ) {
            fileId = searchResult[0].fileId;
          } else {
            // Cannot find fileId by URL
            return false;
          }
        }
      }

      await this.client.deleteFile(fileId);
      return true;
    } catch (err) {
      console.warn(`[ImageKitStorageProvider] Delete error for ${fileIdOrUrl}:`, err);
      return false;
    }
  }

  public async getStorageUsage(): Promise<{ totalFiles: number; totalSizeBytes: number }> {
    if (!this.client) return { totalFiles: 0, totalSizeBytes: 0 };
    try {
      const files = await this.client.listFiles({ limit: 1000 });
      if (Array.isArray(files)) {
        let totalSizeBytes = 0;
        files.forEach((f: any) => {
          totalSizeBytes += f.size || 0;
        });
        return {
          totalFiles: files.length,
          totalSizeBytes,
        };
      }
    } catch (err) {
      console.warn("[ImageKitStorageProvider] Error fetching ImageKit storage usage:", err);
    }
    return { totalFiles: 0, totalSizeBytes: 0 };
  }
}

// Singleton instance helper
let imageKitProviderInstance: ImageKitStorageProvider | null = null;

export function getImageKitStorageProvider(): ImageKitStorageProvider {
  if (!imageKitProviderInstance) {
    imageKitProviderInstance = new ImageKitStorageProvider();
  }
  return imageKitProviderInstance;
}
