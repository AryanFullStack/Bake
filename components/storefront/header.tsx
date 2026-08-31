"use client";

import Link from "next/link";
import Image from "next/image";
import { Suspense, useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  Cake, ChevronDown, ChevronRight, Grid3x3, Heart, Home, Menu,
  PhoneCall, Search, ShoppingBag, ShoppingBasket, ShoppingCart, Sparkles,
  Truck, UserRound, UtensilsCrossed, Watch, X,
} from "lucide-react";
import { useCart } from "./cart-provider";

const navCategories = [
  {
    title: "Bakery",
    items: [
      { label: "Cakes & Pastries", href: "/shop?category=bakery" },
      { label: "Cupcakes & Desserts", href: "/shop?category=bakery&sub=desserts" },
    ],
  },
  {
    title: "Home Decoration",
    items: [
      { label: "Vases & Living Accents", href: "/shop?category=home-decor" },
    ],
  },
  {
    title: "Kitchen Essentials",
    items: [
      { label: "Utensils & Storage", href: "/shop?category=kitchen" },
    ],
  },
  {
    title: "Watches",
    items: [
      { label: "Classic & Modern Timepieces", href: "/shop?category=watches" },
    ],
  },
  {
    title: "Baskets & Storage",
    items: [
      { label: "Organisers & Baskets", href: "/shop?category=baskets" },
    ],
  },
  {
    title: "Daily Essentials",
    items: [
      { label: "Everyday Needs", href: "/shop?category=daily-essentials" },
    ],
  },
];

const navLinks = [
  { label: "Shop", href: "/shop" },
  { label: "Categories", href: "/shop", isDropdown: true },
  { label: "Bakery", href: "/shop?category=bakery" },
  { label: "Custom Cakes", href: "/custom-cake" },
  { label: "About", href: "/about" },
];

const mobileNavLinks = [
  { label: "Home",              href: "/" },
  { label: "Shop All",          href: "/shop" },
  { label: "Bakery",            href: "/shop?category=bakery" },
  { label: "Home Décor",        href: "/shop?category=home-decor" },
  { label: "Kitchen Items",     href: "/shop?category=kitchen" },
  { label: "Watches",           href: "/shop?category=watches" },
  { label: "Baskets & Storage", href: "/shop?category=baskets" },
  { label: "Daily Essentials",  href: "/shop?category=daily-essentials" },
  { label: "Custom Cake Studio",href: "/custom-cake" },
  { label: "About Us",          href: "/about" },
  { label: "FAQs",              href: "/faq" },
  { label: "Track Order",       href: "/track-order" },
  { label: "Contact Us",        href: "/contact" },
];

function HeaderNav({
  pathname,
  megaRef,
  megaOpen,
  setMegaOpen,
}: {
  pathname: string;
  megaRef: React.RefObject<HTMLDivElement | null>;
  megaOpen: boolean;
  setMegaOpen: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  const searchParams = useSearchParams();
  const categoryParam = searchParams.get("category");

  return (
    <nav className="ml-6 hidden items-center gap-1 lg:flex" aria-label="Primary navigation">
      {navLinks.map((link) => {
        if (link.isDropdown) {
          return (
            <div key={link.label} className="relative" ref={megaRef}>
              <button
                onClick={() => setMegaOpen((v) => !v)}
                className={`flex items-center gap-1 rounded-lg px-3 py-2 text-[13px] font-bold transition-colors ${
                  megaOpen ? "bg-orange-light text-orange" : "text-navy hover:bg-white hover:text-orange"
                }`}
              >
                {link.label}
                <ChevronDown size={14} className={`transition-transform ${megaOpen ? "rotate-180" : ""}`} />
              </button>

              {/* Categorized Mega Dropdown */}
              {megaOpen && (
                <div className="absolute left-1/2 top-full mt-2 z-[110] w-[540px] -translate-x-1/2 rounded-2xl border border-line bg-white p-4 shadow-xl animate-scale-in">
                  <div className="grid grid-cols-2 gap-4">
                    {navCategories.map((catGroup) => (
                      <div key={catGroup.title} className="space-y-1">
                        <p className="text-[11px] font-extrabold uppercase tracking-wider text-orange border-b border-line/60 pb-1 mb-1.5">
                          {catGroup.title}
                        </p>
                        {catGroup.items.map((item) => (
                          <Link
                            key={item.label}
                            href={item.href}
                            onClick={() => setMegaOpen(false)}
                            className="block rounded-lg px-2 py-1 text-[12px] font-bold text-navy hover:bg-orange-light hover:text-orange transition-colors"
                          >
                            {item.label}
                          </Link>
                        ))}
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 border-t border-line pt-2.5 px-1 flex items-center justify-between text-[12px] font-extrabold text-orange">
                    <span>Explore everything you need</span>
                    <Link
                      href="/shop"
                      onClick={() => setMegaOpen(false)}
                      className="flex items-center gap-1 hover:text-orange-dark"
                    >
                      Browse All Products <ChevronRight size={14} />
                    </Link>
                  </div>
                </div>
              )}
            </div>
          );
        }

        let active = false;
        if (link.href === "/") {
          active = pathname === "/";
        } else if (link.href === "/shop") {
          active = pathname === "/shop" && categoryParam !== "bakery";
        } else if (link.href.includes("?category=")) {
          const targetCategory = new URLSearchParams(link.href.split("?")[1]).get("category");
          active = pathname === "/shop" && categoryParam === targetCategory;
        } else {
          active = pathname.startsWith(link.href);
        }

        return (
          <Link
            key={link.label}
            href={link.href}
            className={`rounded-lg px-3.5 py-2 text-[13px] font-bold transition-colors ${
              active ? "bg-orange-light text-orange" : "text-navy hover:bg-white hover:text-orange"
            }`}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function Header() {
  const pathname = usePathname();
  const router   = useRouter();
  const { count } = useCart();
  const [menuOpen,   setMenuOpen]   = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [megaOpen,   setMegaOpen]   = useState(false);
  const [query,      setQuery]      = useState("");
  const [scrolled,   setScrolled]   = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const megaRef   = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (searchOpen) searchRef.current?.focus();
  }, [searchOpen]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (megaRef.current && !megaRef.current.contains(e.target as Node)) {
        setMegaOpen(false);
      }
    }
    if (megaOpen) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [megaOpen]);

  // Close mobile menu on navigation
  useEffect(() => setMenuOpen(false), [pathname]);

  if (pathname.startsWith("/admin")) return null;

  function submitSearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!query.trim()) return;
    router.push(`/shop?q=${encodeURIComponent(query.trim())}`);
    setSearchOpen(false);
    setQuery("");
  }

  return (
    <>
      {/* ── Announcement Bar ── */}
      <div className="bg-navy px-4 py-2 text-[11px] font-semibold text-white/80">
        <div className="container-shell flex items-center justify-between gap-2">
          <p className="flex items-center gap-1.5 truncate">
            <Sparkles size={13} className="shrink-0 text-orange" />
            <span className="truncate">Fresh Bakery · Quality Products · Delivery Across Lahore</span>
          </p>
          <div className="flex items-center gap-3 shrink-0 text-[10.5px]">
            <Link href="/track-order" className="flex items-center gap-1 hover:text-orange transition-colors">
              <Truck size={12} className="text-orange" /> <span className="hidden sm:inline">Track Order</span><span className="sm:hidden">Track</span>
            </Link>
            <span className="text-white/30">·</span>
            <a href="tel:03211234567" className="flex items-center gap-1 text-white hover:text-orange transition-colors font-bold">
              <PhoneCall size={11} className="text-orange hidden xs:inline" /> 0321-1234567
            </a>
          </div>
        </div>
      </div>

      {/* ── Main Header ── */}
      <header
        className={`sticky top-0 z-50 border-b border-line/70 transition-all ${
          scrolled ? "bg-cream/95 shadow-[0_8px_24px_rgba(6,33,54,.06)] backdrop-blur-md" : "bg-cream"
        }`}
      >
        <div className={`container-shell relative flex items-center gap-4 transition-all duration-300 ${scrolled ? "h-[64px]" : "h-[76px]"}`}>
          {/* Hamburger (mobile) */}
          <button
            onClick={() => setMenuOpen(true)}
            className="grid h-10 w-10 place-items-center rounded-lg border border-line bg-white text-navy md:hidden"
            aria-label="Open navigation"
          >
            <Menu size={19} />
          </button>

          {/* Logo */}
          <Link
            href="/"
            className="group flex shrink-0 items-center gap-2.5 transition-transform hover:scale-[1.01] max-md:absolute max-md:left-1/2 max-md:-translate-x-1/2"
          >
            <Image
              src="/logobake-01.png"
              alt="Bake Mart Bazaar"
              width={220}
              height={60}
              className="h-10 md:h-13 w-auto object-contain drop-shadow-xs"
              priority
            />
          </Link>

          {/* Desktop Nav */}
          <Suspense fallback={
            <nav className="ml-6 hidden items-center gap-1 lg:flex" aria-label="Primary navigation">
              {navLinks.map((link) => (
                <Link key={link.label} href={link.href} className="rounded-lg px-3.5 py-2 text-[13px] font-bold text-navy">
                  {link.label}
                </Link>
              ))}
            </nav>
          }>
            <HeaderNav pathname={pathname} megaRef={megaRef} megaOpen={megaOpen} setMegaOpen={setMegaOpen} />
          </Suspense>

          {/* Right icons */}
          <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
            <button
              onClick={() => setSearchOpen((v) => !v)}
              className="grid h-10 w-10 place-items-center rounded-lg border border-line bg-white text-navy transition-colors hover:border-orange hover:text-orange"
              aria-label="Search products"
            >
              <Search size={18} />
            </button>
            <Link href="/account/wishlist" className="hidden h-10 w-10 place-items-center rounded-lg border border-line bg-white text-navy transition-colors hover:border-orange hover:text-orange sm:grid" aria-label="Wishlist">
              <Heart size={18} />
            </Link>
            <Link href="/account" className="hidden h-10 w-10 place-items-center rounded-lg border border-line bg-white text-navy transition-colors hover:border-orange hover:text-orange sm:grid" aria-label="Account">
              <UserRound size={18} />
            </Link>
            <Link
              href="/cart"
              className="relative flex h-10 items-center gap-2 rounded-lg bg-orange px-3 text-sm font-extrabold text-white transition-colors hover:bg-orange-dark"
              aria-label="Shopping basket"
            >
              <ShoppingBag size={18} />
              <span className="hidden sm:inline">Basket</span>
              {count > 0 && (
                <span className="grid h-5 min-w-5 place-items-center rounded-full bg-white px-1 text-[10px] font-extrabold text-orange">
                  {count}
                </span>
              )}
            </Link>
          </div>
        </div>

        {/* Search bar */}
        {searchOpen && (
          <div className="border-t border-line bg-paper px-4 py-4">
            <form onSubmit={submitSearch} className="container-shell relative">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
              <input
                ref={searchRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search products — bakery, décor, kitchen, watches…"
                className="field-shell pl-10 pr-24"
              />
              <button
                type="submit"
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg bg-navy px-4 py-2 text-xs font-bold text-white hover:bg-navy-light"
              >
                Search
              </button>
            </form>
          </div>
        )}
      </header>

      {/* ── Mobile Drawer ── */}
      {menuOpen && (
        <div className="fixed inset-0 z-[200] md:hidden" role="dialog" aria-modal="true" aria-label="Mobile navigation">
          <button className="absolute inset-0 bg-navy/50" onClick={() => setMenuOpen(false)} aria-label="Close navigation overlay" />
          <div className="absolute inset-y-0 left-0 flex w-[min(88vw,360px)] flex-col bg-cream shadow-2xl animate-fade-in overflow-y-auto">
            <div className="flex items-center justify-between border-b border-line px-5 py-5 sticky top-0 bg-cream z-10">
              <Link href="/" className="flex items-center gap-2.5">
                <Image src="/logobake-01.png" alt="Bake Mart Bazaar" width={160} height={45} className="h-9 w-auto object-contain" />
              </Link>
              <button onClick={() => setMenuOpen(false)} className="grid h-9 w-9 place-items-center rounded-lg border border-line bg-white text-navy" aria-label="Close navigation">
                <X size={18} />
              </button>
            </div>

            <nav className="flex flex-1 flex-col gap-1 px-5 py-5" aria-label="Mobile navigation">
              <p className="eyebrow mb-2">Explore the Store</p>
              {mobileNavLinks.map((link) => (
                <Link
                  key={link.href + link.label}
                  href={link.href}
                  className="flex items-center justify-between border-b border-line/60 py-3.5 text-base font-bold text-navy hover:text-orange transition-colors"
                >
                  <span>{link.label}</span>
                  <ChevronRight size={17} className="text-orange" />
                </Link>
              ))}

              {/* Bakery Studio CTA */}
              <Link
                href="/custom-cake"
                className="mt-5 flex items-center gap-3 rounded-xl bg-navy p-4 text-white"
              >
                <span className="grid h-10 w-10 place-items-center rounded-lg bg-orange">
                  <Cake size={19} />
                </span>
                <span>
                  <span className="block text-sm font-bold">Custom Cake Studio</span>
                  <span className="mt-1 block text-xs text-white/65">Design your dream cake</span>
                </span>
              </Link>
            </nav>

            {/* Contact strip */}
            <div className="border-t border-line bg-cream-deep px-5 py-4 text-xs text-muted sticky bottom-0">
              <div className="flex items-center justify-between">
                <span>Need help?</span>
                <a className="font-bold text-navy hover:text-orange" href="tel:03211234567">0321-1234567</a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Mobile Bottom Bar ── */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-paper/95 px-4 py-2 shadow-[0_-8px_20px_rgba(6,33,54,.06)] backdrop-blur-md md:hidden">
        <div className="mx-auto flex max-w-md items-center justify-around text-[10px] font-extrabold text-navy">
          <Link href="/" className={`flex flex-col items-center gap-1 py-1 ${pathname === "/" ? "text-orange" : ""}`}>
            <Image src="/logomainficonocns-01.png" alt="Home" width={20} height={20} className="h-5 w-5 object-contain" />
            <span>Home</span>
          </Link>
          <Link href="/shop" className={`flex flex-col items-center gap-1 py-1 ${pathname.startsWith("/shop") ? "text-orange" : ""}`}>
            <Search size={17} />
            <span>Shop</span>
          </Link>
          <Link href="/shop" className={`flex flex-col items-center gap-1 py-1 ${pathname === "/categories" ? "text-orange" : ""}`}>
            <Grid3x3 size={17} />
            <span>Categories</span>
          </Link>
          <Link href="/cart" className={`relative flex flex-col items-center gap-1 py-1 ${pathname === "/cart" ? "text-orange" : ""}`}>
            <ShoppingBag size={17} />
            <span>Basket</span>
            {count > 0 && (
              <span className="absolute -right-2 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-orange px-1 text-[9px] text-white">
                {count}
              </span>
            )}
          </Link>
          <Link href="/account" className={`flex flex-col items-center gap-1 py-1 ${pathname.startsWith("/account") ? "text-orange" : ""}`}>
            <UserRound size={17} />
            <span>Account</span>
          </Link>
        </div>
      </div>
    </>
  );
}
