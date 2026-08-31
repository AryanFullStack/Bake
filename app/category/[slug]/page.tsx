import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getProducts, getCategories } from "@/lib/storefront";
import { ProductCard } from "@/components/storefront/product-card";

interface CategoryPageProps {
  params: Promise<{ slug: string }>;
}

const CATEGORY_DETAILS: Record<string, { title: string; desc: string; banner: string }> = {
  bakery: {
    title: "Fresh Bakery",
    desc: "Cakes, pastries, cupcakes, brownies, cookies & desserts prepared fresh in small batches daily.",
    banner: "/bakery.png",
  },
  cakes: {
    title: "Celebration Cakes",
    desc: "Layer cakes, cream cakes, and handcrafted celebration centrepieces.",
    banner: "/celebration-cakes.png",
  },
  "home-decor": {
    title: "Home Decoration",
    desc: "Vases, wall art, lamps, and decorative accents carefully curated for beautiful living spaces.",
    banner: "/homeDisktop.png",
  },
  kitchen: {
    title: "Kitchen Essentials",
    desc: "Everyday kitchen utensils, organizers, storage sets, and accessories for convenient living.",
    banner: "/kicthens.jpg",
  },
  watches: {
    title: "Watches & Timepieces",
    desc: "Classic and modern wristwatches designed for elegance, style, and durability.",
    banner: "/WD.jpeg",
  },
  baskets: {
    title: "Baskets & Storage",
    desc: "Organise your home beautifully with durable storage baskets, bins, and woven hampers.",
    banner: "/baskets.png",
  },
  "daily-essentials": {
    title: "Daily Essentials & Grocery",
    desc: "Everyday household needs, pantry items, and daily products delivered fast to your door.",
    banner: "/homeItems.jfif",
  },
};

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { slug } = await params;
  const categories = await getCategories();
  const matchedCat = categories.find((c) => c.slug === slug);
  const details = CATEGORY_DETAILS[slug] || {
    title: matchedCat?.name || slug.replaceAll("-", " ").toUpperCase(),
    desc: matchedCat?.description || "Browse top quality products in this category.",
    banner: matchedCat?.image || "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1400&q=90",
  };

  const products = await getProducts({ category: slug });

  return (
    <div className="min-h-screen pb-20">
      {/* Category Hero Banner */}
      <div className="relative overflow-hidden bg-navy py-16 md:py-20 text-white">
        <div className="pointer-events-none absolute inset-0 pattern-navy-dots opacity-40" />
        <div className="container-shell relative z-10">
          <Link
            href="/shop"
            className="inline-flex items-center gap-1 text-xs font-bold text-orange hover:underline mb-4"
          >
            <ArrowLeft size={14} /> Back to Shop
          </Link>
          <h1 className="font-display text-4xl sm:text-5xl font-bold">{details.title}</h1>
          <p className="mt-3 max-w-xl text-sm sm:text-base text-white/75 leading-relaxed font-normal">
            {details.desc}
          </p>
        </div>
      </div>

      {/* Product Grid */}
      <div className="container-shell py-12">
        <div className="flex items-center justify-between border-b border-line pb-4 mb-8">
          <span className="text-xs font-extrabold uppercase tracking-wider text-navy">
            Showing {products.length} Products
          </span>
          <Link
            href={`/shop?category=${slug}`}
            className="text-xs font-bold text-orange hover:underline"
          >
            Apply Filters & Sorting →
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
