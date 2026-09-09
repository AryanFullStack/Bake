import { NextRequest, NextResponse } from "next/server";
import { assertAdminApi } from "@/lib/auth";
import { mediaService } from "@/lib/media/media-service";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { ensureMediaSchema } from "@/lib/supabase/schema-runner";
import { getImageKitStorageProvider } from "@/lib/media/imagekit-provider";

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
    const ikProvider = getImageKitStorageProvider();

    const { searchParams } = new URL(req.url);
    const folder = searchParams.get("folder") || "all";
    const mediaType = searchParams.get("mediaType") || "all";
    const search = searchParams.get("search")?.trim() || "";
    const usageFilter = searchParams.get("usageFilter") || "all"; // 'all' | 'used' | 'unused'
    const providerFilter = searchParams.get("providerFilter") || "all"; // 'all' | 'imagekit' | 'vps'
    const sort = searchParams.get("sort") || "newest"; // 'newest' | 'oldest' | 'largest' | 'smallest' | 'name_asc' | 'name_desc'
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.max(1, Math.min(200, parseInt(searchParams.get("limit") || "24", 10)));

    // Do NOT run blocking filesystem sync on routine list GET calls.
    // Sync can be explicitly triggered by user via /api/media/sync.

    let query = adminClient ? adminClient.from("media").select("*", { count: "exact" }) : null;

    if (query) {
      if (folder && folder !== "all") {
        query = query.eq("folder", folder);
      }
      if (mediaType && mediaType !== "all") {
        query = query.eq("media_type", mediaType);
      }
      if (providerFilter === "imagekit") {
        query = query.ilike("public_url", "%imagekit.io%");
      } else if (providerFilter === "vps") {
        query = query.not("public_url", "ilike", "%imagekit.io%");
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

    let rawItems: any[] = [];
    let totalItemsCount = 0;

    const startIndex = (page - 1) * limit;

    if (query) {
      if (usageFilter === "all") {
        // Fast path: paginate at DB level
        const { data, count, error } = await query.range(startIndex, startIndex + limit - 1);
        if (!error && data) {
          rawItems = data;
          totalItemsCount = count || data.length;
        }
      } else {
        // Usage filter requires evaluating usage: fetch matching candidates
        const { data, count, error } = await query;
        if (!error && data) {
          rawItems = data;
          totalItemsCount = count || data.length;
        }
      }
    }

    // Fallback if DB query returned nothing or client unavailable
    if (rawItems.length === 0 && !search && folder === "all" && mediaType === "all" && usageFilter === "all") {
      const diskFiles = await mediaService.listMedia();
      const mapped = diskFiles.map((f) => ({
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
      totalItemsCount = mapped.length;
      rawItems = mapped.slice(startIndex, startIndex + limit);
    }

    // Determine slice to enrich with usage
    let itemsToProcess = rawItems;
    let paginatedFinalItems: any[] = [];

    if (usageFilter !== "all") {
      // Evaluate usage across candidate items
      const enrichedAll = await Promise.all(
        rawItems.map(async (item) => {
          const usage = await mediaService.getMediaUsage(item.storage_path || item.public_url);
          const isIk = Boolean(
            (item.public_url && item.public_url.includes("imagekit.io")) ||
            (item.storage_path && item.storage_path.includes("imagekit.io"))
          );
          return {
            ...item,
            storage_provider: isIk ? "imagekit" : "vps",
            usage_count: usage.count,
            usages: usage.usages,
          };
        })
      );

      let filtered = enrichedAll;
      if (usageFilter === "used") filtered = filtered.filter((i) => i.usage_count > 0);
      else if (usageFilter === "unused") filtered = filtered.filter((i) => i.usage_count === 0);

      totalItemsCount = filtered.length;
      paginatedFinalItems = filtered.slice(startIndex, startIndex + limit);
    } else {
      // Fast path: items are already paginated by DB range, enrich ONLY these page items
      paginatedFinalItems = await Promise.all(
        itemsToProcess.map(async (item) => {
          const usage = await mediaService.getMediaUsage(item.storage_path || item.public_url);
          const isIk = Boolean(
            (item.public_url && item.public_url.includes("imagekit.io")) ||
            (item.storage_path && item.storage_path.includes("imagekit.io"))
          );
          return {
            ...item,
            storage_provider: isIk ? "imagekit" : "vps",
            usage_count: usage.count,
            usages: usage.usages,
          };
        })
      );
    }

    // Get aggregated stats efficiently
    let folderCounts: Record<string, number> = {};
    let totalDbFiles = 0;
    let imagekitFilesCount = 0;
    let imagekitSizeBytes = 0;
    let vpsFilesCount = 0;
    let vpsSizeBytes = 0;

    if (adminClient) {
      const { data: allStats } = await adminClient
        .from("media")
        .select("folder, public_url, file_size");

      if (allStats) {
        totalDbFiles = allStats.length;
        allStats.forEach((r) => {
          folderCounts[r.folder] = (folderCounts[r.folder] || 0) + 1;
          const isIk = Boolean(r.public_url && r.public_url.includes("imagekit.io"));
          const size = r.file_size || 0;
          if (isIk) {
            imagekitFilesCount++;
            imagekitSizeBytes += size;
          } else {
            vpsFilesCount++;
            vpsSizeBytes += size;
          }
        });
      }
    }

    return NextResponse.json({
      success: true,
      data: paginatedFinalItems,
      pagination: {
        total: totalItemsCount,
        page,
        limit,
        totalPages: Math.ceil(totalItemsCount / limit) || 1,
      },
      stats: {
        totalFiles: totalDbFiles || totalItemsCount,
        totalSizeBytes: imagekitSizeBytes + vpsSizeBytes,
        imagekitConfigured: ikProvider.isConfigured(),
        imagekitFilesCount,
        imagekitSizeBytes,
        vpsFilesCount,
        vpsSizeBytes,
        folders: folderCounts,
        counts: {
          products: (folderCounts["products"] || 0) + (folderCounts["product-gallery"] || 0),
          categories: folderCounts["categories"] || 0,
          brands: folderCounts["brands"] || 0,
          banners: (folderCounts["banners"] || 0) + (folderCounts["homepage"] || 0),
          unused: 0,
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
