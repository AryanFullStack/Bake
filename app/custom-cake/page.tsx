import type { Metadata } from "next";
import { CustomCakeBuilder } from "@/components/storefront/custom-cake-builder";
import { JsonLd, buildBreadcrumbSchema, SITE_URL } from "@/components/seo/json-ld";

export const metadata: Metadata = {
  title: "Custom Cake Studio - Handcrafted Cakes Karachi",
  description:
    "Design and order bespoke celebration cakes in Karachi with Bake Bazaar Mart. Choose custom flavours, tiers, sizes, and upload inspiration reference photos with fast delivery across Karachi.",
  alternates: {
    canonical: "/custom-cake",
  },
  openGraph: {
    title: "Custom Cake Studio | Bake Bazaar Mart",
    description:
      "Handcrafted custom cakes in Karachi. Order bespoke celebration cakes with customized flavours, reference photo uploads, and scheduled local delivery.",
    url: `${SITE_URL}/custom-cake`,
    type: "website",
    images: [
      {
        url: "/custoemcake2.webp",
        width: 1200,
        height: 630,
        alt: "Custom Celebration Cakes by Bake Bazaar Mart Karachi",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Custom Cake Studio | Bake Bazaar Mart",
    description:
      "Bespoke custom cakes in Karachi. Share your cake brief and upload design photos for custom birthday and event cakes.",
    images: ["/custoemcake2.webp"],
  },
};

export default function CustomCakePage() {
  const breadcrumbs = [
    { name: "Home", url: "/" },
    { name: "Bakery", url: "/category/bakery" },
    { name: "Custom Cake Studio", url: "/custom-cake" },
  ];
  const breadcrumbSchema = buildBreadcrumbSchema(breadcrumbs);

  return (
    <>
      <JsonLd data={breadcrumbSchema} />
      <CustomCakeBuilder />
    </>
  );
}
