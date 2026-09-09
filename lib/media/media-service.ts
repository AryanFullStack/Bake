import { getStorageProvider, ALLOWED_FOLDERS, StorageFileInfo } from "./storage-provider";
import { processAndOptimizeImage, validateImageMagicBytes, getImageMetadata } from "./sharp-processor";
import { isForbiddenExtension, sanitizeFilename } from "./security";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { ensureMediaSchema } from "@/lib/supabase/schema-runner";

export interface UploadMediaOptions {
  folder: string;
  originalName?: string;
  customWidth?: number;
  customHeight?: number;
  quality?: number;
  uploadedBy?: string;
  altText?: string;
  title?: string;
  mediaType?: string;
}

export interface UploadMediaResult {
  success: true;
  id?: string;
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

export interface MediaUsageItem {
  entityType: "product_main" | "product_gallery" | "variant_main" | "variant_gallery" | "attribute_swatch" | "attribute_gallery" | "category" | "brand" | "banner" | "custom_cake";
  title: string;
  detail?: string;
  link?: string;
  entityId?: string;
  productId?: string;
}

export interface MediaUsageResult {
  count: number;
  usages: MediaUsageItem[];
}

export interface DatabaseMediaItem {
  id: string;
  filename: string;
  original_filename: string | null;
  storage_path: string;
  public_url: string;
  mime_type: string;
  extension: string;
  file_size: number;
  width: number | null;
  height: number | null;
  alt_text: string | null;
  title: string | null;
  folder: string;
  media_type: string;
  uploaded_by: string | null;
  created_at: string;
  updated_at: string;
  usage_count?: number;
}

export class MediaService {
  private storage = getStorageProvider();

  public normalizeStoragePath(urlOrPath: string): string {
    if (!urlOrPath) return "";
    let clean = urlOrPath.trim().split("?")[0];

    if (clean.includes("/api/media/serve/")) {
      clean = clean.substring(clean.indexOf("/api/media/serve/") + "/api/media/serve/".length);
    } else if (clean.startsWith("/uploads/")) {
      clean = clean.replace(/^\/uploads\//, "");
    } else if (clean.startsWith("uploads/")) {
      clean = clean.replace(/^uploads\//, "");
    }

    return clean.replace(/^\/+/, "");
  }

  public deriveMediaType(folder: string): string {
    switch (folder) {
      case "products":
      case "product-gallery":
        return "product";
      case "categories":
        return "category";
      case "brands":
        return "brand";
      case "banners":
      case "homepage":
        return "banner";
      case "blog":
        return "blog";
      case "users":
      case "avatars":
        return "user";
      case "testimonials":
        return "testimonial";
      case "custom-cakes":
        return "custom-cake";
      default:
        return "gallery";
    }
  }

  public async uploadImage(
    buffer: Buffer,
    options: UploadMediaOptions
  ): Promise<UploadMediaResult> {
    await ensureMediaSchema();
    const { folder, originalName, customWidth, customHeight, quality, uploadedBy, altText, title, mediaType } = options;

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

    // Save metadata to Supabase DB
    const adminClient = createSupabaseAdminClient();
    let mediaRecordId: string | undefined = undefined;

    if (adminClient) {
      try {
        const derivedType = mediaType || this.deriveMediaType(sanitizedFolder);
        const { data, error } = await adminClient
          .from("media")
          .upsert(
            {
              filename: saveResult.filename,
              original_filename: originalName || saveResult.filename,
              storage_path: saveResult.relativePath,
              public_url: saveResult.url,
              mime_type: "image/webp",
              extension: "webp",
              file_size: processed.size,
              width: processed.width,
              height: processed.height,
              alt_text: altText || null,
              title: title || originalName || saveResult.filename,
              folder: sanitizedFolder,
              media_type: derivedType,
              uploaded_by: uploadedBy || null,
              updated_at: new Date().toISOString(),
            },
            { onConflict: "storage_path" }
          )
          .select("id")
          .single();

        if (!error && data) {
          mediaRecordId = data.id;
        }
      } catch (err) {
        console.warn("[MediaService] DB metadata save warning:", err);
      }
    }

    return {
      success: true,
      id: mediaRecordId,
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

  public async getMediaUsage(urlOrPath: string): Promise<MediaUsageResult> {
    const cleanPath = this.normalizeStoragePath(urlOrPath);
    if (!cleanPath) return { count: 0, usages: [] };

    const filename = cleanPath.split("/").pop() || cleanPath;
    if (!filename) return { count: 0, usages: [] };

    const adminClient = createSupabaseAdminClient();
    if (!adminClient) return { count: 0, usages: [] };

    const usages: MediaUsageItem[] = [];

    try {
      // 1. Products (featured_image)
      const { data: mainProducts } = await adminClient
        .from("products")
        .select("id, name, slug")
        .ilike("featured_image", `%${filename}%`);

      if (mainProducts) {
        for (const p of mainProducts) {
          usages.push({
            entityType: "product_main",
            title: `Product Main Image: ${p.name}`,
            detail: `Main featured image for ${p.name}`,
            link: `/admin/products?edit=${p.id}`,
            entityId: p.id,
            productId: p.id,
          });
        }
      }

      // 2. Product Gallery
      const { data: galleryImages } = await adminClient
        .from("product_images")
        .select("id, product_id, products(id, name, slug)")
        .ilike("storage_path", `%${filename}%`);

      if (galleryImages) {
        for (const g of galleryImages) {
          const prod = (g as any).products;
          if (prod) {
            usages.push({
              entityType: "product_gallery",
              title: `Product Gallery: ${prod.name}`,
              detail: `In main image gallery of ${prod.name}`,
              link: `/admin/products?edit=${prod.id}`,
              entityId: g.id,
              productId: prod.id,
            });
          }
        }
      }

      // 3. Product Variations Main Image
      const { data: variantMains } = await adminClient
        .from("product_variations")
        .select("id, title, product_id, products(id, name)")
        .ilike("image_url", `%${filename}%`);

      if (variantMains) {
        for (const v of variantMains) {
          const prod = (v as any).products;
          usages.push({
            entityType: "variant_main",
            title: `Product Variant: ${v.title || "Variant"} (${prod?.name || "Product"})`,
            detail: `Main image for variant option`,
            link: `/admin/products?edit=${v.product_id}`,
            entityId: v.id,
            productId: v.product_id,
          });
        }
      }

      // 4. Product Variation Images Gallery
      const { data: variantGallery } = await adminClient
        .from("product_variation_images")
        .select("id, variation_id, product_variations(id, title, product_id, products(id, name))")
        .ilike("storage_path", `%${filename}%`);

      if (variantGallery) {
        for (const vg of variantGallery) {
          const v = (vg as any).product_variations;
          const prod = v?.products;
          if (v) {
            usages.push({
              entityType: "variant_gallery",
              title: `Variant Gallery: ${v.title || "Variant"} (${prod?.name || "Product"})`,
              detail: `In variant gallery for ${v.title}`,
              link: `/admin/products?edit=${v.product_id}`,
              entityId: vg.id,
              productId: v.product_id,
            });
          }
        }
      }

      // 5. Product Attribute Swatch Images
      const { data: swatchValues } = await adminClient
        .from("product_attribute_values")
        .select("id, label, attribute_id, product_attributes(id, name, product_id, products(id, name))")
        .ilike("swatch_image", `%${filename}%`);

      if (swatchValues) {
        for (const sv of swatchValues) {
          const attr = (sv as any).product_attributes;
          const prod = attr?.products;
          usages.push({
            entityType: "attribute_swatch",
            title: `Attribute Swatch: ${attr?.name || "Attribute"} → ${sv.label}`,
            detail: `Swatch image for ${attr?.name}: ${sv.label} (${prod?.name || "Product"})`,
            link: `/admin/products?edit=${attr?.product_id}`,
            entityId: sv.id,
            productId: attr?.product_id,
          });
        }
      }

      // 6. Product Attribute Linked Images
      const { data: attrLinkedImages } = await adminClient
        .from("product_attribute_images")
        .select("id, attribute_value_id, product_attribute_values(id, label, attribute_id, product_attributes(id, name, product_id, products(id, name)))")
        .ilike("storage_path", `%${filename}%`);

      if (attrLinkedImages) {
        for (const ali of attrLinkedImages) {
          const val = (ali as any).product_attribute_values;
          const attr = val?.product_attributes;
          const prod = attr?.products;
          usages.push({
            entityType: "attribute_gallery",
            title: `Attribute Linked Image: ${attr?.name || "Attribute"} → ${val?.label || "Value"}`,
            detail: `Smart gallery image linked to ${attr?.name}: ${val?.label} (${prod?.name || "Product"})`,
            link: `/admin/products?edit=${attr?.product_id}`,
            entityId: ali.id,
            productId: attr?.product_id,
          });
        }
      }

      // 7. Categories
      const { data: categories } = await adminClient
        .from("categories")
        .select("id, name, slug")
        .ilike("image_path", `%${filename}%`);

      if (categories) {
        for (const c of categories) {
          usages.push({
            entityType: "category",
            title: `Category Image: ${c.name}`,
            detail: `Main category thumbnail for ${c.name}`,
            link: `/admin/categories?edit=${c.id}`,
            entityId: c.id,
          });
        }
      }

      // 8. Brands
      const { data: brands } = await adminClient
        .from("brands")
        .select("id, name, slug")
        .ilike("logo_url", `%${filename}%`);

      if (brands) {
        for (const b of brands) {
          usages.push({
            entityType: "brand",
            title: `Brand Logo: ${b.name}`,
            detail: `Official logo image for ${b.name}`,
            link: `/admin/settings`,
            entityId: b.id,
          });
        }
      }

      // 9. Banners
      const { data: banners } = await adminClient
        .from("banners")
        .select("id, title")
        .ilike("image_path", `%${filename}%`);

      if (banners) {
        for (const bn of banners) {
          usages.push({
            entityType: "banner",
            title: `Banner: ${bn.title}`,
            detail: `Promotional storefront banner`,
            link: `/admin/settings`,
            entityId: bn.id,
          });
        }
      }

      // 10. Custom Cake Images
      const { data: cakeImages } = await adminClient
        .from("custom_cake_images")
        .select("id, request_id, custom_cake_requests(id, request_number, customer_name)")
        .ilike("storage_path", `%${filename}%`);

      if (cakeImages) {
        for (const ci of cakeImages) {
          const req = (ci as any).custom_cake_requests;
          usages.push({
            entityType: "custom_cake",
            title: `Custom Cake Request: ${req?.request_number || "Request"}`,
            detail: `Reference image submitted by ${req?.customer_name || "Customer"}`,
            link: `/admin/custom-cakes?id=${req?.id}`,
            entityId: ci.id,
          });
        }
      }
    } catch (err) {
      console.error("[MediaService.getMediaUsage error]:", err);
    }

    return {
      count: usages.length,
      usages,
    };
  }

  public async deleteMediaWithSafety(
    urlOrPath: string,
    forceRemoveReferences: boolean = false
  ): Promise<{ success: boolean; error?: string; usages?: MediaUsageResult }> {
    const cleanPath = this.normalizeStoragePath(urlOrPath);
    if (!cleanPath) return { success: false, error: "Invalid image path provided." };

    const usageResult = await this.getMediaUsage(cleanPath);

    if (usageResult.count > 0 && !forceRemoveReferences) {
      return {
        success: false,
        error: `Cannot delete image because it is currently used in ${usageResult.count} place(s).`,
        usages: usageResult,
      };
    }

    const adminClient = createSupabaseAdminClient();

    // If forcing removal of references, clear all entity links in DB
    if (usageResult.count > 0 && forceRemoveReferences && adminClient) {
      try {
        await Promise.all([
          adminClient.from("products").update({ featured_image: null }).eq("featured_image", cleanPath),
          adminClient.from("product_images").delete().eq("storage_path", cleanPath),
          adminClient.from("product_variations").update({ image_url: null }).eq("image_url", cleanPath),
          adminClient.from("product_variation_images").delete().eq("storage_path", cleanPath),
          adminClient.from("product_attribute_values").update({ swatch_image: null }).eq("swatch_image", cleanPath),
          adminClient.from("product_attribute_images").delete().eq("storage_path", cleanPath),
          adminClient.from("categories").update({ image_path: null }).eq("image_path", cleanPath),
          adminClient.from("banners").update({ image_path: null }).eq("image_path", cleanPath),
          adminClient.from("custom_cake_images").delete().eq("storage_path", cleanPath),
        ]);
      } catch (err) {
        console.error("[MediaService] Error removing entity references:", err);
      }
    }

    // Delete physical file from VPS disk
    await this.storage.deleteFile(cleanPath);

    // Delete DB metadata record
    if (adminClient) {
      try {
        await adminClient.from("media").delete().eq("storage_path", cleanPath);
      } catch (err) {
        console.error("[MediaService] Error deleting media DB record:", err);
      }
    }

    return { success: true };
  }

  public async updateMediaMetadata(
    storagePathOrId: string,
    data: { altText?: string; title?: string; folder?: string; mediaType?: string }
  ): Promise<boolean> {
    await ensureMediaSchema();
    const adminClient = createSupabaseAdminClient();
    if (!adminClient) return false;

    const cleanPath = this.normalizeStoragePath(storagePathOrId);

    const updatePayload: any = { updated_at: new Date().toISOString() };
    if (data.altText !== undefined) updatePayload.alt_text = data.altText;
    if (data.title !== undefined) updatePayload.title = data.title;
    if (data.folder !== undefined) updatePayload.folder = data.folder;
    if (data.mediaType !== undefined) updatePayload.media_type = data.mediaType;

    const { error } = await adminClient
      .from("media")
      .update(updatePayload)
      .or(`id.eq.${storagePathOrId},storage_path.eq.${cleanPath}`);

    return !error;
  }

  public async syncAndMigrateMedia(): Promise<{
    syncedCount: number;
    totalMediaInDb: number;
    totalDiskFiles: number;
    orphanFiles: string[];
    missingPhysicalFiles: string[];
    stats: any;
  }> {
    await ensureMediaSchema();
    const adminClient = createSupabaseAdminClient();

    // 1. Get all disk files
    const diskFiles = await this.storage.listFiles();
    const diskPathSet = new Set(diskFiles.map((f) => f.relativePath));

    let syncedCount = 0;
    const dbPathSet = new Set<string>();

    if (adminClient) {
      // Fetch existing DB media records
      const { data: existingMedia } = await adminClient.from("media").select("storage_path");
      if (existingMedia) {
        existingMedia.forEach((m) => dbPathSet.add(m.storage_path));
      }

      // Upsert disk files into media DB table if missing
      for (const diskFile of diskFiles) {
        if (!dbPathSet.has(diskFile.relativePath)) {
          const derivedType = this.deriveMediaType(diskFile.folder);
          await adminClient.from("media").upsert(
            {
              filename: diskFile.name,
              original_filename: diskFile.name,
              storage_path: diskFile.relativePath,
              public_url: diskFile.url,
              mime_type: "image/webp",
              extension: diskFile.name.split(".").pop() || "webp",
              file_size: diskFile.size,
              folder: diskFile.folder,
              media_type: derivedType,
              title: diskFile.name,
              created_at: diskFile.createdAt.toISOString(),
              updated_at: diskFile.updatedAt.toISOString(),
            },
            { onConflict: "storage_path" }
          );
          syncedCount++;
          dbPathSet.add(diskFile.relativePath);
        }
      }
    }

    // Determine orphan files (files on disk not referenced by any product/category/banner/etc.)
    const orphanFiles: string[] = [];
    for (const diskFile of diskFiles) {
      const usage = await this.getMediaUsage(diskFile.relativePath);
      if (usage.count === 0) {
        orphanFiles.push(diskFile.relativePath);
      }
    }

    // Determine missing physical files (DB records whose physical file is missing from VPS disk)
    const missingPhysicalFiles: string[] = [];
    for (const dbPath of Array.from(dbPathSet)) {
      if (!diskPathSet.has(dbPath)) {
        missingPhysicalFiles.push(dbPath);
      }
    }

    const stats = await this.storage.getFolderStats();

    return {
      syncedCount,
      totalMediaInDb: dbPathSet.size,
      totalDiskFiles: diskFiles.length,
      orphanFiles,
      missingPhysicalFiles,
      stats,
    };
  }

  public async replaceImage(
    oldUrlOrPath: string,
    newBuffer: Buffer,
    options: UploadMediaOptions
  ): Promise<UploadMediaResult> {
    const uploadResult = await this.uploadImage(newBuffer, options);

    if (oldUrlOrPath) {
      try {
        await this.deleteMediaWithSafety(oldUrlOrPath, true);
      } catch (err) {
        console.warn(`[MediaService] Replace warning: ${oldUrlOrPath}:`, err);
      }
    }

    return uploadResult;
  }

  public async deleteImage(urlOrPath: string): Promise<boolean> {
    const res = await this.deleteMediaWithSafety(urlOrPath, false);
    return res.success;
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
