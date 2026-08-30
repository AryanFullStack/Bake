import { createClient } from "@supabase/supabase-js";
import fs from "fs";

const url = "https://dgipjdyzcugtegfqiiig.supabase.co";
const key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRnaXBqZHl6Y3VndGVnZnFpaWlnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NTU2MzI1OCwiZXhwIjoyMTAxMTM5MjU4fQ.hfALLkIKTbmPeyb8b0Ic0KGp6bK3PtWDqKRanTGaZng";

const supabase = createClient(url, key);

async function run() {
  const sql = fs.readFileSync("supabase/migrations/0014_part2_admin_orders_couriers_custom_cakes.sql", "utf8");
  console.log("Applying migration 0014...");

  // Execute SQL statements using rpc or direct fetch to postgres rest endpoint if available
  // Or test simple courier seed check first:
  const { data: existingCouriers, error: cErr } = await supabase.from("couriers").select("*");
  console.log("Couriers check before:", existingCouriers?.length, cErr?.message);
}

run();
