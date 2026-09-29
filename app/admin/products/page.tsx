import { Suspense } from "react";
import { requireAdmin } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { AdminProductsManager } from "@/components/admin/products-manager";

export default async function AdminProductsPage() {
  await requireAdmin();
  const supabase = await createSupabaseServerClient();
  const [products, categories, brands] = await Promise.all([
    supabase
      .from("products")
      .select(
        "id, name, slug, sku, barcode, product_type, price, sale_price, stock_quantity, low_stock_threshold, status, is_published, is_featured, is_bestseller, category_id, featured_image, updated_at, categories:category_id(id,name,slug), brands(id,name,slug), product_images(id,storage_path,sort_order), product_variations(id,regular_price,sale_price,status,stock_quantity)",
        { count: "exact" }
      )
      .order("created_at", { ascending: false })
      .range(0, 19),
    supabase.from("categories").select("id,name,slug").order("sort_order"),
    supabase.from("brands").select("id,name,slug").order("name"),
  ]);

  return (
    <div className="container mx-auto p-4 md:p-8">
      <Suspense fallback={<div className="p-8 text-center text-sm font-bold text-navy">Loading products...</div>}>
        <AdminProductsManager
          initialProducts={products.data ?? []}
          initialTotal={products.count ?? products.data?.length ?? 0}
          categories={categories.data ?? []}
          brands={brands.data ?? []}
        />
      </Suspense>
    </div>
  );
}
export const dynamic = "force-dynamic";
