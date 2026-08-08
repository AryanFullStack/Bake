export const ALLOWED_FOLDERS = [
  "products",
  "product-gallery",
  "categories",
  "brands",
  "banners",
  "homepage",
  "users",
  "avatars",
  "blog",
  "gallery",
  "testimonials",
  "custom-cakes",
  "payment-receipts",
  "temp",
] as const;

export type AllowedFolder = typeof ALLOWED_FOLDERS[number];
