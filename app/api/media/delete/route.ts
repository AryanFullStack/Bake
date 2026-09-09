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
    let urlsOrPaths: string[] = [];
    let forceRemoveReferences = false;

    const contentType = req.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      const body = await req.json();
      urlOrPath = body.url || body.relativePath || body.path || "";
      if (Array.isArray(body.urls)) urlsOrPaths = body.urls;
      else if (Array.isArray(body.paths)) urlsOrPaths = body.paths;
      forceRemoveReferences = Boolean(body.forceRemoveReferences);
    } else {
      const { searchParams } = new URL(req.url);
      urlOrPath = searchParams.get("url") || searchParams.get("path") || "";
      forceRemoveReferences = searchParams.get("force") === "true";
    }

    if (!urlOrPath && urlsOrPaths.length === 0) {
      return NextResponse.json(
        { success: false, error: "Image URL(s) or path(s) parameter is required." },
        { status: 400 }
      );
    }

    // Handle bulk deletion
    if (urlsOrPaths.length > 0) {
      let deletedCount = 0;
      let failedCount = 0;
      const failures: { path: string; error?: string; usages?: any }[] = [];

      for (const target of urlsOrPaths) {
        if (!target) continue;
        const res = await mediaService.deleteMediaWithSafety(target, forceRemoveReferences);
        if (res.success) {
          deletedCount++;
        } else {
          failedCount++;
          failures.push({
            path: target,
            error: res.error,
            usages: res.usages,
          });
        }
      }

      return NextResponse.json({
        success: failures.length === 0,
        message: `Bulk deletion processed. ${deletedCount} deleted, ${failedCount} failed.`,
        deletedCount,
        failedCount,
        failures,
      });
    }

    // Single item deletion
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
