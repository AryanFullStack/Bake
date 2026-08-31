"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Menu, X, Shield, ChevronRight } from "lucide-react";
import { AdminSidebar } from "./sidebar";

export function AdminLayoutShell({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-[#f7f8f6]">
      {/* Desktop Sticky Sidebar */}
      <div className="hidden md:flex shrink-0">
        <AdminSidebar />
      </div>

      {/* Mobile Navigation Drawer / Slide-out Overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-navy/70 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileOpen(false)}
          />

          {/* Drawer Sidebar Content */}
          <div className="relative z-10 w-[270px] max-w-[85vw] h-full shadow-2xl animate-in slide-in-from-left duration-200">
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute right-3 top-3 z-20 rounded-full bg-white/10 p-2 text-white hover:bg-white/20 transition-colors"
              aria-label="Close navigation"
            >
              <X size={18} />
            </button>
            <AdminSidebar onNavigate={() => setMobileOpen(false)} />
          </div>
        </div>
      )}

      {/* Main Admin Body */}
      <main className="flex-1 overflow-y-auto min-w-0 overflow-x-hidden flex flex-col">
        {/* Mobile Header Bar */}
        <div className="sticky top-0 z-30 flex items-center justify-between border-b border-white/10 bg-navy px-4 py-3 text-white md:hidden shadow-md">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="rounded-xl bg-white/10 p-2 text-white hover:bg-orange transition-colors cursor-pointer"
              aria-label="Open Navigation Menu"
            >
              <Menu size={20} />
            </button>
            <Link href="/admin" className="flex items-center gap-2">
              <div className="rounded-lg bg-white px-2 py-1 shadow-xs">
                <Image
                  src="/logobake-01.png"
                  alt="Bake Mart"
                  width={90}
                  height={26}
                  className="h-6 w-auto object-contain"
                />
              </div>
              <span className="font-display text-xs font-bold text-orange">ADMIN</span>
            </Link>
          </div>

          <Link
            href="/"
            target="_blank"
            className="rounded-lg bg-white/10 px-2.5 py-1.5 text-[11px] font-bold text-white/80 hover:bg-white/20 hover:text-white transition-colors"
          >
            Storefront
          </Link>
        </div>

        <div className="flex-1">{children}</div>
      </main>
    </div>
  );
}
