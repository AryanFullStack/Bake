import { NextRequest, NextResponse } from "next/server";
import { assertAdminApi } from "@/lib/auth";
import { mediaService } from "@/lib/media/media-service";

export async function GET(req: NextRequest) {
  try {
    const admin = await assertAdminApi();
    if (!admin) {
      return NextResponse.json({ success: false, error: "Unauthorized." }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const path = searchParams.get("path") || searchParams.get("url") || "";

    if (!path) {
      return NextResponse.json({ success: false, error: "Path required." }, { status: 400 });
    }

    const usageResult = await mediaService.getMediaUsage(path);

    return NextResponse.json({
      success: true,
      data: usageResult,
    });
  } catch (error: any) {
    console.error("[API /api/media/usage] Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
