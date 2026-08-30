import { createClient } from "@supabase/supabase-js";

const url = "https://dgipjdyzcugtegfqiiig.supabase.co";
const key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRnaXBqZHl6Y3VndGVnZnFpaWlnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NTU2MzI1OCwiZXhwIjoyMTAxMTM5MjU4fQ.hfALLkIKTbmPeyb8b0Ic0KGp6bK3PtWDqKRanTGaZng";

const supabase = createClient(url, key);

async function inspect() {
  const { data: addrs, error: addrErr } = await supabase.from("addresses").select("*").limit(1);
  console.log("Addresses sample:", addrs, addrErr);

  const { data: prods, error: prodErr } = await supabase.from("products").select("id, name, product_type").limit(2);
  console.log("Products sample:", prods, prodErr);

  const { data: vars, error: varErr } = await supabase.from("product_variations").select("id, product_id, sku, regular_price, attributes").limit(2);
  console.log("Variations sample:", vars, varErr);

  const { data: orderItems, error: itemsErr } = await supabase.from("order_items").select("*").limit(1);
  console.log("Order items sample:", orderItems, itemsErr);
}

inspect();
