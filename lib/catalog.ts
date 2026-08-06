export function formatPKR(value: number | string | null | undefined) {
  return new Intl.NumberFormat("en-PK", { style: "currency", currency: "PKR", maximumFractionDigits: 0 }).format(Number(value ?? 0));
}

export function publicStorageUrl(path: string | null | undefined, bucket = "product-images") {
  if (!path) return "/placeholder-bake.svg";
  if (/^https?:\/\//i.test(path)) return path;
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return base ? `${base}/storage/v1/object/public/${bucket}/${path}` : "/placeholder-bake.svg";
}

export function mapProduct(row: any) {
  const images = (row.product_images ?? []).sort((a: any, b: any) => a.sort_order - b.sort_order).map((image: any) => publicStorageUrl(image.storage_path));
  const rating = Number(row.review_summary?.[0]?.average_rating ?? row.average_rating ?? 0);
  const reviews = Number(row.review_summary?.[0]?.review_count ?? row.review_count ?? 0);
  return {
    id: row.id, slug: row.slug, sku: row.sku, name: row.name, category: row.categories?.name ?? "Bakery",
    categoryId: row.category_id ?? undefined, brand: row.brands?.name, description: row.description ?? "Freshly baked in small batches.",
    price: Number(row.price), salePrice: row.sale_price == null ? null : Number(row.sale_price), image: images[0] ?? "/placeholder-bake.svg", images,
    rating, reviews, stock: row.stock_quantity, lowStockThreshold: row.low_stock_threshold, tags: row.tags ?? [], featured: row.is_featured,
    bestseller: row.is_bestseller, isPublished: row.is_published,
  } as import("./types").Product;
}
