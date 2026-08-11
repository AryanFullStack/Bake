import { NextRequest, NextResponse } from "next/server";
import { assertAdminApi } from "@/lib/auth";
import { mediaService } from "@/lib/media/media-service";

export async function GET(req: NextRequest) {
  try {
    const admin = await assertAdminApi();
    if (!admin) {
      return NextResponse.json(
        { success: false, error: "Unauthorized access." },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const folder = searchParams.get("folder") || undefined;
    const search = searchParams.get("search") || undefined;
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "40", 10);

    const allFiles = await mediaService.listMedia(folder, search);
    const stats = await mediaService.getStats();

    const total = allFiles.length;
    const startIndex = (page - 1) * limit;
    const paginatedFiles = allFiles.slice(startIndex, startIndex + limit);

    return NextResponse.json({
      success: true,
      data: paginatedFiles,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
      stats,
    });
  } catch (error: any) {
    console.error("[API /api/media/list] Error listing media:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to retrieve media library." },
      { status: 500 }
    );
  }
}
