import { NextResponse } from "next/server";
import { createSupabasePublicClient } from "@/lib/supabase/server";

// Cache for 60 seconds to avoid hammering Supabase on every page render
export const revalidate = 60;

export async function GET() {
  try {
    const supabase = createSupabasePublicClient();
    const { data, error } = await supabase
      .from("site_settings")
      .select("key,value")
      .in("key", ["delivery", "store"]);

    if (error) throw error;

    const settingMap = Object.fromEntries(
      (data ?? []).map((row: any) => [row.key, row.value])
    );

    const delivery = settingMap.delivery ?? {};
    const store = settingMap.store ?? {};

    return NextResponse.json({
      delivery: {
        fee: Number(delivery.fee ?? 250),
        free_threshold: Number(delivery.free_threshold ?? 3000),
        same_day_cutoff: delivery.same_day_cutoff ?? "13:00",
        cities: delivery.cities ?? [],
      },
      store: {
        name: store.name ?? "Bake Bazaar Mart",
        email: store.email ?? "info@bakebazaarmart.com",
        phone: store.phone ?? "",
        city: store.city ?? "Karachi",
      },
    });
  } catch (err: any) {
    console.error("Failed to fetch site settings:", err);
    // Return safe defaults so storefront never crashes
    return NextResponse.json({
      delivery: { fee: 250, free_threshold: 3000, same_day_cutoff: "13:00", cities: [] },
      store: { name: "Bake Bazaar Mart", email: "info@bakebazaarmart.com", phone: "", city: "Karachi" },
    });
  }
}
