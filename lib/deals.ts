import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type {
  Deal,
  DealAnalytics,
  DealProduct,
  DealStatus,
  DealSummaryStats,
  PriceCalculationResult,
} from "@/lib/types";

/**
 * Computes the dynamic status of a deal based on its scheduling dates and active flag.
 */
export function computeDealStatus(deal: Partial<Deal>, now: Date = new Date()): DealStatus {
  if (!deal.is_active) {
    return "paused";
  }
  if (deal.start_at && new Date(deal.start_at) > now) {
    return "scheduled";
  }
  if (deal.end_at && new Date(deal.end_at) <= now) {
    return "expired";
  }
  return "active";
}

/**
 * Centralized server-side pricing engine for calculating deal discounts and savings.
 */
export function calculateProductDealPrice(options: {
  productId: string;
  variationId?: string | null;
  regularPrice: number;
  activeDeals?: Deal[];
  now?: Date;
}): PriceCalculationResult {
  const { productId, variationId, regularPrice, activeDeals = [], now = new Date() } = options;

  const defaultResult: PriceCalculationResult = {
    regularPrice,
    dealPrice: regularPrice,
    discountAmount: 0,
    discountPercentage: 0,
    isOnDeal: false,
  };

  if (!productId || regularPrice <= 0 || activeDeals.length === 0) {
    return defaultResult;
  }

  // Filter valid, currently active deals containing this product or variation
  const validDeals = activeDeals.filter((deal) => {
    const status = computeDealStatus(deal, now);
    if (status !== "active") return false;

    if (!deal.deal_products || deal.deal_products.length === 0) return false;

    return deal.deal_products.some((dp) => {
      if (dp.product_id !== productId) return false;
      // If deal product specifies a variation_id, match it. If variation_id is null/undefined, deal applies to entire product.
      if (dp.variation_id) {
        return variationId ? dp.variation_id === variationId : false;
      }
      return true;
    });
  });

  if (validDeals.length === 0) {
    return defaultResult;
  }

  // Sort by priority (1 = highest priority, numerically smallest)
  validDeals.sort((a, b) => (a.priority ?? 1) - (b.priority ?? 1));
  const bestDeal = validDeals[0];

  const matchingDp = bestDeal.deal_products?.find(
    (dp) => dp.product_id === productId && (!dp.variation_id || dp.variation_id === variationId)
  );

  let rawDealPrice = regularPrice;

  switch (bestDeal.deal_type) {
    case "percentage": {
      const pct = Math.min(100, Math.max(0, Number(bestDeal.discount_value ?? 0)));
      let discount = (regularPrice * pct) / 100;
      if (bestDeal.max_discount_amount && bestDeal.max_discount_amount > 0) {
        discount = Math.min(discount, Number(bestDeal.max_discount_amount));
      }
      rawDealPrice = regularPrice - discount;
      break;
    }
    case "fixed": {
      const discount = Math.max(0, Number(bestDeal.discount_value ?? 0));
      rawDealPrice = regularPrice - discount;
      break;
    }
    case "sale_price": {
      if (matchingDp && matchingDp.custom_deal_price != null && matchingDp.custom_deal_price > 0) {
        rawDealPrice = Number(matchingDp.custom_deal_price);
      } else {
        rawDealPrice = Math.max(0, Number(bestDeal.discount_value ?? 0));
      }
      break;
    }
    case "buy_x_get_y": {
      // Extensible discount rule placeholder (e.g. effective price reduction)
      const pct = Math.min(100, Math.max(0, Number(bestDeal.discount_value || 25)));
      rawDealPrice = regularPrice * (1 - pct / 100);
      break;
    }
    default:
      rawDealPrice = regularPrice;
  }

  // Ensure non-negative and non-inflated deal price
  const finalDealPrice = Math.min(regularPrice, Math.max(0, Math.round(rawDealPrice)));
  const discountAmount = Math.max(0, regularPrice - finalDealPrice);
  const discountPercentage = regularPrice > 0 ? Math.round((discountAmount / regularPrice) * 100) : 0;

  return {
    regularPrice,
    dealPrice: finalDealPrice,
    discountAmount,
    discountPercentage,
    isOnDeal: discountAmount > 0,
    dealId: bestDeal.id,
    dealName: bestDeal.name,
    badgeText: bestDeal.badge_text || `${discountPercentage}% OFF`,
    endAt: bestDeal.end_at,
    priority: bestDeal.priority,
  };
}

/**
 * Attaches calculated deal pricing to a product and all of its variations.
 */
export function attachDealPricingToProduct(product: any, activeDeals: Deal[]): any {
  if (!product) return product;

  const baseDealInfo = calculateProductDealPrice({
    productId: product.id,
    regularPrice: product.price,
    activeDeals,
  });

  const updatedVariations = (product.variations ?? []).map((v: any) => {
    const varDealInfo = calculateProductDealPrice({
      productId: product.id,
      variationId: v.id,
      regularPrice: v.regularPrice,
      activeDeals,
    });
    return {
      ...v,
      dealInfo: varDealInfo,
      salePrice: varDealInfo.isOnDeal ? varDealInfo.dealPrice : v.salePrice,
    };
  });

  const finalSalePrice = baseDealInfo.isOnDeal ? baseDealInfo.dealPrice : product.salePrice;

  return {
    ...product,
    dealInfo: baseDealInfo,
    salePrice: finalSalePrice,
    variations: updatedVariations,
  };
}

/**
 * Fetches active deals from database.
 */
export async function getActiveDeals(): Promise<Deal[]> {
  try {
    const supabase = await createSupabaseServerClient();
    const nowIso = new Date().toISOString();

    const { data, error } = await supabase
      .from("deals")
      .select("*, deal_products(*)")
      .eq("is_active", true)
      .lte("start_at", nowIso)
      .gt("end_at", nowIso)
      .order("priority", { ascending: true });

    if (error || !data) {
      console.error("[getActiveDeals] Error fetching active deals:", error?.message);
      return [];
    }

    return data.map((row: any) => ({
      ...row,
      discount_value: Number(row.discount_value ?? 0),
      priority: Number(row.priority ?? 1),
      status: computeDealStatus(row),
    })) as Deal[];
  } catch (err) {
    console.error("[getActiveDeals] Unexpected error:", err);
    return [];
  }
}

/**
 * Fetches all deals for public storefront listings (e.g., /deals).
 */
export async function getStorefrontDeals(): Promise<Deal[]> {
  const activeDeals = await getActiveDeals();
  if (activeDeals.length === 0) return [];

  const supabase = await createSupabaseServerClient();
  const dealIds = activeDeals.map((d) => d.id);

  const { data: dealProducts } = await supabase
    .from("deal_products")
    .select(
      `
      id, deal_id, product_id, variation_id, custom_deal_price,
      products (
        id, name, slug, sku, price, sale_price, stock_quantity, is_published,
        categories:category_id ( name ),
        product_images ( id, storage_path, sort_order )
      ),
      product_variations (
        id, name, sku, regular_price, sale_price, stock_quantity, attributes
      )
    `
    )
    .in("deal_id", dealIds);

  const productsByDeal = new Map<string, DealProduct[]>();
  for (const dp of dealProducts ?? []) {
    if (dp.products) {
      const sortedImgs = ((dp.products as any).product_images ?? []).slice().sort((a: any, b: any) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
      (dp.products as any).featured_image = sortedImgs[0]?.storage_path ?? null;
    }
    const list = productsByDeal.get(dp.deal_id) ?? [];
    list.push(dp as any);
    productsByDeal.set(dp.deal_id, list);
  }

  return activeDeals.map((deal) => ({
    ...deal,
    deal_products: productsByDeal.get(deal.id) ?? [],
    products_count: (productsByDeal.get(deal.id) ?? []).length,
  }));
}

/**
 * Fetches a single public deal by slug for storefront deal details page.
 */
export async function getDealBySlug(slug: string): Promise<Deal | null> {
  const supabase = await createSupabaseServerClient();
  const { data: deal, error } = await supabase
    .from("deals")
    .select("*, deal_products(*)")
    .eq("slug", slug)
    .maybeSingle();

  if (error || !deal) return null;

  const { data: rawDealProducts } = await supabase
    .from("deal_products")
    .select(
      `
      id, deal_id, product_id, variation_id, custom_deal_price,
      products (
        id, name, slug, sku, price, sale_price, stock_quantity, is_published, status,
        categories:category_id ( name ),
        product_images ( id, storage_path, sort_order )
      ),
      product_variations (
        id, name, sku, regular_price, sale_price, stock_quantity, attributes
      )
    `
    )
    .eq("deal_id", deal.id);

  const dealProducts = (rawDealProducts ?? []).map((dp: any) => {
    if (dp.products) {
      const sortedImgs = (dp.products.product_images ?? []).slice().sort((a: any, b: any) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
      dp.products.featured_image = sortedImgs[0]?.storage_path ?? null;
    }
    return dp;
  });

  return {
    ...deal,
    discount_value: Number(deal.discount_value ?? 0),
    priority: Number(deal.priority ?? 1),
    status: computeDealStatus(deal),
    deal_products: dealProducts as any,
    products_count: dealProducts.length,
  };
}

/**
 * Fetches featured deal for homepage main promotional showcase.
 */
export async function getFeaturedDeal(): Promise<Deal | null> {
  const activeDeals = await getStorefrontDeals();
  if (activeDeals.length === 0) return null;

  const featured = activeDeals.find((d) => d.is_featured);
  return featured ?? activeDeals[0];
}

/**
 * Dynamically computes Summary Statistics for Admin Deals Dashboard.
 */
export async function getAdminDealsSummary(): Promise<DealSummaryStats> {
  const adminClient = createSupabaseAdminClient();
  const supabase = adminClient ?? (await createSupabaseServerClient());

  const { data: deals } = await supabase
    .from("deals")
    .select("id, is_active, start_at, end_at, deal_products(product_id)");

  if (!deals || deals.length === 0) {
    return {
      totalDeals: 0,
      activeDeals: 0,
      scheduledDeals: 0,
      expiredDeals: 0,
      draftDeals: 0,
      productsOnDeal: 0,
    };
  }

  const now = new Date();
  let activeCount = 0;
  let scheduledCount = 0;
  let expiredCount = 0;
  let draftCount = 0;
  const uniqueProductsOnDeal = new Set<string>();

  for (const deal of deals) {
    const status = computeDealStatus(deal, now);
    if (status === "active") {
      activeCount++;
      if (deal.deal_products) {
        deal.deal_products.forEach((dp: any) => uniqueProductsOnDeal.add(dp.product_id));
      }
    } else if (status === "scheduled") {
      scheduledCount++;
    } else if (status === "expired") {
      expiredCount++;
    } else {
      draftCount++;
    }
  }

  return {
    totalDeals: deals.length,
    activeDeals: activeCount,
    scheduledDeals: scheduledCount,
    expiredDeals: expiredCount,
    draftDeals: draftCount,
    productsOnDeal: uniqueProductsOnDeal.size,
  };
}

/**
 * Calculates genuine performance analytics for a specific deal from database orders.
 */
export async function getDealAnalytics(dealId: string): Promise<DealAnalytics> {
  const adminClient = createSupabaseAdminClient();
  const supabase = adminClient ?? (await createSupabaseServerClient());

  const { data: items } = await supabase
    .from("order_items")
    .select("id, order_id, quantity, line_total, unit_price, regular_price, discount_amount")
    .eq("deal_id", dealId);

  if (!items || items.length === 0) {
    return {
      totalOrders: 0,
      unitsSold: 0,
      grossSales: 0,
      discountGiven: 0,
      averageOrderValue: 0,
    };
  }

  const uniqueOrders = new Set<string>();
  let totalUnits = 0;
  let grossSales = 0;
  let totalDiscounts = 0;

  for (const item of items) {
    if (item.order_id) uniqueOrders.add(item.order_id);
    const qty = Number(item.quantity ?? 1);
    totalUnits += qty;
    grossSales += Number(item.line_total ?? 0);
    totalDiscounts += Number(item.discount_amount ?? 0) * qty;
  }

  const totalOrders = uniqueOrders.size;
  const averageOrderValue = totalOrders > 0 ? Math.round(grossSales / totalOrders) : 0;

  return {
    totalOrders,
    unitsSold: totalUnits,
    grossSales: Math.round(grossSales),
    discountGiven: Math.round(totalDiscounts),
    averageOrderValue,
  };
}
