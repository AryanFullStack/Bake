import { NextRequest, NextResponse } from "next/server";
import { assertAdminApi } from "@/lib/auth";
import { mediaService } from "@/lib/media/media-service";
import { checkRateLimit } from "@/lib/media/security";

export async function POST(req: NextRequest) {
  try {
    const admin = await assertAdminApi();
    if (!admin) {
      return NextResponse.json(
        { success: false, error: "Unauthorized access. Admin permissions required." },
        { status: 401 }
      );
    }

    const rateCheck = checkRateLimit(admin.user.id, 30, 60 * 1000);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { success: false, error: "Rate limit exceeded. Please try again shortly." },
        { status: 429 }
      );
    }

    const formData = await req.formData();
    const oldUrl = (formData.get("oldUrl") as string) || (formData.get("oldPath") as string) || "";
    const folder = (formData.get("folder") as string) || "products";
    const file = formData.get("file") as File;

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { success: false, error: "New image file is required for replacement." },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const result = await mediaService.replaceImage(oldUrl, buffer, {
      folder,
      originalName: file.name,
    });

    return NextResponse.json({
      success: true,
      message: "Image replaced and old file removed successfully.",
      data: result,
    });
  } catch (error: any) {
    console.error("[API /api/media/replace] Replace error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to replace image.",
      },
      { status: 400 }
    );
  }
}
