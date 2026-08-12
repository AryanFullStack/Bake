import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { cleanPhone, formatReviewerName } from "@/lib/reviews";
import { ensureReviewSchema } from "@/lib/supabase/schema-runner";

const reviewSchema = z.object({
  product_id: z.string().uuid("Invalid product ID"),
  order_id: z.string().uuid().optional(),
  order_number: z.string().optional(),
  rating: z.number().int().min(1, "Rating must be between 1 and 5").max(5, "Rating must be between 1 and 5"),
  body: z.string().trim().max(2000, "Review is too long (max 2000 characters)").default(""),
  guest_name: z.string().trim().optional(),
  guest_email: z.string().trim().email().optional().or(z.literal("")),
  guest_phone: z.string().trim().optional(),
});

export async function POST(request: Request) {
  try {
    await ensureReviewSchema();

    const rawJson = await request.json();
    const parsed = reviewSchema.safeParse(rawJson);

    if (!parsed.success) {
      const errorMsg = parsed.error.issues.map((i) => i.message).join(", ");
      return NextResponse.json({ error: errorMsg || "Invalid review data" }, { status: 400 });
    }

    const { product_id, order_id, order_number, rating, body, guest_name, guest_email, guest_phone } = parsed.data;
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    let verifiedOrder: any = null;

    // 1. Authenticated User Verification
    if (user) {
      let query = supabase
        .from("orders")
        .select("id, order_number, user_id, status, customer_name, customer_email, customer_phone, order_items(product_id)")
        .eq("user_id", user.id)
        .eq("status", "delivered");

      if (order_id) query = query.eq("id", order_id);
      else if (order_number) query = query.ilike("order_number", order_number.trim());

      const { data: orders } = await query;
      if (orders && orders.length > 0) {
        verifiedOrder = orders.find((o: any) => o.order_items?.some((item: any) => item.product_id === product_id));
      }
    }

    // 2. Guest Order Verification (or fallback if logged in user is reviewing a guest order)
    if (!verifiedOrder && (order_number || order_id) && (guest_email || guest_phone)) {
      let query = supabase
        .from("orders")
        .select("id, order_number, user_id, status, customer_name, customer_email, customer_phone, order_items(product_id)")
        .eq("status", "delivered");

      if (order_id) query = query.eq("id", order_id);
      if (order_number) query = query.ilike("order_number", order_number.trim());

      const { data: orders } = await query;
      if (orders && orders.length > 0) {
        const inputEmail = guest_email?.toLowerCase();
        const inputPhone = guest_phone ? cleanPhone(guest_phone) : "";

        verifiedOrder = orders.find((o: any) => {
          const matchesEmail = inputEmail && o.customer_email?.toLowerCase() === inputEmail;
          const matchesPhone = inputPhone && cleanPhone(o.customer_phone || "") === inputPhone;
          const hasProduct = o.order_items?.some((item: any) => item.product_id === product_id);
          return (matchesEmail || matchesPhone) && hasProduct;
        });
      }
    }

    if (!verifiedOrder) {
      return NextResponse.json(
        { error: "Could not verify your purchase. You can only review products from successfully delivered orders." },
        { status: 403 }
      );
    }

    // Determine customer display name safely
    let customerName = guest_name || verifiedOrder.customer_name || "Customer";
    let customerEmail = guest_email || verifiedOrder.customer_email || null;

    if (user) {
      const { data: profile } = await supabase.from("profiles").select("full_name").eq("id", user.id).maybeSingle();
      if (profile?.full_name) customerName = profile.full_name;
      if (user.email) customerEmail = user.email;
    }

    const safeReviewerName = formatReviewerName(customerName, customerEmail);

    const reviewData = {
      product_id,
      order_id: verifiedOrder.id,
      user_id: user ? user.id : null,
      guest_name: user ? null : customerName,
      guest_email: user ? null : customerEmail,
      guest_phone: user ? null : (guest_phone || verifiedOrder.customer_phone),
      reviewer_name: safeReviewerName,
      rating,
      body,
      status: "pending",
      is_approved: false,
      is_verified_purchase: true,
      updated_at: new Date().toISOString(),
    };

    // Check if review already exists for this order & product
    const { data: existing } = await supabase
      .from("reviews")
      .select("id")
      .eq("order_id", verifiedOrder.id)
      .eq("product_id", product_id)
      .maybeSingle();

    let savedReview: any;
    let saveError: any;

    if (existing?.id) {
      const { data, error } = await supabase
        .from("reviews")
        .update(reviewData)
        .eq("id", existing.id)
        .select("id, status, is_approved, rating, body, reviewer_name")
        .single();
      savedReview = data;
      saveError = error;
    } else {
      const { data, error } = await supabase
        .from("reviews")
        .insert(reviewData)
        .select("id, status, is_approved, rating, body, reviewer_name")
        .single();
      savedReview = data;
      saveError = error;
    }

    if (saveError) {
      console.error("[Submit Review Error]:", saveError);
      return NextResponse.json({ error: saveError.message || "Failed to submit review" }, { status: 400 });
    }

    return NextResponse.json({
      ok: true,
      review: savedReview,
      message: "Thank you! Your review has been submitted and is pending moderation before being published.",
    });
  } catch (error: any) {
    console.error("[Submit Review Exception]:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
