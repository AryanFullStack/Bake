import type { Metadata } from "next";
import { TrackCustomCakeClient } from "@/components/storefront/track-custom-cake-client";
import { JsonLd, buildBreadcrumbSchema, SITE_URL } from "@/components/seo/json-ld";

export const metadata: Metadata = {
  title: "Track Custom Cake Order - Live Status & Quotations",
  description:
    "Track your Bake Bazaar Mart custom celebration cake order status in real time. Enter your request number and phone number to monitor quotation, decorator review, baking, and delivery.",
  alternates: {
    canonical: "/track-custom-cake",
  },
  openGraph: {
    title: "Track Custom Cake Order | Bake Bazaar Mart",
    description:
      "Real-time tracking for custom cake requests and orders at Bake Bazaar Mart Karachi.",
    url: `${SITE_URL}/track-custom-cake`,
    type: "website",
    images: ["/custoemcake2.webp"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Track Custom Cake Order | Bake Bazaar Mart",
    description:
      "Check your Bake Bazaar Mart custom celebration cake status, decorator review, and delivery dispatch.",
    images: ["/custoemcake2.webp"],
  },
};

export default function TrackCustomCakePage() {
  const breadcrumbSchema = buildBreadcrumbSchema([
    { name: "Home", url: "/" },
    { name: "Custom Cake Studio", url: "/custom-cake" },
    { name: "Track Custom Cake", url: "/track-custom-cake" },
  ]);

  return (
    <>
      <JsonLd data={breadcrumbSchema} />
      <TrackCustomCakeClient />
    </>
  );
}
