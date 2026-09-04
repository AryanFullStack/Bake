import { Metadata } from "next";
import { notFound } from "next/navigation";
import { getDealBySlug } from "@/lib/deals";
import { DealPageClient } from "@/components/storefront/deal-page-client";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const deal = await getDealBySlug(slug);

  if (!deal) {
    return {
      title: "Deal Not Found | Bake Mart",
      description: "The requested promotional deal was not found.",
    };
  }

  return {
    title: `${deal.name} | Bake Mart Bazaar`,
    description:
      deal.short_description ||
      `Save on selected Bake Mart products during our limited-time ${deal.name}. Shop now before the deal ends.`,
    openGraph: {
      title: `${deal.name} | Bake Mart Bazaar`,
      description: deal.short_description || `Limited time offer: ${deal.name}`,
      images: deal.banner_image ? [{ url: deal.banner_image }] : [],
    },
  };
}

export default async function PublicDealPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const deal = await getDealBySlug(slug);

  if (!deal) notFound();

  return <DealPageClient deal={deal} />;
}

export const dynamic = "force-dynamic";
