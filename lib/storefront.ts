import { createSupabaseServerClient } from "@/lib/supabase/server";
import { mapProduct } from "@/lib/catalog";
import type { Category, Product } from "@/lib/types";

function configured() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

export async function getCategories(): Promise<Category[]> {
  if (!configured()) return [];
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.from("categories").select("id,name,slug,description,image_path,parent_id").order("sort_order").limit(100);
  
  const dbCategories = (data ?? []).map((row: any) => ({
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    image: row.image_path ?? "/placeholder-bake.svg",
    parent_id: row.parent_id ?? null,
  }));

  const standardPresets: Array<{ name: string; slug: string; description: string; image: string }> = [
    { name: "Bakery", slug: "bakery", description: "Freshly baked cakes, pastries & desserts", image: "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=900&q=85" },
    { name: "Daily Essentials", slug: "daily-essentials", description: "Everyday grocery & household needs", image: "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=900&q=85" },
    { name: "Home Decoration", slug: "home-decor", description: "Vases, wall art & decorative items", image: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=900&q=85" },
    { name: "Kitchen Essentials", slug: "kitchen", description: "Utensils, storage & accessories", image: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?auto=format&fit=crop&w=900&q=85" },
    { name: "Watches", slug: "watches", description: "Classic & modern timepieces", image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=900&q=85" },
    { name: "Baskets & Storage", slug: "baskets", description: "Organise your home beautifully", image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=900&q=85" },
  ];

  const result = [...dbCategories];
  for (const preset of standardPresets) {
    if (!result.some(c => c.slug === preset.slug || c.name.toLowerCase() === preset.name.toLowerCase())) {
      result.push({
        id: preset.slug,
        name: preset.name,
        slug: preset.slug,
        description: preset.description,
        image: preset.image,
        parent_id: null,
      });
    }
  }

  return result;
}

export async function getProducts(options: { featured?: boolean; bestseller?: boolean; category?: string; search?: string; saleOnly?: boolean; limit?: number } = {}): Promise<Product[]> {
  if (!configured()) return [];
  const supabase = await createSupabaseServerClient();
  let categoryIds: string[] | undefined;
  if (options.category) {
    const rawCatParam = options.category.toLowerCase().trim();
    const slugAliasMap: Record<string, string[]> = {
      "bakery": ["bakery", "cakes", "pastries", "cupcakes", "brownies", "cookies", "desserts"],
      "cakes": ["cakes", "celebration-cakes"],
      "home-decor": ["home-decor", "home-decoration", "home"],
      "kitchen": ["kitchen", "kitchen-essentials"],
      "baskets": ["baskets", "baskets-storage"],
      "daily-essentials": ["daily-essentials", "daily", "grocery"],
    };
    const targetSlugs = slugAliasMap[rawCatParam] ?? [rawCatParam];
    const { data: matchedCats } = await supabase
      .from("categories")
      .select("id, slug, parent_id")
      .in("slug", targetSlugs);
    const directIds = (matchedCats ?? []).map((c: any) => c.id);
    if (directIds.length > 0) {
      const { data: childCats } = await supabase
        .from("categories")
        .select("id")
        .in("parent_id", directIds);
      const childIds = (childCats ?? []).map((c: any) => c.id);
      categoryIds = Array.from(new Set([...directIds, ...childIds]));
    } else {
      const { data: nameCats } = await supabase
        .from("categories")
        .select("id")
        .ilike("name", `%${rawCatParam}%`);
      if (nameCats && nameCats.length > 0) {
        categoryIds = nameCats.map((c: any) => c.id);
      } else {
        return [];
      }
    }
  }
  let query = supabase
    .from("products")
    .select("id,slug,sku,name,description,price,sale_price,stock_quantity,low_stock_threshold,is_published,is_featured,is_bestseller,seo_title,seo_description,tags,category_id,brand_id,featured_image,product_type,categories:category_id(name,slug),brands(name,slug),product_images(storage_path,alt_text,sort_order)")
    .eq("is_published", true)
    .order("created_at", { ascending: false })
    .limit(options.limit ?? 48);
  if (options.featured) query = query.eq("is_featured", true);
  if (options.bestseller) query = query.eq("is_bestseller", true);
  if (options.saleOnly) query = query.not("sale_price", "is", null);
  if (categoryIds && categoryIds.length > 0) query = query.in("category_id", categoryIds);
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
  const { data: row, error } = await supabase
    .from("products")
    .select("id,slug,sku,name,description,short_description,specifications,ingredients,care_instructions,delivery_information,return_policy,price,sale_price,stock_quantity,low_stock_threshold,is_published,is_featured,is_bestseller,seo_title,seo_description,tags,category_id,brand_id,featured_image,product_type,categories:category_id(name,slug),brands(name,slug),product_images(storage_path,alt_text,sort_order),product_attributes(id,name,slug,display_type,sort_order,is_required,controls_images,product_attribute_values(id,label,slug,sort_order,swatch_color,swatch_image,is_active,product_attribute_images(id,storage_path,sort_order,product_image_id))),product_variations(id,combination_key,name,title,description,sku,barcode,regular_price,sale_price,stock_quantity,low_stock_threshold,attributes,status,weight,dimensions,specifications,product_variation_images(storage_path,alt_text,sort_order,is_featured))")
    .eq("slug", slug)
    .eq("is_published", true)
    .maybeSingle();
  if (error || !row) return null;
  const [{ data: reviews }, { data: faqs }] = await Promise.all([
    supabase.from("reviews").select("id,rating,body,created_at,user_id,profiles(full_name)").eq("product_id", row.id).eq("is_approved", true).order("created_at", { ascending: false }).limit(30),
    supabase.from("product_faqs").select("id,question,answer,sort_order").eq("product_id", row.id).eq("is_published", true).order("sort_order"),
  ]);
  const ratings = reviews ?? [];
  const rating = ratings.length ? ratings.reduce((sum: number, review: any) => sum + review.rating, 0) / ratings.length : 0;
  return { product: mapProduct({ ...row, average_rating: rating, review_count: ratings.length }), reviews: ratings, faqs: faqs ?? [] };
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
