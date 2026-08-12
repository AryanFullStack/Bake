import { NextRequest, NextResponse } from "next/server";
import { assertAdminApi } from "@/lib/auth";
import { mediaService } from "@/lib/media/media-service";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { ensureMediaSchema } from "@/lib/supabase/schema-runner";

export async function GET(req: NextRequest) {
  try {
    const admin = await assertAdminApi();
    if (!admin) {
      return NextResponse.json(
        { success: false, error: "Unauthorized access." },
        { status: 401 }
      );
    }

    await ensureMediaSchema();
    const adminClient = createSupabaseAdminClient();

    const { searchParams } = new URL(req.url);
    const folder = searchParams.get("folder") || "all";
    const mediaType = searchParams.get("mediaType") || "all";
    const search = searchParams.get("search")?.trim() || "";
    const usageFilter = searchParams.get("usageFilter") || "all"; // 'all' | 'used' | 'unused'
    const sort = searchParams.get("sort") || "newest"; // 'newest' | 'oldest' | 'largest' | 'smallest' | 'name_asc' | 'name_desc'
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.max(1, Math.min(200, parseInt(searchParams.get("limit") || "40", 10)));

    // Ensure filesystem and DB media table are synced
    await mediaService.syncAndMigrateMedia();

    let query = adminClient ? adminClient.from("media").select("*", { count: "exact" }) : null;

    if (query) {
      if (folder && folder !== "all") {
        query = query.eq("folder", folder);
      }
      if (mediaType && mediaType !== "all") {
        query = query.eq("media_type", mediaType);
      }

      if (search) {
        query = query.or(
          `filename.ilike.%${search}%,original_filename.ilike.%${search}%,title.ilike.%${search}%,alt_text.ilike.%${search}%`
        );
      }

      // Sorting
      switch (sort) {
        case "oldest":
          query = query.order("created_at", { ascending: true });
          break;
        case "largest":
          query = query.order("file_size", { ascending: false });
          break;
        case "smallest":
          query = query.order("file_size", { ascending: true });
          break;
        case "name_asc":
          query = query.order("filename", { ascending: true });
          break;
        case "name_desc":
          query = query.order("filename", { ascending: false });
          break;
        case "newest":
        default:
          query = query.order("created_at", { ascending: false });
          break;
      }
    }

    let items: any[] = [];
    let total = 0;

    if (query) {
      const { data, count, error } = await query;
      if (!error && data) {
        items = data;
        total = count || data.length;
      }
    }

    // Fallback if DB query returned nothing or client unavailable
    if (items.length === 0 && !search && folder === "all" && mediaType === "all") {
      const diskFiles = await mediaService.listMedia();
      items = diskFiles.map((f) => ({
        id: f.relativePath,
        filename: f.name,
        original_filename: f.name,
        storage_path: f.relativePath,
        public_url: f.url,
        mime_type: "image/webp",
        extension: "webp",
        file_size: f.size,
        folder: f.folder,
        media_type: mediaService.deriveMediaType(f.folder),
        created_at: f.createdAt.toISOString(),
        updated_at: f.updatedAt.toISOString(),
      }));
      total = items.length;
    }

    // Enrich items with live usage info
    const enrichedItems = await Promise.all(
      items.map(async (item) => {
        const usage = await mediaService.getMediaUsage(item.storage_path);
        return {
          ...item,
          usage_count: usage.count,
          usages: usage.usages,
        };
      })
    );

    // Apply Usage filter (used / unused)
    let filteredItems = enrichedItems;
    if (usageFilter === "used") {
      filteredItems = enrichedItems.filter((i) => i.usage_count > 0);
    } else if (usageFilter === "unused") {
      filteredItems = enrichedItems.filter((i) => i.usage_count === 0);
    }

    // Pagination
    const startIndex = (page - 1) * limit;
    const paginatedItems = filteredItems.slice(startIndex, startIndex + limit);

    // Calculate aggregated storage stats
    const diskStats = await mediaService.getStats();

    let productImagesCount = 0;
    let categoryImagesCount = 0;
    let brandImagesCount = 0;
    let bannerImagesCount = 0;
    let unusedCount = 0;

    enrichedItems.forEach((i) => {
      if (i.folder === "products" || i.folder === "product-gallery") productImagesCount++;
      else if (i.folder === "categories") categoryImagesCount++;
      else if (i.folder === "brands") brandImagesCount++;
      else if (i.folder === "banners" || i.folder === "homepage") bannerImagesCount++;

      if (i.usage_count === 0) unusedCount++;
    });

    return NextResponse.json({
      success: true,
      data: paginatedItems,
      pagination: {
        total: filteredItems.length,
        page,
        limit,
        totalPages: Math.ceil(filteredItems.length / limit) || 1,
      },
      stats: {
        totalFiles: diskStats.totalFiles,
        totalSizeBytes: diskStats.totalSizeBytes,
        folders: diskStats.folders,
        counts: {
          products: productImagesCount,
          categories: categoryImagesCount,
          brands: brandImagesCount,
          banners: bannerImagesCount,
          unused: unusedCount,
        },
      },
    });
  } catch (error: any) {
    console.error("[API /api/media/list] Error listing media:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to retrieve media library." },
      { status: 500 }
    );
  }
}
