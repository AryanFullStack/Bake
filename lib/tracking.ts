import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getCustomCakeStepIndex, getStandardOrderStepIndex } from "./tracking-status";

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
  rawPhone: string
): Promise<TrackResult> {
  const ref = (rawReference || "").trim();
  const phone = (rawPhone || "").trim();

  if (!ref) {
    return { found: false, error: "Please enter an order or request reference number." };
  }
  if (!phone || phone.replace(/\D/g, "").length < 7) {
    return { found: false, error: "Please enter a valid phone number (at least 7 digits)." };
  }

  const phoneDigits = phone.replace(/\D/g, "");
  const last10Phone = phoneDigits.slice(-10);

  // Generate phone variants for database RPC lookups
  const phoneVariants = Array.from(
    new Set([
      phone,
      phoneDigits,
      `0${last10Phone}`,
      `92${last10Phone}`,
      `+92${last10Phone}`,
      phoneDigits.slice(-11),
    ])
  ).filter(Boolean);

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
    ])
  );

  const supabase = await createSupabaseServerClient();

  // 1. Check RPC track_order
  for (const oRef of orderRefVariants) {
    for (const pVar of phoneVariants) {
      try {
        const { data } = await supabase.rpc("track_order", {
          p_order_number: oRef,
          p_phone: pVar,
        });
        if (data && data.order_number) {
          return {
            found: true,
            type: "standard",
            order: data,
          };
        }
      } catch {
        // continue
      }
    }
  }

  // 2. Check RPC track_custom_cake
  for (const cRef of cakeRefVariants) {
    for (const pVar of phoneVariants) {
      try {
        const { data } = await supabase.rpc("track_custom_cake", {
          p_request_number: cRef,
          p_phone: pVar,
        });
        if (data && data.request_number) {
          const req = {
            ...data,
            full_name: data.customer_name || data.full_name,
            price_quote: data.quote?.amount ?? data.price_quote,
            admin_notes: data.quote?.note ?? data.admin_notes,
          };
          return {
            found: true,
            type: "custom_cake",
            request: req,
          };
        }
      } catch {
        // continue
      }
    }
  }

  // 3. Fallback: Query direct database via Admin client if available to handle phone format variations
  const admin = createSupabaseAdminClient();
  if (admin) {
    // Search standard orders
    for (const oRef of orderRefVariants) {
      const { data: orderRows } = await admin
        .from("orders")
        .select("*, order_status_history(*), order_items(product_id, product_name, variation_title, variation_attributes, image_path, sku, unit_price, quantity, line_total), couriers(*)")
        .ilike("order_number", oRef);

      if (orderRows && orderRows.length > 0) {
        for (const orderRow of orderRows) {
          const rowDigits = (orderRow.customer_phone || "").replace(/\D/g, "");
          if (
            rowDigits === phoneDigits ||
            (last10Phone.length >= 7 && rowDigits.slice(-10) === last10Phone) ||
            rowDigits.endsWith(phoneDigits) ||
            phoneDigits.endsWith(rowDigits)
          ) {
            return {
              found: true,
              type: "standard",
              order: {
                ...orderRow,
                history: orderRow.order_status_history || [],
              },
            };
          }
        }
      }
    }

    // Search custom cake requests
    for (const cRef of cakeRefVariants) {
      const { data: cakeRows } = await admin
        .from("custom_cake_requests")
        .select("*, custom_cake_status_history(*), custom_cake_quotes(*)")
        .ilike("request_number", cRef);

      if (cakeRows && cakeRows.length > 0) {
        for (const cakeRow of cakeRows) {
          const rowDigits = (cakeRow.phone || "").replace(/\D/g, "");
          if (
            rowDigits === phoneDigits ||
            (last10Phone.length >= 7 && rowDigits.slice(-10) === last10Phone) ||
            rowDigits.endsWith(phoneDigits) ||
            phoneDigits.endsWith(rowDigits)
          ) {
            const quote = Array.isArray(cakeRow.custom_cake_quotes)
              ? cakeRow.custom_cake_quotes[0]
              : cakeRow.custom_cake_quotes;
            return {
              found: true,
              type: "custom_cake",
              request: {
                ...cakeRow,
                full_name: cakeRow.customer_name,
                quote,
                price_quote: quote?.amount,
                admin_notes: quote?.note,
                history: cakeRow.custom_cake_status_history || [],
              },
            };
          }
        }
      }
    }
  }

  return {
    found: false,
    error: "Order or custom cake request not found. Check both details and try again.",
  };
}
