import React from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight, Award, Cake, CheckCircle2, Heart, Home, Mail,
  Package, ShieldCheck, ShoppingBag, ShoppingBasket, Star,
  Truck, UtensilsCrossed, Watch, Wheat, Sparkles,
} from "lucide-react";
import { getHomeContent } from "@/lib/storefront";
import { ProductCard } from "@/components/storefront/product-card";
import { MultiCategoryHero } from "@/components/storefront/multi-category-hero";
import { HomeKitchenShowcase } from "@/components/storefront/home-kitchen-showcase";
import { DealsCountdown } from "@/components/storefront/deals-countdown";
import type { Product } from "@/lib/types";

/* ── Fallback Multi-Category Products ────────────────────────── */
const MOCK_MOST_LOVED: Product[] = [
  {
    id: "mock-1",
    slug: "signature-chocolate-fudge-cake",
    sku: "BAK-001",
    name: "Signature Chocolate Fudge Cake",
    description: "Rich layered chocolate sponge with Belgian fudge icing.",
    price: 2400,
    salePrice: 2100,
    stock: 12,
    isPublished: true,
    featured: true,
    bestseller: true,
    category: "Bakery",
    categoryId: "bakery",
    image: "/cake.jpg",
    images: ["/cake.jpg"],
    productType: "simple",
    rating: 5.0,
    reviews: 28,
  },
  {
    id: "mock-2",
    slug: "nordic-ceramic-flower-vase",
    sku: "HOM-001",
    name: "Nordic Ceramic Flower Vase",
    description: "Minimalist ceramic accent vase for living rooms.",
    price: 1800,
    salePrice: null,
    stock: 8,
    isPublished: true,
    featured: true,
    bestseller: true,
    category: "Home Decoration",
    categoryId: "home-decor",
    image: "/homeItems.jfif",
    images: ["/homeItems.jfif"],
    productType: "simple",
    rating: 4.9,
    reviews: 14,
  },
  {
    id: "mock-3",
    slug: "bamboo-kitchen-utensil-set",
    sku: "KIT-001",
    name: "Bamboo Cooking Utensil & Holder Set",
    description: "Eco-friendly 6-piece bamboo spoon set with counter stand.",
    price: 1550,
    salePrice: 1290,
    stock: 15,
    isPublished: true,
    featured: true,
    bestseller: false,
    category: "Kitchen Essentials",
    categoryId: "kitchen",
    image: "/kicthens.jpg",
    images: ["/kicthens.jpg"],
    productType: "simple",
    rating: 4.8,
    reviews: 19,
  },
  {
    id: "mock-4",
    slug: "classic-leather-chronograph-watch",
    sku: "WAT-001",
    name: "Classic Leather Chronograph Watch",
    description: "Elegant quartz timepiece with genuine brown leather strap.",
    price: 4500,
    salePrice: 3800,
    stock: 5,
    isPublished: true,
    featured: true,
    bestseller: true,
    category: "Watches",
    categoryId: "watches",
    image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80",
    images: ["https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80"],
    productType: "simple",
    rating: 5.0,
    reviews: 22,
  },
  {
    id: "mock-5",
    slug: "woven-cotton-rope-storage-basket",
    sku: "BAS-001",
    name: "Woven Cotton Rope Storage Basket",
    description: "Multi-purpose laundry and toy organiser basket with handles.",
    price: 2200,
    salePrice: null,
    stock: 9,
    isPublished: true,
    featured: true,
    bestseller: false,
    category: "Baskets & Storage",
    categoryId: "baskets",
    image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=800&q=80",
    images: ["https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=800&q=80"],
    productType: "simple",
    rating: 4.7,
    reviews: 11,
  },
  {
    id: "mock-6",
    slug: "artisan-fresh-butter-croissants",
    sku: "BAK-002",
    name: "Artisan Butter Croissants (Pack of 4)",
    description: "Golden flaky French pastries baked fresh daily.",
    price: 950,
    salePrice: 820,
    stock: 20,
    isPublished: true,
    featured: true,
    bestseller: true,
    category: "Bakery",
    categoryId: "bakery",
    image: "/cakechake.jpg",
    images: ["/cakechake.jpg"],
    productType: "simple",
    rating: 4.9,
    reviews: 35,
  },
];

const MOCK_NEW_ARRIVALS: Product[] = [
  {
    id: "mock-new-1",
    slug: "modern-amber-glass-table-lamp",
    sku: "HOM-002",
    name: "Modern Amber Glass Table Lamp",
    description: "Warm glowing bedside table lamp with brass base.",
    price: 3600,
    salePrice: null,
    stock: 6,
    isPublished: true,
    featured: true,
    bestseller: false,
    category: "Home Decoration",
    categoryId: "home-decor",
    image: "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=800&q=80",
    images: ["https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=800&q=80"],
    productType: "simple",
    rating: 5.0,
    reviews: 6,
  },
  {
    id: "mock-new-2",
    slug: "airtight-glass-food-storage-containers",
    sku: "KIT-002",
    name: "Airtight Glass Food Storage Jars (Set of 3)",
    description: "Bamboo lid borosilicate glass canister set.",
    price: 2800,
    salePrice: 2400,
    stock: 10,
    isPublished: true,
    featured: true,
    bestseller: false,
    category: "Kitchen Essentials",
    categoryId: "kitchen",
    image: "https://images.unsplash.com/photo-1610557892470-55d9e80c0bce?auto=format&fit=crop&w=800&q=80",
    images: ["https://images.unsplash.com/photo-1610557892470-55d9e80c0bce?auto=format&fit=crop&w=800&q=80"],
    productType: "simple",
    rating: 4.8,
    reviews: 8,
  },
  {
    id: "mock-new-3",
    slug: "minimalist-silver-mesh-watch",
    sku: "WAT-002",
    name: "Minimalist Silver Mesh Watch",
    description: "Ultra-thin stainless steel mesh watch.",
    price: 4900,
    salePrice: null,
    stock: 4,
    isPublished: true,
    featured: true,
    bestseller: false,
    category: "Watches",
    categoryId: "watches",
    image: "https://images.unsplash.com/photo-1524805444758-089113d48a6d?auto=format&fit=crop&w=800&q=80",
    images: ["https://images.unsplash.com/photo-1524805444758-089113d48a6d?auto=format&fit=crop&w=800&q=80"],
    productType: "simple",
    rating: 4.9,
    reviews: 5,
  },
  {
    id: "mock-new-4",
    slug: "red-velvet-cream-cheese-cupcakes",
    sku: "BAK-003",
    name: "Red Velvet Cream Cheese Cupcakes (Box of 6)",
    description: "Moist red velvet sponge topped with cream cheese frosting.",
    price: 1400,
    salePrice: 1250,
    stock: 18,
    isPublished: true,
    featured: true,
    bestseller: false,
    category: "Bakery",
    categoryId: "bakery",
    image: "https://images.unsplash.com/photo-1550617931-e17a7b70dce2?auto=format&fit=crop&w=800&q=80",
    images: ["https://images.unsplash.com/photo-1550617931-e17a7b70dce2?auto=format&fit=crop&w=800&q=80"],
    productType: "simple",
    rating: 5.0,
    reviews: 16,
  },
];

/* ── Category Data ─────────────────────────────────────────── */
const SHOP_BY_CATEGORIES = [
  {
    slug: "bakery",
    name: "Bakery",
    description: "Fresh cakes & pastries",
    image: "/cake.jpg",
    href: "/shop?category=bakery",
    icon: Cake,
  },
  {
    slug: "home-decor",
    name: "Home Decoration",
    description: "Vases & accents",
    image: "/homeItems.jfif",
    href: "/shop?category=home-decor",
    icon: Home,
  },
  {
    slug: "kitchen",
    name: "Kitchen Essentials",
    description: "Utensils & storage",
    image: "/kicthens.jpg",
    href: "/shop?category=kitchen",
    icon: UtensilsCrossed,
  },
  {
    slug: "watches",
    name: "Watches",
    description: "Classic timepieces",
    image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=600&q=80",
    href: "/shop?category=watches",
    icon: Watch,
  },
  {
    slug: "baskets",
    name: "Baskets & Storage",
    description: "Organise beautifully",
    image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=600&q=80",
    href: "/shop?category=baskets",
    icon: ShoppingBasket,
  },
  {
    slug: "daily-essentials",
    name: "Daily Essentials",
    description: "Everyday needs",
    image: "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&q=80",
    href: "/shop?category=daily-essentials",
    icon: Wheat,
  },
];

const FEATURED_SHOWCASE_CARDS = [
  {
    category: "Fresh Bakery",
    subtitle: "Cakes & Pastries",
    image: "/cakechake.jpg",
    href: "/shop?category=bakery",
    accentTag: "text-orange",
  },
  {
    category: "Home Décor",
    subtitle: "Vases & Living",
    image: "/homeItems.jfif",
    href: "/shop?category=home-decor",
    accentTag: "text-green",
  },
  {
    category: "Kitchen",
    subtitle: "Essentials & Storage",
    image: "/kicthens.jpg",
    href: "/shop?category=kitchen",
    accentTag: "text-blue-400",
  },
  {
    category: "Watches",
    subtitle: "Classic & Modern",
    image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80",
    href: "/shop?category=watches",
    accentTag: "text-purple-300",
  },
];

/* ── Stars helper ─────────────────────────────────────────── */
function Stars({ rating = 5 }: { rating?: number }) {
  return (
    <div className="flex gap-0.5 text-orange">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} size={13} className={i < Math.round(rating) ? "fill-current" : "fill-none"} />
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════ */

export default async function HomePage() {
  const { categories, featured, bestsellers, reviews } = await getHomeContent();

  // Smart non-repeating product selection logic
  const allDbProducts = [...bestsellers, ...featured];
  const mostLoved: Product[] = (allDbProducts.length >= 6
    ? allDbProducts.slice(0, 6)
    : [...allDbProducts, ...MOCK_MOST_LOVED.filter(m => !allDbProducts.some(p => p.id === m.id))]
  ).slice(0, 6);

  const mostLovedIds = new Set(mostLoved.map((p) => p.id));
  
  const dealProducts: Product[] = allDbProducts
    .filter((p) => p.salePrice && !mostLovedIds.has(p.id))
    .slice(0, 4);

  // If deal products from DB is less than 4, fill with mock deals
  const dealIds = new Set(dealProducts.map(p => p.id));
  if (dealProducts.length < 4) {
    for (const mockItem of MOCK_MOST_LOVED) {
      if (!mostLovedIds.has(mockItem.id) && !dealIds.has(mockItem.id) && mockItem.salePrice) {
        dealProducts.push(mockItem);
        dealIds.add(mockItem.id);
        if (dealProducts.length >= 4) break;
      }
    }
  }

  const newArrivals: Product[] = allDbProducts
    .filter((p) => !mostLovedIds.has(p.id) && !dealIds.has(p.id))
    .slice(0, 4);

  if (newArrivals.length < 4) {
    for (const mockNew of MOCK_NEW_ARRIVALS) {
      if (!mostLovedIds.has(mockNew.id) && !dealIds.has(mockNew.id)) {
        newArrivals.push(mockNew);
        if (newArrivals.length >= 4) break;
      }
    }
  }

  return (
    <div className="overflow-x-clip">

      {/* ── 3. Hero Section — Most Important ────────────────────── */}
      <MultiCategoryHero />

      {/* ── 4. Shop by Category (Horizontal Scroll on Mobile) ────── */}
      <section id="categories" className="container-shell py-12 md:py-20">
        <div className="flex flex-col justify-between gap-3 md:flex-row md:items-end mb-8">
          <div>
            <p className="eyebrow text-orange">Shop What You Need</p>
            <h2 className="section-heading mt-1.5">
              Explore everyday essentials,<br className="hidden sm:block" />
              treats and home favourites.
            </h2>
          </div>
          <Link
            href="/shop"
            className="inline-flex items-center gap-2 text-xs sm:text-sm font-extrabold text-navy hover:text-orange transition-colors group shrink-0"
          >
            Browse everything <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        {/* Mobile horizontal scroll container / Desktop grid */}
        <div className="flex gap-4 overflow-x-auto pb-4 pt-1 sm:grid sm:grid-cols-3 lg:grid-cols-6 scrollbar-thin">
          {SHOP_BY_CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            return (
              <Link
                key={cat.slug}
                href={cat.href}
                className="group shrink-0 w-[165px] sm:w-auto rounded-2xl border border-line bg-white p-3 text-center shadow-xs transition-all duration-300 hover:-translate-y-1 hover:border-orange/30 hover:shadow-md flex flex-col items-center justify-between"
              >
                <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-cream-deep">
                  <Image
                    src={cat.image}
                    alt={cat.name}
                    fill
                    sizes="(max-width: 640px) 165px, (max-width: 1024px) 33vw, 18vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute top-2.5 left-2.5 grid h-7 w-7 place-items-center rounded-lg bg-white/90 shadow-xs backdrop-blur-xs">
                    <Icon size={14} className="text-navy" />
                  </div>
                </div>
                <div className="mt-3">
                  <h3 className="text-xs font-extrabold text-navy group-hover:text-orange transition-colors truncate">
                    {cat.name}
                  </h3>
                  <p className="mt-0.5 text-[10.5px] text-muted truncate">{cat.description}</p>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* ── 5. Featured Category Showcase (4-Card Visual Strip) ───── */}
      <section className="container-shell pb-14 md:pb-20">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {FEATURED_SHOWCASE_CARDS.map((card) => (
            <Link
              key={card.category}
              href={card.href}
              className="group relative aspect-[1.25] sm:aspect-[1.1] overflow-hidden rounded-3xl border border-line bg-white shadow-xs transition-all duration-500 hover:-translate-y-1 hover:shadow-lg"
            >
              <Image
                src={card.image}
                alt={card.category}
                fill
                sizes="(max-width: 640px) 100vw, 25vw"
                className="object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-navy/85 via-navy/30 to-transparent" />
              <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between">
                <div>
                  <span className={`text-[10px] font-extrabold uppercase tracking-widest ${card.accentTag}`}>
                    {card.category}
                  </span>
                  <h3 className="text-sm sm:text-base font-bold text-white mt-0.5">{card.subtitle}</h3>
                </div>
                <span className="grid h-8 w-8 place-items-center rounded-full bg-white/20 text-white backdrop-blur-xs group-hover:bg-orange group-hover:text-white transition-all">
                  <ArrowRight size={14} />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ── 6. Bakery + Custom Cake Studio Signature Split Layout ─── */}
      <section className="relative overflow-hidden bg-navy text-white py-16 md:py-24">
        {/* Organic curved shape backdrop */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-20 top-0 h-[450px] w-[450px] rounded-full bg-orange/15 blur-3xl" />
          <div className="absolute -right-20 bottom-0 h-[450px] w-[450px] rounded-full bg-green/15 blur-3xl" />
        </div>

        <div className="container-shell relative z-10">
          <div className="grid gap-8 lg:grid-cols-2 lg:gap-10 items-stretch">
            
            {/* Left — Bakery Card with Image */}
            <div className="flex flex-col justify-between rounded-3xl border border-white/15 bg-white/5 p-6 sm:p-8 backdrop-blur-md overflow-hidden shadow-xl hover:border-white/25 transition-all">
              <div>
                {/* Bakery Image Banner */}
                <div className="relative aspect-[1.6] w-full overflow-hidden rounded-2xl mb-6 shadow-md">
                  <Image
                    src="/cake.jpg"
                    alt="Freshly baked cakes and pastries"
                    fill
                    sizes="(max-width: 768px) 100vw, 50vw"
                    className="object-cover transition-transform duration-700 hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-navy/80 via-transparent to-transparent" />
                  <span className="absolute bottom-3 left-3 inline-flex items-center gap-1.5 rounded-full border border-white/25 bg-navy/85 px-3 py-1 text-[11px] font-bold text-white backdrop-blur-xs">
                    <Cake size={13} className="text-orange" /> Small Batch Baking
                  </span>
                </div>

                <span className="eyebrow text-orange">Fresh Bakery</span>
                <h2 className="mt-2 font-display text-2xl sm:text-3xl font-bold leading-tight">
                  Freshly Baked Daily.
                </h2>
                <p className="mt-3 text-xs sm:text-sm leading-relaxed text-white/75">
                  Fresh cakes, pastries, cupcakes and desserts prepared in small batches.
                </p>

                {/* Highlights */}
                <div className="mt-5 space-y-2">
                  {[
                    "Fresh Daily prepared in small batches",
                    "Small Batch Baking with honest ingredients",
                    "Real Butter & rich Pakistani flavours",
                  ].map((item) => (
                    <div key={item} className="flex items-center gap-2 text-xs font-semibold text-white/85">
                      <CheckCircle2 size={15} className="text-green shrink-0" />
                      {item}
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-8 pt-4 border-t border-white/10">
                <Link href="/shop?category=bakery" className="button-primary text-xs sm:text-sm px-6 w-full justify-center">
                  Shop Fresh Bakery <ArrowRight size={15} />
                </Link>
              </div>
            </div>

            {/* Right — Custom Cake Studio Card with Image */}
            <div className="flex flex-col justify-between rounded-3xl border border-orange/30 bg-orange/10 p-6 sm:p-8 backdrop-blur-md overflow-hidden shadow-xl hover:border-orange/50 transition-all">
              <div>
                {/* Custom Cake Image Banner */}
                <div className="relative aspect-[1.6] w-full overflow-hidden rounded-2xl mb-6 shadow-md">
                  <Image
                    src="/custoemcake2.png"
                    alt="Custom celebration cake finished in frosting"
                    fill
                    sizes="(max-width: 768px) 100vw, 50vw"
                    className="object-cover transition-transform duration-700 hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-navy/80 via-transparent to-transparent" />
                  <span className="absolute bottom-3 left-3 inline-flex items-center gap-1.5 rounded-full border border-orange/40 bg-orange/90 px-3 py-1 text-[11px] font-bold text-white backdrop-blur-xs">
                    <Sparkles size={13} /> Custom Decorator Studio
                  </span>
                </div>

                <span className="eyebrow text-white">Custom Cake Studio</span>
                <h2 className="mt-2 font-display text-2xl sm:text-3xl font-bold leading-tight text-orange">
                  Finished in Frosting.
                </h2>
                <p className="mt-3 text-xs sm:text-sm leading-relaxed text-white/75">
                  Tell us your celebration idea and our cake decorators will bring it to life.
                </p>

                {/* Highlights */}
                <div className="mt-5 space-y-2">
                  {[
                    "Made to Order for birthdays & events",
                    "Custom Designs tailored to your vision",
                    "Reference Image Upload for exact details",
                    "Custom Delivery Date scheduled for your party",
                  ].map((item) => (
                    <div key={item} className="flex items-center gap-2 text-xs font-semibold text-white/85">
                      <CheckCircle2 size={15} className="text-orange shrink-0" />
                      {item}
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-8 pt-4 border-t border-orange/20 flex flex-wrap items-center gap-3">
                <Link href="/custom-cake" className="button-primary text-xs sm:text-sm px-5 flex-1 justify-center">
                  Custom Cake Studio
                </Link>
                <Link
                  href="/track-custom-cake"
                  className="button-secondary border-white/30 bg-white/10 text-white hover:bg-white hover:text-navy text-xs sm:text-sm px-4"
                >
                  Track Cake Order
                </Link>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── 7. Most Loved This Week (Max 6 products) ─────────────── */}
      <section className="container-shell py-16 md:py-20">
        <div className="flex flex-col justify-between gap-3 md:flex-row md:items-end mb-10">
          <div>
            <p className="eyebrow text-orange">Most Loved This Week</p>
            <h2 className="section-heading mt-1.5">
              Products Our Customers<br />Keep Coming Back For.
            </h2>
          </div>
          <Link
            href="/shop"
            className="inline-flex items-center gap-2 text-xs sm:text-sm font-extrabold text-navy hover:text-orange transition-colors group shrink-0"
          >
            Shop All <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-3 xl:grid-cols-6">
          {mostLoved.map((product, i) => (
            <div key={product.id} className="animate-slide-up" style={{ animationDelay: `${i * 0.06}s` }}>
              <ProductCard product={product} />
            </div>
          ))}
        </div>
      </section>

      {/* ── 8. Limited-Time Deals ─────────────────────────────────── */}
      <section className="relative overflow-hidden bg-navy text-white py-16 md:py-20">
        {/* Poster inspired background glow */}
        <div className="pointer-events-none absolute inset-0">
          <div
            className="absolute right-0 top-0 h-[450px] w-[450px] rounded-full opacity-30"
            style={{ background: "radial-gradient(circle, #fd7600 0%, transparent 70%)" }}
          />
        </div>

        <div className="container-shell relative z-10">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end mb-10">
            <div>
              <span className="deal-badge mb-3 inline-block">🔥 Today's Best Deals</span>
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-white">
                Hand-picked offers — refreshed regularly.
              </h2>
            </div>
            <DealsCountdown />
          </div>

          <div className="grid grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-4">
            {dealProducts.map((product, i) => (
              <div key={product.id} className="animate-slide-up" style={{ animationDelay: `${i * 0.08}s` }}>
                <ProductCard product={product} />
              </div>
            ))}
          </div>

          <div className="mt-10 text-center">
            <Link
              href="/shop?sale=1"
              className="button-secondary border-white/30 bg-white/10 text-white hover:bg-white hover:text-navy inline-flex items-center gap-2 text-xs sm:text-sm px-6 py-3"
            >
              View All Deals <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </section>

      {/* ── 9. Home & Living (Make Your Space Better) ─────────────── */}
      <HomeKitchenShowcase />

      {/* ── 10. New Arrivals (Short 4-product section) ──────────────── */}
      <section className="container-shell py-16 md:py-20 border-t border-line/60">
        <div className="flex flex-col justify-between gap-3 md:flex-row md:items-end mb-10">
          <div>
            <p className="eyebrow text-orange">Just Dropped</p>
            <h2 className="section-heading mt-1.5">New Arrivals</h2>
            <p className="mt-1 text-xs sm:text-sm text-muted">Fresh products added to Bake Mart Bazaar.</p>
          </div>
          <Link
            href="/shop?sort=newest"
            className="inline-flex items-center gap-2 text-xs sm:text-sm font-extrabold text-navy hover:text-orange transition-colors group shrink-0"
          >
            View All New Arrivals <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-4">
          {newArrivals.map((product, i) => (
            <div key={product.id} className="animate-fade-in" style={{ animationDelay: `${i * 0.07}s` }}>
              <ProductCard product={product} />
            </div>
          ))}
        </div>
      </section>

      {/* ── 11. Why Bake Mart Bazaar? (4 Trust Pillars) ────────────── */}
      <section className="container-shell py-16 md:py-20 bg-paper/60 rounded-3xl my-8">
        <div className="text-center mb-12">
          <p className="eyebrow text-orange">Why Choose Us</p>
          <h2 className="section-heading mt-1.5">Why Bake Mart Bazaar?</h2>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              icon: Award,
              title: "Quality Products",
              copy: "Carefully selected for everyday needs.",
            },
            {
              icon: Cake,
              title: "Fresh Bakery",
              copy: "Freshly prepared with quality ingredients.",
            },
            {
              icon: Package,
              title: "Great Prices",
              copy: "Quality products at competitive prices.",
            },
            {
              icon: Truck,
              title: "Fast Delivery",
              copy: "Safe delivery across Lahore.",
            },
          ].map(({ icon: Icon, title, copy }) => (
            <div
              key={title}
              className="flex flex-col items-center text-center gap-4 p-6 rounded-2xl bg-white border border-line/70 shadow-xs hover:shadow-md hover:-translate-y-1 transition-all"
            >
              <div className="feature-icon-ring">
                <Icon size={24} />
              </div>
              <div>
                <h3 className="font-display text-base font-bold text-navy">{title}</h3>
                <p className="mt-1.5 text-xs text-muted leading-relaxed">{copy}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── 12. Trust Statistics Strip ─────────────────────────────── */}
      <section className="bg-navy py-12 text-white">
        <div className="container-shell grid grid-cols-2 gap-4 md:grid-cols-4">
          {[
            { stat: "700+", label: "Products" },
            { stat: "5,000+", label: "Happy Customers" },
            { stat: "4.9★", label: "Average Rating" },
            { stat: "Lahore", label: "Same-Day Delivery" },
          ].map(({ stat, label }) => (
            <div key={label} className="text-center p-4">
              <p className="font-display text-3xl sm:text-4xl font-black text-orange">{stat}</p>
              <p className="mt-1 text-[11px] font-semibold text-white/60 uppercase tracking-wider">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── 13. Customer Reviews (Max 3 review cards) ─────────────── */}
      <section className="container-shell py-16 md:py-24">
        <div className="mx-auto max-w-2xl text-center mb-10">
          <p className="eyebrow text-orange">Customer Reviews</p>
          <h2 className="section-heading mt-1.5">Loved by Families Across Lahore</h2>
          <div className="mt-3 flex items-center justify-center gap-1 text-orange">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} size={16} fill="currentColor" />
            ))}
            <span className="ml-2 text-xs font-bold text-navy">4.9 average rating</span>
          </div>
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          {(reviews.length ? reviews.slice(0, 3) : [
            { name: "Fatima Malik", body: "Amazing chocolate cake — everyone at the party loved it! Delivery was on time.", rating: 5, product: "Signature Chocolate Cake" },
            { name: "Ahmed Raza", body: "The kitchen storage set is exactly what I needed. Great quality at a fair price.", rating: 5, product: "Premium Kitchen Storage Set" },
            { name: "Sara Hussain", body: "Ordered the decorative vase and it looks stunning in my living room. Bake Mart really has everything!", rating: 5, product: "Decorative Home Vase" },
          ]).map((review: any, i: number) => {
            const name = review.profiles?.full_name ?? review.name ?? "Verified Customer";
            const body = review.body;
            const product = review.products?.name ?? review.product ?? "Bake Mart Product";
            const rating = review.rating ?? 5;
            return (
              <article key={name + i} className="card p-6 flex flex-col justify-between hover:-translate-y-1 transition-transform">
                <div>
                  <Stars rating={rating} />
                  <p className="mt-3 text-sm leading-relaxed text-navy font-medium">"{body}"</p>
                </div>
                <div className="mt-6 border-t border-line/60 pt-4">
                  <p className="text-[11px] font-bold text-orange truncate">Purchased: {product}</p>
                  <div className="mt-3 flex items-center gap-2.5">
                    <div className="grid h-8 w-8 place-items-center rounded-full bg-navy text-xs font-bold text-white shrink-0">
                      {name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-xs font-extrabold text-navy">{name}</p>
                      <p className="text-[10px] text-green font-bold flex items-center gap-1">
                        <CheckCircle2 size={11} /> Verified Purchase
                      </p>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* ── 14. More Than a Bakery (Brand Story) ─────────────────── */}
      <section className="py-16 md:py-24 bg-cream-deep/60">
        <div className="container-shell">
          <div className="grid items-center gap-10 md:grid-cols-2 lg:gap-16">
            {/* Image */}
            <div className="relative aspect-[1.15] overflow-hidden rounded-[28px] shadow-lg">
              <Image
                src="/cakechake.jpg"
                alt="Bake Mart Bazaar — More than a bakery"
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover"
              />
            </div>

            {/* Content */}
            <div>
              <p className="eyebrow text-orange">Our Story</p>
              <h2 className="section-heading mt-2">More Than a Bakery.</h2>
              <p className="mt-4 text-sm sm:text-base leading-relaxed text-muted font-normal">
                Bake Mart Bazaar brings bakery favourites, home décor, kitchen essentials, watches, baskets, daily-use products and more together in one convenient online store.
              </p>
              <p className="mt-3 text-sm sm:text-base leading-relaxed text-muted font-normal">
                One store for celebrations, everyday needs and everything in between.
              </p>

              <div className="mt-8">
                <Link href="/about" className="button-primary text-xs sm:text-sm px-6">
                  Discover Our Story <ArrowRight size={15} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 15. Newsletter (Simple Subscription) ──────────────────── */}
      <section className="bg-navy py-14 text-white">
        <div className="container-shell">
          <div className="mx-auto max-w-xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-bold text-white/90 mb-4">
              <Mail size={13} className="text-orange" /> Stay connected
            </span>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-white">
              Stay in the Loop
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-white/70">
              New products, seasonal offers & exclusive deals.
            </p>

            <form className="mt-6 mx-auto flex max-w-md flex-col gap-2.5 sm:flex-row">
              <input
                required
                type="email"
                placeholder="Your email address"
                id="newsletter-email"
                className="min-w-0 flex-1 rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-xs text-white outline-none placeholder:text-white/40 focus:border-orange transition-colors"
              />
              <button
                type="submit"
                className="button-primary shrink-0 text-xs py-2.5 px-6"
              >
                Subscribe <ArrowRight size={14} />
              </button>
            </form>
          </div>
        </div>
      </section>

    </div>
  );
}

export const dynamic = "force-dynamic";
