import { requireAdmin } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { AdminProductsManager } from "@/components/admin/products-manager";

export default async function AdminProductsPage() {
  await requireAdmin();
  const supabase = await createSupabaseServerClient();
  const [products, categories, brands] = await Promise.all([
    supabase
      .from("products")
      .select("id, name, slug, sku, barcode, product_type, description, short_description, price, sale_price, stock_quantity, low_stock_threshold, is_published, is_featured, is_bestseller, category_id, brand_id, tags, created_at, updated_at, categories:category_id(id,name,slug), brands(id,name,slug), product_images(id,storage_path,alt_text,sort_order), product_attributes(id,name,slug,display_type,sort_order,is_required,product_attribute_values(id,label,slug,sort_order,swatch_color,swatch_image,is_active)), product_variations(id,combination_key,name,title,description,sku,barcode,regular_price,sale_price,stock_quantity,low_stock_threshold,status,attributes,weight,dimensions,specifications,product_variation_images(storage_path,sort_order,is_featured))")
      .order("created_at", { ascending: false })
      .limit(100),
    supabase.from("categories").select("id,name,slug").order("sort_order"),
    supabase.from("brands").select("id,name,slug").order("name"),
  ]);

  return (
    <div className="container mx-auto p-4 md:p-8">
      <AdminProductsManager
        initialProducts={products.data ?? []}
        categories={categories.data ?? []}
        brands={brands.data ?? []}
      />
    </div>
  );
}
export const dynamic = "force-dynamic";
