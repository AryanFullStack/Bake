import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createClient } from "@supabase/supabase-js";
import { findUnifiedTrackOrder } from "@/lib/tracking";

const schema = z.object({
  full_name: z.string().min(2),
  phone: z.string().min(7),
  email: z.string().email().optional().or(z.literal("")),
  city: z.string().min(2),
  area: z.string().min(2),
  address: z.string().min(8),
  landmark: z.string().optional(),
  instructions: z.string().optional(),
  cake_type: z.string().min(2),
  cake_size: z.string().min(1),
  flavor: z.string().min(2),
  quantity: z.coerce.number().int().positive(),
  theme: z.string().optional(),
  cake_message: z.string().optional(),
  preferred_delivery_at: z.string().optional(),
  budget: z.string().optional(),
  special_instructions: z.string().optional(),
});

export async function POST(request: Request) {
  const form = await request.formData();
  const payload = Object.fromEntries(
    Array.from(form.entries()).filter(([, value]) => typeof value === "string")
  );
  const parsed = schema.safeParse({
    ...payload,
    preferred_delivery_at:
      payload.date && payload.time
        ? `${payload.date}T${payload.time}:00+05:00`
        : "",
  });
  if (!parsed.success)
    return NextResponse.json(
      { error: "Please complete the required cake and delivery details" },
      { status: 400 }
    );
  const supabase = await createSupabaseServerClient();
  const { data: requestNumber, error } = await supabase.rpc(
    "create_custom_cake_request",
    { p_payload: parsed.data }
  );
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  const files = form
    .getAll("images")
    .filter((value): value is File => value instanceof File && value.size > 0);
  if (
    files.length &&
    process.env.SUPABASE_SERVICE_ROLE_KEY &&
    process.env.NEXT_PUBLIC_SUPABASE_URL
  ) {
    const admin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );
    const { data: requestRow } = await admin
      .from("custom_cake_requests")
      .select("id")
      .eq("request_number", requestNumber)
      .single();
    if (requestRow)
      for (const file of files.slice(0, 5)) {
        const path = `${requestNumber}/${crypto.randomUUID()}-${file.name.replace(
          /[^a-zA-Z0-9._-]/g,
          "-"
        )}`;
        const buffer = Buffer.from(await file.arrayBuffer());
        const upload = await admin.storage
          .from("custom-cake-references")
          .upload(path, buffer, { contentType: file.type, upsert: false });
        if (!upload.error)
          await admin
            .from("custom_cake_images")
            .insert({ request_id: requestRow.id, storage_path: path });
      }
  }
  return NextResponse.json({ request_number: requestNumber });
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const reference =
    searchParams.get("request") ||
    searchParams.get("request_number") ||
    searchParams.get("order") ||
    searchParams.get("order_number") ||
    searchParams.get("number") ||
    "";
  const phone = searchParams.get("phone") || "";

  const result = await findUnifiedTrackOrder(reference, phone);
  if (!result.found) {
    return NextResponse.json(
      { error: result.error ?? "Request not found" },
      { status: 404 }
    );
  }

  return NextResponse.json({
    type: result.type,
    request: result.request || null,
    order: result.order || null,
  });
}
