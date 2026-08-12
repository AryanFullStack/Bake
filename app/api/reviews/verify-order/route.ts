import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { cleanPhone } from "@/lib/reviews";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const orderNumber = body.order_number?.toString().trim();
    const contact = body.contact?.toString().trim();

    if (!orderNumber || !contact) {
      return NextResponse.json(
        { error: "Please enter both Order Number and Phone or Email" },
        { status: 400 }
      );
    }

    const supabase = await createSupabaseServerClient();
    const isEmail = contact.includes("@");
    const cleanedContactPhone = cleanPhone(contact);

    // Look up order
    const { data: order, error } = await supabase
      .from("orders")
      .select("id, order_number, status, customer_name, customer_email, customer_phone, order_items(product_id, product_name, unit_price, quantity)")
      .ilike("order_number", orderNumber)
      .maybeSingle();

    if (error || !order) {
      return NextResponse.json(
        { error: "Order not found. Please verify your order number." },
        { status: 404 }
      );
    }

    // Verify contact info matches
    const matchesContact = isEmail
      ? order.customer_email?.toLowerCase() === contact.toLowerCase()
      : cleanPhone(order.customer_phone || "") === cleanedContactPhone;

    if (!matchesContact) {
      return NextResponse.json(
        { error: "Phone number or email does not match the records for this order." },
        { status: 403 }
      );
    }

    if (order.status !== "delivered") {
      return NextResponse.json(
        { error: `Reviews can only be submitted after your order is delivered. Current status: ${order.status.replaceAll("_", " ")}.` },
        { status: 400 }
      );
    }

    // Fetch existing reviews for this order
    const { data: existingReviews } = await supabase
      .from("reviews")
      .select("id, product_id, rating, body, status, is_approved, created_at")
      .eq("order_id", order.id);

    const existingMap = new Map((existingReviews || []).map((r) => [r.product_id, r]));

    const items = (order.order_items || []).map((item: any) => ({
      product_id: item.product_id,
      product_name: item.product_name,
      unit_price: item.unit_price,
      quantity: item.quantity,
      existing_review: existingMap.get(item.product_id) || null,
    }));

    return NextResponse.json({
      order_id: order.id,
      order_number: order.order_number,
      customer_name: order.customer_name,
      customer_email: order.customer_email,
      customer_phone: order.customer_phone,
      items,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Order verification failed" },
      { status: 500 }
    );
  }
}
