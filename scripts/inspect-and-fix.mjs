import { readFileSync } from "fs";
import { createClient } from "@supabase/supabase-js";

// Load .env
readFileSync(".env", "utf8")
  .split("\n")
  .forEach((line) => {
    const eq = line.indexOf("=");
    if (eq > 0) {
      const k = line.slice(0, eq).trim();
      const v = line.slice(eq + 1).trim();
      if (k) process.env[k] = v;
    }
  });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function inspect() {
  console.log("Checking profiles table...");
  const { data: profiles, error: pErr } = await supabase.from("profiles").select("*");
  if (pErr) {
    console.error("Profiles query error:", pErr);
  } else {
    console.log("Profiles found:", profiles);
  }

  console.log("\nChecking auth users...");
  const { data: users, error: uErr } = await supabase.auth.admin.listUsers();
  if (uErr) {
    console.error("Users list error:", uErr);
  } else {
    console.log(
      "Users count:",
      users.users.length,
      users.users.map((u) => ({
        id: u.id,
        email: u.email,
        user_metadata: u.user_metadata,
        app_metadata: u.app_metadata,
      }))
    );
  }
}

inspect();
