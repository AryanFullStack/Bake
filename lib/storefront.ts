import { createSupabaseServerClient } from "@/lib/supabase/server";
import { mapProduct } from "@/lib/catalog";
import type { Category, Product } from "@/lib/types";

function configured() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

export async function getCategories(): Promise<Category[]> {
  if (!configured()) return [];
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.from("categories").select("id,name,slug,description,image_path").order("sort_order").limit(100);
  return (data ?? []).map((row: any) => ({ id: row.id, name: row.name, slug: row.slug, description: row.description, image: row.image_path ?? "/placeholder-bake.svg" }));
}

export async function getProducts(options: { featured?: boolean; bestseller?: boolean; category?: string; search?: string; saleOnly?: boolean; limit?: number } = {}): Promise<Product[]> {
  if (!configured()) return [];
  const supabase = await createSupabaseServerClient();
  // Resolve category slug to category_id (PostgREST cannot filter on joined columns)
  let categoryId: string | undefined;
  if (options.category) {
    const { data: cat } = await supabase.from("categories").select("id").eq("slug", options.category).maybeSingle();
    if (!cat) return []; // no matching category → return empty
    categoryId = cat.id;
  }
  let query = supabase.from("products").select("id,slug,sku,name,description,price,sale_price,stock_quantity,low_stock_threshold,is_published,is_featured,is_bestseller,seo_title,seo_description,tags,category_id,brand_id,categories(name,slug),brands(name,slug),product_images(storage_path,alt_text,sort_order)").eq("is_published", true).order("created_at", { ascending: false }).limit(options.limit ?? 48);
  if (options.featured) query = query.eq("is_featured", true);
  if (options.bestseller) query = query.eq("is_bestseller", true);
  if (options.saleOnly) query = query.not("sale_price", "is", null);
  if (categoryId) query = query.eq("category_id", categoryId);
  if (options.search) { const term = options.search.replace(/[,()]/g, " "); query = query.or(`name.ilike.%${term}%,description.ilike.%${term}%`); }
  const { data, error } = await query;
  if (error) { console.error("[getProducts] error:", error.message); return []; }
  const rows = data ?? [];
  const ids = rows.map((row: any) => row.id);
  if (!ids.length) return [];
  const { data: reviews } = await supabase.from("reviews").select("product_id,rating").in("product_id", ids).eq("is_approved", true);
  const summary = new Map<string, { total: number; count: number }>();
  for (const review of reviews ?? []) {
    const current = summary.get(review.product_id) ?? { total: 0, count: 0 };
    current.total += review.rating; current.count += 1; summary.set(review.product_id, current);
  }
  return rows.map((row: any) => { const s = summary.get(row.id); return mapProduct({ ...row, average_rating: s ? s.total / s.count : 0, review_count: s?.count ?? 0 }); });
}

export async function getProductBySlug(slug: string) {
  if (!configured()) return null;
  const supabase = await createSupabaseServerClient();
  const { data: row, error } = await supabase.from("products").select("id,slug,sku,name,description,price,sale_price,stock_quantity,low_stock_threshold,is_published,is_featured,is_bestseller,seo_title,seo_description,tags,category_id,brand_id,categories(name,slug),brands(name,slug),product_images(storage_path,alt_text,sort_order)").eq("slug", slug).eq("is_published", true).maybeSingle();
  if (error || !row) return null;
  const { data: reviews } = await supabase.from("reviews").select("id,rating,body,created_at,user_id,profiles(full_name)").eq("product_id", row.id).eq("is_approved", true).order("created_at", { ascending: false }).limit(30);
  const ratings = reviews ?? [];
  const rating = ratings.length ? ratings.reduce((sum: number, review: any) => sum + review.rating, 0) / ratings.length : 0;
  return { product: mapProduct({ ...row, average_rating: rating, review_count: ratings.length }), reviews: ratings };
}

export async function getHomeContent() {
  const [categories, featured, bestsellers, banners, faqs, reviews] = await Promise.all([getCategories(), getProducts({ featured: true, limit: 8 }), getProducts({ bestseller: true, limit: 8 }), getBanners(), getFaqs(), getFeaturedReviews()]);
  return { categories, featured, bestsellers, banners, faqs, reviews };
}

export async function getFeaturedReviews() {
  if (!configured()) return [];
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.from("reviews").select("id,rating,body,created_at,profiles(full_name),products(name)").eq("is_approved", true).order("created_at", { ascending: false }).limit(3);
  return data ?? [];
}

export async function getBanners() {
  if (!configured()) return [];
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.from("banners").select("id,title,body,image_path,cta_label,cta_href").eq("is_active", true).order("sort_order").limit(10);
  return (data ?? []).map((row: any) => ({ ...row, image_path: row.image_path ?? "/placeholder-bake.svg" }));
}

export async function getFaqs() {
  if (!configured()) return [];
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.from("faqs").select("id,question,answer").eq("is_published", true).order("sort_order").limit(100);
  return data ?? [];
}
