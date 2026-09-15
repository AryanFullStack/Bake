import type { MetadataRoute } from "next";
import { getCategories } from "@/lib/storefront";
import { getActiveDeals } from "@/lib/deals";
import { createSupabasePublicClient } from "@/lib/supabase/server";

export const revalidate = 3600; // Revalidate sitemap hourly

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://bakebazaarmart.com";
  const currentDate = new Date();

  // 1. Static Core Public Pages
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}`,
      lastModified: currentDate,
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${baseUrl}/shop`,
      lastModified: currentDate,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/custom-cake`,
      lastModified: currentDate,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: currentDate,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: currentDate,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/faq`,
      lastModified: currentDate,
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/shipping-delivery`,
      lastModified: currentDate,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${baseUrl}/refund-cancellation`,
      lastModified: currentDate,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${baseUrl}/track-order`,
      lastModified: currentDate,
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${baseUrl}/track-custom-cake`,
      lastModified: currentDate,
      changeFrequency: "monthly",
      priority: 0.5,
    },
  ];

  // 2. Dynamic Categories
  let categoryRoutes: MetadataRoute.Sitemap = [];
  try {
    const categories = await getCategories();
    categoryRoutes = categories
      .filter((cat) => Boolean(cat.slug))
      .map((cat) => ({
        url: `${baseUrl}/category/${cat.slug}`,
        lastModified: currentDate,
        changeFrequency: "daily",
        priority: 0.8,
      }));
  } catch (err) {
    console.error("Failed to generate category sitemap entries:", err);
  }

  // 3. Dynamic Products
  let productRoutes: MetadataRoute.Sitemap = [];
  try {
    const supabase = createSupabasePublicClient();
    const { data: products } = await supabase
      .from("products")
      .select("slug, updated_at, created_at, is_published, status")
      .or("is_published.eq.true,status.eq.published")
      .limit(2000);

    if (products) {
      productRoutes = products
        .filter((p) => Boolean(p.slug))
        .map((p) => ({
          url: `${baseUrl}/products/${p.slug}`,
          lastModified: p.updated_at ? new Date(p.updated_at) : p.created_at ? new Date(p.created_at) : currentDate,
          changeFrequency: "weekly",
          priority: 0.8,
        }));
    }
  } catch (err) {
    console.error("Failed to generate product sitemap entries:", err);
  }

  // 4. Dynamic Deals
  let dealRoutes: MetadataRoute.Sitemap = [];
  try {
    const activeDeals = await getActiveDeals();
    dealRoutes = (activeDeals || [])
      .filter((deal) => Boolean(deal.slug))
      .map((deal) => ({
        url: `${baseUrl}/deals/${deal.slug}`,
        lastModified: deal.updated_at ? new Date(deal.updated_at) : currentDate,
        changeFrequency: "daily",
        priority: 0.7,
      }));
  } catch (err) {
    console.error("Failed to generate deals sitemap entries:", err);
  }

  return [...staticRoutes, ...categoryRoutes, ...productRoutes, ...dealRoutes];
}

