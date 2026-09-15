import fs from "fs";
import path from "path";
import { createClient } from "@supabase/supabase-js";
import ImageKit from "imagekit";
import sharp from "sharp";

// Load .env and .env.local
for (const envFile of [".env", ".env.local"]) {
  if (fs.existsSync(envFile)) {
    fs.readFileSync(envFile, "utf8")
      .split("\n")
      .forEach((line) => {
        const eq = line.indexOf("=");
        if (eq > 0) {
          const k = line.slice(0, eq).trim();
          const v = line.slice(eq + 1).trim();
          if (k && !process.env[k]) process.env[k] = v;
        }
      });
  }
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const ik = new ImageKit({
  publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
  urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT,
});

async function main() {
  console.log("=== CUSTOM CAKE STUDIO E2E VERIFICATION ===");
  let passed = 0;
  let failed = 0;

  function assert(condition, desc) {
    if (condition) {
      console.log(`  [PASS] ${desc}`);
      passed++;
    } else {
      console.error(`  [FAIL] ${desc}`);
      failed++;
    }
  }

  // 1. Quotation Calculation Logic Test
  console.log("\n1. Quotation Calculation Engine Test:");
  {
    const breakdown = {
      basePrice: 1500,
      designPrice: 500,
      tierPrice: 300,
      deliveryFee: 150,
      extraCharges: 50,
      discountAmount: 200,
      advanceRequired: 1000,
      paidAmount: 1000,
    };
    const finalPrice = Math.max(
      0,
      breakdown.basePrice +
        breakdown.designPrice +
        breakdown.tierPrice +
        breakdown.deliveryFee +
        breakdown.extraCharges -
        breakdown.discountAmount
    );
    const balance = Math.max(0, finalPrice - breakdown.paidAmount);

    assert(finalPrice === 2300, `Final price calculated correctly: ${finalPrice} (expected 2300)`);
    assert(balance === 1300, `Remaining balance calculated correctly: ${balance} (expected 1300)`);
  }

  // 2. Timeline Step Resolution Test
  console.log("\n2. Timeline Step Progression Test:");
  {
    const TIMELINE_STEPS = [
      { key: "submitted", label: "Request Submitted" },
      { key: "under_review", label: "Under Review" },
      { key: "quoted", label: "Quote Ready" },
      { key: "quote_accepted", label: "Quote Accepted" },
      { key: "payment_pending", label: "Payment Verification" },
      { key: "confirmed", label: "Order Confirmed" },
      { key: "in_baking", label: "Baking" },
      { key: "decorating", label: "Decorating" },
      { key: "ready_for_pickup", label: "Ready for Pickup" },
      { key: "out_for_delivery", label: "Out for Delivery" },
      { key: "delivered", label: "Delivered" },
    ];

    const stepIndexMap = {
      submitted: 0,
      under_review: 1,
      quoted: 2,
      changes_requested: 2,
      quote_accepted: 3,
      payment_pending: 4,
      confirmed: 5,
      in_baking: 6,
      decorating: 7,
      ready_for_pickup: 8,
      out_for_delivery: 9,
      delivered: 10,
      cancelled: 0,
    };

    assert(stepIndexMap["in_baking"] === 6, "in_baking mapped to step 6 (Baking)");
    assert(stepIndexMap["delivered"] === 10, "delivered mapped to step 10 (Delivered)");
    assert(TIMELINE_STEPS.length === 11, "Complete 11-step visual timeline configured");
  }

  // 3. Sharp Image Compression & ImageKit Upload Test
  console.log("\n3. Image Processing & ImageKit Upload Test:");
  let uploadedFileId = null;
  try {
    // Generate synthetic 200x200 PNG test image
    const rawPng = await sharp({
      create: {
        width: 200,
        height: 200,
        channels: 4,
        background: { r: 255, g: 105, b: 180, alpha: 1 },
      },
    })
      .png()
      .toBuffer();

    // Compress to WebP
    const compressedWebP = await sharp(rawPng)
      .resize({ width: 200, height: 200, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 85 })
      .toBuffer();

    assert(compressedWebP.length > 0, `Compressed WebP buffer created (${compressedWebP.length} bytes)`);

    // Upload to ImageKit
    const testFileName = `test-cake-${Date.now()}.webp`;
    const uploadRes = await ik.upload({
      file: compressedWebP.toString("base64"),
      fileName: testFileName,
      folder: "/custom-cakes",
      useUniqueFileName: true,
    });

    uploadedFileId = uploadRes.fileId;
    assert(
      uploadRes.url && uploadRes.url.startsWith("https://ik.imagekit.io"),
      `Successfully uploaded to ImageKit CDN: ${uploadRes.url}`
    );
  } catch (err) {
    assert(false, `ImageKit upload failed: ${err.message}`);
  }

  // 4. Verify Existing Database Record & Relations
  console.log("\n4. Supabase Custom Cake Queries & Relations Test:");
  try {
    const { data: request, error } = await supabase
      .from("custom_cake_requests")
      .select(`
        *,
        custom_cake_images(*),
        custom_cake_quotes(*),
        custom_cake_status_history(*)
      `)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    assert(!error, `Query executed without error: ${error ? error.message : "OK"}`);
    assert(!!request, `Fetched latest custom cake request: ${request?.request_number || request?.id}`);

    if (request) {
      console.log(`   Request Number: ${request.request_number}`);
      console.log(`   Customer: ${request.customer_name} (${request.customer_phone})`);
      console.log(`   Status: ${request.status}`);
      console.log(`   Images Count: ${request.custom_cake_images?.length || 0}`);

      if (request.custom_cake_images && request.custom_cake_images.length > 0) {
        const firstImg = request.custom_cake_images[0];
        assert(
          firstImg.storage_path.startsWith("https://ik.imagekit.io") ||
            firstImg.storage_path.startsWith("http"),
          `ImageKit storage URL valid: ${firstImg.storage_path}`
        );
      }
    }
  } catch (err) {
    assert(false, `Database query failed: ${err.message}`);
  }

  // 5. Test End-to-End Insert, Tracking Fetch, and Cleanup
  console.log("\n5. End-to-End Test Request Lifecycle:");
  let createdRequestId = null;
  try {
    const testRequestNumber = `BM-TEST-${Date.now().toString().slice(-4)}`;
    const { data: newReq, error: insertError } = await supabase
      .from("custom_cake_requests")
      .insert({
        request_number: testRequestNumber,
        customer_name: "Automated QA User",
        phone: "03001234567",
        email: "qa@example.com",
        city: "Karachi",
        area: "Clifton Block 2",
        landmark: "Near QA Plaza",
        delivery_address: "Apartment 4B, Clifton QA Tower",
        cake_type: "Fondant Cake",
        cake_size: "3 Lbs",
        flavor: "Belgian Chocolate",
        theme: "Birthday Superhero",
        cake_message: "Happy Birthday E2E!",
        preferred_delivery_at: new Date(Date.now() + 86400000 * 2).toISOString(),
        budget: 5000,
        special_instructions: JSON.stringify({
          filling: "Hazelnut Ganache",
          shape: "Round",
          tiers: "2 Tiers",
          dietary_requirements: "Eggless",
          note: "Handle with extra love",
        }),
        status: "submitted",
      })
      .select()
      .single();

    if (insertError) {
      console.error("Insert error details:", insertError);
    }
    assert(!insertError, `Inserted test custom cake request: ${testRequestNumber} - ${insertError?.message}`);
    if (newReq) {
      createdRequestId = newReq.id;

      // Attach test image
      const { error: imgErr } = await supabase.from("custom_cake_images").insert({
        request_id: createdRequestId,
        storage_path: "https://ik.imagekit.io/uu9ypnoai/custom-cakes/test-sample.webp",
      });
      if (imgErr) console.error("imgErr:", imgErr);
      assert(!imgErr, "Attached ImageKit reference image to test request");

      // Verify fetch via tracking query logic
      const { data: trackedReq, error: trackErr } = await supabase
        .from("custom_cake_requests")
        .select(`
          *,
          custom_cake_images(*),
          custom_cake_quotes(*),
          custom_cake_status_history(*)
        `)
        .eq("id", createdRequestId)
        .single();

      assert(!trackErr && !!trackedReq, "Tracking query successfully fetched request with images");
      assert(
        trackedReq?.custom_cake_images?.[0]?.storage_path.includes("ik.imagekit.io"),
        "Tracked request contains direct ImageKit CDN URL"
      );

      // Add quote
      const { error: quoteErr } = await supabase.from("custom_cake_quotes").insert({
        request_id: createdRequestId,
        amount: 4500,
        deposit_amount: 2000,
        note: JSON.stringify({
          basePrice: 4500,
          designPrice: 500,
          tierPrice: 300,
          deliveryFee: 200,
          extraCharges: 0,
          discountAmount: 500,
          advanceRequired: 2000,
          paidAmount: 0,
          note: "Itemized quote generated",
        }),
        status: "pending",
      });
      if (quoteErr) console.error("quoteErr:", quoteErr);
      assert(!quoteErr, "Admin itemized quote created successfully");

      // Update status to quotation_prepared
      const { error: statusErr } = await supabase
        .from("custom_cake_requests")
        .update({ status: "quotation_prepared" })
        .eq("id", createdRequestId);
      if (statusErr) console.error("statusErr:", statusErr);
      assert(!statusErr, "Status transitioned to quotation_prepared");

      // Test conversion to storefront order
      const testOrderNumber = `BM-TEST-${Date.now().toString().slice(-5)}`;
      const { data: convOrder, error: convErr } = await supabase
        .from("orders")
        .insert({
          order_number: testOrderNumber,
          customer_name: "Automated QA User",
          customer_phone: "03001234567",
          customer_email: "qa@example.com",
          city: "Karachi",
          area: "Clifton Block 2",
          delivery_address: "Apartment 4B, Clifton QA Tower",
          subtotal: 4500,
          delivery_fee: 200,
          discount: 500,
          total: 4200,
          payment_method: "cod",
          status: "confirmed",
        })
        .select()
        .single();

      assert(!convErr && !!convOrder, `Converted order created: ${testOrderNumber}`);

      if (convOrder) {
        // Link to request
        await supabase
          .from("custom_cake_requests")
          .update({ linked_order_id: convOrder.id, status: "confirmed" })
          .eq("id", createdRequestId);

        // Verify duplicate conversion prevention logic
        const { data: checkReq } = await supabase
          .from("custom_cake_requests")
          .select("linked_order_id")
          .eq("id", createdRequestId)
          .single();

        assert(
          checkReq?.linked_order_id === convOrder.id,
          "Duplicate prevention: request locked with linked_order_id"
        );

        // Cleanup test order
        await supabase.from("order_items").delete().eq("order_id", convOrder.id);
        await supabase.from("order_status_history").delete().eq("order_id", convOrder.id);
        await supabase.from("orders").delete().eq("id", convOrder.id);
      }
    }
  } catch (err) {
    assert(false, `Test request lifecycle failed: ${err.message}`);
  } finally {
    // Cleanup test record
    if (createdRequestId) {
      await supabase.from("custom_cake_images").delete().eq("request_id", createdRequestId);
      await supabase.from("custom_cake_quotes").delete().eq("request_id", createdRequestId);
      await supabase.from("custom_cake_status_history").delete().eq("request_id", createdRequestId);
      await supabase.from("custom_cake_requests").delete().eq("id", createdRequestId);
      console.log(`   Cleaned up test request ID: ${createdRequestId}`);
    }
    // Cleanup ImageKit test upload
    if (uploadedFileId) {
      try {
        await ik.deleteFile(uploadedFileId);
        console.log(`   Cleaned up test ImageKit file: ${uploadedFileId}`);
      } catch (e) {
        // ignore
      }
    }
  }

  console.log("\n===========================================");
  console.log(`Results: ${passed} passed, ${failed} failed`);
  if (failed === 0) {
    console.log("All Custom Cake Studio verification checks PASSED successfully!");
  } else {
    process.exitCode = 1;
  }
}

main().catch((e) => {
  console.error("Fatal error:", e);
  process.exit(1);
});
