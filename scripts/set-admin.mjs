import { readFileSync, existsSync } from "fs";
import { createClient } from "@supabase/supabase-js";

[".env", ".env.local"].forEach((file) => {
  if (existsSync(file)) {
    readFileSync(file, "utf8")
      .split("\n")
      .forEach((line) => {
        const eq = line.indexOf("=");
        if (eq > 0) {
          const k = line.slice(0, eq).trim();
          const v = line.slice(eq + 1).trim();
          if (k) process.env[k] = v;
        }
      });
  }
});

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function main() {
  const targetEmail = "aryanwaheednew@gmail.com";
  console.log(`Setting admin role for ${targetEmail}...`);

  // 1. Get user
  const { data: usersData, error: listErr } = await supabase.auth.admin.listUsers();
  if (listErr) {
    console.error("Error listing users:", listErr);
    process.exit(1);
  }

  const user = usersData.users.find((u) => u.email?.toLowerCase() === targetEmail.toLowerCase());
  if (!user) {
    console.error(`User with email ${targetEmail} not found!`);
    process.exit(1);
  }

  console.log(`Found user ${user.email} (ID: ${user.id})`);

  // 2. Update user_metadata and app_metadata
  const { data: updateData, error: updateErr } = await supabase.auth.admin.updateUserById(user.id, {
    user_metadata: { ...user.user_metadata, role: "admin", full_name: user.user_metadata?.full_name || "Admin" },
    app_metadata: { ...user.app_metadata, role: "admin" },
  });

  if (updateErr) {
    console.error("Error updating user metadata:", updateErr);
  } else {
    console.log("Successfully updated auth user metadata & app_metadata to role: admin!");
  }

  // 3. Upsert profiles row
  const { data: profile, error: profErr } = await supabase
    .from("profiles")
    .upsert(
      {
        id: user.id,
        role: "admin",
        full_name: user.user_metadata?.full_name || "Admin",
      },
      { onConflict: "id" }
    )
    .select()
    .single();

  if (profErr) {
    console.error("Error upserting profile:", profErr);
  } else {
    console.log("Successfully upserted profile row with role: admin!", profile);
  }
}

main();
