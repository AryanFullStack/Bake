const { resolveMediaUrl, isVpsMediaUrl } = require('../lib/media-url.ts');

const testCases = [
  "/uploads/products/product_1788636356_981a25.webp",
  "/products/product_1788636356_981a25.webp",
  "uploads/products/product_1788636356_981a25.webp",
  "products/product_1788636356_981a25.webp",
  "product_1788636356_981a25.webp",
  "/api/media/serve/products/product_1788636356_981a25.webp",
  "/bakery.png",
  "/placeholder-bake.svg",
  null,
  undefined,
  "https://images.unsplash.com/photo-12345"
];

console.log("=== Testing resolveMediaUrl ===");
for (const tc of testCases) {
  const res = resolveMediaUrl(tc);
  const isVps = isVpsMediaUrl(res);
  console.log(`Input:  ${tc}`);
  console.log(`Output: ${res}`);
  console.log(`Is VPS: ${isVps}`);
  console.log("-----------------------------------");
}
