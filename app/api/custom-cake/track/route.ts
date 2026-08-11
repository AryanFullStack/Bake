import { NextResponse } from "next/server";
import { findUnifiedTrackOrder } from "@/lib/tracking";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const reference =
      body.request_number ||
      body.order_number ||
      body.request ||
      body.order ||
      body.number ||
      "";
    const phone = body.phone || "";

    const result = await findUnifiedTrackOrder(reference, phone);
    if (!result.found) {
      return NextResponse.json(
        { error: result.error ?? "Cake request not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      type: result.type,
      request: result.request || null,
      order: result.order || null,
    });
  } catch {
    return NextResponse.json({ error: "Invalid request payload" }, { status: 400 });
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const reference =
    searchParams.get("request_number") ||
    searchParams.get("order_number") ||
    searchParams.get("request") ||
    searchParams.get("order") ||
    searchParams.get("number") ||
    "";
  const phone = searchParams.get("phone") || "";

  const result = await findUnifiedTrackOrder(reference, phone);
  if (!result.found) {
    return NextResponse.json(
      { error: result.error ?? "Cake request not found" },
      { status: 404 }
    );
  }

  return NextResponse.json({
    type: result.type,
    request: result.request || null,
    order: result.order || null,
  });
}
