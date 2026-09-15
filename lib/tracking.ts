import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getCustomCakeStepIndex, getStandardOrderStepIndex } from "./tracking-status";
import { parseCakeSpecifications, parseQuotationBreakdown } from "./custom-cake";
import { resolveCakeImageUrl } from "./custom-cake-media";

export { getCustomCakeStepIndex, getStandardOrderStepIndex };

export interface TrackResult {
  found: boolean;
  type?: "standard" | "custom_cake";
  order?: any;
  request?: any;
  error?: string;
}

export async function findUnifiedTrackOrder(
  rawReference: string,
  rawPhoneOrEmail: string
): Promise<TrackResult> {
  const ref = (rawReference || "").trim();
  const verification = (rawPhoneOrEmail || "").trim();

  if (!ref) {
    return { found: false, error: "Please enter an order or custom cake request reference number." };
  }
  if (!verification) {
    return { found: false, error: "Please enter your phone number or email for verification." };
  }

  const isEmail = verification.includes("@");
  const phoneDigits = verification.replace(/\D/g, "");
  const last10Phone = phoneDigits.slice(-10);

  if (!isEmail && phoneDigits.length < 7) {
    return { found: false, error: "Please enter a valid phone number (at least 7 digits) or email address." };
  }

  const cleanRef = ref.toUpperCase();

  // Reference variants for standard orders (BM-XXXXX)
  const orderRefVariants = Array.from(
    new Set([
      cleanRef,
      cleanRef.startsWith("BM-") ? cleanRef : `BM-${cleanRef}`,
      cleanRef.replace(/^BM-CR-/, "BM-"),
      cleanRef.replace(/^CR-/, "BM-"),
    ])
  );

  // Reference variants for custom cake requests (BM-CR-XXXX)
  const cakeRefVariants = Array.from(
    new Set([
      cleanRef,
      cleanRef.startsWith("BM-CR-")
        ? cleanRef
        : cleanRef.startsWith("CR-")
        ? `BM-${cleanRef}`
        : `BM-CR-${cleanRef.replace(/^BM-/, "")}`,
      `BM-CR-${cleanRef}`,
      cleanRef,
    ])
  );

  const admin = createSupabaseAdminClient();
  const supabase = await createSupabaseServerClient();
  const dbClient = admin ?? supabase;

  // 1. If it looks like a custom cake reference (BM-CR or CR), check custom cakes first
  const isCakeRef = cleanRef.startsWith("BM-CR") || cleanRef.startsWith("CR");

  if (isCakeRef) {
    for (const cRef of cakeRefVariants) {
      const { data: cakeRows } = await dbClient
        .from("custom_cake_requests")
        .select(`
          *,
          custom_cake_status_history(*),
          custom_cake_quotes(*),
          custom_cake_images(*),
          orders:linked_order_id(id, order_number, status)
        `)
        .ilike("request_number", cRef);

      if (cakeRows && cakeRows.length > 0) {
        for (const cakeRow of cakeRows) {
          let verified = false;
          if (isEmail) {
            verified = (cakeRow.email || "").toLowerCase() === verification.toLowerCase();
          } else {
            const rowDigits = (cakeRow.phone || "").replace(/\D/g, "");
            verified =
              rowDigits === phoneDigits ||
              (last10Phone.length >= 7 && rowDigits.slice(-10) === last10Phone) ||
              rowDigits.endsWith(phoneDigits) ||
              phoneDigits.endsWith(rowDigits);
          }

          if (verified) {
            const quoteRow = Array.isArray(cakeRow.custom_cake_quotes)
              ? cakeRow.custom_cake_quotes[0]
              : cakeRow.custom_cake_quotes;
            const quote = parseQuotationBreakdown(quoteRow, cakeRow);
            const specs = parseCakeSpecifications(cakeRow);

            const images = (cakeRow.custom_cake_images || []).map((img: any) => ({
              id: img.id,
              url: resolveCakeImageUrl(img.storage_path),
              created_at: img.created_at,
            }));

            const sortedHistory = (cakeRow.custom_cake_status_history || []).sort(
              (a: any, b: any) =>
                new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            );

            return {
              found: true,
              type: "custom_cake",
              request: {
                ...cakeRow,
                full_name: cakeRow.customer_name,
                specs,
                quote,
                price_quote: quote?.final_price ?? quoteRow?.amount,
                deposit_required: quote?.deposit_amount ?? quoteRow?.deposit_amount ?? 0,
                admin_notes: quote?.note ?? quoteRow?.note,
                images,
                history: sortedHistory,
                linked_order: cakeRow.orders || null,
              },
            };
          }
        }
      }
    }
  }

  // 2. Check Standard Orders
  for (const oRef of orderRefVariants) {
    const { data: orderRows } = await dbClient
      .from("orders")
      .select("*, order_status_history(*), order_items(*), couriers(*), payments(*)")
      .ilike("order_number", oRef);

    if (orderRows && orderRows.length > 0) {
      for (const orderRow of orderRows) {
        let verified = false;
        if (isEmail) {
          verified = (orderRow.customer_email || "").toLowerCase() === verification.toLowerCase();
        } else {
          const rowDigits = (orderRow.customer_phone || "").replace(/\D/g, "");
          verified =
            rowDigits === phoneDigits ||
            (last10Phone.length >= 7 && rowDigits.slice(-10) === last10Phone) ||
            rowDigits.endsWith(phoneDigits) ||
            phoneDigits.endsWith(rowDigits);
        }

        if (verified) {
          const sortedHistory = (orderRow.order_status_history || []).sort(
            (a: any, b: any) =>
              new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          );

          return {
            found: true,
            type: "standard",
            order: {
              ...orderRow,
              history: sortedHistory,
            },
          };
        }
      }
    }
  }

  // 3. Fallback: Check custom cakes if not checked earlier
  if (!isCakeRef) {
    for (const cRef of cakeRefVariants) {
      const { data: cakeRows } = await dbClient
        .from("custom_cake_requests")
        .select(`
          *,
          custom_cake_status_history(*),
          custom_cake_quotes(*),
          custom_cake_images(*),
          orders:linked_order_id(id, order_number, status)
        `)
        .ilike("request_number", cRef);

      if (cakeRows && cakeRows.length > 0) {
        for (const cakeRow of cakeRows) {
          let verified = false;
          if (isEmail) {
            verified = (cakeRow.email || "").toLowerCase() === verification.toLowerCase();
          } else {
            const rowDigits = (cakeRow.phone || "").replace(/\D/g, "");
            verified =
              rowDigits === phoneDigits ||
              (last10Phone.length >= 7 && rowDigits.slice(-10) === last10Phone) ||
              rowDigits.endsWith(phoneDigits) ||
              phoneDigits.endsWith(rowDigits);
          }

          if (verified) {
            const quoteRow = Array.isArray(cakeRow.custom_cake_quotes)
              ? cakeRow.custom_cake_quotes[0]
              : cakeRow.custom_cake_quotes;
            const quote = parseQuotationBreakdown(quoteRow, cakeRow);
            const specs = parseCakeSpecifications(cakeRow);

            const images = (cakeRow.custom_cake_images || []).map((img: any) => ({
              id: img.id,
              url: resolveCakeImageUrl(img.storage_path),
              created_at: img.created_at,
            }));

            const sortedHistory = (cakeRow.custom_cake_status_history || []).sort(
              (a: any, b: any) =>
                new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            );

            return {
              found: true,
              type: "custom_cake",
              request: {
                ...cakeRow,
                full_name: cakeRow.customer_name,
                specs,
                quote,
                price_quote: quote?.final_price ?? quoteRow?.amount,
                deposit_required: quote?.deposit_amount ?? quoteRow?.deposit_amount ?? 0,
                admin_notes: quote?.note ?? quoteRow?.note,
                images,
                history: sortedHistory,
                linked_order: cakeRow.orders || null,
              },
            };
          }
        }
      }
    }
  }

  return {
    found: false,
    error: "Order or custom cake request not found. Check both reference number and phone/email and try again.",
  };
}
