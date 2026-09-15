import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ChevronRight, Sparkles, ArrowRight } from "lucide-react";
import { getProducts, getCategories } from "@/lib/storefront";
import { ProductCard } from "@/components/storefront/product-card";
import {
  JsonLd,
  buildBreadcrumbSchema,
  buildCollectionPageSchema,
} from "@/components/seo/json-ld";

interface CategoryPageProps {
  params: Promise<{ slug: string }>;
}

const CATEGORY_DETAILS: Record<string, { title: string; desc: string; banner: string; intro: string }> = {
  bakery: {
    title: "Fresh Bakery",
    desc: "Cakes, pastries, cupcakes, brownies, cookies & desserts prepared fresh in small batches daily.",
    intro: "Handcrafted in small batches with honest ingredients, our fresh bakery range brings daily indulgence straight to your home in Karachi. Same-day local dispatch available for orders placed before 1:00 PM.",
    banner: "/bakery.webp",
  },
  cakes: {
    title: "Celebration Cakes",
    desc: "Layer cakes, cream cakes, and handcrafted celebration centrepieces for birthdays and weddings.",
    intro: "Celebrate birthdays, anniversaries, and milestones with Bake Bazaar Mart's artisanal celebration cakes. Hand-finished in silky frosting with customized options available for your party.",
    banner: "/celebration-cakes.webp",
  },
  "home-decor": {
    title: "Home Decoration",
    desc: "Vases, wall art, lamps, and decorative accents carefully curated for beautiful living spaces.",
    intro: "Elevate your living room, bedroom, and dining spaces with aesthetic vases, lamps, and statement accessories. Shipped with protective packaging across Karachi and nationwide across Pakistan.",
    banner: "/homeDisktop.webp",
  },
  kitchen: {
    title: "Kitchen Essentials",
    desc: "Everyday kitchen utensils, organizers, storage sets, and accessories for convenient living.",
    intro: "Equip your kitchen with durable cooking utensils, airtight food containers, cutlery, and smart organizers designed for everyday cooking comfort.",
    banner: "/kicthens.webp",
  },
  watches: {
    title: "Watches & Timepieces",
    desc: "Classic and modern wristwatches designed for elegance, style, and everyday durability.",
    intro: "Explore premium wristwatches, stylish straps, and timeless designs for men and women. Delivered securely with cash on delivery anywhere in Pakistan.",
    banner: "/WD.webp",
  },
  baskets: {
    title: "Baskets & Storage",
    desc: "Organise your home beautifully with durable storage baskets, bins, and woven hampers.",
    intro: "Keep every room tidy and stylish with our multipurpose storage baskets, laundry organizers, and aesthetic woven bins.",
    banner: "/baskets.webp",
  },
  "daily-essentials": {
    title: "Daily Essentials",
    desc: "Everyday household needs, pantry items, and daily products delivered fast to your door.",
    intro: "Stock up on everyday essentials and household goods at honest prices, delivered reliably right to your doorstep.",
    banner: "/homeItems.webp",
  },
};

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params;
  const categories = await getCategories();
  const matchedCat = categories.find((c) => c.slug === slug);
  const details = CATEGORY_DETAILS[slug] || {
    title: matchedCat?.name || slug.replaceAll("-", " ").toUpperCase(),
    desc: matchedCat?.description || `Browse top quality ${slug.replaceAll("-", " ")} at Bake Bazaar Mart.`,
    intro: matchedCat?.description || "Curated products delivered with care across Karachi and Pakistan.",
    banner: matchedCat?.image || "/homeDisktop.webp",
  };

  const title = `${details.title} - Online Store Karachi`;
  const description = `${details.desc} Order online from Bake Bazaar Mart with fast local delivery in Karachi and courier shipping nationwide across Pakistan.`;
  const bannerUrl = details.banner.startsWith("http") ? details.banner : `https://bakebazaarmart.com${details.banner}`;

  return {
    title,
    description,
    alternates: {
      canonical: `/category/${slug}`,
    },
    openGraph: {
      title: `${details.title} | Bake Bazaar Mart`,
      description,
      url: `https://bakebazaarmart.com/category/${slug}`,
      type: "website",
      images: [
        {
          url: bannerUrl,
          width: 1200,
          height: 630,
          alt: `${details.title} — Bake Bazaar Mart Karachi`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${details.title} | Bake Bazaar Mart`,
      description,
      images: [bannerUrl],
    },
  };
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { slug } = await params;
  const categories = await getCategories();
  const matchedCat = categories.find((c) => c.slug === slug);
  const details = CATEGORY_DETAILS[slug] || {
    title: matchedCat?.name || slug.replaceAll("-", " ").toUpperCase(),
    desc: matchedCat?.description || `Browse top quality products in ${slug.replaceAll("-", " ")}.`,
    intro: matchedCat?.description || "Curated products delivered with care across Karachi and Pakistan.",
    banner: matchedCat?.image || "/homeDisktop.webp",
  };

  const products = await getProducts({ category: slug });

  const breadcrumbs = [
    { name: "Home", url: "/" },
    { name: "Shop", url: "/shop" },
    { name: details.title, url: `/category/${slug}` },
  ];

  const breadcrumbSchema = buildBreadcrumbSchema(breadcrumbs);
  const collectionSchema = buildCollectionPageSchema(
    details.title,
    details.desc,
    `/category/${slug}`,
    products
  );

  const isBakeryRelated = slug === "bakery" || slug === "cakes";

  return (
    <div className="min-h-screen pb-20">
      <JsonLd data={breadcrumbSchema} />
      <JsonLd data={collectionSchema} />

      {/* Category Hero Banner */}
      <div className="relative overflow-hidden bg-navy py-14 md:py-18 text-white">
        <div className="pointer-events-none absolute inset-0 pattern-navy-dots opacity-40" />
        <div className="container-shell relative z-10">
          {/* Breadcrumb Trail */}
          <nav aria-label="Breadcrumbs" className="flex items-center gap-1.5 text-xs text-white/70 mb-4 font-semibold">
            <Link href="/" className="hover:text-orange transition-colors">Home</Link>
            <ChevronRight size={13} className="text-white/40" />
            <Link href="/shop" className="hover:text-orange transition-colors">Shop</Link>
            <ChevronRight size={13} className="text-white/40" />
            <span className="text-orange">{details.title}</span>
          </nav>

          <h1 className="font-display text-3xl sm:text-5xl font-bold">{details.title}</h1>
          <p className="mt-3 max-w-2xl text-sm sm:text-base text-white/80 leading-relaxed font-normal">
            {details.intro}
          </p>
        </div>
      </div>

      {/* Cross-Link Callout for Custom Cakes */}
      {isBakeryRelated && (
        <div className="container-shell pt-8">
          <div className="rounded-2xl border border-orange/30 bg-orange/10 p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-orange text-white">
                <Sparkles size={18} />
              </span>
              <div>
                <h2 className="text-sm sm:text-base font-extrabold text-navy">
                  Looking for a custom cake design?
                </h2>
                <p className="text-xs text-muted mt-0.5 max-w-xl">
                  Order tailored celebration cakes with your chosen flavour, size, reference photos, and custom delivery schedule.
                </p>
              </div>
            </div>
            <Link
              href="/custom-cake"
              className="button-primary text-xs shrink-0 self-start sm:self-center px-5 py-2.5 inline-flex items-center gap-2"
            >
              Custom Cake Studio <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      )}

      {/* Product Grid */}
      <div className="container-shell py-10">
        <div className="flex items-center justify-between border-b border-line pb-4 mb-8">
          <span className="text-xs font-extrabold uppercase tracking-wider text-navy">
            Showing {products.length} Products
          </span>
          <Link
            href={`/shop?category=${slug}`}
            className="text-xs font-bold text-orange hover:underline"
          >
            Filter & Sort In Shop →
          </Link>
        </div>

        {products.length > 0 ? (
          <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="rounded-3xl border border-dashed border-line p-12 text-center">
            <h3 className="font-display text-lg font-bold text-navy">No products found in this category yet</h3>
            <p className="mt-2 text-xs text-muted">Check back soon as new inventory is published daily.</p>
            <Link href="/shop" className="button-primary mt-6 inline-flex text-xs">
              Explore All Categories
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

export const revalidate = 120;
