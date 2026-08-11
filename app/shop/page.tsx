import { getCategories, getProducts } from "@/lib/storefront";
import { ShopBrowser } from "@/components/storefront/shop-browser";
import type { Category } from "@/lib/types";

function resolveCategoryName(slug: string | undefined, categories: Category[]): string {
  if (!slug || slug.toLowerCase() === "all") return "All";
  const normSlug = slug.toLowerCase().trim();

  const directMatch = categories.find((c) => c.slug.toLowerCase() === normSlug);
  if (directMatch) return directMatch.name;

  const aliases: Record<string, string> = {
    "bakery": "Bakery",
    "cakes": "Celebration Cakes",
    "celebration-cakes": "Celebration Cakes",
    "pastries": "Pastries",
    "cupcakes": "Cupcakes",
    "brownies": "Brownies",
    "cookies": "Cookies",
    "brownies-cookies": "Brownies & Cookies",
    "desserts": "Desserts",
    "home-decor": "Home Decoration",
    "home-decoration": "Home Decoration",
    "home": "Home Decoration",
    "kitchen": "Kitchen Essentials",
    "kitchen-essentials": "Kitchen Essentials",
    "watches": "Watches",
    "baskets": "Baskets & Storage",
    "baskets-storage": "Baskets & Storage",
    "daily-essentials": "Daily Essentials",
    "daily": "Daily Essentials",
    "grocery": "Daily Essentials",
  };

  if (aliases[normSlug]) return aliases[normSlug];

  const key = normSlug.replace(/[^a-z0-9]+/g, "");
  const nameMatch = categories.find((c) => c.name.toLowerCase().replace(/[^a-z0-9]+/g, "") === key);
  if (nameMatch) return nameMatch.name;

  return "All";
}

export default async function ShopPage({ searchParams }: { searchParams: Promise<{ category?: string; q?: string; sale?: string }> }) {
  const params = await searchParams;
  const [categories, products] = await Promise.all([
    getCategories(),
    getProducts({ search: params.q, saleOnly: params.sale === "1", limit: 100 })
  ]);
  const initialCategory = resolveCategoryName(params.category, categories);
  return <ShopBrowser categories={categories} products={products} initialCategory={initialCategory} initialQuery={params.q ?? ""} initialSaleOnly={params.sale === "1"} />;
}
export const dynamic = "force-dynamic";
