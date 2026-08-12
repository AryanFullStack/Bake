import { NextRequest, NextResponse } from "next/server";
import { assertAdminApi } from "@/lib/auth";
import { mediaService } from "@/lib/media/media-service";

export async function POST(req: NextRequest) {
  try {
    const admin = await assertAdminApi();
    if (!admin) {
      return NextResponse.json({ success: false, error: "Unauthorized." }, { status: 401 });
    }

    const body = await req.json();
    const { id, path, altText, title, folder, mediaType } = body;

    const target = id || path;
    if (!target) {
      return NextResponse.json({ success: false, error: "Media ID or path required." }, { status: 400 });
    }

    const updated = await mediaService.updateMediaMetadata(target, {
      altText,
      title,
      folder,
      mediaType,
    });

    if (!updated) {
      return NextResponse.json({ success: false, error: "Failed to update media record." }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: "Media metadata updated successfully.",
    });
  } catch (error: any) {
    console.error("[API /api/media/update] Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
