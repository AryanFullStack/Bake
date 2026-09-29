import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://dgipjdyzcugtegfqiiig.supabase.co";
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRnaXBqZHl6Y3VndGVnZnFpaWlnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NTU2MzI1OCwiZXhwIjoyMTAxMTM5MjU4fQ.hfALLkIKTbmPeyb8b0Ic0KGp6bK3PtWDqKRanTGaZng";

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

async function main() {
  console.log("🔍 Finding incorrectly seeded unsplash cake images attached to products...");

  // The red velvet cake unsplash image that was mass-seeded into unrelated products
  const BAD_SEED_URL = "https://images.unsplash.com/photo-1586788680434-30d324b2d46f?auto=format&fit=crop&w=1200&q=88";

  // Check how many product_images entries have this bad seed URL
  const { data: badImages, error: fetchErr } = await supabase
    .from("product_images")
    .select("id, product_id, storage_path, products(id, name, slug)")
    .eq("storage_path", BAD_SEED_URL);

  if (fetchErr) {
    console.error("❌ Error querying product_images:", fetchErr.message);
    process.exit(1);
  }

  console.log(`Found ${badImages?.length || 0} product_images rows with the rogue seed cake image.`);

  if (badImages && badImages.length > 0) {
    const idsToDelete = badImages.map(img => img.id);
    
    // Perform deletion in chunks of 50
    let deletedCount = 0;
    for (let i = 0; i < idsToDelete.length; i += 50) {
      const chunk = idsToDelete.slice(i, i + 50);
      const { error: delErr } = await supabase
        .from("product_images")
        .delete()
        .in("id", chunk);

      if (delErr) {
        console.error("❌ Error deleting chunk:", delErr.message);
      } else {
        deletedCount += chunk.length;
      }
    }

    console.log(`✅ Successfully deleted ${deletedCount} rogue seed cake images from product_images.`);
  }

  // Also check if any other product has an unsplash image that doesn't belong to bakery
  const { data: allUnsplash, error: allErr } = await supabase
    .from("product_images")
    .select("id, product_id, storage_path, products(id, name, slug, category_id, categories(name, slug))")
    .ilike("storage_path", "%images.unsplash.com%");

  if (!allErr && allUnsplash) {
    console.log(`\nRemaining unsplash images in product_images: ${allUnsplash.length}`);
    for (const item of allUnsplash) {
      console.log(`  - [${item.products?.categories?.name || 'No Cat'}] ${item.products?.name} (${item.products?.slug})`);
    }
  }

  console.log("\n🎉 Cleanup complete!");
}

main().catch(err => {
  console.error("Fatal error:", err);
  process.exit(1);
});
