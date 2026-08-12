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
    let forceRemoveReferences = false;

    const contentType = req.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      const body = await req.json();
      urlOrPath = body.url || body.relativePath || body.path || "";
      forceRemoveReferences = Boolean(body.forceRemoveReferences);
    } else {
      const { searchParams } = new URL(req.url);
      urlOrPath = searchParams.get("url") || searchParams.get("path") || "";
      forceRemoveReferences = searchParams.get("force") === "true";
    }

    if (!urlOrPath) {
      return NextResponse.json(
        { success: false, error: "Image URL or path parameter is required." },
        { status: 400 }
      );
    }

    const result = await mediaService.deleteMediaWithSafety(urlOrPath, forceRemoveReferences);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error,
          inUse: Boolean(result.usages && result.usages.count > 0),
          usages: result.usages,
        },
        { status: result.usages && result.usages.count > 0 ? 409 : 400 }
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
