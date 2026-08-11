import { NextResponse } from "next/server";
import { findUnifiedTrackOrder } from "@/lib/tracking";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const reference =
      body.order_number ||
      body.request_number ||
      body.order ||
      body.request ||
      body.number ||
      "";
    const phone = body.phone || "";

    const result = await findUnifiedTrackOrder(reference, phone);
    if (!result.found) {
      return NextResponse.json(
        { error: result.error ?? "Order not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      type: result.type,
      order: result.order || null,
      request: result.request || null,
    });
  } catch {
    return NextResponse.json({ error: "Invalid request payload" }, { status: 400 });
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const reference =
    searchParams.get("order_number") ||
    searchParams.get("request_number") ||
    searchParams.get("order") ||
    searchParams.get("request") ||
    searchParams.get("number") ||
    "";
  const phone = searchParams.get("phone") || "";

  const result = await findUnifiedTrackOrder(reference, phone);
  if (!result.found) {
    return NextResponse.json(
      { error: result.error ?? "Order not found" },
      { status: 404 }
    );
  }

  return NextResponse.json({
    type: result.type,
    order: result.order || null,
    request: result.request || null,
  });
}
