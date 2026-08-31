"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  BarChart3, Cake, ChevronRight, ExternalLink,
  FolderTree, Images, LayoutDashboard, LogOut,
  Package, Settings, ShoppingBag, Star, Tag, Users,
} from "lucide-react";

const navGroups = [
  {
    label: "Main",
    items: [
      { label: "Dashboard", href: "/admin", icon: LayoutDashboard, exact: true },
      { label: "Orders", href: "/admin/orders", icon: ShoppingBag },
      { label: "Reports", href: "/admin/reports", icon: BarChart3 },
    ],
  },
  {
    label: "Catalog",
    items: [
      { label: "Products", href: "/admin/products", icon: Package },
      { label: "Deals & Promotions", href: "/admin/products?filter=deals", icon: Tag },
      { label: "Categories", href: "/admin/categories", icon: FolderTree },
      { label: "Media Library", href: "/admin/media", icon: Images },
    ],
  },
  {
    label: "Customers",
    items: [
      { label: "Customers", href: "/admin/customers", icon: Users },
      { label: "Reviews", href: "/admin/reviews", icon: Star },
      { label: "Custom Cakes", href: "/admin/custom-cakes", icon: Cake },
    ],
  },
  {
    label: "System",
    items: [
      { label: "Settings", href: "/admin/settings", icon: Settings },
    ],
  },
];

export function AdminSidebar() {
  const pathname = usePathname();

  function isActive(href: string, exact = false) {
    return exact ? pathname === href : (pathname === href || (href !== "/admin" && pathname.startsWith(href)));
  }

  return (
    <aside
      className="sticky top-0 flex h-screen w-[252px] flex-col overflow-y-auto overflow-x-hidden border-r border-white/[.07] text-white"
      style={{ background: "var(--admin-sidebar)" }}
    >
      {/* ── Logo ────────────────────────────────────── */}
      <div className="px-5 pt-6 pb-4 border-b border-white/[.07]">
        <Link href="/admin" className="flex items-center gap-3">
          <div className="rounded-xl bg-white px-2 py-1.5 shadow-sm">
            <Image src="/logobake-01.png" alt="Bake Mart Bazaar" width={120} height={36} className="h-8 w-auto object-contain" />
          </div>
        </Link>
        <div className="mt-3 flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-green/20 border border-green/25 px-2.5 py-1 text-[10px] font-bold text-green">
            <span className="h-1.5 w-1.5 rounded-full bg-green animate-pulse inline-block" /> Live
          </span>
          <span className="text-[10px] font-bold uppercase tracking-widest text-white/30">Operations</span>
        </div>
      </div>

      {/* ── Nav ─────────────────────────────────────── */}
      <nav className="flex flex-1 flex-col gap-6 px-3 py-5">
        {navGroups.map(group => (
          <div key={group.label}>
            <p className="mb-2 px-3 text-[9.5px] font-extrabold uppercase tracking-[.2em] text-white/25">
              {group.label}
            </p>
            <div className="flex flex-col gap-0.5">
              {group.items.map(({ label, href, icon: Icon, exact }) => {
                const active = isActive(href, exact);
                return (
                  <Link
                    key={href}
                    href={href}
                    className={`group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-semibold transition-all duration-200 ${
                      active
                        ? "bg-orange/15 text-orange"
                        : "text-white/55 hover:bg-white/[.06] hover:text-white"
                    }`}
                  >
                    {/* Active indicator bar */}
                    {active && (
                      <span className="absolute left-0 top-2 bottom-2 w-0.5 rounded-full bg-orange" />
                    )}
                    <Icon size={16} className={active ? "text-orange" : "text-white/40 group-hover:text-white/80"} />
                    {label}
                    {active && <ChevronRight size={13} className="ml-auto text-orange/60" />}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* ── Footer ──────────────────────────────────── */}
      <div className="border-t border-white/[.07] p-4 flex flex-col gap-1">
        <Link
          href="/"
          target="_blank"
          className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-xs font-semibold text-white/45 hover:bg-white/[.06] hover:text-white transition-colors"
        >
          <ExternalLink size={14} /> View Storefront
        </Link>
        <Link
          href="/api/auth/signout"
          className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-xs font-semibold text-white/45 hover:bg-red-500/15 hover:text-red-400 transition-colors"
        >
          <LogOut size={14} /> Sign Out
        </Link>
      </div>
    </aside>
  );
}
