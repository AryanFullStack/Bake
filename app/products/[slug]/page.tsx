import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getProductBySlug, getRelatedProducts } from "@/lib/storefront";
import { ProductDetailClient } from "@/components/storefront/product-detail-client";
import { ProductCard } from "@/components/storefront/product-card";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const result = await getProductBySlug(slug);
  if (!result) {
    return {
      title: "Product Not Found | Bake Bazaar Mart",
    };
  }

  const p = result.product;
  const title = `${p.name} | Bake Bazaar Mart`;
  const description =
    p.shortDescription ||
    p.description?.slice(0, 160) ||
    `Order ${p.name} online from Bake Bazaar Mart Karachi. Fast delivery across Karachi and shipping nationwide all over Pakistan.`;
  const images = p.imageUrls?.length ? [p.imageUrls[0]] : ["/brand/bakebazaar-logo.png"];

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images,
      type: "website",
    },
  };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const result = await getProductBySlug(slug);
  if (!result) {
    return (
      <div className="container-shell py-24 text-center">
        <h1 className="font-display text-4xl text-navy">Product not found</h1>
        <Link href="/shop" className="mt-5 inline-block text-sm font-bold text-orange">
          Back to shop
        </Link>
      </div>
    );
  }

  // Use targeted related products query — only fetches products in the same category,
  // excludes current product. Much faster than getProducts({limit:12}) + filter.
  const related = await getRelatedProducts(result.product.categoryId, result.product.id, 4);

  return (
    <div className="container-shell py-8 md:py-14">
      <Link href="/shop" className="inline-flex items-center gap-2 text-sm font-semibold text-muted hover:text-orange">
        <ArrowLeft size={16} /> Back to shop
      </Link>
      <ProductDetailClient product={result.product} reviews={result.reviews} faqs={result.faqs} />
      {related.length > 0 && (
        <section className="mt-20">
          <p className="text-xs font-bold uppercase tracking-[.18em] text-orange">You may also like</p>
          <h2 className="mt-2 font-display text-3xl font-bold text-navy">Related Products</h2>
          <div className="mt-7 grid grid-cols-2 gap-x-3 gap-y-9 sm:grid-cols-4">
            {related.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

// ISR: revalidate every 2 minutes — product data is fresh enough while eliminating
// the cost of 6 live Supabase queries per visitor.
export const revalidate = 120;
