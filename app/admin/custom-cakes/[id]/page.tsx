import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { parseCakeSpecifications, parseQuotationBreakdown } from "@/lib/custom-cake";
import { resolveCakeImageUrl } from "@/lib/custom-cake-media";
import { CustomCakeDetailClient } from "@/components/admin/custom-cake-detail-client";

export default async function AdminCustomCakeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;

  const supabase = await createSupabaseServerClient();
  const adminClient = createSupabaseAdminClient() ?? supabase;

  const { data: row, error } = await adminClient
    .from("custom_cake_requests")
    .select(
      "*, custom_cake_quotes(*), custom_cake_images(*), custom_cake_status_history(*), orders:linked_order_id(id, order_number, status)"
    )
    .eq("id", id)
    .single();

  if (error || !row) {
    notFound();
  }

  const quoteRow = Array.isArray(row.custom_cake_quotes)
    ? row.custom_cake_quotes[0]
    : row.custom_cake_quotes;
  const quote = parseQuotationBreakdown(quoteRow, row);
  const specs = parseCakeSpecifications(row);

  const images = (row.custom_cake_images || []).map((img: any) => ({
    id: img.id,
    url: resolveCakeImageUrl(img.storage_path),
    created_at: img.created_at,
  }));

  const history = (row.custom_cake_status_history || []).sort(
    (a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  const enrichedRequest = {
    ...row,
    specs,
    quote,
    images,
    history,
    linked_order: row.orders || null,
  };

  return <CustomCakeDetailClient initialRequest={enrichedRequest} />;
}

export const dynamic = "force-dynamic";

