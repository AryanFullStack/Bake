import { Suspense } from "react";
import { requireAdmin } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getStorefrontDeals } from "@/lib/deals";
import { DealFormClient } from "@/components/admin/deal-form-client";

export default async function CreateDealPage() {
  await requireAdmin();

  const adminClient = createSupabaseAdminClient();
  const supabase = adminClient ?? (await createSupabaseServerClient());

  const [productsRes, categoriesRes, activeDeals] = await Promise.all([
    supabase
      .from("products")
      .select(
        `
        id, name, slug, sku, price, sale_price, stock_quantity, category_id, product_type,
        categories:category_id(id, name, slug),
        product_images(id, storage_path, sort_order),
        product_variations(id, name, sku, regular_price, sale_price, stock_quantity, attributes)
      `
      )
      .order("name", { ascending: true })
      .limit(500),
    supabase.from("categories").select("id, name, slug").order("sort_order"),
    getStorefrontDeals(),
  ]);

  if (productsRes.error) {
    console.error("[CreateDealPage] Products fetch error:", productsRes.error);
  }

  const normalizedProducts = (productsRes.data ?? []).map((p: any) => {
    const sortedImgs = (p.product_images ?? []).slice().sort((a: any, b: any) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
    return {
      ...p,
      featured_image: sortedImgs[0]?.storage_path ?? null,
    };
  });

  return (
    <Suspense fallback={<div className="p-8 text-center text-sm font-bold text-navy">Loading deal creator...</div>}>
      <DealFormClient
        allProducts={normalizedProducts}
        allCategories={categoriesRes.data ?? []}
        activeDeals={activeDeals}
      />
    </Suspense>
  );
}

export const dynamic = "force-dynamic";
