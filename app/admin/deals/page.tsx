import { Suspense } from "react";
import { requireAdmin } from "@/lib/auth";
import { getAdminDealsSummary, getStorefrontDeals } from "@/lib/deals";
import { DealsDashboardClient } from "@/components/admin/deals-dashboard-client";

export default async function AdminDealsPage() {
  await requireAdmin();

  const [summary, deals] = await Promise.all([
    getAdminDealsSummary(),
    getStorefrontDeals(),
  ]);

  return (
    <Suspense fallback={<div className="p-8 text-center text-sm font-bold text-navy">Loading deals workspace...</div>}>
      <DealsDashboardClient initialSummary={summary} initialDeals={deals} />
    </Suspense>
  );
}

export const dynamic = "force-dynamic";
