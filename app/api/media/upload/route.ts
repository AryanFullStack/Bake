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

    const rateCheck = checkRateLimit(admin.user.id, 50, 60 * 1000);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { success: false, error: "Rate limit exceeded. Please wait a moment before uploading again." },
        { status: 429 }
      );
    }

    const formData = await req.formData();
    const folder = (formData.get("folder") as string) || "products";
    
    // Get file or files array
    const files = formData.getAll("file").concat(formData.getAll("files")) as File[];

    if (!files || files.length === 0 || !(files[0] instanceof File)) {
      return NextResponse.json(
        { success: false, error: "No image files provided in form data." },
        { status: 400 }
      );
    }

    const uploadedResults = [];

    for (const file of files) {
      if (!(file instanceof File)) continue;
      
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      const result = await mediaService.uploadImage(buffer, {
        folder,
        originalName: file.name,
      });

      uploadedResults.push(result);
    }

    if (uploadedResults.length === 1) {
      return NextResponse.json({
        success: true,
        message: "Image uploaded and optimized successfully.",
        data: uploadedResults[0],
      });
    }

    return NextResponse.json({
      success: true,
      message: `${uploadedResults.length} images uploaded and optimized successfully.`,
      data: uploadedResults,
    });
  } catch (error: any) {
    console.error("[API /api/media/upload] Upload error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "An unexpected error occurred during image upload.",
      },
      { status: 400 }
    );
  }
}
