import { NextRequest, NextResponse } from "next/server";
import { assertAdminApi } from "@/lib/auth";
import { mediaService } from "@/lib/media/media-service";

export async function POST(req: NextRequest) {
  try {
    const admin = await assertAdminApi();
    if (!admin) {
      return NextResponse.json({ success: false, error: "Unauthorized." }, { status: 401 });
    }

    const syncReport = await mediaService.syncAndMigrateMedia();

    return NextResponse.json({
      success: true,
      message: `Sync completed. ${syncReport.syncedCount} new images registered.`,
      data: syncReport,
    });
  } catch (error: any) {
    console.error("[API /api/media/sync] Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
