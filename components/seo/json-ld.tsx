import React from "react";
import type { Product } from "@/lib/types";

export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://bakebazaarmart.com";
export const BRAND_NAME = "Bake Bazaar Mart";
export const STORE_EMAIL = "info@bakebazaarmart.com";
export const STORE_CITY = "Karachi";
export const STORE_COUNTRY = "Pakistan";

export function JsonLd({ data }: { data: Record<string, any> | Record<string, any>[] }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

/**
 * Organization Schema
 */
export function buildOrganizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${SITE_URL}/#organization`,
    name: BRAND_NAME,
    url: SITE_URL,
    logo: `${SITE_URL}/logobake-01.png`,
    email: STORE_EMAIL,
    contactPoint: [
      {
        "@type": "ContactPoint",
        contactType: "Customer Support",
        email: STORE_EMAIL,
        areaServed: "PK",
        availableLanguage: ["en", "ur"],
      },
    ],
  };
}

/**
 * WebSite Schema with Site Search potentialAction
 */
export function buildWebSiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${SITE_URL}/#website`,
    url: SITE_URL,
    name: BRAND_NAME,
    publisher: {
      "@id": `${SITE_URL}/#organization`,
    },
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${SITE_URL}/shop?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

/**
 * LocalBusiness / Store / Bakery Schema
 */
export function buildLocalBusinessSchema() {
  return {
    "@context": "https://schema.org",
    "@type": ["Store", "Bakery"],
    "@id": `${SITE_URL}/#localbusiness`,
    name: BRAND_NAME,
    url: SITE_URL,
    image: `${SITE_URL}/logobake-01.png`,
    email: STORE_EMAIL,
    priceRange: "PKR",
    address: {
      "@type": "PostalAddress",
      addressLocality: STORE_CITY,
      addressRegion: "Sindh",
      addressCountry: "PK",
    },
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: [
          "Monday",
          "Tuesday",
          "Wednesday",
          "Thursday",
          "Friday",
          "Saturday",
          "Sunday",
        ],
        opens: "09:00",
        closes: "22:00",
      },
    ],
    servesCuisine: "Bakery, Cakes, Desserts",
  };
}

/**
 * BreadcrumbList Schema
 */
export function buildBreadcrumbSchema(items: { name: string; url: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url.startsWith("http") ? item.url : `${SITE_URL}${item.url}`,
    })),
  };
}

/**
 * Product & Offer Schema with authentic rating data only
 */
export function buildProductSchema(product: Product, reviews: any[] = []) {
  const primaryImage = product.image
    ? product.image.startsWith("http")
      ? product.image
      : `${SITE_URL}${product.image}`
    : `${SITE_URL}/placeholder-bake.svg`;

  const additionalImages = (product.images || [])
    .map((img) => (img.startsWith("http") ? img : `${SITE_URL}${img}`))
    .filter((img) => img !== primaryImage);

  const price = product.salePrice ?? product.price;
  const isAvailable = (product.stock ?? 0) > 0;

  // Real aggregate rating only: never emit fake ratings or fake reviews
  const reviewCount = reviews.length || (product.reviews ?? 0);
  const avgRating =
    reviews.length > 0
      ? reviews.reduce((sum, r) => sum + Number(r.rating || 0), 0) / reviews.length
      : Number(product.rating ?? 0);

  const schema: Record<string, any> = {
    "@context": "https://schema.org",
    "@type": "Product",
    "@id": `${SITE_URL}/products/${product.slug}#product`,
    name: product.name,
    image: [primaryImage, ...additionalImages],
    description:
      product.seoDescription ||
      product.shortDescription ||
      product.description ||
      `Order ${product.name} online from Bake Bazaar Mart Karachi.`,
    sku: product.sku || product.id,
    brand: {
      "@type": "Brand",
      name: product.brand || BRAND_NAME,
    },
    category: product.category,
    offers: {
      "@type": "Offer",
      url: `${SITE_URL}/products/${product.slug}`,
      priceCurrency: "PKR",
      price: price,
      priceValidUntil: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      itemCondition: "https://schema.org/NewCondition",
      availability: isAvailable
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      seller: {
        "@type": "Organization",
        name: BRAND_NAME,
      },
    },
  };

  if (reviewCount > 0 && avgRating > 0) {
    schema.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: Number(avgRating.toFixed(1)),
      reviewCount: reviewCount,
      bestRating: 5,
      worstRating: 1,
    };
  }

  // Include authentic reviews if available
  if (reviews.length > 0) {
    schema.review = reviews.slice(0, 5).map((r) => {
      const author = r.profiles?.full_name || r.reviewer_name || r.guest_name || "Verified Customer";
      return {
        "@type": "Review",
        author: {
          "@type": "Person",
          name: author,
        },
        datePublished: r.created_at ? new Date(r.created_at).toISOString().split("T")[0] : undefined,
        reviewRating: {
          "@type": "Rating",
          ratingValue: Number(r.rating || 5),
          bestRating: 5,
          worstRating: 1,
        },
        reviewBody: r.body || "",
      };
    });
  }

  return schema;
}

/**
 * CollectionPage / ItemList Schema for Category & Catalog pages
 */
export function buildCollectionPageSchema(
  categoryName: string,
  description: string,
  categoryUrl: string,
  products: Product[] = []
) {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `${categoryName} | ${BRAND_NAME}`,
    description: description,
    url: categoryUrl.startsWith("http") ? categoryUrl : `${SITE_URL}${categoryUrl}`,
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: products.length,
      itemListElement: products.slice(0, 24).map((p, idx) => ({
        "@type": "ListItem",
        position: idx + 1,
        url: `${SITE_URL}/products/${p.slug}`,
        name: p.name,
      })),
    },
  };
}

/**
 * FAQPage Schema
 */
export function buildFaqSchema(faqs: { question: string; answer: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };
}

