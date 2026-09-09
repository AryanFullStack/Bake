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
    const pub = process.env.IMAGEKIT_PUBLIC_KEY || process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY || this.publicKey;
    const priv = process.env.IMAGEKIT_PRIVATE_KEY || this.privateKey;
    const endpoint = process.env.IMAGEKIT_URL_ENDPOINT || process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT || this.urlEndpoint;
    return Boolean(pub && priv && endpoint);
  }

  public getUrlEndpoint(): string {
    return process.env.IMAGEKIT_URL_ENDPOINT || process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT || this.urlEndpoint;
  }

  private getClient(): ImageKit | null {
    const pub = process.env.IMAGEKIT_PUBLIC_KEY || process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY || this.publicKey;
    const priv = process.env.IMAGEKIT_PRIVATE_KEY || this.privateKey;
    const endpoint = process.env.IMAGEKIT_URL_ENDPOINT || process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT || this.urlEndpoint;

    if (!pub || !priv || !endpoint) return null;

    if (!this.client) {
      try {
        this.client = new ImageKit({
          publicKey: pub,
          privateKey: priv,
          urlEndpoint: endpoint,
        });
      } catch (err) {
        console.error("[ImageKitStorageProvider] Initialization error:", err);
      }
    }
    return this.client;
  }

  public async uploadFile(
    options: ImageKitUploadOptions
  ): Promise<ImageKitUploadResult> {
    const client = this.getClient();

    if (!client) {
      throw new Error(
        "ImageKit credentials (IMAGEKIT_PUBLIC_KEY, IMAGEKIT_PRIVATE_KEY, IMAGEKIT_URL_ENDPOINT) are missing or incomplete in environment variables."
      );
    }

    const sanitizedFolder = ALLOWED_FOLDERS.includes(
      options.folder as AllowedFolder
    )
      ? options.folder
      : "products";
    const folderPath = `/${sanitizedFolder}`;

    const response = await client.upload({
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
    const client = this.getClient();
    if (!client) return false;

    try {
      let fileId = fileIdOrUrl.trim();

      // If a full URL was provided, search for file by path/name to get fileId
      if (fileId.startsWith("http://") || fileId.startsWith("https://")) {
        const urlObj = new URL(fileId);
        const pathName = urlObj.pathname;
        const name = pathName.split("/").pop();

        if (name) {
          const searchResult = await client.listFiles({
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

      await client.deleteFile(fileId);
      return true;
    } catch (err) {
      console.warn(`[ImageKitStorageProvider] Delete error for ${fileIdOrUrl}:`, err);
      return false;
    }
  }

  public async getStorageUsage(): Promise<{ totalFiles: number; totalSizeBytes: number }> {
    const client = this.getClient();
    if (!client) return { totalFiles: 0, totalSizeBytes: 0 };
    try {
      const files = await client.listFiles({ limit: 1000 });
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
