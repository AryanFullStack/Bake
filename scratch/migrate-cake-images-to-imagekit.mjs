import fs from "fs";
import { createClient } from "@supabase/supabase-js";
import ImageKit from "imagekit";

// Load .env
fs.readFileSync(".env", "utf8")
  .split("\n")
  .forEach((line) => {
    const eq = line.indexOf("=");
    if (eq > 0) {
      const k = line.slice(0, eq).trim();
      const v = line.slice(eq + 1).trim();
      if (k && !process.env[k]) process.env[k] = v;
    }
  });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const ik = new ImageKit({
  publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
  urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT,
});

async function run() {
  const { data: images, error } = await supabase.from("custom_cake_images").select("*");
  if (error) {
    console.error("Error fetching custom_cake_images:", error);
    return;
  }

  console.log(`Found ${images.length} custom_cake_images.`);
  for (const img of images) {
    if (img.storage_path.startsWith("http")) {
      console.log(`Image ${img.id} already has URL: ${img.storage_path}`);
      continue;
    }

    console.log(`Migrating ${img.storage_path} to ImageKit...`);
    const { data: fileData, error: dErr } = await supabase.storage
      .from("custom-cake-references")
      .download(img.storage_path);

    if (dErr || !fileData) {
      console.error(`Failed to download ${img.storage_path}:`, dErr);
      continue;
    }

    const buffer = Buffer.from(await fileData.arrayBuffer());
    const cleanFileName = img.storage_path.split("/").pop() || `cake-${img.id}.jpg`;

    const uploadRes = await ik.upload({
      file: buffer,
      fileName: cleanFileName,
      folder: "/custom-cakes",
      useUniqueFileName: false,
    });

    console.log(`Uploaded to ImageKit: ${uploadRes.url}`);

    const { error: uErr } = await supabase
      .from("custom_cake_images")
      .update({ storage_path: uploadRes.url })
      .eq("id", img.id);

    if (uErr) {
      console.error(`Failed to update DB for ${img.id}:`, uErr);
    } else {
      console.log(`Updated DB record ${img.id} successfully!`);
    }
  }
}

run();

