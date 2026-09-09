import fs from "fs";
import path from "path";

export interface StorageFileInfo {
  name: string;
  folder: string;
  relativePath: string;
  url: string;
  size: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface SaveFileResult {
  folder: string;
  filename: string;
  relativePath: string;
  url: string;
  size: number;
}

export interface IStorageProvider {
  saveFile(folder: string, filename: string, buffer: Buffer): Promise<SaveFileResult>;
  deleteFile(relativePathOrUrl: string): Promise<boolean>;
  listFiles(folder?: string, search?: string): Promise<StorageFileInfo[]>;
  getFileBuffer(relativePathOrUrl: string): Promise<{ buffer: Buffer; mimeType: string; size: number } | null>;
  fileExists(relativePathOrUrl: string): Promise<boolean>;
  getFolderStats(): Promise<{ totalFiles: number; totalSizeBytes: number; folders: Record<string, number> }>;
}
import { ALLOWED_FOLDERS, AllowedFolder } from "./constants";
export { ALLOWED_FOLDERS, type AllowedFolder };


export class LocalStorageProvider implements IStorageProvider {
  private baseDir: string;

  constructor(customBaseDir?: string) {
    // Priority: Explicit param -> Env VAR UPLOADS_DIR -> Hostinger persistent sibling dir -> local fallback
    if (customBaseDir) {
      this.baseDir = path.resolve(customBaseDir);
    } else if (process.env.UPLOADS_DIR) {
      this.baseDir = path.resolve(process.env.UPLOADS_DIR);
    } else {
      // Sibling folder outside next.js app directory to survive GitHub redeploys
      this.baseDir = path.resolve(process.cwd(), "..", "uploads");
    }

    this.ensureDirectoryStructure();
  }

  public getBaseDir(): string {
    return this.baseDir;
  }

  private ensureDirectoryStructure() {
    try {
      if (!fs.existsSync(this.baseDir)) {
        fs.mkdirSync(this.baseDir, { recursive: true });
      }
      for (const folder of ALLOWED_FOLDERS) {
        const folderPath = path.join(this.baseDir, folder);
        if (!fs.existsSync(folderPath)) {
          fs.mkdirSync(folderPath, { recursive: true });
        }
      }
    } catch (err) {
      console.error("[LocalStorageProvider] Error initializing directories:", err);
    }
  }

  public normalizePath(relativePathOrUrl: string): string {
    if (!relativePathOrUrl) return "";
    let clean = relativePathOrUrl.trim();
    // Remove query params if any
    clean = clean.split("?")[0];

    // Remove serve API prefix if full URL/path was passed
    if (clean.includes("/api/media/serve/")) {
      clean = clean.substring(clean.indexOf("/api/media/serve/") + "/api/media/serve/".length);
    } else if (clean.startsWith("/uploads/")) {
      clean = clean.replace(/^\/uploads\//, "");
    } else if (clean.startsWith("uploads/")) {
      clean = clean.replace(/^uploads\//, "");
    }

    clean = clean.replace(/^\/+/, "");
    return clean;
  }

  private resolveAbsolutePath(relativePathOrUrl: string): string {
    const rawClean = this.normalizePath(relativePathOrUrl);

    let decodedClean = rawClean;
    try {
      decodedClean = decodeURIComponent(rawClean);
    } catch {
      // keep raw if decode fails
    }

    const cleanVariants = Array.from(
      new Set([
        rawClean,
        decodedClean,
        rawClean.replace(/\+/g, " "),
        decodedClean.replace(/\+/g, " "),
      ])
    ).filter(Boolean);

    // Candidate upload base directories on VPS / local system
    const candidateBaseDirs = [
      this.baseDir,
      path.resolve(process.cwd(), "public", "uploads"),
      path.resolve(process.cwd(), "uploads"),
      path.resolve(process.cwd(), "..", "uploads"),
      path.resolve(process.cwd(), "public"),
      path.resolve(process.cwd(), "public", "products"),
      path.resolve(process.cwd(), "uploads", "products"),
      path.resolve(process.cwd(), "..", "uploads", "products"),
      path.resolve(process.cwd(), "..", "products"),
      path.resolve(process.cwd(), "products"),
      path.resolve(process.cwd(), ".."),
      process.cwd(),
    ];

    const uniqueBaseDirs = Array.from(new Set(candidateBaseDirs));

    for (const base of uniqueBaseDirs) {
      if (!fs.existsSync(base)) continue;

      for (const rel of cleanVariants) {
        // Direct relative path
        const absolute = path.resolve(base, rel);
        if (absolute.startsWith(base) && fs.existsSync(absolute) && fs.statSync(absolute).isFile()) {
          return absolute;
        }

        // Smart Fallback 1: check if filename exists directly inside any allowed folder under this base
        const filename = path.basename(rel);
        for (const folder of ALLOWED_FOLDERS) {
          const candidate = path.resolve(base, folder, filename);
          if (candidate.startsWith(base) && fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
            return candidate;
          }
        }

        // Smart Fallback 2: strip leading folder component if relative was e.g. "unknown/foo.webp"
        const relativeParts = rel.split("/");
        if (relativeParts.length > 1) {
          const subRelative = relativeParts.slice(1).join("/");
          for (const folder of ALLOWED_FOLDERS) {
            const candidate = path.resolve(base, folder, subRelative);
            if (candidate.startsWith(base) && fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
              return candidate;
            }
          }
        }
      }
    }

    return path.resolve(this.baseDir, decodedClean || rawClean);
  }

  public async saveFile(folder: string, filename: string, buffer: Buffer): Promise<SaveFileResult> {
    const sanitizedFolder = ALLOWED_FOLDERS.includes(folder as AllowedFolder) ? folder : "products";
    const folderPath = path.join(this.baseDir, sanitizedFolder);

    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true });
    }

    const filePath = path.join(folderPath, filename);
    await fs.promises.writeFile(filePath, buffer);

    const relativePath = `${sanitizedFolder}/${filename}`;
    const url = `/api/media/serve/${relativePath}`;

    return {
      folder: sanitizedFolder,
      filename,
      relativePath,
      url,
      size: buffer.length,
    };
  }

  public async deleteFile(relativePathOrUrl: string): Promise<boolean> {
    try {
      const absolutePath = this.resolveAbsolutePath(relativePathOrUrl);
      if (fs.existsSync(absolutePath)) {
        await fs.promises.unlink(absolutePath);
        return true;
      }
      return false;
    } catch (error) {
      console.error(`[LocalStorageProvider] Delete error for ${relativePathOrUrl}:`, error);
      return false;
    }
  }

  public async listFiles(folder?: string, search?: string): Promise<StorageFileInfo[]> {
    const results: StorageFileInfo[] = [];
    const targetFolders = folder && ALLOWED_FOLDERS.includes(folder as AllowedFolder)
      ? [folder]
      : ALLOWED_FOLDERS;

    for (const f of targetFolders) {
      const folderPath = path.join(this.baseDir, f);
      if (!fs.existsSync(folderPath)) continue;

      const entries = await fs.promises.readdir(folderPath, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.isFile()) {
          const name = entry.name;
          if (search && !name.toLowerCase().includes(search.toLowerCase())) {
            continue;
          }

          const filePath = path.join(folderPath, name);
          const stats = await fs.promises.stat(filePath);
          const relativePath = `${f}/${name}`;

          results.push({
            name,
            folder: f,
            relativePath,
            url: `/api/media/serve/${relativePath}`,
            size: stats.size,
            createdAt: stats.birthtime,
            updatedAt: stats.mtime,
          });
        }
      }
    }

    // Sort newest first
    return results.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  }

  public async getFileBuffer(relativePathOrUrl: string): Promise<{ buffer: Buffer; mimeType: string; size: number } | null> {
    try {
      const absolutePath = this.resolveAbsolutePath(relativePathOrUrl);
      if (!fs.existsSync(absolutePath)) {
        return null;
      }

      const buffer = await fs.promises.readFile(absolutePath);
      const ext = path.extname(absolutePath).toLowerCase();

      let mimeType = "image/webp";
      if (ext === ".jpg" || ext === ".jpeg") mimeType = "image/jpeg";
      else if (ext === ".png") mimeType = "image/png";
      else if (ext === ".svg") mimeType = "image/svg+xml";

      return {
        buffer,
        mimeType,
        size: buffer.length,
      };
    } catch (err) {
      console.error(`[LocalStorageProvider] Get buffer error for ${relativePathOrUrl}:`, err);
      return null;
    }
  }

  public async fileExists(relativePathOrUrl: string): Promise<boolean> {
    try {
      const absolutePath = this.resolveAbsolutePath(relativePathOrUrl);
      return fs.existsSync(absolutePath);
    } catch {
      return false;
    }
  }

  public async getFolderStats(): Promise<{ totalFiles: number; totalSizeBytes: number; folders: Record<string, number> }> {
    let totalFiles = 0;
    let totalSizeBytes = 0;
    const folders: Record<string, number> = {};

    for (const f of ALLOWED_FOLDERS) {
      folders[f] = 0;
      const folderPath = path.join(this.baseDir, f);
      if (!fs.existsSync(folderPath)) continue;

      const entries = await fs.promises.readdir(folderPath, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.isFile()) {
          const stats = await fs.promises.stat(path.join(folderPath, entry.name));
          totalFiles += 1;
          totalSizeBytes += stats.size;
          folders[f] += 1;
        }
      }
    }

    return { totalFiles, totalSizeBytes, folders };
  }
}

// Singleton factory instance
let storageProviderInstance: IStorageProvider | null = null;

export function getStorageProvider(): IStorageProvider {
  if (!storageProviderInstance) {
    storageProviderInstance = new LocalStorageProvider();
  }
  return storageProviderInstance;
}
