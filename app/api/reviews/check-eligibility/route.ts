import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { cleanPhone } from "@/lib/reviews";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const productId = body.product_id;
    const orderNumberInput = body.order_number?.toString().trim();
    const contactInput = body.contact?.toString().trim(); // email or phone

    if (!productId) {
      return NextResponse.json({ eligible: false, reason: "Product ID is required" }, { status: 400 });
    }

    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    let matchedOrder: any = null;

    // 1. If user is logged in, search user's delivered orders containing this product
    if (user) {
      const { data: userOrders } = await supabase
        .from("orders")
        .select("id, order_number, status, customer_name, customer_phone, customer_email, order_items(product_id)")
        .eq("user_id", user.id)
        .eq("status", "delivered")
        .order("created_at", { ascending: false });

      if (userOrders && userOrders.length > 0) {
        matchedOrder = userOrders.find((order: any) =>
          order.order_items?.some((item: any) => item.product_id === productId)
        );
      }
    }

    // 2. If no authenticated order found, check guest inputs (order number + phone/email)
    if (!matchedOrder && orderNumberInput && contactInput) {
      const isEmail = contactInput.includes("@");
      const cleanedInputPhone = cleanPhone(contactInput);

      const { data: rawOrders } = await supabase
        .from("orders")
        .select("id, order_number, status, customer_name, customer_phone, customer_email, order_items(product_id)")
        .ilike("order_number", orderNumberInput)
        .eq("status", "delivered");

      if (rawOrders && rawOrders.length > 0) {
        matchedOrder = rawOrders.find((order: any) => {
          const matchesContact = isEmail
            ? order.customer_email?.toLowerCase() === contactInput.toLowerCase()
            : cleanPhone(order.customer_phone || "") === cleanedInputPhone;
          const containsProduct = order.order_items?.some((item: any) => item.product_id === productId);
          return matchesContact && containsProduct;
        });
      }
    }

    if (!matchedOrder) {
      return NextResponse.json({
        eligible: false,
        reason: "No delivered order containing this product was found matching your details.",
      });
    }

    // 3. Check if a review already exists for this order & product combination
    const { data: existingReview } = await supabase
      .from("reviews")
      .select("id, rating, body, status, is_approved, is_verified_purchase, created_at, reviewer_name")
      .eq("order_id", matchedOrder.id)
      .eq("product_id", productId)
      .maybeSingle();

    return NextResponse.json({
      eligible: true,
      order_id: matchedOrder.id,
      order_number: matchedOrder.order_number,
      customer_name: matchedOrder.customer_name,
      customer_email: matchedOrder.customer_email,
      customer_phone: matchedOrder.customer_phone,
      existing_review: existingReview || null,
    });
  } catch (error: any) {
    return NextResponse.json(
      { eligible: false, reason: error.message || "Failed to check eligibility" },
      { status: 500 }
    );
  }
}
