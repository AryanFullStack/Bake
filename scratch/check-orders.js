import { createClient } from "@supabase/supabase-js";

const url = "https://dgipjdyzcugtegfqiiig.supabase.co";
const key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRnaXBqZHl6Y3VndGVnZnFpaWlnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NTU2MzI1OCwiZXhwIjoyMTAxMTM5MjU4fQ.hfALLkIKTbmPeyb8b0Ic0KGp6bK3PtWDqKRanTGaZng";

const supabase = createClient(url, key);

async function inspect() {
  const { data: orders, error } = await supabase.from("orders").select("id, order_number, total, created_at, order_items(*)");
  if (error) {
    console.error("Error fetching orders:", error);
    return;
  }
  console.log("Total orders:", orders.length);
  for (const o of orders) {
    console.log(`Order: ${o.order_number} | ID: ${o.id} | Total: ${o.total} | Items Count: ${o.order_items ? o.order_items.length : 0}`);
    if (o.order_items && o.order_items.length > 0) {
      console.log("  Items:", JSON.stringify(o.order_items));
    }
  }
}

inspect();
