export type Product = {
  id: string;
  slug: string;
  sku?: string;
  name: string;
  category: string;
  categoryId?: string;
  brand?: string;
  description: string;
  price: number;
  salePrice?: number | null;
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
};

export type CartItem = Product & { quantity: number };

export type OrderStatus = "placed" | "confirmed" | "processing" | "baking" | "ready" | "out_for_delivery" | "delivered" | "cancelled";
export type CustomCakeStatus = "submitted" | "under_review" | "quotation_prepared" | "confirmation_required" | "confirmed" | "deposit_pending" | "in_production" | "ready" | "out_for_delivery" | "delivered" | "completed" | "cancelled" | "rejected";

export type Category = { id?: string; name: string; slug: string; description?: string | null; image: string; count?: string };

export type ProductRow = {
  id: string; slug: string; sku: string; name: string; description: string | null;
  price: number | string; sale_price: number | string | null; stock_quantity: number;
  low_stock_threshold: number; is_published: boolean; is_featured: boolean; is_bestseller: boolean;
  tags: string[]; category_id: string | null; brand_id: string | null;
  categories?: { name: string; slug: string } | null;
  brands?: { name: string; slug: string } | null;
  product_images?: { storage_path: string; alt_text: string | null; sort_order: number }[];
};
