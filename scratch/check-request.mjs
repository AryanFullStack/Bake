import fs from "fs";
import { createClient } from "@supabase/supabase-js";

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

async function check() {
  const { data: reqs, error } = await supabase
    .from("custom_cake_requests")
    .select("*, custom_cake_images(*)")
    .order("created_at", { ascending: false })
    .limit(5);

  console.log("Recent requests:", reqs?.map(r => ({
    number: r.request_number,
    name: r.customer_name,
    status: r.status,
    images: r.custom_cake_images,
    special_instructions: r.special_instructions,
  })));
}

check();

