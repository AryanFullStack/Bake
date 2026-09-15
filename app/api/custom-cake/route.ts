import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { encodeCakeSpecifications } from "@/lib/custom-cake";
import { uploadCakeImageToImageKit } from "@/lib/custom-cake-media";

const schema = z.object({
  full_name: z.string().min(2, "Full name is required"),
  phone: z.string().min(10, "Valid phone number is required"),
  email: z.string().email().optional().or(z.literal("")),
  city: z.string().min(2, "City is required"),
  area: z.string().min(2, "Area / Town is required"),
  address: z.string().min(5, "Delivery address is required"),
  landmark: z.string().optional().or(z.literal("")),
  instructions: z.string().optional().or(z.literal("")),
  cake_type: z.string().min(2, "Cake type is required"),
  cake_size: z.string().min(2, "Cake size / weight is required"),
  flavor: z.string().min(2, "Flavour is required"),
  filling: z.string().optional().or(z.literal("")),
  shape: z.string().optional().or(z.literal("")),
  tiers: z.string().optional().or(z.literal("")),
  dietary_requirements: z.string().optional().or(z.literal("")),
  quantity: z.coerce.number().int().positive().default(1),
  theme: z.string().optional().or(z.literal("")),
  cake_message: z.string().optional().or(z.literal("")),
  preferred_delivery_at: z.string().optional().or(z.literal("")),
  budget: z.string().optional().or(z.literal("")),
  special_instructions: z.string().optional().or(z.literal("")),
});

export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const payload = Object.fromEntries(
      Array.from(form.entries()).filter(([, value]) => typeof value === "string")
    );

    const deliveryTime = (form.get("preferred_delivery_time") as string) || (form.get("time") as string) || "14:00";
    const deliveryDate = (form.get("preferred_delivery_date") as string) || (form.get("date") as string) || "";
    let preferredDeliveryAt = "";
    if (deliveryDate) {
      preferredDeliveryAt = `${deliveryDate}T${deliveryTime.slice(0, 5)}:00+05:00`;
    }

    const parsed = schema.safeParse({
      ...payload,
      preferred_delivery_at: preferredDeliveryAt,
    });

    if (!parsed.success) {
      const errorMsg = parsed.error.issues[0]?.message || "Please complete required fields.";
      return NextResponse.json({ error: errorMsg }, { status: 400 });
    }

    const {
      full_name,
      phone,
      email,
      city,
      area,
      address,
      landmark,
      instructions,
      cake_type,
      cake_size,
      flavor,
      filling,
      shape,
      tiers,
      dietary_requirements,
      quantity,
      theme,
      cake_message,
      preferred_delivery_at,
      budget,
      special_instructions,
    } = parsed.data;

    // Encode specs for resilient backward compatibility
    const encoded = encodeCakeSpecifications({
      filling,
      shape,
      tiers,
      dietary_requirements,
      special_instructions,
    });

    const supabase = await createSupabaseServerClient();
    const admin = createSupabaseAdminClient() ?? supabase;

    // 1. Create request using database RPC if available
    const rpcPayload = {
      full_name,
      phone,
      email: email || null,
      city,
      area,
      address,
      landmark: landmark || null,
      instructions: instructions || null,
      cake_type,
      cake_size,
      flavor,
      quantity,
      theme: theme || null,
      cake_message: cake_message || null,
      preferred_delivery_at: preferred_delivery_at || null,
      budget: budget ? Number(budget) : null,
      special_instructions: encoded.combined_instructions,
    };

    let requestNumber: string | null = null;
    let requestId: string | null = null;

    const { data: rpcNum, error: rpcErr } = await supabase.rpc(
      "create_custom_cake_request",
      { p_payload: rpcPayload }
    );

    if (!rpcErr && rpcNum) {
      requestNumber = rpcNum;
      const { data: reqRow } = await admin
        .from("custom_cake_requests")
        .select("id")
        .eq("request_number", requestNumber)
        .single();
      if (reqRow) requestId = reqRow.id;
    } else {
      // Direct insert fallback
      const randomSeq = Math.floor(1000 + Math.random() * 9000);
      requestNumber = `BM-CR-${randomSeq}`;

      const { data: inserted, error: insertErr } = await admin
        .from("custom_cake_requests")
        .insert({
          request_number: requestNumber,
          customer_name: full_name,
          phone: phone.replace(/\s+/g, ""),
          email: email || null,
          city,
          area,
          delivery_address: address,
          landmark: landmark || null,
          delivery_instructions: instructions || null,
          preferred_delivery_at: preferred_delivery_at || null,
          cake_type,
          cake_size,
          flavor,
          quantity,
          theme: theme || null,
          cake_message: cake_message || null,
          budget: budget ? Number(budget) : null,
          special_instructions: encoded.combined_instructions,
          status: "submitted",
        })
        .select("id")
        .single();

      if (insertErr || !inserted) {
        return NextResponse.json(
          { error: insertErr?.message || "Failed to save custom cake request" },
          { status: 500 }
        );
      }

      requestId = inserted.id;

      // Status history entry
      await admin.from("custom_cake_status_history").insert({
        request_id: requestId,
        new_status: "submitted",
        note: "Initial brief submitted by customer",
      });
    }

    // Attempt to update direct columns if they exist in DB
    if (requestId) {
      try {
        await admin
          .from("custom_cake_requests")
          .update({
            filling: filling || null,
            shape: shape || null,
            tiers: tiers || null,
            dietary_requirements: dietary_requirements || null,
          })
          .eq("id", requestId);
      } catch {
        // Safe fallback - encoded into combined_instructions
      }
    }

    // 2. Handle Reference Image Uploads directly to ImageKit
    const files: File[] = [];
    for (const [key, val] of form.entries()) {
      if (val instanceof File && val.size > 0) {
        files.push(val);
      }
    }

    const uploadedUrls: string[] = [];

    if (files.length > 0 && requestId) {
      for (const file of files.slice(0, 5)) {
        try {
          const uploadRes = await uploadCakeImageToImageKit(file, "custom-cakes");
          if (uploadRes?.url) {
            uploadedUrls.push(uploadRes.url);
            const { error: dbImgErr } = await admin.from("custom_cake_images").insert({
              request_id: requestId,
              storage_path: uploadRes.url,
            });
            if (dbImgErr) {
              console.error("[POST /api/custom-cake] Error inserting image into custom_cake_images:", dbImgErr);
            }
          }
        } catch (imgErr) {
          console.error("[POST /api/custom-cake] Error uploading reference image to ImageKit:", imgErr);
        }
      }
    }

    // 3. Create Notification & Email event
    try {
      if (email) {
        await admin.from("email_outbox").insert({
          recipient: email,
          template: "custom_cake_submitted",
          payload: {
            request_number: requestNumber,
            customer_name: full_name,
            flavor,
            cake_size,
            delivery_date: deliveryDate,
          },
          status: "pending",
        });
      }
    } catch {
      // Non-blocking notification
    }

    return NextResponse.json({
      success: true,
      request_number: requestNumber,
      uploaded_images: uploadedUrls,
    });
  } catch (err: any) {
    console.error("[POST /api/custom-cake error]:", err);
    return NextResponse.json(
      { error: err.message || "An unexpected error occurred while submitting brief" },
      { status: 500 }
    );
  }
}
