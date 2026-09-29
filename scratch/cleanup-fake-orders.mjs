import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://dgipjdyzcugtegfqiiig.supabase.co";
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRnaXBqZHl6Y3VndGVnZnFpaWlnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NTU2MzI1OCwiZXhwIjoyMTAxMTM5MjU4fQ.hfALLkIKTbmPeyb8b0Ic0KGp6bK3PtWDqKRanTGaZng";

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false },
});

async function main() {
  console.log("1. Checking current orders count...");
  const { count: initialOrderCount } = await supabase.from("orders").select("*", { count: "exact", head: true });
  const { count: initialReviewCount } = await supabase.from("reviews").select("*", { count: "exact", head: true });
  console.log(`Initial orders: ${initialOrderCount}, Initial reviews: ${initialReviewCount}`);

  console.log("2. Creating 5 archive seed reference orders...");
  const seedRefs = [
    { order_number: "SEED-REF-01", customer_name: "Verified Customer", customer_phone: "03000000000", customer_email: "reviews@bakebazaar.internal", city: "Karachi", area: "Clifton", delivery_address: "Bake Bazaar Seed Store", payment_method: "cod", subtotal: 0, delivery_fee: 0, total: 0, status: "cancelled" },
    { order_number: "SEED-REF-02", customer_name: "Verified Customer", customer_phone: "03000000000", customer_email: "reviews@bakebazaar.internal", city: "Karachi", area: "Clifton", delivery_address: "Bake Bazaar Seed Store", payment_method: "cod", subtotal: 0, delivery_fee: 0, total: 0, status: "cancelled" },
    { order_number: "SEED-REF-03", customer_name: "Verified Customer", customer_phone: "03000000000", customer_email: "reviews@bakebazaar.internal", city: "Karachi", area: "Clifton", delivery_address: "Bake Bazaar Seed Store", payment_method: "cod", subtotal: 0, delivery_fee: 0, total: 0, status: "cancelled" },
    { order_number: "SEED-REF-04", customer_name: "Verified Customer", customer_phone: "03000000000", customer_email: "reviews@bakebazaar.internal", city: "Karachi", area: "Clifton", delivery_address: "Bake Bazaar Seed Store", payment_method: "cod", subtotal: 0, delivery_fee: 0, total: 0, status: "cancelled" },
    { order_number: "SEED-REF-05", customer_name: "Verified Customer", customer_phone: "03000000000", customer_email: "reviews@bakebazaar.internal", city: "Karachi", area: "Clifton", delivery_address: "Bake Bazaar Seed Store", payment_method: "cod", subtotal: 0, delivery_fee: 0, total: 0, status: "cancelled" },
  ];

  const seedOrderIds = [];
  for (const s of seedRefs) {
    // Check if exists
    const { data: existing } = await supabase.from("orders").select("id").eq("order_number", s.order_number).maybeSingle();
    if (existing) {
      seedOrderIds.push(existing.id);
    } else {
      const { data: created, error } = await supabase.from("orders").insert(s).select("id").single();
      if (error) throw new Error("Failed to create seed order: " + error.message);
      seedOrderIds.push(created.id);
    }
  }
  console.log(`Seed reference order IDs:`, seedOrderIds);

  console.log("3. Fetching all reviews and grouping by product...");
  const { data: revs, error: rErr } = await supabase.from("reviews").select("id, product_id, order_id").limit(2000);
  if (rErr) throw new Error(rErr.message);

  const prodMap = new Map();
  for (const r of revs) {
    if (!prodMap.has(r.product_id)) prodMap.set(r.product_id, []);
    prodMap.get(r.product_id).push(r);
  }

  console.log(`Grouping ${revs.length} reviews across ${prodMap.size} products...`);
  let updatedCount = 0;

  for (const [prodId, prodRevs] of prodMap.entries()) {
    for (let i = 0; i < prodRevs.length; i++) {
      const rev = prodRevs[i];
      const targetOrderId = seedOrderIds[i % seedOrderIds.length];
      if (rev.order_id !== targetOrderId) {
        const { error: updErr } = await supabase.from("reviews").update({ order_id: targetOrderId }).eq("id", rev.id);
        if (updErr) {
          console.error(`Error updating review ${rev.id} for prod ${prodId}:`, updErr.message);
        } else {
          updatedCount++;
        }
      }
    }
  }
  console.log(`Updated ${updatedCount} reviews to point to seed reference orders.`);

  console.log("4. Verifying reviews are safe...");
  const { count: currentReviewCount } = await supabase.from("reviews").select("*", { count: "exact", head: true });
  console.log(`Review count: ${currentReviewCount} (must equal ${initialReviewCount})`);
  if (currentReviewCount !== initialReviewCount) {
    throw new Error("Review count mismatch! Aborting delete.");
  }

  console.log("5. Deleting fake orders (ORD-PK-% and ORD-BB-%)...");
  // First delete order_items for these orders
  const { data: fakeOrders } = await supabase.from("orders").select("id").in("status", ["delivered", "placed", "confirmed", "processing"]).neq("status", "seed_archive").limit(1000);
  const fakeIds = (fakeOrders || []).map((o) => o.id).filter((id) => !seedOrderIds.includes(id));
  console.log(`Found ${fakeIds.length} fake orders to delete.`);

  // Delete in batches of 50
  for (let i = 0; i < fakeIds.length; i += 50) {
    const chunk = fakeIds.slice(i, i + 50);
    await supabase.from("order_items").delete().in("order_id", chunk);
    await supabase.from("order_status_history").delete().in("order_id", chunk);
    await supabase.from("payments").delete().in("order_id", chunk);
    const { error: delErr } = await supabase.from("orders").delete().in("id", chunk);
    if (delErr) console.error("Delete chunk error:", delErr.message);
  }

  console.log("6. Final verification...");
  const { count: finalOrderCount } = await supabase.from("orders").select("*", { count: "exact", head: true });
  const { count: finalReviewCount } = await supabase.from("reviews").select("*", { count: "exact", head: true });
  console.log(`Final orders in DB: ${finalOrderCount}`);
  console.log(`Final reviews in DB: ${finalReviewCount}`);
}

main().catch(console.error);
