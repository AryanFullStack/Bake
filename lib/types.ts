export type AttributeDisplayType = "button" | "color" | "image" | "radio";

export type ProductAttributeValue = {
  id?: string;
  label: string;
  slug: string;
  sortOrder?: number;
  swatchColor?: string | null;
  swatchImage?: string | null;
  images?: string[];
  isActive?: boolean;
};

export type ProductAttribute = {
  id?: string;
  name: string;
  slug: string;
  displayType: AttributeDisplayType;
  sortOrder?: number;
  required?: boolean;
  controlsImages?: boolean;
  values: ProductAttributeValue[];
};

export type GlobalAttributeValue = {
  id: string;
  attributeId: string;
  label: string;
  slug: string;
  swatchColor?: string | null;
  swatchImage?: string | null;
  sortOrder: number;
  isActive: boolean;
};

export type GlobalAttribute = {
  id: string;
  name: string;
  slug: string;
  displayType: AttributeDisplayType;
  description?: string | null;
  sortOrder: number;
  values?: GlobalAttributeValue[];
};

export type CategoryAttributeTemplate = {
  id: string;
  categoryId: string;
  name: string;
  slug: string;
  displayType: AttributeDisplayType;
  required: boolean;
  sortOrder: number;
  defaultValues: { label: string; slug: string; swatchColor?: string; swatchImage?: string }[];
};

export type ProductVariation = {
  id: string;
  combinationKey?: string;
  name: string;
  title?: string | null;
  description?: string | null;
  sku?: string | null;
  barcode?: string | null;
  regularPrice: number;
  salePrice?: number | null;
  costPrice?: number | null;
  stockQuantity: number;
  lowStockThreshold?: number;
  status: "active" | "inactive";
  attributes: Record<string, string>;
  featuredImage?: string | null;
  galleryImages?: string[];
  weight?: number | null;
  dimensions?: Record<string, string | number>;
  specifications?: Record<string, string>;
};

export type Product = {
  id: string;
  slug: string;
  sku?: string;
  barcode?: string;
  name: string;
  category: string;
  categoryId?: string;
  brand?: string;
  brandId?: string;
  description: string;
  price: number;
  salePrice?: number | null;
  costPrice?: number | null;
  priceMin?: number;
  priceMax?: number;
  priceRange?: string | null;
  image: string;
  images?: string[];
  rating: number;
  reviews: number;
  stock: number;
  lowStockThreshold?: number;
  badge?: string;
  tags?: string[];
  featured?: boolean;
  bestseller?: boolean;
  isPublished?: boolean;
  status?: "draft" | "published" | "hidden" | "scheduled";
  productType?: "simple" | "variable";
  shortDescription?: string | null;
  specifications?: Record<string, string>;
  ingredients?: string | null;
  careInstructions?: string | null;
  deliveryInformation?: string | null;
  returnPolicy?: string | null;
  seoTitle?: string | null;
  seoDescription?: string | null;
  attributes?: ProductAttribute[];
  variations?: ProductVariation[];
};

export type CartItem = Product & {
  quantity: number;
  variationId?: string;
  variationAttributes?: Record<string, string>;
  variationTitle?: string;
};

export type OrderStatus = "placed" | "confirmed" | "processing" | "baking" | "ready" | "out_for_delivery" | "delivered" | "cancelled";
export type CustomCakeStatus = "submitted" | "under_review" | "quotation_prepared" | "confirmation_required" | "confirmed" | "deposit_pending" | "in_production" | "ready" | "out_for_delivery" | "delivered" | "completed" | "cancelled" | "rejected";

export type Category = { id?: string; name: string; slug: string; description?: string | null; image: string; count?: string; parent_id?: string | null };

export type ProductRow = {
  id: string; slug: string; sku: string; barcode?: string; name: string; description: string | null;
  price: number | string; sale_price: number | string | null; cost_price?: number | string | null; stock_quantity: number;
  low_stock_threshold: number; is_published: boolean; is_featured: boolean; is_bestseller: boolean;
  status?: "published" | "draft" | "hidden" | "scheduled"; product_type?: "simple" | "variable";
  tags: string[]; category_id: string | null; brand_id: string | null;
  short_description?: string | null; specifications?: Record<string, string>;
  featured_image?: string | null;
  categories?: { id: string; name: string; slug: string } | { id: string; name: string; slug: string }[] | null | any;
  brands?: { id: string; name: string; slug: string } | { id: string; name: string; slug: string }[] | null | any;
  product_images?: { storage_path: string; alt_text: string | null; sort_order: number }[];
  product_attributes?: any[];
  product_variations?: any[];
  updated_at: string;
};
