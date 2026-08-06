"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Cake, ChevronRight, Heart, Menu, PhoneCall, Search, ShoppingBag, Sparkles, UserRound, X } from "lucide-react";
import { useCart } from "./cart-provider";

const navLinks = [
  { label: "Shop", href: "/shop" },
  { label: "Cakes", href: "/shop?category=cakes" },
  { label: "Custom cakes", href: "/custom-cake" },
  { label: "Our story", href: "/about" },
  { label: "Help", href: "/faq" },
];

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { count } = useCart();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [scrolled, setScrolled] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (searchOpen) searchRef.current?.focus();
  }, [searchOpen]);

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
      <div className="bg-navy px-4 py-2 text-[11px] font-semibold text-white/80">
        <div className="container-shell flex items-center justify-between gap-4">
          <p className="flex items-center gap-2 truncate"><Sparkles size={13} className="shrink-0 text-orange" /> Freshly baked in Lahore · Delivery across the city</p>
          <div className="hidden items-center gap-4 md:flex"><Link href="/track-order" className="hover:text-orange">Track an order</Link><a href="tel:03211234567" className="flex items-center gap-1.5 text-white hover:text-orange"><PhoneCall size={12} className="text-orange" /> 0321-1234567</a></div>
        </div>
      </div>

      <header className={`sticky top-0 z-40 border-b border-line/70 transition-all ${scrolled ? "bg-cream/95 shadow-[0_8px_24px_rgba(6,33,54,.06)] backdrop-blur-md" : "bg-cream"}`}>
        <div className="container-shell flex h-[76px] items-center gap-4">
          <button onClick={() => setMenuOpen(true)} className="grid h-10 w-10 place-items-center rounded-lg border border-line bg-white text-navy md:hidden" aria-label="Open navigation"><Menu size={19} /></button>

          <Link href="/" className="group flex shrink-0 items-center gap-2.5 transition-transform hover:scale-[1.01]">
            <Image
              src="/logobake-01.png"
              alt="Bake Mart Bazaar"
              width={220}
              height={60}
              className="h-11 md:h-13 w-auto object-contain drop-shadow-xs"
              priority
            />
          </Link>

          <nav className="ml-8 hidden items-center gap-1 lg:flex" aria-label="Primary navigation">
            {navLinks.map((link) => {
              const active = pathname === link.href || (link.href !== "/shop" && pathname.startsWith(link.href.split("?")[0]));
              return <Link key={link.label} href={link.href} className={`rounded-lg px-3 py-2 text-[13px] font-bold transition-colors ${active ? "bg-orange-light text-orange" : "text-navy hover:bg-white hover:text-orange"}`}>{link.label}{link.label === "Custom cakes" && <span className="ml-1.5 text-[9px] font-extrabold uppercase text-orange">Studio</span>}</Link>;
            })}
          </nav>

          <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
            <button onClick={() => setSearchOpen((value) => !value)} className="grid h-10 w-10 place-items-center rounded-lg border border-line bg-white text-navy transition-colors hover:border-orange hover:text-orange" aria-label="Search products"><Search size={18} /></button>
            <Link href="/account/wishlist" className="hidden h-10 w-10 place-items-center rounded-lg border border-line bg-white text-navy transition-colors hover:border-orange hover:text-orange sm:grid" aria-label="Wishlist"><Heart size={18} /></Link>
            <Link href="/account" className="hidden h-10 w-10 place-items-center rounded-lg border border-line bg-white text-navy transition-colors hover:border-orange hover:text-orange sm:grid" aria-label="Account"><UserRound size={18} /></Link>
            <Link href="/cart" className="relative flex h-10 items-center gap-2 rounded-lg bg-orange px-3 text-sm font-extrabold text-white transition-colors hover:bg-orange-dark" aria-label="Shopping basket"><ShoppingBag size={18} /><span className="hidden sm:inline">Basket</span>{count > 0 && <span className="grid h-5 min-w-5 place-items-center rounded-full bg-white px-1 text-[10px] font-extrabold text-orange">{count}</span>}</Link>
          </div>
        </div>

        {searchOpen && <div className="border-t border-line bg-paper px-4 py-4"><form onSubmit={submitSearch} className="container-shell relative"><Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" /><input ref={searchRef} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search cakes, pastries, brownies…" className="field-shell pl-10 pr-24" /><button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg bg-navy px-4 py-2 text-xs font-bold text-white hover:bg-navy-light">Search</button></form></div>}
      </header>

      {menuOpen && <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true" aria-label="Mobile navigation">
        <button className="absolute inset-0 bg-navy/50" onClick={() => setMenuOpen(false)} aria-label="Close navigation overlay" />
        <div className="absolute inset-y-0 left-0 flex w-[min(88vw,360px)] flex-col bg-cream shadow-2xl animate-fade-in">
          <div className="flex items-center justify-between border-b border-line px-5 py-5">
            <Link href="/" onClick={() => setMenuOpen(false)} className="flex items-center gap-2.5">
              <Image src="/logobake-01.png" alt="Bake Mart Bazaar" width={160} height={45} className="h-9 w-auto object-contain" />
            </Link>
            <button onClick={() => setMenuOpen(false)} className="grid h-9 w-9 place-items-center rounded-lg border border-line bg-white text-navy" aria-label="Close navigation"><X size={18} /></button>
          </div>
          <nav className="flex flex-1 flex-col gap-1 px-5 py-7" aria-label="Mobile navigation"><p className="eyebrow mb-3">Explore the bakery</p>{navLinks.concat([{ label: "Track an order", href: "/track-order" }, { label: "Contact us", href: "/contact" }]).map((link) => <Link key={link.label} href={link.href} onClick={() => setMenuOpen(false)} className="flex items-center justify-between border-b border-line/70 py-4 text-base font-bold text-navy"><span>{link.label}</span><ChevronRight size={17} className="text-orange" /></Link>)}<Link href="/custom-cake" onClick={() => setMenuOpen(false)} className="mt-7 flex items-center gap-3 rounded-xl bg-navy p-4 text-white"><span className="grid h-10 w-10 place-items-center rounded-lg bg-orange"><Cake size={19} /></span><span><span className="block text-sm font-bold">Have a cake in mind?</span><span className="mt-1 block text-xs text-white/65">Talk to our cake studio</span></span></Link></nav>
          <div className="border-t border-line bg-cream-deep px-5 py-4 text-xs text-muted">Need help? <a className="font-bold text-navy" href="tel:03211234567">0321-1234567</a></div>
        </div>
      </div>}

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-paper/95 px-4 py-2 shadow-[0_-8px_20px_rgba(6,33,54,.06)] backdrop-blur-md md:hidden">
        <div className="mx-auto flex max-w-md items-center justify-around text-[10px] font-extrabold text-navy">
          <Link href="/" className={`flex flex-col items-center gap-1 py-1 ${pathname === "/" ? "text-orange" : ""}`}>
            <Image src="/logomainficonocns-01.png" alt="Home" width={20} height={20} className="h-5 w-5 object-contain" />
            <span>Home</span>
          </Link>
          <Link href="/shop" className={`flex flex-col items-center gap-1 py-1 ${pathname.startsWith("/shop") ? "text-orange" : ""}`}><Search size={17} /><span>Shop</span></Link>
          <Link href="/custom-cake" className={`flex flex-col items-center gap-1 py-1 ${pathname.startsWith("/custom-cake") ? "text-orange" : ""}`}><Cake size={17} /><span>Custom</span></Link>
          <Link href="/cart" className={`relative flex flex-col items-center gap-1 py-1 ${pathname === "/cart" ? "text-orange" : ""}`}><ShoppingBag size={17} /><span>Basket</span>{count > 0 && <span className="absolute -right-2 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-orange px-1 text-[9px] text-white">{count}</span>}</Link>
          <Link href="/account" className={`flex flex-col items-center gap-1 py-1 ${pathname.startsWith("/account") ? "text-orange" : ""}`}><UserRound size={17} /><span>Account</span></Link>
        </div>
      </div>
    </>
  );
}
