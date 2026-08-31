import { AdminLayoutShell } from "@/components/admin/admin-layout-shell";
import { requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();

  return <AdminLayoutShell>{children}</AdminLayoutShell>;
}
