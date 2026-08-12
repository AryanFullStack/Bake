import { NextRequest, NextResponse } from "next/server";
import { assertAdminApi } from "@/lib/auth";
import { mediaService } from "@/lib/media/media-service";

export async function GET(req: NextRequest) {
  try {
    const admin = await assertAdminApi();
    if (!admin) {
      return NextResponse.json({ success: false, error: "Unauthorized." }, { status: 401 });
    }

    const healthData = await mediaService.syncAndMigrateMedia();

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
      },
    });
  } catch (error: any) {
    console.error("[API /api/media/health] Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
