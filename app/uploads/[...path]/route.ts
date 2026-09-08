import { NextRequest, NextResponse } from "next/server";

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
    // Redirect legacy /uploads/... requests to canonical media serving API
    return NextResponse.redirect(new URL(`/api/media/serve/${relativePath}`, req.url), 307);
  } catch (error) {
    console.error("[Uploads Route] Error redirecting:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
