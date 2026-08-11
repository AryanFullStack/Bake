export function getCustomCakeStepIndex(status: string): number {
  const s = (status || "").toLowerCase().replace(/[\s-]/g, "_");
  if (s === "submitted") return 0;
  if (s === "under_review" || s === "review") return 1;
  if (s === "quotation_prepared" || s === "quoted" || s === "quote_ready") return 2;
  if (s === "confirmation_required" || s === "confirmed" || s === "deposit_pending") return 3;
  if (s === "in_production" || s === "baking" || s === "decorating" || s === "processing") return 4;
  if (
    s === "ready" ||
    s === "out_for_delivery" ||
    s === "delivered" ||
    s === "completed" ||
    s === "dispatched"
  )
    return 5;
  return 0;
}

export function getStandardOrderStepIndex(status: string): number {
  const s = (status || "").toLowerCase().replace(/[\s-]/g, "_");
  if (s === "placed") return 0;
  if (s === "confirmed") return 1;
  if (s === "processing") return 2;
  if (s === "baking" || s === "in_production") return 3;
  if (s === "ready" || s === "packed") return 4;
  if (s === "out_for_delivery") return 5;
  if (s === "delivered" || s === "completed") return 6;
  return 0;
}
