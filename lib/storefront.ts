import { createSupabaseServerClient } from "@/lib/supabase/server";
import { mapProduct } from "@/lib/catalog";
import type { Category, Product } from "@/lib/types";
import { getActiveDeals, getStorefrontDeals, getFeaturedDeal, attachDealPricingToProduct } from "@/lib/deals";
import { resolveMediaUrl } from "@/lib/media-url";

function configured() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

export async function getCategories(): Promise<Category[]> {
  if (!configured()) return [];
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.from("categories").select("id,name,slug,description,image_path,parent_id").order("sort_order").limit(100);
  
  const defaultImageMap: Record<string, string> = {
    bakery: "/bakery.png",
    baskets: "/baskets.png",
    "baskets-storage": "/baskets.png",
    watches: "/WD.jpeg",
    kitchen: "/kicthens.jpg",
    "home-decor": "/homeDisktop.png",
    cakes: "/celebration-cakes.png",
    "celebration-cakes": "/celebration-cakes.png",
    "daily-essentials": "/homeItems.jfif",
    pastries: "/bakery.png",
    cupcakes: "/celebration-cakes.png",
    brownies: "/bakery.png",
    cookies: "/bakery.png",
    desserts: "/celebration-cakes.png",
  };

  const dbCategories = (data ?? []).map((row: any) => {
    let img = row.image_path;
    if (img && img !== "/placeholder-bake.svg" && !img.includes("unsplash.com")) {
      img = resolveMediaUrl(img);
    } else if (!img || img === "/placeholder-bake.svg" || img.includes("unsplash.com")) {
      img = defaultImageMap[row.slug] || defaultImageMap[row.name?.toLowerCase()] || "/bakery.png";
    }

    return {
      id: row.id,
      name: row.name,
      slug: row.slug,
      description: row.description,
      image: img,
      parent_id: row.parent_id ?? null,
    };
  });

  const standardPresets: Array<{ name: string; slug: string; description: string; image: string }> = [
    { name: "Bakery", slug: "bakery", description: "Freshly baked cakes, pastries & desserts", image: "/bakery.png" },
    { name: "Celebration Cakes", slug: "cakes", description: "Layer cakes, cream cakes and celebration centrepieces", image: "/celebration-cakes.png" },
    { name: "Baskets & Storage", slug: "baskets", description: "Organise your home beautifully", image: "/baskets.png" },
    { name: "Watches", slug: "watches", description: "Classic & modern timepieces", image: "/WD.jpeg" },
    { name: "Kitchen Essentials", slug: "kitchen", description: "Utensils, storage & accessories", image: "/kicthens.jpg" },
    { name: "Home Decoration", slug: "home-decor", description: "Vases, wall art & decorative items", image: "/homeDisktop.png" },
    { name: "Daily Essentials", slug: "daily-essentials", description: "Everyday grocery & household needs", image: "/homeItems.jfif" },
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
    .or("is_published.eq.true,is_published.is.null,status.eq.published")
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
  const activeDeals = await getActiveDeals();
  return rows.map((row: any) => {
    const s = summary.get(row.id);
    const mapped = mapProduct({ ...row, average_rating: s ? s.total / s.count : 0, review_count: s?.count ?? 0 });
    return attachDealPricingToProduct(mapped, activeDeals);
  });
}

export async function getProductBySlug(slug: string) {
  if (!configured()) return null;
  const supabase = await createSupabaseServerClient();
  
  const rawSlug = decodeURIComponent(slug).trim();
  const slugified = rawSlug.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "");
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(rawSlug);

  // Step 1: Find the product record efficiently and flexibly
  let productQuery = supabase
    .from("products")
    .select("id,slug,sku,name,description,short_description,specifications,ingredients,care_instructions,delivery_information,return_policy,price,sale_price,stock_quantity,low_stock_threshold,is_published,status,is_featured,is_bestseller,seo_title,seo_description,tags,category_id,brand_id,featured_image,product_type,categories:category_id(name,slug),brands(name,slug),product_images(storage_path,alt_text,sort_order)");

  if (isUuid) {
    productQuery = productQuery.or(`id.eq.${rawSlug},slug.eq.${rawSlug},slug.eq.${slugified}`);
  } else if (slugified && slugified !== rawSlug.toLowerCase()) {
    productQuery = productQuery.or(`slug.eq.${rawSlug},slug.eq.${slugified},slug.ilike.${rawSlug},slug.ilike.${slugified},sku.eq.${rawSlug}`);
  } else {
    productQuery = productQuery.or(`slug.eq.${rawSlug},slug.ilike.${rawSlug},sku.eq.${rawSlug}`);
  }

  let { data: rows, error: searchErr } = await productQuery.limit(5);

  if (searchErr || !rows || rows.length === 0) {
    // Fallback: search by name ilike
    const cleanSearchName = rawSlug.replace(/[-_]+/g, " ");
    const { data: nameRows } = await supabase
      .from("products")
      .select("id,slug,sku,name,description,short_description,specifications,ingredients,care_instructions,delivery_information,return_policy,price,sale_price,stock_quantity,low_stock_threshold,is_published,status,is_featured,is_bestseller,seo_title,seo_description,tags,category_id,brand_id,featured_image,product_type,categories:category_id(name,slug),brands(name,slug),product_images(storage_path,alt_text,sort_order)")
      .ilike("name", `%${cleanSearchName}%`)
      .limit(1);

    rows = nameRows ?? [];
  }

  if (!rows || rows.length === 0) return null;

  // Prefer published product if multiple returned, otherwise first matching row
  const row = rows.find((r: any) => r.is_published || r.status === "published") ?? rows[0];
  const productId = row.id;

  // Step 2: Safely fetch attributes, variations, faqs, and reviews in separate resilient queries
  const [attrRes, varRes, faqRes, reviewRes, activeDeals] = await Promise.all([
    supabase
      .from("product_attributes")
      .select("id,name,slug,display_type,sort_order,is_required,controls_images,product_attribute_values(id,label,slug,sort_order,swatch_color,swatch_image,is_active,product_attribute_images(id,storage_path,sort_order,product_image_id))")
      .eq("product_id", productId)
      .order("sort_order"),
    supabase
      .from("product_variations")
      .select("id,combination_key,name,title,description,sku,barcode,regular_price,sale_price,stock_quantity,low_stock_threshold,attributes,status,weight,dimensions,specifications,product_variation_images(storage_path,alt_text,sort_order,is_featured)")
      .eq("product_id", productId),
    supabase
      .from("product_faqs")
      .select("id,question,answer,sort_order")
      .eq("product_id", productId)
      .eq("is_published", true)
      .order("sort_order"),
    supabase
      .from("reviews")
      .select("id,product_id,order_id,user_id,rating,body,status,is_approved,is_verified_purchase,reviewer_name,guest_name,guest_email,created_at")
      .eq("product_id", productId)
      .or("status.eq.approved,is_approved.eq.true")
      .order("created_at", { ascending: false })
      .limit(200),
    getActiveDeals(),
  ]);

  const productAttributes = attrRes.data ?? [];
  const productVariations = varRes.data ?? [];
  const faqs = faqRes.data ?? [];
  const reviews = reviewRes.data ?? [];

  const fullRow = {
    ...row,
    product_attributes: productAttributes,
    product_variations: productVariations,
  };

  const rating = reviews.length ? reviews.reduce((sum: number, review: any) => sum + review.rating, 0) / reviews.length : 0;
  const mapped = mapProduct({ ...fullRow, average_rating: rating, review_count: reviews.length });
  const finalProduct = attachDealPricingToProduct(mapped, activeDeals);

  return { product: finalProduct, reviews, faqs };
}

export async function getHomeContent() {
  const [categories, featured, bestsellers, banners, faqs, reviews, activeDeals, featuredDeal] = await Promise.all([
    getCategories(),
    getProducts({ featured: true, limit: 8 }),
    getProducts({ bestseller: true, limit: 8 }),
    getBanners(),
    getFaqs(),
    getFeaturedReviews(),
    getStorefrontDeals(),
    getFeaturedDeal(),
  ]);
  return { categories, featured, bestsellers, banners, faqs, reviews, activeDeals, featuredDeal };
}

export async function getFeaturedReviews() {
  if (!configured()) return [];
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.from("reviews").select("id,rating,body,created_at,reviewer_name,guest_name,products(name)").or("status.eq.approved,is_approved.eq.true").order("created_at", { ascending: false }).limit(3);
  return data ?? [];
}

export async function getBanners() {
  if (!configured()) return [];
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.from("banners").select("id,title,body,image_path,cta_label,cta_href").eq("is_active", true).order("sort_order").limit(10);
  return (data ?? []).map((row: any) => ({ ...row, image_path: row.image_path ? resolveMediaUrl(row.image_path) : "/placeholder-bake.svg" }));
}

export async function getFaqs() {
  if (!configured()) return [];
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.from("faqs").select("id,question,answer").eq("is_published", true).order("sort_order").limit(100);
  return data ?? [];
}
