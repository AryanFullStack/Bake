import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getProductBySlug, getProducts } from "@/lib/storefront";
import { ProductDetailClient } from "@/components/storefront/product-detail-client";
import { ProductCard } from "@/components/storefront/product-card";

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const result = await getProductBySlug(slug);
  if (!result) return <div className="container-shell py-24 text-center"><h1 className="font-display text-4xl text-navy">Bake not found</h1><Link href="/shop" className="mt-5 inline-block text-sm font-bold text-orange">Back to shop</Link></div>;
  const related = (await getProducts({ limit: 12 })).filter((product) => product.id !== result.product.id && product.category === result.product.category).slice(0, 4);
  return <div className="container-shell py-8 md:py-14"><Link href="/shop" className="inline-flex items-center gap-2 text-sm font-semibold text-muted hover:text-orange"><ArrowLeft size={16} /> Back to shop</Link><ProductDetailClient product={result.product} reviews={result.reviews} faqs={result.faqs} />{related.length > 0 && <section className="mt-20"><p className="text-xs font-bold uppercase tracking-[.18em] text-orange">You may also like</p><h2 className="mt-2 font-display text-3xl font-bold text-navy">More from the counter</h2><div className="mt-7 grid grid-cols-2 gap-x-3 gap-y-9 sm:grid-cols-4">{related.map((product) => <ProductCard key={product.id} product={product} />)}</div></section>}</div>;
}
export const dynamic = "force-dynamic";
