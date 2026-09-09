import { NextRequest, NextResponse } from "next/server";
import { assertAdminApi } from "@/lib/auth";
import { mediaService } from "@/lib/media/media-service";
import { getImageKitStorageProvider } from "@/lib/media/imagekit-provider";

export async function POST(req: NextRequest) {
  try {
    const admin = await assertAdminApi();
    if (!admin) {
      return NextResponse.json(
        { success: false, error: "Unauthorized access. Admin permissions required." },
        { status: 401 }
      );
    }

    const ikProvider = getImageKitStorageProvider();
    if (!ikProvider.isConfigured()) {
      return NextResponse.json(
        {
          success: false,
          error:
            "ImageKit environment variables (IMAGEKIT_PUBLIC_KEY, IMAGEKIT_PRIVATE_KEY, IMAGEKIT_URL_ENDPOINT) are not configured.",
        },
        { status: 400 }
      );
    }

    const result = await mediaService.migrateExistingVpsImagesToImageKit();

    return NextResponse.json({
      success: result.success,
      message: `VPS to ImageKit migration complete: ${result.migratedCount} migrated, ${result.skippedCount} skipped, ${result.failedCount} failed.`,
      data: result,
    });
  } catch (error: any) {
    console.error("[API /api/admin/media/migrate-imagekit] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Migration failed due to an unexpected error.",
      },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const admin = await assertAdminApi();
    if (!admin) {
      return NextResponse.json(
        { success: false, error: "Unauthorized access. Admin permissions required." },
        { status: 401 }
      );
    }

    const ikProvider = getImageKitStorageProvider();

    return NextResponse.json({
      success: true,
      configured: ikProvider.isConfigured(),
      urlEndpoint: ikProvider.getUrlEndpoint() || null,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || "Error checking ImageKit status." },
      { status: 500 }
    );
  }
}
