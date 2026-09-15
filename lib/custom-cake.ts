export const CUSTOM_CAKE_STATUSES = [
  "submitted",
  "under_review",
  "quotation_prepared",
  "confirmation_required",
  "confirmed",
  "deposit_pending",
  "in_production",
  "ready",
  "out_for_delivery",
  "delivered",
  "completed",
  "cancelled",
  "rejected",
] as const;

export type CustomCakeStatus = typeof CUSTOM_CAKE_STATUSES[number];

export const CUSTOM_CAKE_STEPS = [
  { key: "submitted", label: "Submitted", desc: "Brief received & logged" },
  { key: "under_review", label: "Under Review", desc: "Decorator analyzing brief" },
  { key: "quotation_prepared", label: "Quotation Prepared", desc: "Pricing & quote ready" },
  { key: "confirmation_required", label: "Confirmation Required", desc: "Customer review required" },
  { key: "confirmed", label: "Confirmed", desc: "Brief accepted & locked" },
  { key: "deposit_pending", label: "Deposit Pending", desc: "Awaiting advance payment" },
  { key: "in_production", label: "In Production", desc: "Baking & handcrafted art" },
  { key: "ready", label: "Ready", desc: "Chilled & packed in studio" },
  { key: "out_for_delivery", label: "Out for Delivery", desc: "Handed to courier fleet" },
  { key: "delivered", label: "Delivered", desc: "Delivered to recipient" },
  { key: "completed", label: "Completed", desc: "Order finalized" },
] as const;

export const CUSTOM_CAKE_PAYMENT_METHODS = [
  { id: "cod", label: "Cash on Delivery", desc: "Pay cash upon arrival" },
  { id: "bank_transfer", label: "Bank Transfer", desc: "Meezan Bank Ltd." },
  { id: "jazzcash", label: "JazzCash", desc: "Mobile Wallet Transfer" },
] as const;

export const CUSTOM_CAKE_PAYMENT_STATUSES = [
  "pending",
  "instructions_sent",
  "awaiting_verification",
  "submitted",
  "verified",
  "partially_paid",
  "paid",
  "failed",
  "refunded",
] as const;

export type CustomCakePaymentStatus = typeof CUSTOM_CAKE_PAYMENT_STATUSES[number];

export const STATUS_LABELS: Record<string, string> = {
  submitted: "Submitted",
  under_review: "Under Review",
  quotation_prepared: "Quotation Prepared",
  confirmation_required: "Confirmation Required",
  confirmed: "Confirmed",
  deposit_pending: "Deposit Pending",
  in_production: "In Production",
  ready: "Ready",
  out_for_delivery: "Out for Delivery",
  delivered: "Delivered",
  completed: "Completed",
  cancelled: "Cancelled",
  rejected: "Rejected",
};

export const STATUS_BADGE_CLASSES: Record<string, string> = {
  submitted: "bg-blue-50 text-blue-700 border-blue-200",
  under_review: "bg-purple-50 text-purple-700 border-purple-200",
  quotation_prepared: "bg-yellow-50 text-yellow-800 border-yellow-200",
  confirmation_required: "bg-amber-50 text-amber-800 border-amber-200",
  confirmed: "bg-emerald-50 text-emerald-700 border-emerald-200",
  deposit_pending: "bg-orange/10 text-orange border-orange/20",
  in_production: "bg-indigo-50 text-indigo-700 border-indigo-200",
  ready: "bg-teal-50 text-teal-700 border-teal-200",
  out_for_delivery: "bg-cyan-50 text-cyan-700 border-cyan-200",
  delivered: "bg-green-100 text-green-800 border-green-300",
  completed: "bg-green-200 text-green-900 border-green-400",
  cancelled: "bg-red-50 text-red-700 border-red-200",
  rejected: "bg-rose-50 text-rose-800 border-rose-200",
};

export const PAYMENT_STATUS_BADGE_CLASSES: Record<string, string> = {
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  instructions_sent: "bg-blue-50 text-blue-700 border-blue-200",
  awaiting_verification: "bg-purple-50 text-purple-700 border-purple-200 animate-pulse",
  submitted: "bg-indigo-50 text-indigo-700 border-indigo-200",
  verified: "bg-emerald-50 text-emerald-800 border-emerald-300",
  partially_paid: "bg-orange/10 text-orange border-orange/20",
  paid: "bg-green-100 text-green-900 border-green-300",
  failed: "bg-red-50 text-red-700 border-red-200",
  refunded: "bg-gray-100 text-gray-700 border-gray-300",
};

export interface CakeSpecifications {
  cake_type: string;
  cake_size: string;
  flavor: string;
  filling: string;
  shape: string;
  tiers: string;
  theme: string;
  cake_message: string;
  dietary_requirements: string;
  budget: string;
  special_instructions: string;
  delivery_date?: string;
  delivery_time?: string;
}

export interface QuotationBreakdown {
  base_price: number;
  design_charges: number;
  tier_charges: number;
  extra_charges: number;
  delivery_fee: number;
  discount: number;
  final_price: number;
  deposit_amount: number;
  amount_paid: number;
  remaining_balance: number;
  note: string;
  customer_notes?: string;
  decline_reason?: string;
  status: "pending" | "accepted" | "changes_requested" | "declined";
  expires_at?: string | null;
  decided_at?: string | null;
}

/**
 * Calculates itemized quotation totals and remaining balance.
 */
export function calculateQuotation(params: {
  base_price?: number | string;
  design_charges?: number | string;
  tier_charges?: number | string;
  extra_charges?: number | string;
  delivery_fee?: number | string;
  discount?: number | string;
  deposit_amount?: number | string;
  amount_paid?: number | string;
}) {
  const base = Math.max(0, Number(params.base_price || 0));
  const design = Math.max(0, Number(params.design_charges || 0));
  const tier = Math.max(0, Number(params.tier_charges || 0));
  const extra = Math.max(0, Number(params.extra_charges || 0));
  const delivery = Math.max(0, Number(params.delivery_fee || 0));
  const discount = Math.max(0, Number(params.discount || 0));

  const subtotalBeforeDiscount = base + design + tier + extra + delivery;
  const final_price = Math.max(0, subtotalBeforeDiscount - discount);

  const deposit = Math.max(0, Number(params.deposit_amount || 0));
  const paid = Math.max(0, Number(params.amount_paid || 0));
  const remaining_balance = Math.max(0, final_price - paid);

  return {
    base_price: base,
    design_charges: design,
    tier_charges: tier,
    extra_charges: extra,
    delivery_fee: delivery,
    discount,
    final_price,
    deposit_amount: deposit,
    amount_paid: paid,
    remaining_balance,
  };
}

/**
 * Parses cake specifications with defensive backward compatibility.
 * Extracts filling, shape, tiers, dietary requirements from dedicated fields
 * or parsed JSON/tags in special_instructions.
 */
export function parseCakeSpecifications(row: any): CakeSpecifications {
  if (!row) {
    return {
      cake_type: "",
      cake_size: "",
      flavor: "",
      filling: "None / Baker's Choice",
      shape: "Round",
      tiers: "1 Tier",
      theme: "",
      cake_message: "",
      dietary_requirements: "Standard",
      budget: "",
      special_instructions: "",
    };
  }

  let filling = row.filling || "";
  let shape = row.shape || "";
  let tiers = row.tiers || "";
  let dietary = row.dietary_requirements || "";
  let cleanInstructions = row.special_instructions || "";

  // Check if special_instructions has embedded structured JSON
  if (cleanInstructions && cleanInstructions.includes("__CAKE_SPECS__:")) {
    try {
      const parts = cleanInstructions.split("__CAKE_SPECS__:");
      const jsonText = parts[1]?.trim();
      if (jsonText) {
        const parsed = JSON.parse(jsonText);
        filling = filling || parsed.filling || "";
        shape = shape || parsed.shape || "";
        tiers = tiers || parsed.tiers || "";
        dietary = dietary || parsed.dietary_requirements || "";
      }
      cleanInstructions = parts[0]?.trim() || "";
    } catch {
      // Ignore JSON parse failure, keep cleanInstructions
    }
  }

  // Delivery Date & Time extraction from preferred_delivery_at
  let delivery_date = "";
  let delivery_time = "";
  if (row.preferred_delivery_at) {
    try {
      const d = new Date(row.preferred_delivery_at);
      delivery_date = d.toISOString().split("T")[0];
      const hours = String(d.getHours()).padStart(2, "0");
      const mins = String(d.getMinutes()).padStart(2, "0");
      delivery_time = `${hours}:${mins}`;
    } catch {
      // ignore
    }
  }

  return {
    cake_type: row.cake_type || "Celebration Cake",
    cake_size: row.cake_size || "2 kg (Serves 12-15)",
    flavor: row.flavor || "Chocolate Fudge",
    filling: filling || "Signature Chocolate Ganache",
    shape: shape || "Round",
    tiers: tiers || "Single Tier",
    theme: row.theme || "",
    cake_message: row.cake_message || "",
    dietary_requirements: dietary || "Standard",
    budget: row.budget ? String(row.budget) : "",
    special_instructions: cleanInstructions,
    delivery_date,
    delivery_time,
  };
}

/**
 * Encodes extra cake specifications into a backward-compatible format
 * so they are never lost regardless of database column states.
 */
export function encodeCakeSpecifications(specs: {
  filling?: string;
  shape?: string;
  tiers?: string;
  dietary_requirements?: string;
  special_instructions?: string;
}): {
  filling: string;
  shape: string;
  tiers: string;
  dietary_requirements: string;
  combined_instructions: string;
} {
  const filling = specs.filling?.trim() || "Signature Chocolate Ganache";
  const shape = specs.shape?.trim() || "Round";
  const tiers = specs.tiers?.trim() || "Single Tier";
  const dietary = specs.dietary_requirements?.trim() || "Standard";
  const baseInstructions = specs.special_instructions?.trim() || "";

  const specsJson = JSON.stringify({
    filling,
    shape,
    tiers,
    dietary_requirements: dietary,
  });

  const combined_instructions = baseInstructions
    ? `${baseInstructions}\n\n__CAKE_SPECS__:${specsJson}`
    : `__CAKE_SPECS__:${specsJson}`;

  return {
    filling,
    shape,
    tiers,
    dietary_requirements: dietary,
    combined_instructions,
  };
}

/**
 * Parses quotation breakdown from custom_cake_quotes row.
 */
export function parseQuotationBreakdown(
  quoteRow: any,
  requestRow?: any
): QuotationBreakdown | null {
  if (!quoteRow) return null;

  let base = Number(quoteRow.base_price ?? 0);
  let design = Number(quoteRow.design_charges ?? 0);
  let tier = Number(quoteRow.tier_charges ?? 0);
  let extra = Number(quoteRow.extra_charges ?? 0);
  let delivery = Number(quoteRow.delivery_fee ?? 0);
  let discount = Number(quoteRow.discount ?? 0);
  let finalPrice = Number(quoteRow.amount ?? 0);
  let deposit = Number(quoteRow.deposit_amount ?? 0);
  let paid = Number(requestRow?.amount_paid ?? 0);

  let note = quoteRow.note || "";
  let customerNotes = quoteRow.customer_notes || "";
  let declineReason = quoteRow.decline_reason || "";

  // Check if note has embedded breakdown JSON
  if (note && note.includes("__QUOTE_BREAKDOWN__:")) {
    try {
      const parts = note.split("__QUOTE_BREAKDOWN__:");
      const jsonText = parts[1]?.trim();
      if (jsonText) {
        const parsed = JSON.parse(jsonText);
        base = base || Number(parsed.base_price || 0);
        design = design || Number(parsed.design_charges || 0);
        tier = tier || Number(parsed.tier_charges || 0);
        extra = extra || Number(parsed.extra_charges || 0);
        discount = discount || Number(parsed.discount || 0);
        delivery = delivery || Number(parsed.delivery_fee || 0);
        customerNotes = customerNotes || parsed.customer_notes || "";
        declineReason = declineReason || parsed.decline_reason || "";
      }
      note = parts[0]?.trim() || "";
    } catch {
      // ignore
    }
  }

  // If base price was 0 but final amount exists, default base price to finalPrice
  if (base === 0 && finalPrice > 0) {
    base = finalPrice;
  }

  const calc = calculateQuotation({
    base_price: base,
    design_charges: design,
    tier_charges: tier,
    extra_charges: extra,
    delivery_fee: delivery,
    discount,
    deposit_amount: deposit,
    amount_paid: paid,
  });

  return {
    base_price: calc.base_price,
    design_charges: calc.design_charges,
    tier_charges: calc.tier_charges,
    extra_charges: calc.extra_charges,
    delivery_fee: calc.delivery_fee,
    discount: calc.discount,
    final_price: calc.final_price || finalPrice,
    deposit_amount: calc.deposit_amount || deposit,
    amount_paid: calc.amount_paid,
    remaining_balance: calc.remaining_balance,
    note,
    customer_notes: customerNotes,
    decline_reason: declineReason,
    status: (quoteRow.status as any) || "pending",
    expires_at: quoteRow.expires_at || null,
    decided_at: quoteRow.decided_at || null,
  };
}

/**
 * Encodes quotation breakdown into note field for backward compatibility.
 */
export function encodeQuotationNote(
  noteText: string,
  breakdown: {
    base_price: number;
    design_charges: number;
    tier_charges: number;
    extra_charges: number;
    delivery_fee: number;
    discount: number;
    customer_notes?: string;
    decline_reason?: string;
  }
): string {
  const jsonText = JSON.stringify(breakdown);
  const cleanNote = noteText?.trim() || "";
  return cleanNote
    ? `${cleanNote}\n\n__QUOTE_BREAKDOWN__:${jsonText}`
    : `__QUOTE_BREAKDOWN__:${jsonText}`;
}

/**
 * Computes step index along the 11-step visual timeline.
 */
export function getCustomCakeTimelineIndex(status: string): number {
  const s = (status || "").toLowerCase().replace(/[\s-]/g, "_");
  const stepIdx = CUSTOM_CAKE_STEPS.findIndex((step) => step.key === s);
  if (stepIdx !== -1) return stepIdx;

  if (s === "review" || s === "consultation") return 1;
  if (s === "quoted" || s === "quote_ready") return 2;
  if (s === "baking" || s === "decorating") return 6;
  if (s === "packed" || s === "dispatched") return 8;

  return 0;
}

