import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ChevronRight } from "lucide-react";
import { getProductBySlug, getRelatedProducts, getCategories } from "@/lib/storefront";
import { ProductDetailClient } from "@/components/storefront/product-detail-client";
import { ProductCard } from "@/components/storefront/product-card";
import {
  JsonLd,
  buildProductSchema,
  buildBreadcrumbSchema,
  SITE_URL,
} from "@/components/seo/json-ld";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const result = await getProductBySlug(slug);
  if (!result) {
    return {
      title: "Product Not Found",
      description: "The requested product was not found in our store catalog.",
    };
  }

  const p = result.product;
  const title = p.seoTitle || p.name;
  const description =
    p.seoDescription ||
    p.shortDescription ||
    (p.description ? p.description.slice(0, 160) : "") ||
    `Order ${p.name} online from Bake Bazaar Mart Karachi. Fresh quality, honest pricing, and fast local delivery in Karachi and nationwide across Pakistan.`;

  const primaryImage = p.image
    ? p.image.startsWith("http")
      ? p.image
      : `${SITE_URL}${p.image}`
    : `${SITE_URL}/logobake-01.png`;

  return {
    title,
    description,
    alternates: {
      canonical: `/products/${slug}`,
    },
    openGraph: {
      title: `${title} | Bake Bazaar Mart`,
      description,
      url: `${SITE_URL}/products/${slug}`,
      type: "website",
      images: [
        {
          url: primaryImage,
          width: 800,
          height: 800,
          alt: `${p.name} — Bake Bazaar Mart`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | Bake Bazaar Mart`,
      description,
      images: [primaryImage],
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
        <p className="mt-3 text-sm text-muted">
          This product is currently unavailable or has been moved.
        </p>
        <Link href="/shop" className="button-primary mt-6 inline-flex text-xs">
          Explore All Products
        </Link>
      </div>
    );
  }

  const { product, reviews, faqs } = result;

  // Resolve category slug for breadcrumbs
  const categories = await getCategories();
  const matchedCat = categories.find(
    (c) =>
      c.id === product.categoryId ||
      c.name.toLowerCase() === (product.category || "").toLowerCase()
  );
  const categorySlug = matchedCat?.slug || "bakery";
  const categoryName = product.category || matchedCat?.name || "Products";

  // Targeted related products
  const related = await getRelatedProducts(product.categoryId, product.id, 4);

  // Structured Data
  const productSchema = buildProductSchema(product, reviews);
  const breadcrumbItems = [
    { name: "Home", url: "/" },
    { name: "Shop", url: "/shop" },
    { name: categoryName, url: `/category/${categorySlug}` },
    { name: product.name, url: `/products/${product.slug}` },
  ];
  const breadcrumbSchema = buildBreadcrumbSchema(breadcrumbItems);

  return (
    <div className="container-shell py-6 md:py-10">
      <JsonLd data={productSchema} />
      <JsonLd data={breadcrumbSchema} />

      {/* Semantic Breadcrumbs */}
      <nav aria-label="Breadcrumbs" className="flex flex-wrap items-center gap-1.5 text-xs text-muted mb-6 font-medium">
        <Link href="/" className="hover:text-orange transition-colors">Home</Link>
        <ChevronRight size={13} className="text-line" />
        <Link href="/shop" className="hover:text-orange transition-colors">Shop</Link>
        <ChevronRight size={13} className="text-line" />
        <Link href={`/category/${categorySlug}`} className="hover:text-orange transition-colors">{categoryName}</Link>
        <ChevronRight size={13} className="text-line" />
        <span className="text-navy font-bold truncate max-w-[200px] sm:max-w-none">{product.name}</span>
      </nav>

      <ProductDetailClient product={product} reviews={reviews} faqs={faqs} />

      {related.length > 0 && (
        <section className="mt-16 md:mt-24 border-t border-line/60 pt-12">
          <p className="text-xs font-bold uppercase tracking-[.18em] text-orange">You may also like</p>
          <h2 className="mt-2 font-display text-2xl sm:text-3xl font-bold text-navy">Related Products</h2>
          <div className="mt-7 grid grid-cols-2 gap-x-3 gap-y-9 sm:grid-cols-4">
            {related.map((prod) => (
              <ProductCard key={prod.id} product={prod} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

// ISR: revalidate every 2 minutes
export const revalidate = 120;
