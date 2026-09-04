import { Suspense } from "react";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { computeDealStatus, getDealAnalytics } from "@/lib/deals";
import { DealDetailClient } from "@/components/admin/deal-detail-client";

export default async function AdminDealDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();

  const { id } = await params;
  const adminClient = createSupabaseAdminClient();
  const supabase = adminClient ?? (await createSupabaseServerClient());

  const { data: deal } = await supabase
    .from("deals")
    .select("*, deal_products(*)")
    .eq("id", id)
    .single();

  if (!deal) notFound();

  const { data: rawDealProducts } = await supabase
    .from("deal_products")
    .select(
      `
      id, deal_id, product_id, variation_id, custom_deal_price,
      products (
        id, name, slug, sku, price, sale_price, stock_quantity, low_stock_threshold, is_published,
        categories:category_id ( name ),
        product_images ( id, storage_path, sort_order )
      ),
      product_variations (
        id, name, sku, regular_price, sale_price, stock_quantity, attributes
      )
    `
    )
    .eq("deal_id", id);

  const dealProducts = (rawDealProducts || []).map((dp: any) => {
    if (dp.products) {
      const sortedImgs = (dp.products.product_images ?? []).slice().sort((a: any, b: any) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
      dp.products.featured_image = sortedImgs[0]?.storage_path ?? null;
    }
    return dp;
  });

  const analytics = await getDealAnalytics(id);
  const status = computeDealStatus(deal);

  const fullDeal = {
    ...deal,
    discount_value: Number(deal.discount_value ?? 0),
    priority: Number(deal.priority ?? 1),
    status,
    deal_products: dealProducts as any,
  };

  return (
    <Suspense fallback={<div className="p-8 text-center text-sm font-bold text-navy">Loading deal performance data...</div>}>
      <DealDetailClient initialDeal={fullDeal as any} initialAnalytics={analytics} />
    </Suspense>
  );
}

export const dynamic = "force-dynamic";
