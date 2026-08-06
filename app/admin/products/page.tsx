import { requireAdmin } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { AdminProductsManager } from "@/components/admin/products-manager";

export default async function AdminProductsPage() { await requireAdmin(); const supabase = await createSupabaseServerClient(); const [products, categories, brands] = await Promise.all([supabase.from("products").select("*,categories(id,name,slug),brands(id,name,slug),product_images(id,storage_path,alt_text,sort_order)").order("created_at", { ascending: false }).limit(1000), supabase.from("categories").select("id,name,slug").order("sort_order"), supabase.from("brands").select("id,name,slug").order("name")]); return <AdminProductsManager initialProducts={products.data ?? []} categories={categories.data ?? []} brands={brands.data ?? []} />; }
export const dynamic = "force-dynamic";
