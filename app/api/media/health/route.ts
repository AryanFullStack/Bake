import { NextRequest, NextResponse } from "next/server";
import { assertAdminApi } from "@/lib/auth";
import { mediaService } from "@/lib/media/media-service";
import { getImageKitStorageProvider } from "@/lib/media/imagekit-provider";

export async function GET(req: NextRequest) {
  try {
    const admin = await assertAdminApi();
    if (!admin) {
      return NextResponse.json({ success: false, error: "Unauthorized." }, { status: 401 });
    }

    const healthData = await mediaService.syncAndMigrateMedia();
    const ikProvider = getImageKitStorageProvider();
    const ikConfigured = ikProvider.isConfigured();
    const ikUsage = ikConfigured ? await ikProvider.getStorageUsage() : { totalFiles: 0, totalSizeBytes: 0 };

    // Storage warning threshold calculations (e.g. 5GB limit baseline for Hostinger VPS check)
    const MAX_RECOMMENDED_BYTES = 5 * 1024 * 1024 * 1024; // 5 GB
    const usedBytes = healthData.stats.totalSizeBytes;
    const usagePercent = Math.min(100, Math.round((usedBytes / MAX_RECOMMENDED_BYTES) * 100));

    return NextResponse.json({
      success: true,
      data: {
        totalFiles: healthData.totalDiskFiles,
        totalMediaInDb: healthData.totalMediaInDb,
        totalSizeBytes: usedBytes,
        usagePercent,
        warningThreshold: usagePercent >= 80,
        criticalThreshold: usagePercent >= 90,
        orphanFilesCount: healthData.orphanFiles.length,
        orphanFiles: healthData.orphanFiles,
        missingPhysicalFilesCount: healthData.missingPhysicalFiles.length,
        missingPhysicalFiles: healthData.missingPhysicalFiles,
        folders: healthData.stats.folders,
        imagekit: {
          configured: ikConfigured,
          endpoint: ikProvider.getUrlEndpoint() || null,
          filesCount: ikUsage.totalFiles,
          totalSizeBytes: ikUsage.totalSizeBytes,
        },
      },
    });
  } catch (error: any) {
    console.error("[API /api/media/health] Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
