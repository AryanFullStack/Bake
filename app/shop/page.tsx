import { getCategories, getProducts } from "@/lib/storefront";
import { ShopBrowser } from "@/components/storefront/shop-browser";

export default async function ShopPage({ searchParams }: { searchParams: Promise<{ category?: string; q?: string; sale?: string }> }) {
  const params = await searchParams;
  const [categories, products] = await Promise.all([getCategories(), getProducts({ category: params.category, search: params.q, saleOnly: params.sale === "1", limit: 100 })]);
  // Resolve slug → name so client-side filter (which compares p.category = category name) works correctly
  const initialCategory = params.category
    ? (categories.find((c) => c.slug === params.category)?.name ?? "All")
    : "All";
  return <ShopBrowser categories={categories} products={products} initialCategory={initialCategory} initialQuery={params.q ?? ""} initialSaleOnly={params.sale === "1"} />;
}
export const dynamic = "force-dynamic";
