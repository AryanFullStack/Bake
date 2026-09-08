import { resolveMediaUrl } from "./media-url";

export function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

export function generateSKU(productName: string, categoryName?: string, attributeLabels: string[] = []): string {
  const catPrefix = categoryName ? slugify(categoryName).slice(0, 4).toUpperCase() : "PROD";
  const nameParts = slugify(productName).split("-").filter(Boolean).map(p => p.slice(0, 4).toUpperCase());
  const attrParts = attributeLabels.map(l => slugify(l).slice(0, 3).toUpperCase());
  const base = [catPrefix, ...nameParts.slice(0, 2), ...attrParts].join("-");
  return base || "SKU-001";
}

export function formatPKR(value: number | string | null | undefined) {
  return new Intl.NumberFormat("en-PK", { style: "currency", currency: "PKR", maximumFractionDigits: 0 }).format(Number(value ?? 0));
}

export function publicStorageUrl(path: string | null | undefined, bucket = "product-images") {
  return resolveMediaUrl(path);
}

export function mapProduct(row: any) {
  const galleryImages = (row.product_images ?? []).sort((a: any, b: any) => a.sort_order - b.sort_order).map((image: any) => publicStorageUrl(image.storage_path));
  // featured_image is the primary image, fall back to first gallery image, then placeholder
  const primaryImage = row.featured_image
    ? publicStorageUrl(row.featured_image)
    : galleryImages[0] ?? "/placeholder-bake.svg";
  const images = row.featured_image
    ? [publicStorageUrl(row.featured_image), ...galleryImages.filter((u: string) => u !== publicStorageUrl(row.featured_image))]
    : galleryImages;
  const rating = Number(row.review_summary?.[0]?.average_rating ?? row.average_rating ?? 0);
  const reviews = Number(row.review_summary?.[0]?.review_count ?? row.review_count ?? 0);
  const variations = (row.product_variations ?? row.variations ?? []).map((variation: any) => {
    const media = (variation.product_variation_images ?? variation.variation_images ?? [])
      .slice()
      .sort((a: any, b: any) => a.sort_order - b.sort_order);
    const featuredMedia = media.find((image: any) => image.is_featured) ?? media[0];
    const featuredImage = variation.image_url ? publicStorageUrl(variation.image_url, "product-images") : (featuredMedia ? publicStorageUrl(featuredMedia.storage_path, "product-images") : null);
    const galleryImages = media
      .filter((image: any) => !featuredImage || publicStorageUrl(image.storage_path, "product-images") !== featuredImage)
      .map((image: any) => publicStorageUrl(image.storage_path, "product-images"));
    return {
      id: variation.id,
      combinationKey: variation.combination_key,
      name: variation.name,
      title: variation.title,
      description: variation.description,
      sku: variation.sku,
      barcode: variation.barcode,
      regularPrice: Number(variation.regular_price ?? variation.price ?? 0),
      salePrice: variation.sale_price == null ? null : Number(variation.sale_price),
      costPrice: variation.cost_price == null ? null : Number(variation.cost_price),
      stockQuantity: Number(variation.stock_quantity ?? 0),
      lowStockThreshold: Number(variation.low_stock_threshold ?? 5),
      status: variation.status === "inactive" ? "inactive" : "active",
      attributes: variation.attributes ?? {},
      featuredImage,
      galleryImages,
      weight: variation.weight == null ? null : Number(variation.weight),
      dimensions: variation.dimensions ?? {},
      specifications: variation.specifications ?? {},
    };
  });

  // Price range calculation for variable products
  let priceMin = Number(row.price ?? 0);
  let priceMax = Number(row.price ?? 0);
  let priceRange: string | null = null;

  if (row.product_type === "variable" && variations.length > 0) {
    const activePrices = variations
      .filter((v: any) => v.status === "active")
      .map((v: any) => v.salePrice ?? v.regularPrice);
    if (activePrices.length > 0) {
      priceMin = Math.min(...activePrices);
      priceMax = Math.max(...activePrices);
      priceRange = priceMin === priceMax ? formatPKR(priceMin) : `${formatPKR(priceMin)} – ${formatPKR(priceMax)}`;
    }
  }

  return {
    id: row.id, slug: row.slug, sku: row.sku, barcode: row.barcode, name: row.name, category: row.categories?.name ?? "General",
    categoryId: row.category_id ?? undefined, brand: row.brands?.name, brandId: row.brand_id ?? undefined,
    description: row.description ?? "Quality products for every occasion.",
    price: Number(row.price), salePrice: row.sale_price == null ? null : Number(row.sale_price), costPrice: row.cost_price == null ? null : Number(row.cost_price),
    priceMin, priceMax, priceRange,
    image: primaryImage, images,
    rating, reviews, stock: row.stock_quantity, lowStockThreshold: row.low_stock_threshold, tags: row.tags ?? [], featured: row.is_featured,
    bestseller: row.is_bestseller, isPublished: row.is_published, status: row.status ?? (row.is_published ? "published" : "draft"),
    productType: row.product_type ?? "simple",
    shortDescription: row.short_description,
    specifications: row.specifications ?? {},
    ingredients: row.ingredients,
    careInstructions: row.care_instructions,
    deliveryInformation: row.delivery_information,
    returnPolicy: row.return_policy,
    seoTitle: row.seo_title,
    seoDescription: row.seo_description,
    variations,
    attributes: (row.product_attributes ?? row.attributes ?? []).map((attribute: any) => ({
      id: attribute.id,
      name: attribute.name,
      slug: attribute.slug,
      displayType: attribute.display_type ?? "button",
      sortOrder: attribute.sort_order ?? 0,
      required: attribute.is_required !== false,
      controlsImages: attribute.controls_images ?? (attribute.display_type === "color" || attribute.name?.toLowerCase().includes("color")),
      values: (attribute.product_attribute_values ?? attribute.values ?? []).map((value: any) => {
        const rawAttrImages = value.product_attribute_images ?? value.attribute_images ?? value.images ?? [];
        const mappedImages = (Array.isArray(rawAttrImages) ? rawAttrImages : [])
          .slice()
          .sort((a: any, b: any) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
          .map((img: any) => (typeof img === "string" ? publicStorageUrl(img) : publicStorageUrl(img.storage_path)));
        return {
          id: value.id,
          label: value.label,
          slug: value.slug,
          sortOrder: value.sort_order ?? 0,
          swatchColor: value.swatch_color,
          swatchImage: value.swatch_image ? publicStorageUrl(value.swatch_image) : null,
          images: mappedImages,
          isActive: value.is_active !== false,
        };
      }),
    })),
  } as import("./types").Product;
}

