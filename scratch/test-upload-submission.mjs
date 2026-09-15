import fs from "fs";
import sharp from "sharp";

async function testPost() {
  console.log("Creating test image...");
  const imgBuffer = await sharp({
    create: {
      width: 300,
      height: 300,
      channels: 4,
      background: { r: 200, g: 50, b: 50, alpha: 1 },
    },
  })
    .jpeg()
    .toBuffer();

  const blob = new Blob([imgBuffer], { type: "image/jpeg" });
  const form = new FormData();
  form.append("full_name", "Image Test User");
  form.append("phone", "03009999999");
  form.append("email", "imagetest@example.com");
  form.append("city", "Karachi");
  form.append("area", "DHA Phase 5");
  form.append("address", "Street 12, House 4");
  form.append("cake_type", "Celebration Cake");
  form.append("cake_size", "2 kg / 4.5 lbs (Serves 12-15)");
  form.append("flavor", "Signature Chocolate Fudge");
  form.append("preferred_delivery_date", "2026-10-15");
  form.append("preferred_delivery_time", "14:00");
  form.append("special_instructions", "Testing image upload via form");
  form.append("images", blob, "test-cake-sample.jpg");

  console.log("Sending POST to http://localhost:3001/api/custom-cake...");
  try {
    const res = await fetch("http://localhost:3001/api/custom-cake", {
      method: "POST",
      body: form,
    });

    const text = await res.text();
    console.log("HTTP Status:", res.status);
    console.log("Response Body:", text);
  } catch (err) {
    console.error("Fetch failed:", err);
  }
}

testPost();
