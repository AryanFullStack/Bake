import { requireAdmin } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { AdminReviewsManager } from "@/components/admin/reviews-manager";
import { ensureReviewSchema } from "@/lib/supabase/schema-runner";

export default async function AdminReviewsPage() {
  await requireAdmin();
  await ensureReviewSchema();

  const adminClient = createSupabaseAdminClient();
  const supabase = adminClient || (await createSupabaseServerClient());

  let reviews: any[] = [];

  // Try direct join select
  const { data: rawReviews, error: reviewsError } = await supabase
    .from("reviews")
    .select("*, products(id, name, slug), orders(order_number, customer_name, customer_phone, customer_email)")
    .order("created_at", { ascending: false })
    .limit(1000);

  if (reviewsError) {
    console.warn("[AdminReviewsPage Query Warning - using fallback]:", reviewsError.message || reviewsError);

    // Fallback: Fetch plain reviews and join products/orders in memory
    const { data: fallbackReviews } = await supabase
      .from("reviews")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(1000);

    if (fallbackReviews && fallbackReviews.length > 0) {
      const productIds = Array.from(new Set(fallbackReviews.map((r: any) => r.product_id).filter(Boolean)));
      const orderIds = Array.from(new Set(fallbackReviews.map((r: any) => r.order_id).filter(Boolean)));

      const [{ data: products }, { data: orders }] = await Promise.all([
        productIds.length ? supabase.from("products").select("id, name, slug").in("id", productIds) : Promise.resolve({ data: [] }),
        orderIds.length ? supabase.from("orders").select("id, order_number, customer_name, customer_phone, customer_email").in("id", orderIds) : Promise.resolve({ data: [] }),
      ]);

      const productMap = new Map((products ?? []).map((p: any) => [p.id, p]));
      const orderMap = new Map((orders ?? []).map((o: any) => [o.id, o]));

      reviews = fallbackReviews.map((r: any) => ({
        ...r,
        products: productMap.get(r.product_id) || null,
        orders: orderMap.get(r.order_id) || null,
      }));
    }
  } else {
    reviews = rawReviews ?? [];
  }

  return <AdminReviewsManager initialReviews={reviews} />;
}

export const dynamic = "force-dynamic";
