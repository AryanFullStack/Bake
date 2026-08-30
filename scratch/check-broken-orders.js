import { createClient } from "@supabase/supabase-js";

const url = "https://dgipjdyzcugtegfqiiig.supabase.co";
const key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRnaXBqZHl6Y3VndGVnZnFpaWlnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NTU2MzI1OCwiZXhwIjoyMTAxMTM5MjU4fQ.hfALLkIKTbmPeyb8b0Ic0KGp6bK3PtWDqKRanTGaZng";

const supabase = createClient(url, key);

async function inspect() {
  const targetNumbers = ["BM-56196", "BM-33412", "BM-15202", "BM-18174"];
  const { data: orders, error } = await supabase
    .from("orders")
    .select("*, order_items(*)")
    .in("order_number", targetNumbers);

  if (error) {
    console.error(error);
    return;
  }

  console.log("Broken orders details:");
  console.log(JSON.stringify(orders, null, 2));
}

inspect();
