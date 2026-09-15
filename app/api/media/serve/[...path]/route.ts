import { NextRequest, NextResponse } from "next/server";
import { getStorageProvider } from "@/lib/media/storage-provider";
import { getImageKitStorageProvider } from "@/lib/media/imagekit-provider";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path: pathSegments } = await params;
    if (!pathSegments || pathSegments.length === 0) {
      return new NextResponse("Not Found", { status: 404 });
    }

    const rawRelativePath = pathSegments.join("/");
    let relativePath = rawRelativePath;
    try {
      relativePath = decodeURIComponent(rawRelativePath);
    } catch {
      // Keep raw path if URI decode fails
    }

    const storage = getStorageProvider();

    // 1. Attempt to retrieve physical file buffer from VPS storage (supports raw and URI-decoded paths)
    let fileData = await storage.getFileBuffer(relativePath);
    if (!fileData && relativePath !== rawRelativePath) {
      fileData = await storage.getFileBuffer(rawRelativePath);
    }

    if (fileData) {
      return new NextResponse(new Uint8Array(fileData.buffer), {
        status: 200,
        headers: {
          "Content-Type": fileData.mimeType,
          "Content-Length": fileData.size.toString(),
          "Cache-Control": "public, max-age=31536000, immutable",
          "X-Content-Type-Options": "nosniff",
          "Access-Control-Allow-Origin": "*",
          "Accept-Ranges": "bytes",
        },
      });
    }

    // 2. Fallback to ImageKit CDN if ImageKit is configured and physical file is absent on local VPS disk
    const ikProvider = getImageKitStorageProvider();
    if (ikProvider.isConfigured()) {
      const endpoint = ikProvider.getUrlEndpoint().replace(/\/+$/, "");
      const cleanPath = relativePath.replace(/^\/+/, "");
      const filename = cleanPath.split("/").pop() || cleanPath;

      // Candidate ImageKit CDN paths
      const candidateIkUrls = [
        `${endpoint}/${cleanPath}`,
        `${endpoint}/products/${filename}`,
      ];

      for (const ikUrl of candidateIkUrls) {
        try {
          const res = await fetch(ikUrl, { method: "HEAD" });
          if (res.ok) {
            return NextResponse.redirect(ikUrl, { status: 307 });
          }
        } catch {
          // Continue to next candidate
        }
      }
    }

    // 3. Fallback: Check Supabase Storage private buckets (custom-cake-references, payment-receipts)
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      try {
        const { createClient } = await import("@supabase/supabase-js");
        const admin = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL,
          process.env.SUPABASE_SERVICE_ROLE_KEY,
          { auth: { autoRefreshToken: false, persistSession: false } }
        );

        const cleanPath = relativePath.replace(/^\/+/, "");
        const buckets = ["custom-cake-references", "payment-receipts", "product-images"];
        for (const bucket of buckets) {
          const pathToCheck = cleanPath.startsWith(`${bucket}/`) ? cleanPath.substring(bucket.length + 1) : cleanPath;
          const { data: supaBlob } = await admin.storage.from(bucket).download(pathToCheck);
          if (supaBlob) {
            const buffer = Buffer.from(await supaBlob.arrayBuffer());
            return new NextResponse(new Uint8Array(buffer), {
              status: 200,
              headers: {
                "Content-Type": supaBlob.type || "image/jpeg",
                "Content-Length": buffer.length.toString(),
                "Cache-Control": "public, max-age=86400, immutable",
                "X-Content-Type-Options": "nosniff",
              },
            });
          }
        }
      } catch (supaErr) {
        console.warn("[API media/serve] Supabase storage fallback check error:", supaErr);
      }
    }

    return new NextResponse("Image Not Found", { status: 404 });
  } catch (error) {
    console.error("[API media/serve] Error serving image:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
