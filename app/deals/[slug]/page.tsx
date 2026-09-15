import { Metadata } from "next";
import { notFound } from "next/navigation";
import { getDealBySlug } from "@/lib/deals";
import { DealPageClient } from "@/components/storefront/deal-page-client";
import { JsonLd, buildBreadcrumbSchema, SITE_URL } from "@/components/seo/json-ld";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const deal = await getDealBySlug(slug);

  if (!deal) {
    return {
      title: "Deal Not Found",
      description: "The requested promotional deal was not found.",
    };
  }

  const title = deal.name;
  const description =
    deal.short_description ||
    `Save on selected Bake Bazaar Mart products during our limited-time ${deal.name}. Shop now before the deal ends.`;

  return {
    title,
    description,
    alternates: {
      canonical: `/deals/${slug}`,
    },
    openGraph: {
      title: `${title} | Bake Bazaar Mart`,
      description,
      url: `${SITE_URL}/deals/${slug}`,
      type: "website",
      images: deal.banner_image ? [{ url: deal.banner_image }] : ["/homeDisktop.webp"],
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | Bake Bazaar Mart`,
      description,
      images: deal.banner_image ? [deal.banner_image] : ["/homeDisktop.webp"],
    },
  };
}

export default async function PublicDealPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const deal = await getDealBySlug(slug);

  if (!deal) notFound();

  const breadcrumbs = [
    { name: "Home", url: "/" },
    { name: "Deals", url: "/shop?sale=1" },
    { name: deal.name, url: `/deals/${deal.slug}` },
  ];
  const breadcrumbSchema = buildBreadcrumbSchema(breadcrumbs);

  return (
    <>
      <JsonLd data={breadcrumbSchema} />
      <DealPageClient deal={deal} />
    </>
  );
}

export const dynamic = "force-dynamic";
