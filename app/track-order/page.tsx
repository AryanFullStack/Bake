import type { Metadata } from "next";
import { TrackOrderClient } from "@/components/storefront/track-order-client";
import { JsonLd, buildBreadcrumbSchema, SITE_URL } from "@/components/seo/json-ld";

export const metadata: Metadata = {
  title: "Track Your Order - Karachi & Nationwide Delivery Status",
  description:
    "Track your Bake Bazaar Mart order in real time. Enter your order reference number and phone number to monitor baking, packaging, courier dispatch, and delivery across Pakistan.",
  alternates: {
    canonical: "/track-order",
  },
  openGraph: {
    title: "Track Your Order | Bake Bazaar Mart",
    description:
      "Check live status for your Bake Bazaar Mart online orders and courier delivery.",
    url: `${SITE_URL}/track-order`,
    type: "website",
    images: ["/homeDisktop.webp"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Track Your Order | Bake Bazaar Mart",
    description:
      "Real-time order tracking and dispatch status for Bake Bazaar Mart customers.",
    images: ["/homeDisktop.webp"],
  },
};

export default function TrackOrderPage() {
  const breadcrumbSchema = buildBreadcrumbSchema([
    { name: "Home", url: "/" },
    { name: "Track Order", url: "/track-order" },
  ]);

  return (
    <>
      <JsonLd data={breadcrumbSchema} />
      <TrackOrderClient />
    </>
  );
}
