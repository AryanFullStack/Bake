import { NextRequest, NextResponse } from "next/server";
import { assertAdminApi } from "@/lib/auth";
import { mediaService } from "@/lib/media/media-service";

export async function POST(req: NextRequest) {
  try {
    const admin = await assertAdminApi();
    if (!admin) {
      return NextResponse.json(
        { success: false, error: "Unauthorized access." },
        { status: 401 }
      );
    }

    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { success: false, error: "No image file provided for validation." },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const validationResult = await mediaService.validateImage(buffer);

    if (!validationResult.valid) {
      const errorMsg = "error" in validationResult ? validationResult.error : "File failed validation checks.";
      return NextResponse.json({
        success: false,
        valid: false,
        error: errorMsg || "File failed validation checks.",
      }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      valid: true,
      data: validationResult,
    });
  } catch (error: any) {
    console.error("[API /api/media/validate] Validation error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to validate file." },
      { status: 400 }
    );
  }
}
