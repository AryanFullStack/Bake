"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  ChevronRight,
  LayoutDashboard,
  Package,
  Settings,
  ShoppingBag,
  Star,
  Store,
  Users,
  Cake,
} from "lucide-react";

const nav = [
  { label: "Overview", href: "/admin", icon: LayoutDashboard },
  { label: "Orders", href: "/admin/orders", icon: ShoppingBag },
  { label: "Products", href: "/admin/products", icon: Package },
  { label: "Custom Cakes", href: "/admin/custom-cakes", icon: Cake },
  { label: "Customers", href: "/admin/customers", icon: Users },
  { label: "Reviews", href: "/admin/reviews", icon: Star },
  { label: "Settings", href: "/admin/settings", icon: Settings },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="sticky top-0 flex h-screen w-[252px] flex-col border-r border-white/10 bg-navy p-6 text-white">
      {/* Logo */}
      <Link href="/admin" className="flex flex-col items-start gap-1">
        <div className="rounded-xl bg-white p-2 shadow-sm transition-transform hover:scale-[1.02]">
          <Image src="/logobake-01.png" alt="Bake Mart Bazaar" width={180} height={50} className="h-9 w-auto object-contain" />
        </div>
        <span className="mt-1 px-1 text-[9px] font-bold uppercase tracking-[.22em] text-orange/80">Operations studio</span>
      </Link>

      {/* Nav */}
      <div className="mt-12 mb-3 text-[10px] font-extrabold uppercase tracking-[.2em] text-white/35">Workspace</div>
      <nav className="flex flex-1 flex-col gap-1.5 text-sm">
        {nav.map(({ label, href, icon: Icon }) => {
          const active = pathname === href || (href !== "/admin" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 font-semibold transition-colors ${
                active
                  ? "bg-orange text-white shadow-lg shadow-orange/20"
                  : "text-white/60 hover:bg-white/10 hover:text-white"
              }`}
            >
              <Icon size={17} />
              {label}
              {active && <ChevronRight size={14} className="ml-auto" />}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="mt-auto border-t border-white/10 pt-4">
        <Link
          href="/"
          className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-xs font-semibold text-white/50 transition hover:text-white"
        >
          <Store size={15} />
          View Storefront
        </Link>
      </div>
    </aside>
  );
}
