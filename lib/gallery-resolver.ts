import type { Product, ProductAttribute, ProductVariation } from "./types";

function variationMatches(selection: Record<string, string>, variation: ProductVariation) {
  return Object.entries(selection).every(([key, value]) => variation.attributes?.[key] === value);
}

/**
 * Deterministically resolves the product image gallery based on customer selections.
 * 
 * Priority Hierarchy:
 * 1. Exact Variant Gallery (if matching active variant has specific images assigned)
 * 2. Combined Attribute Gallery (if multiple image-controlling attributes are selected and have images)
 * 3. Primary Image Attribute Gallery (e.g. Color = Red -> Red gallery)
 * 4. General Product Gallery (product.image + product.images)
 */
export function resolveProductGallery(
  product: Product,
  selectedOptions: Record<string, string> = {}
): string[] {
  const generalGallery = Array.from(
    new Set([product.image, ...(product.images ?? [])].filter(Boolean))
  );

  const variations = (product.variations ?? []).filter((v) => v.status === "active");
  const attributes = product.attributes ?? [];

  // Priority 1: Check Exact Variant Gallery
  if (variations.length > 0 && Object.keys(selectedOptions).length > 0) {
    const activeVariation = variations.find((v) => variationMatches(selectedOptions, v));
    if (activeVariation) {
      const varImages = Array.from(
        new Set(
          [activeVariation.featuredImage, ...(activeVariation.galleryImages ?? [])].filter(Boolean) as string[]
        )
      );
      if (varImages.length > 0) {
        return varImages;
      }
    }
  }

  // Identify attributes configured to control images (or defaulting to Color)
  const imageControllingAttrs = attributes.filter(
    (attr) => attr.controlsImages || attr.displayType === "color" || attr.name.toLowerCase().includes("color")
  );

  // Collect linked images from selected image-controlling attributes
  const matchedAttributeGalleries: string[][] = [];

  for (const attr of imageControllingAttrs) {
    const selectedVal = selectedOptions[attr.slug];
    if (!selectedVal) continue;

    const valObj = attr.values?.find(
      (v) => v.slug === selectedVal || v.label === selectedVal
    );

    if (valObj && valObj.images && valObj.images.length > 0) {
      const cleaned = valObj.images.filter(Boolean);
      if (cleaned.length > 0) {
        matchedAttributeGalleries.push(cleaned);
      }
    }
  }

  // Priority 2: Combined Attribute Gallery (if multiple image-controlling attributes match)
  if (matchedAttributeGalleries.length > 1) {
    const combined = Array.from(new Set(matchedAttributeGalleries.flat()));
    if (combined.length > 0) return combined;
  }

  // Priority 3: Primary Image Attribute Gallery (first matching attribute gallery)
  if (matchedAttributeGalleries.length === 1) {
    return matchedAttributeGalleries[0];
  }

  // Priority 4: Fallback to General Product Gallery
  return generalGallery.length > 0 ? generalGallery : ["/placeholder-bake.svg"];
}
