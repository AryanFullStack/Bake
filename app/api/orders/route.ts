import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const orderSchema = z.object({
  customer: z.object({ full_name: z.string().trim().min(2).max(120), phone: z.string().trim().min(7).max(30), email: z.string().trim().email().optional().or(z.literal("")), city: z.string().trim().min(2).max(80), area: z.string().trim().min(2).max(120), address: z.string().trim().min(8).max(500), landmark: z.string().max(160).optional(), instructions: z.string().max(500).optional() }),
  payment_method: z.enum(["cod", "bank_transfer"]),
  items: z.array(z.object({ product_id: z.string().uuid(), quantity: z.number().int().positive().max(100) })).min(1).max(100),
});

export async function POST(request: Request) {
  const parsed = orderSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid order details" }, { status: 400 });
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) return NextResponse.json({ error: "Supabase is not configured" }, { status: 503 });
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("create_guest_order", { p_customer: parsed.data.customer, p_payment_method: parsed.data.payment_method, p_items: parsed.data.items });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ order_number: data });
}
