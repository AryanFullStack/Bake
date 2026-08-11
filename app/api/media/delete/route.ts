import { NextRequest, NextResponse } from "next/server";
import { assertAdminApi } from "@/lib/auth";
import { mediaService } from "@/lib/media/media-service";

export async function DELETE(req: NextRequest) {
  try {
    const admin = await assertAdminApi();
    if (!admin) {
      return NextResponse.json(
        { success: false, error: "Unauthorized access." },
        { status: 401 }
      );
    }

    let urlOrPath = "";

    const contentType = req.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      const body = await req.json();
      urlOrPath = body.url || body.relativePath || body.path || "";
    } else {
      const { searchParams } = new URL(req.url);
      urlOrPath = searchParams.get("url") || searchParams.get("path") || "";
    }

    if (!urlOrPath) {
      return NextResponse.json(
        { success: false, error: "Image URL or path parameter is required." },
        { status: 400 }
      );
    }

    const deleted = await mediaService.deleteImage(urlOrPath);

    if (!deleted) {
      return NextResponse.json(
        { success: false, error: "File not found or could not be deleted." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Image deleted successfully from persistent storage.",
    });
  } catch (error: any) {
    console.error("[API /api/media/delete] Delete error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to delete image." },
      { status: 500 }
    );
  }
}
