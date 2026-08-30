import { NextRequest, NextResponse } from "next/server";
import { getStorageProvider } from "@/lib/media/storage-provider";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path: pathSegments } = await params;
    if (!pathSegments || pathSegments.length === 0) {
      return new NextResponse("Not Found", { status: 404 });
    }

    const relativePath = pathSegments.join("/");
    const storage = getStorageProvider();

    const fileData = await storage.getFileBuffer(relativePath);
    if (!fileData) {
      try {
        const fs = await import("fs");
        const pathModule = await import("path");
        const placeholderPath = pathModule.resolve(process.cwd(), "public", "placeholder-bake.svg");
        if (fs.existsSync(placeholderPath)) {
          const svgBuffer = await fs.promises.readFile(placeholderPath);
          return new NextResponse(svgBuffer, {
            status: 200,
            headers: {
              "Content-Type": "image/svg+xml",
              "Cache-Control": "public, max-age=86400",
            },
          });
        }
      } catch (e) {
        console.error("[API media/serve] Fallback image error:", e);
      }
      return new NextResponse("Image Not Found", { status: 404 });
    }

    return new NextResponse(new Uint8Array(fileData.buffer), {
      status: 200,
      headers: {
        "Content-Type": fileData.mimeType,
        "Content-Length": fileData.size.toString(),
        "Cache-Control": "public, max-age=31536000, immutable",
        "X-Content-Type-Options": "nosniff",
        "Accept-Ranges": "bytes",
      },
    });
  } catch (error) {
    console.error("[API media/serve] Error serving image:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
