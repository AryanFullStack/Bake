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
  dealInfo?: PriceCalculationResult;
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

export type OrderStatus = "placed" | "confirmed" | "processing" | "baking" | "ready" | "out_for_delivery" | "delivered" | "cancelled" | "returned";
export type CustomCakeStatus = "submitted" | "under_review" | "quotation_prepared" | "confirmation_required" | "confirmed" | "deposit_pending" | "in_production" | "ready" | "out_for_delivery" | "delivered" | "completed" | "cancelled" | "rejected";

export type PaymentMethod = "cod" | "bank_transfer" | "card" | "cash";
export type PaymentStatus = "pending" | "pending_verification" | "paid" | "failed" | "refunded";

export type Courier = {
  id: string;
  name: string;
  code: string;
  website_url?: string | null;
  tracking_url_template?: string | null;
  phone?: string | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
};

export type PaymentRecord = {
  id: string;
  order_id: string;
  method: PaymentMethod;
  status: PaymentStatus;
  receipt_path?: string | null;
  verified_by?: string | null;
  verified_at?: string | null;
  note?: string | null;
  transaction_reference?: string | null;
  payment_notes?: string | null;
  created_at: string;
};

export type OrderStatusHistoryItem = {
  id: string;
  order_id: string;
  old_status?: OrderStatus | null;
  new_status: OrderStatus;
  note?: string | null;
  changed_by?: string | null;
  created_at: string;
  profiles?: { full_name?: string | null; role?: string } | null;
};

export type AdminOrderItem = {
  id: string;
  order_id: string;
  product_id?: string | null;
  variation_id?: string | null;
  variation_attributes?: Record<string, string> | null;
  variation_title?: string | null;
  image_path?: string | null;
  product_name: string;
  sku?: string | null;
  unit_price: number;
  quantity: number;
  line_total: number;
  products?: { id: string; name: string; price: number; sale_price?: number | null; featured_image?: string | null } | null;
};

export type AdminCustomerStats = {
  total_orders: number;
  total_spent: number;
  latest_order_date?: string | null;
  account_created_at?: string | null;
};

export type AdminOrder = {
  id: string;
  order_number: string;
  user_id?: string | null;
  customer_name: string;
  customer_phone: string;
  customer_email?: string | null;
  city: string;
  area: string;
  delivery_address: string;
  landmark?: string | null;
  delivery_instructions?: string | null;
  preferred_delivery_at?: string | null;
  subtotal: number;
  delivery_fee: number;
  discount: number;
  total: number;
  payment_method: PaymentMethod;
  status: OrderStatus;
  courier_id?: string | null;
  courier_name?: string | null;
  tracking_number?: string | null;
  tracking_url?: string | null;
  dispatched_at?: string | null;
  expected_delivery_at?: string | null;
  delivery_notes?: string | null;
  admin_notes?: string | null;
  created_at: string;
  order_items?: AdminOrderItem[];
  payments?: PaymentRecord[];
  order_status_history?: OrderStatusHistoryItem[];
  couriers?: Courier | null;
  customer_stats?: AdminCustomerStats;
};

export type Category = { id?: string; name: string; slug: string; description?: string | null; image: string; count?: string; parent_id?: string | null };

export type ReviewStatus = "pending" | "approved" | "rejected" | "hidden";

export type Review = {
  id: string;
  product_id: string;
  order_id: string;
  user_id?: string | null;
  guest_name?: string | null;
  guest_email?: string | null;
  guest_phone?: string | null;
  reviewer_name: string;
  rating: number;
  body: string;
  status: ReviewStatus;
  is_approved: boolean;
  is_verified_purchase: boolean;
  is_reported?: boolean;
  admin_note?: string | null;
  created_at: string;
  updated_at?: string;
  products?: { id?: string; name: string; slug?: string } | null;
  profiles?: { full_name?: string | null } | null;
  orders?: { order_number: string; customer_name?: string; customer_phone?: string; customer_email?: string } | null;
};

export type RatingDistribution = {
  average: number;
  total: number;
  counts: Record<1 | 2 | 3 | 4 | 5, number>;
  percentages: Record<1 | 2 | 3 | 4 | 5, number>;
};

export type ReviewEligibilityResult = {
  eligible: boolean;
  reason?: string;
  order_id?: string;
  order_number?: string;
  existing_review?: Review | null;
};

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

export type DealType = "percentage" | "fixed" | "sale_price" | "buy_x_get_y";

export type DealStatus = "draft" | "scheduled" | "active" | "paused" | "expired";

export type DealProduct = {
  id?: string;
  deal_id?: string;
  product_id: string;
  variation_id?: string | null;
  custom_deal_price?: number | null;
  created_at?: string;
  products?: {
    id: string;
    name: string;
    sku: string;
    price: number;
    sale_price?: number | null;
    featured_image?: string | null;
    stock_quantity: number;
    categories?: { name: string } | null;
  } | null;
  product_variations?: {
    id: string;
    name: string;
    sku?: string | null;
    regular_price: number;
    sale_price?: number | null;
    stock_quantity: number;
    attributes?: Record<string, string>;
  } | null;
};

export type Deal = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  short_description?: string | null;
  deal_type: DealType;
  discount_value: number;
  banner_image?: string | null;
  mobile_banner_image?: string | null;
  badge_text?: string | null;
  start_at: string;
  end_at: string;
  priority: number;
  is_active: boolean;
  is_featured: boolean;
  max_quantity_per_customer?: number | null;
  total_quantity?: number | null;
  min_quantity?: number | null;
  min_cart_amount?: number | null;
  max_discount_amount?: number | null;
  created_at?: string;
  updated_at?: string;
  status?: DealStatus;
  deal_products?: DealProduct[];
  products_count?: number;
};

export type PriceCalculationResult = {
  regularPrice: number;
  dealPrice: number;
  discountAmount: number;
  discountPercentage: number;
  isOnDeal: boolean;
  dealId?: string;
  dealName?: string;
  badgeText?: string;
  endAt?: string;
  priority?: number;
};

export type DealSummaryStats = {
  totalDeals: number;
  activeDeals: number;
  scheduledDeals: number;
  expiredDeals: number;
  draftDeals: number;
  productsOnDeal: number;
};

export type DealAnalytics = {
  totalOrders: number;
  unitsSold: number;
  grossSales: number;
  discountGiven: number;
  averageOrderValue: number;
};

