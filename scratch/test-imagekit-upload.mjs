import fs from "fs";
import { createRequire } from "module";

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

const ImageKit = (await import("imagekit")).default;
const pub = process.env.IMAGEKIT_PUBLIC_KEY;
const priv = process.env.IMAGEKIT_PRIVATE_KEY;
const endpoint = process.env.IMAGEKIT_URL_ENDPOINT;

console.log("ImageKit configured:", Boolean(pub && priv && endpoint));
console.log("Endpoint:", endpoint);

const ik = new ImageKit({
  publicKey: pub,
  privateKey: priv,
  urlEndpoint: endpoint,
});

// Create a small 1x1 test PNG buffer
const testPng = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==", "base64");

try {
  const uploadRes = await ik.upload({
    file: testPng,
    fileName: `test-cake-${Date.now()}.png`,
    folder: "/custom-cakes",
    useUniqueFileName: false,
  });
  console.log("Upload test succeeded!");
  console.log("URL:", uploadRes.url);
  console.log("FileId:", uploadRes.fileId);

  // Clean up test file
  await ik.deleteFile(uploadRes.fileId);
  console.log("Cleanup succeeded!");
} catch (err) {
  console.error("Upload test failed:", err);
}

