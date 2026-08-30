import { requireAdmin } from "@/lib/auth";
import { AdminReportsManager } from "@/components/admin/reports-manager";

export default async function AdminReportsPage() {
  await requireAdmin();
  return <AdminReportsManager />;
}

export const dynamic = "force-dynamic";
