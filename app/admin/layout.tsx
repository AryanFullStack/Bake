import { AdminSidebar } from "@/components/admin/sidebar";
import { requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();

  return (
    <div className="flex h-screen overflow-hidden bg-[#f7f8f6]">
      {/* Desktop Sticky Sidebar */}
      <div className="hidden md:flex shrink-0">
        <AdminSidebar />
      </div>

      {/* Main Admin Body */}
      <main className="flex-1 overflow-y-auto min-w-0 overflow-x-hidden">
        {/* Mobile Header Bar */}
        <div className="sticky top-0 z-30 flex items-center justify-between border-b border-white/10 bg-navy px-4 py-3 text-white md:hidden">
          <div className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-orange text-white text-xs font-bold">
              ✦
            </span>
            <span className="font-display font-bold text-base">Bake Mart Admin</span>
          </div>
        </div>

        {children}
      </main>
    </div>
  );
}
