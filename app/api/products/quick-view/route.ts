import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { mapProduct } from "@/lib/catalog";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  const slug = searchParams.get("slug");

  if (!id && !slug) {
    return NextResponse.json({ error: "Product ID or slug required" }, { status: 400 });
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 503 });
  }

  const supabase = await createSupabaseServerClient();

  let query = supabase
    .from("products")
    .select("id,slug,sku,name,description,short_description,specifications,ingredients,care_instructions,delivery_information,return_policy,price,sale_price,stock_quantity,low_stock_threshold,is_published,status,is_featured,is_bestseller,seo_title,seo_description,tags,category_id,brand_id,featured_image,product_type,categories:category_id(name,slug),brands(name,slug),product_images(storage_path,alt_text,sort_order)");

  if (id) {
    query = query.eq("id", id);
  } else if (slug) {
    query = query.eq("slug", slug);
  }

  const { data: rows, error } = await query.limit(1);

  if (error || !rows || rows.length === 0) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  const row = rows[0];
  const productId = row.id;

  const [attrRes, varRes, reviewRes] = await Promise.all([
    supabase
      .from("product_attributes")
      .select("id,name,slug,display_type,sort_order,is_required,controls_images,product_attribute_values(id,label,slug,sort_order,swatch_color,swatch_image,is_active)")
      .eq("product_id", productId)
      .order("sort_order"),
    supabase
      .from("product_variations")
      .select("id,combination_key,name,title,description,sku,barcode,regular_price,sale_price,stock_quantity,low_stock_threshold,attributes,status,weight,dimensions,specifications,product_variation_images(storage_path,alt_text,sort_order,is_featured)")
      .eq("product_id", productId)
      .eq("status", "active"),
    supabase
      .from("reviews")
      .select("product_id,rating")
      .eq("product_id", productId)
      .eq("is_approved", true),
  ]);

  const productAttributes = attrRes.data ?? [];
  const productVariations = varRes.data ?? [];
  const reviews = reviewRes.data ?? [];

  const rating = reviews.length ? reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / reviews.length : 0;

  const fullProduct = mapProduct({
    ...row,
    average_rating: rating,
    review_count: reviews.length,
    product_attributes: productAttributes,
    product_variations: productVariations,
  });

  return NextResponse.json({ product: fullProduct });
}
