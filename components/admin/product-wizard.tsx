"use client";

import { useMemo, useRef, useState, useEffect } from "react";
import Image from "next/image";
import {
  AlertTriangle,
  ArrowRight,
  Check,
  ChevronLeft,
  ChevronRight,
  Copy,
  Eye,
  Globe,
  Image as ImageIcon,
  Info,
  Layers,
  Link as LinkIcon,
  Minus,
  Palette,
  Plus,
  RefreshCw,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  Star,
  Tag,
  Trash2,
  Truck,
  Upload,
  Wand2,
  X,
} from "lucide-react";
import { formatPKR, generateSKU, publicStorageUrl, slugify } from "@/lib/catalog";
import { resolveProductGallery } from "@/lib/gallery-resolver";
import { MediaPickerModal } from "@/components/admin/media-picker-modal";


type Category = { id: string; name: string; slug: string; parent_id?: string | null };
type Brand = { id: string; name: string; slug: string };

type AttributeDisplayType = "button" | "color" | "image" | "radio";

type AttributeValue = {
  id?: string;
  label: string;
  slug: string;
  swatchColor?: string;
  swatchImage?: string;
  images?: string[];
  isActive?: boolean;
};

type Attribute = {
  id?: string;
  name: string;
  slug: string;
  displayType: AttributeDisplayType;
  controlsImages?: boolean;
  values: AttributeValue[];
};

type Variation = {
  id?: string;
  combinationKey: string;
  name: string;
  title?: string | null;
  description?: string | null;
  sku: string;
  barcode?: string;
  regularPrice: number;
  salePrice?: number | null;
  costPrice?: number | null;
  stockQuantity: number;
  lowStockThreshold: number;
  status: "active" | "inactive";
  attributes: Record<string, string>;
  featuredImage?: string | null;
  galleryImages: string[];
  weight?: number | null;
  dimensions?: Record<string, string | number>;
  specifications?: Record<string, string>;
};

type Props = {
  initialProduct?: any;
  product?: any;
  categories: Category[];
  brands: Brand[];
  onClose: () => void;
  onSuccess?: () => void;
  onSaved?: () => void;
};

function combinationKey(attributes: Record<string, string>): string {
  return Object.entries(attributes)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join("|");
}

function normaliseAttribute(attr: any): Attribute {
  return {
    id: attr.id,
    name: attr.name,
    slug: attr.slug || slugify(attr.name),
    displayType: attr.displayType || attr.display_type || "button",
    controlsImages: attr.controlsImages ?? attr.controls_images ?? (attr.displayType === "color" || attr.display_type === "color" || (attr.name || "").toLowerCase().includes("color")),
    values: (attr.values || attr.product_attribute_values || []).map((val: any) => {
      const rawImgs = val.images || (val.product_attribute_images || []).map((img: any) => img.storage_path || img);
      return {
        id: val.id,
        label: val.label,
        slug: val.slug || slugify(val.label),
        swatchColor: val.swatchColor || val.swatch_color || "",
        swatchImage: val.swatchImage || val.swatch_image || "",
        images: Array.isArray(rawImgs) ? rawImgs.filter(Boolean) : [],
        isActive: val.isActive !== false && val.is_active !== false,
      };
    }),
  };
}

function normaliseVariation(v: any): Variation {
  const attrs = v.attributes || {};
  return {
    id: v.id,
    name: v.name || "",
    title: v.title || null,
    description: v.description || null,
    combinationKey: v.combinationKey || v.combination_key || combinationKey(attrs),
    sku: v.sku || "",
    barcode: v.barcode || "",
    regularPrice: Number(v.regularPrice ?? v.regular_price ?? v.price ?? 0),
    salePrice: v.salePrice ?? v.sale_price ?? null,
    costPrice: v.costPrice ?? v.cost_price ?? null,
    stockQuantity: Number(v.stockQuantity ?? v.stock_quantity ?? 0),
    lowStockThreshold: Number(v.lowStockThreshold ?? v.low_stock_threshold ?? 5),
    status: v.status === "inactive" ? "inactive" : "active",
    attributes: attrs,
    featuredImage: v.featuredImage || v.featured_image || v.image_url || null,
    galleryImages: v.galleryImages || v.gallery_images || [],
    weight: v.weight ?? null,
    dimensions: v.dimensions || {},
    specifications: v.specifications || {},
  };
}

export function ProductWizard({ initialProduct, product, categories, brands, onClose, onSuccess, onSaved }: Props) {
  const current = initialProduct || product;
  const done = onSuccess || onSaved || (() => {});

  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type?: "success" | "error" } | null>(null);

  // Form State
  const [productType, setProductType] = useState<"simple" | "variable">(current?.product_type || "simple");
  const [hasVariants, setHasVariants] = useState<boolean>(current?.product_type === "variable" || Boolean(current?.product_variations?.length));
  const [name, setName] = useState(current?.name || "");
  const [slug, setSlug] = useState(current?.slug || "");
  const [originalSlug] = useState(current?.slug || "");
  const [sku, setSku] = useState(current?.sku || "");
  const [barcode, setBarcode] = useState(current?.barcode || "");
  const [categoryId, setCategoryId] = useState(current?.category_id || "");
  const [brandId, setBrandId] = useState(current?.brand_id || "");
  const [status, setStatus] = useState<"published" | "draft" | "hidden">(current?.status || (current?.is_published ? "published" : "draft"));
  const [isFeatured, setIsFeatured] = useState<boolean>(Boolean(current?.is_featured));
  const [isBestseller, setIsBestseller] = useState<boolean>(Boolean(current?.is_bestseller));

  // Pricing & Inventory
  const [regularPrice, setRegularPrice] = useState(String(current?.price ?? ""));
  const [salePrice, setSalePrice] = useState(current?.sale_price == null ? "" : String(current.sale_price));
  const [costPrice, setCostPrice] = useState(current?.cost_price == null ? "" : String(current.cost_price));
  const [stock, setStock] = useState(Number(current?.stock_quantity ?? 0));
  const [threshold, setThreshold] = useState(Number(current?.low_stock_threshold ?? 5));

  // Media
  const [featuredImage, setFeaturedImage] = useState<string>(current?.featured_image || "");
  const [galleryImages, setGalleryImages] = useState<string[]>(
    current?.product_images?.map((i: any) => i.storage_path) || current?.gallery_images || []
  );
  const [isMediaPickerOpen, setIsMediaPickerOpen] = useState(false);

  // Attributes & Variations
  const [attributes, setAttributes] = useState<Attribute[]>(
    (current?.product_attributes || current?.attributes || []).map(normaliseAttribute)
  );
  const [variations, setVariations] = useState<Variation[]>(
    (current?.product_variations || current?.variations || []).map(normaliseVariation)
  );
  const [selectedRows, setSelectedRows] = useState<number[]>([]);

  // Specifications (Key-Value)
  const [specifications, setSpecifications] = useState<Array<{ key: string; value: string }>>(() => {
    const raw = current?.specifications || {};
    return Object.entries(raw).map(([key, value]) => ({ key, value: String(value) }));
  });

  // Descriptions & Extra info
  const [description, setDescription] = useState(current?.description || "");
  const [shortDescription, setShortDescription] = useState(current?.short_description || "");
  const [ingredients, setIngredients] = useState(current?.ingredients || "");
  const [careInstructions, setCareInstructions] = useState(current?.care_instructions || "");
  const [deliveryInfo, setDeliveryInfo] = useState(current?.delivery_information || "");
  const [returnPolicy, setReturnPolicy] = useState(current?.return_policy || "");

  // SEO
  const [seoTitle, setSeoTitle] = useState(current?.seo_title || "");
  const [seoDescription, setSeoDescription] = useState(current?.seo_description || "");
  const [tagsInput, setTagsInput] = useState((current?.tags || []).join(", "));

  // UI state
  const [newAttributeName, setNewAttributeName] = useState("");
  const [newAttrDisplayType, setNewAttrDisplayType] = useState<AttributeDisplayType>("button");
  const [newValueLabel, setNewValueLabel] = useState<Record<string, string>>({});
  const [newValueColor, setNewValueColor] = useState<Record<string, string>>({});
  const [bulkPriceInput, setBulkPriceInput] = useState("");
  const [bulkStockInput, setBulkStockInput] = useState("");
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Smart Image Gallery state
  const [managingTarget, setManagingTarget] = useState<
    | { type: "attribute_value"; attrIndex: number; valIndex: number }
    | { type: "variation"; varIndex: number }
    | null
  >(null);
  const [autoMatchMatches, setAutoMatchMatches] = useState<
    Array<{ attrIndex: number; valIndex: number; attrName: string; valLabel: string; image: string }>
  >([]);
  const [showAutoMatchModal, setShowAutoMatchModal] = useState(false);
  const [previewSelections, setPreviewSelections] = useState<Record<string, string>>({});

  function toggleControlsImages(attrIndex: number) {
    setAttributes(prev =>
      prev.map((a, i) => (i === attrIndex ? { ...a, controlsImages: !a.controlsImages } : a))
    );
  }

  function applyImagesToVariants(attrIndex: number, valIndex: number) {
    const attr = attributes[attrIndex];
    const val = attr?.values[valIndex];
    if (!attr || !val || !val.images?.length) {
      showToastMsg("Please link at least one image to this option first", "error");
      return;
    }

    const valSlug = val.slug;
    const attrSlug = attr.slug;
    let count = 0;

    setVariations(prev =>
      prev.map(v => {
        if (v.attributes[attrSlug] === valSlug || v.attributes[attr.name] === val.label) {
          count++;
          return {
            ...v,
            featuredImage: val.images![0],
            galleryImages: val.images!.slice(1),
          };
        }
        return v;
      })
    );

    showToastMsg(`Attached ${val.images.length} images to ${count} ${val.label} variant(s)`);
  }

  function runAutoMatch() {
    if (!galleryImages.length) {
      showToastMsg("Please upload product images first to run Auto Match", "error");
      return;
    }
    if (!attributes.length) {
      showToastMsg("Please add product attributes first to run Auto Match", "error");
      return;
    }

    const matches: Array<{ attrIndex: number; valIndex: number; attrName: string; valLabel: string; image: string }> = [];

    attributes.forEach((attr, aIdx) => {
      attr.values.forEach((val, vIdx) => {
        const valTerm = val.label.toLowerCase().trim();
        const valSlugTerm = val.slug.toLowerCase().trim();
        if (!valTerm || valTerm.length < 2) return;

        galleryImages.forEach(img => {
          const filename = img.split("/").pop()?.toLowerCase() || "";
          if (filename.includes(valTerm) || filename.includes(valSlugTerm)) {
            if (!matches.some(m => m.attrIndex === aIdx && m.valIndex === vIdx && m.image === img)) {
              matches.push({
                attrIndex: aIdx,
                valIndex: vIdx,
                attrName: attr.name,
                valLabel: val.label,
                image: img,
              });
            }
          }
        });
      });
    });

    if (matches.length === 0) {
      showToastMsg("No image filenames matched attribute values (e.g. red-front.webp)");
      return;
    }

    setAutoMatchMatches(matches);
    setShowAutoMatchModal(true);
  }

  function confirmAutoMatch() {
    setAttributes(prev => {
      const next = [...prev];
      autoMatchMatches.forEach(m => {
        const targetVal = next[m.attrIndex]?.values[m.valIndex];
        if (targetVal) {
          const currentImgs = targetVal.images || [];
          if (!currentImgs.includes(m.image)) {
            next[m.attrIndex].values[m.valIndex] = {
              ...targetVal,
              images: [...currentImgs, m.image],
            };
            next[m.attrIndex].controlsImages = true;
          }
        }
      });
      return next;
    });
    setShowAutoMatchModal(false);
    showToastMsg(`Applied ${autoMatchMatches.length} auto-matched image references`);
  }

  const activeCategory = useMemo(() => categories.find(c => c.id === categoryId), [categories, categoryId]);

  // Auto-generate Slug & SKU when Name changes (for new products)
  useEffect(() => {
    if (!current && name) {
      setSlug(slugify(name));
      if (!sku) setSku(generateSKU(name, activeCategory?.name));
      if (!seoTitle) setSeoTitle(name);
    }
  }, [name, current, activeCategory, sku, seoTitle]);

  const showToastMsg = (msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Upload Files handler using Persistent VPS media API
  async function uploadFiles(files: FileList | File[], onUploaded: (urls: string[]) => void) {
    setUploading(true);
    try {
      const urls: string[] = [];
      for (const file of Array.from(files)) {
        if (file.size > 5 * 1024 * 1024) {
          showToastMsg(`"${file.name}" exceeds 5MB limit.`, "error");
          continue;
        }
        const form = new FormData();
        form.append("file", file);
        form.append("folder", "products");
        const res = await fetch("/api/media/upload", { method: "POST", body: form });
        const json = await res.json();
        if (json.success) urls.push(json.data.url);
        else showToastMsg(json.error || "Upload failed", "error");
      }
      if (urls.length > 0) onUploaded(urls);
    } catch {
      showToastMsg("Error uploading images", "error");
    } finally {
      setUploading(false);
    }
  }

  // Use Category Recommended Options
  async function applyCategoryRecommendations() {
    if (!categoryId && !activeCategory) {
      showToastMsg("Please select a Category first", "error");
      return;
    }
    try {
      const catSlug = activeCategory?.slug || "";
      const res = await fetch(`/api/admin/categories/templates?category_id=${categoryId}&category_slug=${catSlug}`);
      const json = await res.json();
      if (json.success && Array.isArray(json.templates) && json.templates.length > 0) {
        const newAttrs: Attribute[] = json.templates.map((tpl: any) => ({
          name: tpl.name,
          slug: tpl.slug || slugify(tpl.name),
          displayType: tpl.display_type || "button",
          values: (tpl.default_values || []).map((val: any) => ({
            label: val.label,
            slug: val.slug || slugify(val.label),
            swatchColor: val.swatchColor || val.swatch_color || "",
            swatchImage: val.swatchImage || val.swatch_image || "",
            isActive: true,
          })),
        }));
        setAttributes(newAttrs);
        setProductType("variable");
        setHasVariants(true);
        showToastMsg(`Applied recommended options for ${activeCategory?.name}`);
      }
    } catch {
      showToastMsg("Failed to load category recommendations", "error");
    }
  }

  // Add Attribute
  function addAttribute() {
    const attrName = newAttributeName.trim();
    if (!attrName) return;
    const attrSlug = slugify(attrName);
    if (attributes.some(a => a.slug === attrSlug)) {
      showToastMsg("Attribute already exists", "error");
      return;
    }
    setAttributes(prev => [
      ...prev,
      {
        name: attrName,
        slug: attrSlug,
        displayType: newAttrDisplayType,
        values: [],
      },
    ]);
    setNewAttributeName("");
  }

  // Add Attribute Value
  function addAttributeValue(attrIndex: number) {
    const targetAttr = attributes[attrIndex];
    if (!targetAttr) return;
    const label = (newValueLabel[targetAttr.slug] || "").trim();
    if (!label) return;
    const valSlug = slugify(label);
    if (targetAttr.values.some(v => v.slug === valSlug)) {
      showToastMsg("Value already exists in this attribute", "error");
      return;
    }
    const colorHex = newValueColor[targetAttr.slug] || "";
    setAttributes(prev =>
      prev.map((a, idx) =>
        idx !== attrIndex
          ? a
          : {
              ...a,
              values: [
                ...a.values,
                { label, slug: valSlug, swatchColor: colorHex, isActive: true },
              ],
            }
      )
    );
    setNewValueLabel(prev => ({ ...prev, [targetAttr.slug]: "" }));
    setNewValueColor(prev => ({ ...prev, [targetAttr.slug]: "" }));
  }

  // Remove Attribute Value
  function removeAttributeValue(attrIndex: number, valIndex: number) {
    setAttributes(prev =>
      prev.map((a, idx) =>
        idx !== attrIndex
          ? a
          : { ...a, values: a.values.filter((_, vIdx) => vIdx !== valIndex) }
      )
    );
  }

  // Smart Variant Generation (Non-destructive)
  function generateVariations() {
    if (!attributes.length || attributes.some(a => !a.values.length)) {
      showToastMsg("Please add at least one attribute with values first", "error");
      return;
    }

    const existingMap = new Map<string, Variation>();
    variations.forEach(v => existingMap.set(v.combinationKey, v));

    let combinations: Record<string, string>[] = [{}];
    for (const attr of attributes) {
      const activeValues = attr.values.filter(v => v.isActive !== false);
      if (!activeValues.length) continue;
      combinations = combinations.flatMap(partial =>
        activeValues.map(v => ({ ...partial, [attr.slug]: v.slug }))
      );
    }

    const baseRegPrice = Number(regularPrice) || 0;
    const baseSalePrice = salePrice ? Number(salePrice) : null;
    const catName = activeCategory?.name;

    const newVariationsList: Variation[] = combinations.map(combo => {
      const key = combinationKey(combo);
      const prev = existingMap.get(key);
      const comboLabels = Object.entries(combo).map(([attrSlug, valSlug]) => {
        const attrObj = attributes.find(a => a.slug === attrSlug);
        const valObj = attrObj?.values.find(v => v.slug === valSlug);
        return valObj?.label || valSlug;
      });

      if (prev) return prev; // Preserve existing custom price, stock, images

      const generatedSku = generateSKU(name || "PRODUCT", catName, comboLabels);
      const comboTitle = comboLabels.join(" / ");

      return {
        name: `${name || "Product"} - ${comboTitle}`,
        combinationKey: key,
        sku: generatedSku,
        regularPrice: baseRegPrice,
        salePrice: baseSalePrice,
        stockQuantity: 0,
        lowStockThreshold: threshold,
        status: "active",
        attributes: combo,
        galleryImages: [],
      };
    });

    setVariations(newVariationsList);
    showToastMsg(`Generated ${newVariationsList.length} variant combinations`);
  }

  // Bulk Variant Edits
  function applyBulkPrice() {
    const val = Number(bulkPriceInput);
    if (isNaN(val) || val < 0) return;
    setVariations(prev =>
      prev.map((v, idx) =>
        selectedRows.length === 0 || selectedRows.includes(idx) ? { ...v, regularPrice: val } : v
      )
    );
    setBulkPriceInput("");
    showToastMsg("Bulk price updated");
  }

  function applyBulkStock() {
    const val = Number(bulkStockInput);
    if (isNaN(val) || val < 0) return;
    setVariations(prev =>
      prev.map((v, idx) =>
        selectedRows.length === 0 || selectedRows.includes(idx) ? { ...v, stockQuantity: val } : v
      )
    );
    setBulkStockInput("");
    showToastMsg("Bulk stock updated");
  }

  function autoGenAllSKUs() {
    setVariations(prev =>
      prev.map((v, idx) => {
        if (selectedRows.length > 0 && !selectedRows.includes(idx)) return v;
        const comboLabels = Object.values(v.attributes);
        return { ...v, sku: generateSKU(name || "PROD", activeCategory?.name, comboLabels) };
      })
    );
    showToastMsg("SKUs regenerated");
  }

  // Add / Remove Specifications
  function addSpecification() {
    setSpecifications(prev => [...prev, { key: "", value: "" }]);
  }

  function updateSpecification(idx: number, key: string, value: string) {
    setSpecifications(prev => prev.map((item, i) => (i === idx ? { key, value } : item)));
  }

  function removeSpecification(idx: number) {
    setSpecifications(prev => prev.filter((_, i) => i !== idx));
  }

  // Save Product
  async function saveProduct() {
    if (!name.trim()) {
      showToastMsg("Product name is required", "error");
      setStep(1);
      return;
    }
    if (!sku.trim()) {
      showToastMsg("SKU is required", "error");
      setStep(1);
      return;
    }

    setSaving(true);

    const specsMap: Record<string, string> = {};
    specifications.forEach(s => {
      if (s.key.trim()) specsMap[s.key.trim()] = s.value.trim();
    });

    const isVar = hasVariants && productType === "variable";
    const totalStock = isVar
      ? variations.reduce((sum, v) => sum + (v.status === "active" ? v.stockQuantity : 0), 0)
      : stock;

    const payload = {
      id: current?.id,
      name,
      slug: slug || slugify(name),
      sku,
      barcode,
      product_type: isVar ? "variable" : "simple",
      brand_id: brandId || null,
      category_id: categoryId || null,
      description,
      short_description: shortDescription,
      price: Number(regularPrice) || 0,
      sale_price: salePrice ? Number(salePrice) : null,
      cost_price: costPrice ? Number(costPrice) : null,
      stock_quantity: totalStock,
      low_stock_threshold: threshold,
      featured_image: featuredImage || galleryImages[0] || "",
      gallery_images: galleryImages,
      attributes: isVar ? attributes : [],
      variations: isVar
        ? variations.map(v => ({
            ...v,
            combination_key: v.combinationKey,
            regular_price: v.regularPrice,
            sale_price: v.salePrice,
            cost_price: v.costPrice,
            stock_quantity: v.stockQuantity,
            low_stock_threshold: v.lowStockThreshold,
            featured_image: v.featuredImage,
            gallery_images: v.galleryImages,
          }))
        : [],
      status,
      is_published: status === "published",
      is_featured: isFeatured,
      is_bestseller: isBestseller,
      specifications: specsMap,
      ingredients,
      care_instructions: careInstructions,
      delivery_information: deliveryInfo,
      return_policy: returnPolicy,
      seo_title: seoTitle || name,
      seo_description: seoDescription || shortDescription || description.slice(0, 160),
      tags: tagsInput.split(",").map((t: string) => t.trim()).filter(Boolean),
    };

    try {
      const res = await fetch("/api/admin/products", {
        method: current?.id ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (json.success) {
        showToastMsg(current?.id ? "Product updated successfully" : "Product created successfully");
        setTimeout(() => done(), 600);
      } else {
        showToastMsg(json.error || "Save failed", "error");
      }
    } catch {
      showToastMsg("Network error saving product", "error");
    } finally {
      setSaving(false);
    }
  }

  const steps = [
    { id: 1, label: "Basics" },
    { id: 2, label: "Media" },
    { id: 3, label: "Pricing & Stock" },
    { id: 4, label: "Attributes & Swatches" },
    { id: 5, label: "Variant Matrix" },
    { id: 6, label: "Specifications" },
    { id: 7, label: "Descriptions" },
    { id: 8, label: "SEO & Tags" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy/60 p-3 sm:p-6 backdrop-blur-sm animate-scale-in">
      <div className="flex h-[94vh] w-full max-w-6xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl border border-admin-border">
        {/* Header */}
        <header className="flex items-center justify-between border-b border-admin-border px-6 py-4 bg-white">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-orange/10 px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-orange">
                Product Builder
              </span>
              {current?.id && (
                <span className="text-xs font-mono text-admin-muted">ID: {current.id.slice(0, 8)}</span>
              )}
            </div>
            <h2 className="mt-0.5 text-xl font-bold text-navy">
              {current?.id ? `Edit: ${current.name}` : "Add New Product"}
            </h2>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowPreviewModal(true)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-admin-border bg-admin-bg px-3.5 py-2 text-xs font-bold text-navy hover:bg-white transition-colors"
            >
              <Eye size={14} className="text-orange" /> Preview Storefront
            </button>
            <button
              onClick={onClose}
              className="rounded-full p-2 text-admin-muted hover:bg-admin-bg hover:text-navy transition-colors"
              aria-label="Close"
            >
              <X size={20} />
            </button>
          </div>
        </header>

        {/* Step Tabs Navigation Bar */}
        <div className="flex overflow-x-auto border-b border-admin-border bg-admin-bg/60">
          {steps.map(s => {
            const active = step === s.id;
            return (
              <button
                key={s.id}
                onClick={() => setStep(s.id)}
                className={`flex shrink-0 items-center gap-2 border-b-2 px-4 py-3 text-xs font-extrabold transition-colors ${
                  active
                    ? "border-orange bg-white text-orange shadow-xs"
                    : "border-transparent text-admin-muted hover:text-navy"
                }`}
              >
                <span className={`grid h-5 w-5 place-items-center rounded-full text-[10px] font-bold ${active ? "bg-orange text-white" : "bg-admin-border text-admin-muted"}`}>
                  {s.id}
                </span>
                {s.label}
              </button>
            );
          })}
        </div>

        {/* Body Content */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          {/* STEP 1: BASICS */}
          {step === 1 && (
            <div className="mx-auto grid max-w-4xl gap-6">
              <div>
                <h3 className="text-xl font-bold text-navy">Product Basics</h3>
                <p className="mt-1 text-xs text-admin-muted">
                  Configure primary identification, categorization, and product structure.
                </p>
              </div>

              {/* Product Type Switch Card */}
              <div className="rounded-2xl border border-admin-border bg-admin-bg/40 p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-bold text-navy text-sm">Product Has Options / Variants</span>
                    <p className="mt-0.5 text-xs text-admin-muted">
                      Enable if this product comes in different Sizes, Colors, Flavors, Materials, etc.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const next = !hasVariants;
                      setHasVariants(next);
                      setProductType(next ? "variable" : "simple");
                    }}
                    className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${hasVariants ? "bg-orange" : "bg-admin-border"}`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${hasVariants ? "translate-x-5" : "translate-x-0"}`}
                    />
                  </button>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="field-label">
                  Product Name <span className="text-orange">*</span>
                  <input
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="e.g. Premium Chronograph Watch / Belgian Chocolate Cake"
                    className="field-shell mt-2"
                  />
                </label>

                <label className="field-label">
                  SKU (Stock Keeping Unit) <span className="text-orange">*</span>
                  <div className="relative mt-2">
                    <input
                      value={sku}
                      onChange={e => setSku(e.target.value)}
                      placeholder="e.g. WATCH-CHRONO-001"
                      className="field-shell pr-20 font-mono text-xs"
                    />
                    <button
                      type="button"
                      onClick={() => setSku(generateSKU(name || "PROD", activeCategory?.name))}
                      className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg bg-admin-bg px-2 py-1 text-[10px] font-bold text-navy hover:bg-orange hover:text-white transition-colors"
                    >
                      Auto Gen
                    </button>
                  </div>
                </label>

                <label className="field-label">
                  Product Slug
                  <input
                    value={slug}
                    onChange={e => setSlug(slugify(e.target.value))}
                    className="field-shell mt-2 font-mono text-xs"
                  />
                  {current?.is_published && slug !== originalSlug && (
                    <span className="mt-1 flex items-center gap-1 text-[11px] font-bold text-amber-600">
                      <AlertTriangle size={12} /> Changing slug of a published product may affect SEO links.
                    </span>
                  )}
                </label>

                <label className="field-label">
                  Barcode / EAN (Optional)
                  <input
                    value={barcode}
                    onChange={e => setBarcode(e.target.value)}
                    placeholder="e.g. 8901234567890"
                    className="field-shell mt-2 font-mono text-xs"
                  />
                </label>

                <label className="field-label">
                  Category
                  <select
                    value={categoryId}
                    onChange={e => setCategoryId(e.target.value)}
                    className="field-shell mt-2"
                  >
                    <option value="">Choose category…</option>
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="field-label">
                  Brand (Optional)
                  <select
                    value={brandId}
                    onChange={e => setBrandId(e.target.value)}
                    className="field-shell mt-2"
                  >
                    <option value="">No brand</option>
                    {brands.map(b => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              {/* Status & Flags */}
              <div className="grid gap-4 sm:grid-cols-3">
                <label className="field-label">
                  Publish Status
                  <select
                    value={status}
                    onChange={e => setStatus(e.target.value as any)}
                    className="field-shell mt-2"
                  >
                    <option value="published">Published (Visible to customers)</option>
                    <option value="draft">Draft (Hidden in admin draft)</option>
                    <option value="hidden">Hidden (Unlisted product link)</option>
                  </select>
                </label>

                <label className="flex items-center gap-3 rounded-xl border border-admin-border bg-white p-4 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isFeatured}
                    onChange={e => setIsFeatured(e.target.checked)}
                    className="h-4 w-4 accent-orange rounded"
                  />
                  <div>
                    <span className="text-xs font-bold text-navy">★ Featured Product</span>
                    <p className="text-[10px] text-admin-muted">Highlight on homepage showcase</p>
                  </div>
                </label>

                <label className="flex items-center gap-3 rounded-xl border border-admin-border bg-white p-4 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isBestseller}
                    onChange={e => setIsBestseller(e.target.checked)}
                    className="h-4 w-4 accent-orange rounded"
                  />
                  <div>
                    <span className="text-xs font-bold text-navy">🔥 Bestseller Badge</span>
                    <p className="text-[10px] text-admin-muted">Show bestseller pill on cards</p>
                  </div>
                </label>
              </div>
            </div>
          )}

          {/* STEP 2: MEDIA */}
          {step === 2 && (
            <div className="mx-auto grid max-w-4xl gap-6">
              <div>
                <h3 className="text-xl font-bold text-navy">Product Media & Gallery</h3>
                <p className="mt-1 text-xs text-admin-muted">
                  Upload high-resolution square images. First image automatically becomes the main image. Stored persistently on Hostinger VPS.
                </p>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                multiple
                className="hidden"
                onChange={e => e.target.files?.length && uploadFiles(e.target.files, urls => {
                  setGalleryImages(prev => [...prev, ...urls]);
                  if (!featuredImage) setFeaturedImage(urls[0]);
                })}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setIsMediaPickerOpen(true)}
                  className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-orange bg-orange-light/30 p-6 text-center cursor-pointer transition hover:bg-orange hover:text-white group"
                >
                  <div className="grid h-12 w-12 place-items-center rounded-full bg-orange text-white group-hover:bg-white group-hover:text-orange shadow-md mb-2 transition-colors">
                    <ImageIcon size={22} />
                  </div>
                  <p className="font-bold text-sm">Choose From Media Library</p>
                  <p className="mt-1 text-xs opacity-80">Select existing VPS images without uploading duplicates.</p>
                </button>

                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-admin-border bg-admin-bg/40 p-6 text-center cursor-pointer transition hover:border-orange hover:bg-orange/5"
                >
                  <div className="grid h-12 w-12 place-items-center rounded-full bg-navy/10 text-navy mb-2">
                    <Upload size={22} />
                  </div>
                  <p className="font-bold text-navy text-sm">
                    {uploading ? "Uploading to VPS…" : "Upload New Images"}
                  </p>
                  <p className="mt-1 text-xs text-admin-muted">
                    Supports PNG, JPG, WebP up to 5 MB. WebP optimized.
                  </p>
                </div>
              </div>


              {galleryImages.length > 0 && (
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 md:grid-cols-5">
                  {galleryImages.map((img, idx) => {
                    const isMain = featuredImage === img || (!featuredImage && idx === 0);
                    return (
                      <div
                        key={`${img}-${idx}`}
                        className={`group relative aspect-square overflow-hidden rounded-2xl border-2 transition-all ${isMain ? "border-orange shadow-md" : "border-admin-border bg-admin-bg"}`}
                      >
                        <img src={publicStorageUrl(img)} alt="" className="h-full w-full object-cover" />
                        
                        {/* Overlay Controls */}
                        <div className="absolute inset-0 bg-navy/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2">
                          <button
                            onClick={() => {
                              setGalleryImages(prev => prev.filter((_, i) => i !== idx));
                              if (featuredImage === img) setFeaturedImage(galleryImages.find(g => g !== img) || "");
                            }}
                            className="self-end rounded-full bg-white p-1 text-red-500 hover:bg-red-50"
                            aria-label="Remove image"
                          >
                            <Trash2 size={13} />
                          </button>

                          {!isMain && (
                            <button
                              onClick={() => setFeaturedImage(img)}
                              className="rounded-lg bg-orange px-2 py-1 text-[10px] font-bold text-white shadow"
                            >
                              Set Main
                            </button>
                          )}
                        </div>

                        {isMain && (
                          <span className="absolute bottom-2 left-2 rounded-full bg-navy px-2 py-0.5 text-[9px] font-extrabold text-white">
                            Main Image
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* STEP 3: PRICING & STOCK */}
          {step === 3 && (
            <div className="mx-auto grid max-w-4xl gap-6">
              <div>
                <h3 className="text-xl font-bold text-navy">Pricing & Base Inventory</h3>
                <p className="mt-1 text-xs text-admin-muted">
                  {hasVariants
                    ? "Set base pricing. You can apply these to all variants in Step 5 or customize individually."
                    : "Configure single product price and stock quantity."}
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <label className="field-label">
                  Regular Price (PKR) <span className="text-orange">*</span>
                  <input
                    type="number"
                    value={regularPrice}
                    onChange={e => setRegularPrice(e.target.value)}
                    placeholder="e.g. 2500"
                    className="field-shell mt-2 font-bold text-navy"
                  />
                </label>

                <label className="field-label">
                  Sale Price (PKR)
                  <input
                    type="number"
                    value={salePrice}
                    onChange={e => setSalePrice(e.target.value)}
                    placeholder="e.g. 1999"
                    className="field-shell mt-2 text-green font-bold"
                  />
                </label>

                <label className="field-label">
                  Cost Price (PKR - Admin Only)
                  <input
                    type="number"
                    value={costPrice}
                    onChange={e => setCostPrice(e.target.value)}
                    placeholder="e.g. 1200"
                    className="field-shell mt-2 text-admin-muted"
                  />
                </label>
              </div>

              {!hasVariants && (
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="field-label">
                    Stock Quantity <span className="text-orange">*</span>
                    <input
                      type="number"
                      value={stock}
                      onChange={e => setStock(Number(e.target.value))}
                      className="field-shell mt-2 font-bold text-navy"
                    />
                  </label>

                  <label className="field-label">
                    Low Stock Threshold Warning
                    <input
                      type="number"
                      value={threshold}
                      onChange={e => setThreshold(Number(e.target.value))}
                      className="field-shell mt-2"
                    />
                  </label>
                </div>
              )}
            </div>
          )}

          {/* STEP 4: ATTRIBUTES & SWATCHES */}
          {step === 4 && (
            <div className="mx-auto grid max-w-4xl gap-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-xl font-bold text-navy">Attributes & Image Mapping</h3>
                  <p className="mt-1 text-xs text-admin-muted">
                    Define options (Color, Size, Style, Material, etc.) and link option-specific image galleries.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={runAutoMatch}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-blue-500/30 bg-blue-50 px-3.5 py-2 text-xs font-bold text-blue-600 hover:bg-blue-600 hover:text-white transition-colors"
                  >
                    <Sparkles size={14} /> Auto Match Images
                  </button>

                  {categoryId && (
                    <button
                      type="button"
                      onClick={applyCategoryRecommendations}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-orange/30 bg-orange/10 px-3.5 py-2 text-xs font-bold text-orange hover:bg-orange hover:text-white transition-colors"
                    >
                      <Wand2 size={14} /> Use Recommended Options
                    </button>
                  )}
                </div>
              </div>

              {/* Add Custom Attribute Bar */}
              <div className="flex flex-wrap gap-2 rounded-2xl border border-admin-border bg-admin-bg/50 p-4">
                <input
                  value={newAttributeName}
                  onChange={e => setNewAttributeName(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && addAttribute()}
                  placeholder="Attribute name (e.g. Color, Size, Flavor, Strap Material)"
                  className="field-shell max-w-xs font-bold"
                />
                <select
                  value={newAttrDisplayType}
                  onChange={e => setNewAttrDisplayType(e.target.value as AttributeDisplayType)}
                  className="field-shell max-w-[150px]"
                >
                  <option value="button">Button Pill</option>
                  <option value="color">Color Swatch</option>
                  <option value="radio">Radio Button</option>
                  <option value="image">Image Swatch</option>
                </select>
                <button type="button" onClick={addAttribute} className="button-primary shrink-0">
                  <Plus size={15} /> Add Attribute
                </button>
              </div>

              {/* Attributes List */}
              {attributes.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-admin-border bg-admin-bg/30 p-10 text-center">
                  <Layers className="mx-auto text-admin-muted" size={28} />
                  <p className="mt-3 font-bold text-navy text-sm">No attributes configured</p>
                  <p className="mt-1 text-xs text-admin-muted">
                    Add an attribute above or click "Use Recommended Options" to populate catalog options.
                  </p>
                </div>
              ) : (
                <div className="grid gap-5">
                  {attributes.map((attr, attrIdx) => (
                    <div key={attr.slug} className="rounded-2xl border border-admin-border bg-white p-5 shadow-xs">
                      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-admin-border/60 pb-4">
                        <div className="flex items-center gap-3">
                          <input
                            value={attr.name}
                            onChange={e => {
                              const val = e.target.value;
                              setAttributes(prev =>
                                prev.map((a, i) => (i === attrIdx ? { ...a, name: val, slug: slugify(val) } : a))
                              );
                            }}
                            className="field-shell max-w-xs font-bold text-navy"
                          />
                          <select
                            value={attr.displayType}
                            onChange={e => {
                              const val = e.target.value as AttributeDisplayType;
                              setAttributes(prev =>
                                prev.map((a, i) => (i === attrIdx ? { ...a, displayType: val } : a))
                              );
                            }}
                            className="field-shell max-w-[140px]"
                          >
                            <option value="button">Buttons</option>
                            <option value="color">Color Swatch</option>
                            <option value="radio">Radio</option>
                            <option value="image">Image Swatch</option>
                          </select>
                        </div>

                        <div className="flex items-center gap-4">
                          {/* Controls Product Images Toggle Switch */}
                          <div className="flex items-center gap-2 rounded-xl border border-admin-border bg-admin-bg/60 px-3 py-1.5">
                            <span className="text-xs font-bold text-navy">Controls Product Images</span>
                            <button
                              type="button"
                              onClick={() => toggleControlsImages(attrIdx)}
                              className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${attr.controlsImages ? "bg-orange" : "bg-admin-border"}`}
                            >
                              <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${attr.controlsImages ? "translate-x-4" : "translate-x-0"}`} />
                            </button>
                            <span className={`text-[10px] font-extrabold uppercase ${attr.controlsImages ? "text-orange" : "text-admin-muted"}`}>
                              {attr.controlsImages ? "YES" : "NO"}
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={() => setAttributes(prev => prev.filter((_, i) => i !== attrIdx))}
                            className="text-red-500 hover:text-red-700 p-1"
                            aria-label="Remove attribute"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>

                      {/* Option Values List with Images Mapping */}
                      <div className="mt-5 space-y-3">
                        <span className="text-xs font-bold uppercase tracking-wider text-admin-muted">
                          Option Values & Linked Galleries:
                        </span>

                        {attr.values.length === 0 ? (
                          <p className="text-xs italic text-admin-muted">No values added yet for {attr.name}.</p>
                        ) : (
                          <div className="grid gap-3 sm:grid-cols-2">
                            {attr.values.map((val, valIdx) => {
                              const imgCount = val.images?.length ?? 0;
                              return (
                                <div key={val.slug} className="flex flex-col justify-between rounded-xl border border-admin-border bg-admin-bg/40 p-3.5 space-y-3">
                                  <div className="flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-2">
                                      {attr.displayType === "color" && (
                                        <span
                                          className="h-4 w-4 rounded-full border border-black/15 shadow-xs"
                                          style={{ backgroundColor: val.swatchColor || "#cccccc" }}
                                        />
                                      )}
                                      <span className="font-bold text-navy text-xs">{val.label}</span>
                                    </div>

                                    {/* Admin Image Status Indicator Badge */}
                                    {imgCount > 0 ? (
                                      <span className="rounded-full bg-green/10 px-2.5 py-0.5 text-[10px] font-extrabold text-green flex items-center gap-1">
                                        <Check size={11} strokeWidth={3} /> {imgCount} {imgCount === 1 ? "Image" : "Images"}
                                      </span>
                                    ) : attr.controlsImages ? (
                                      <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[10px] font-extrabold text-amber-700 flex items-center gap-1">
                                        <AlertTriangle size={11} /> No Images
                                      </span>
                                    ) : (
                                      <span className="rounded-full bg-admin-border/60 px-2.5 py-0.5 text-[10px] font-bold text-admin-muted">
                                        ○ No Image Mapping
                                      </span>
                                    )}
                                  </div>

                                  {/* Linked Images Thumbnails Strip */}
                                  {imgCount > 0 && (
                                    <div className="flex gap-1.5 overflow-x-auto pb-1">
                                      {val.images!.map((img, iIdx) => (
                                        <div key={iIdx} className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg border border-admin-border bg-white">
                                          <img src={publicStorageUrl(img)} alt="" className="h-full w-full object-cover" />
                                        </div>
                                      ))}
                                    </div>
                                  )}

                                  {/* Actions Bar */}
                                  <div className="flex items-center justify-between border-t border-admin-border/60 pt-2.5">
                                    <button
                                      type="button"
                                      onClick={() => setManagingTarget({ type: "attribute_value", attrIndex: attrIdx, valIndex: valIdx })}
                                      className="inline-flex items-center gap-1 text-[11px] font-bold text-orange hover:underline"
                                    >
                                      <ImageIcon size={13} /> Manage Images
                                    </button>

                                    {hasVariants && imgCount > 0 && (
                                      <button
                                        type="button"
                                        onClick={() => applyImagesToVariants(attrIdx, valIdx)}
                                        className="text-[10px] font-bold text-admin-muted hover:text-navy"
                                        title={`Apply ${val.label} images to all generated variants`}
                                      >
                                        Apply to Variants →
                                      </button>
                                    )}

                                    <button
                                      type="button"
                                      onClick={() => removeAttributeValue(attrIdx, valIdx)}
                                      className="text-admin-muted hover:text-red-500"
                                      aria-label="Remove value"
                                    >
                                      <X size={13} />
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      {/* Add Value Controls */}
                      <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-admin-border/40 pt-4">
                        <input
                          value={newValueLabel[attr.slug] || ""}
                          onChange={e => setNewValueLabel(prev => ({ ...prev, [attr.slug]: e.target.value }))}
                          onKeyDown={e => e.key === "Enter" && addAttributeValue(attrIdx)}
                          placeholder={`Add ${attr.name} option value (e.g. Red, Blue, Large)`}
                          className="field-shell max-w-xs text-xs"
                        />

                        {attr.displayType === "color" && (
                          <div className="flex items-center gap-2">
                            <input
                              type="color"
                              value={newValueColor[attr.slug] || "#ff0000"}
                              onChange={e => setNewValueColor(prev => ({ ...prev, [attr.slug]: e.target.value }))}
                              className="h-9 w-9 cursor-pointer rounded-xl border border-admin-border p-0.5"
                            />
                            <input
                              type="text"
                              value={newValueColor[attr.slug] || ""}
                              onChange={e => setNewValueColor(prev => ({ ...prev, [attr.slug]: e.target.value }))}
                              placeholder="#FF0000"
                              className="field-shell w-20 font-mono text-xs"
                            />
                          </div>
                        )}

                        <button
                          type="button"
                          onClick={() => addAttributeValue(attrIdx)}
                          className="button-secondary py-1.5 text-xs shrink-0"
                        >
                          <Plus size={14} /> Add Value
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* STEP 5: VARIANT MATRIX */}
          {step === 5 && (
            <div className="grid gap-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-xl font-bold text-navy">Variant Matrix</h3>
                  <p className="mt-1 text-xs text-admin-muted">
                    Manage combinations, individual pricing, stock, SKUs, and variant-specific images.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={generateVariations}
                  disabled={!attributes.length || attributes.some(a => !a.values.length)}
                  className="button-primary disabled:opacity-40"
                >
                  <RefreshCw size={15} /> Generate Combinations
                </button>
              </div>

              {/* Bulk Edit Bar */}
              {variations.length > 0 && (
                <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-admin-border bg-admin-bg/50 p-4">
                  <span className="text-xs font-bold text-navy">
                    Bulk Actions ({selectedRows.length ? `${selectedRows.length} selected` : "All variants"}):
                  </span>

                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      value={bulkPriceInput}
                      onChange={e => setBulkPriceInput(e.target.value)}
                      placeholder="Set Price"
                      className="field-shell w-24 text-xs"
                    />
                    <button type="button" onClick={applyBulkPrice} className="button-secondary py-1.5 px-2.5 text-xs">
                      Apply Price
                    </button>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      value={bulkStockInput}
                      onChange={e => setBulkStockInput(e.target.value)}
                      placeholder="Set Stock"
                      className="field-shell w-24 text-xs"
                    />
                    <button type="button" onClick={applyBulkStock} className="button-secondary py-1.5 px-2.5 text-xs">
                      Apply Stock
                    </button>
                  </div>

                  <button type="button" onClick={autoGenAllSKUs} className="button-secondary py-1.5 px-2.5 text-xs">
                    Auto-Gen SKUs
                  </button>
                </div>
              )}

              {/* Variations Table */}
              {variations.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-admin-border bg-admin-bg/30 p-10 text-center">
                  <ImageIcon className="mx-auto text-admin-muted" size={28} />
                  <p className="mt-3 font-bold text-navy text-sm">No variants generated yet</p>
                  <p className="mt-1 text-xs text-admin-muted">
                    Click "Generate Combinations" above to populate the matrix.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-2xl border border-admin-border bg-white">
                  <table className="w-full text-left text-xs min-w-[900px]">
                    <thead className="border-b border-admin-border bg-admin-bg font-extrabold uppercase tracking-wider text-admin-muted">
                      <tr>
                        <th className="p-3 w-10">
                          <input
                            type="checkbox"
                            checked={selectedRows.length === variations.length && variations.length > 0}
                            onChange={() =>
                              setSelectedRows(
                                selectedRows.length === variations.length ? [] : variations.map((_, i) => i)
                              )
                            }
                            className="h-4 w-4 accent-orange rounded cursor-pointer"
                          />
                        </th>
                        <th className="p-3">Variant Option</th>
                        <th className="p-3">SKU</th>
                        <th className="p-3">Regular Price</th>
                        <th className="p-3">Sale Price</th>
                        <th className="p-3">Stock</th>
                        <th className="p-3">Image</th>
                        <th className="p-3">Status</th>
                        <th className="p-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-admin-border/60">
                      {variations.map((varItem, idx) => {
                        const isSelected = selectedRows.includes(idx);
                        return (
                          <tr key={varItem.combinationKey} className={`hover:bg-admin-bg/40 ${isSelected ? "bg-orange/5" : ""}`}>
                            <td className="p-3">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() =>
                                  setSelectedRows(prev =>
                                    prev.includes(idx) ? prev.filter(i => i !== idx) : [...prev, idx]
                                  )
                                }
                                className="h-4 w-4 accent-orange rounded cursor-pointer"
                              />
                            </td>
                            <td className="p-3">
                              <p className="font-bold text-navy">
                                {Object.entries(varItem.attributes)
                                  .map(([k, v]) => `${k}: ${v}`)
                                  .join(" · ")}
                              </p>
                            </td>
                            <td className="p-3">
                              <input
                                value={varItem.sku}
                                onChange={e =>
                                  setVariations(prev =>
                                    prev.map((v, i) => (i === idx ? { ...v, sku: e.target.value } : v))
                                  )
                                }
                                className="field-shell w-36 font-mono text-xs"
                              />
                            </td>
                            <td className="p-3">
                              <input
                                type="number"
                                value={varItem.regularPrice}
                                onChange={e =>
                                  setVariations(prev =>
                                    prev.map((v, i) =>
                                      i === idx ? { ...v, regularPrice: Number(e.target.value) } : v
                                    )
                                  )
                                }
                                className="field-shell w-24 font-bold text-navy"
                              />
                            </td>
                            <td className="p-3">
                              <input
                                type="number"
                                value={varItem.salePrice ?? ""}
                                onChange={e =>
                                  setVariations(prev =>
                                    prev.map((v, i) =>
                                      i === idx ? { ...v, salePrice: e.target.value ? Number(e.target.value) : null } : v
                                    )
                                  )
                                }
                                className="field-shell w-24 text-green font-bold"
                              />
                            </td>
                            <td className="p-3">
                              <input
                                type="number"
                                value={varItem.stockQuantity}
                                onChange={e =>
                                  setVariations(prev =>
                                    prev.map((v, i) =>
                                      i === idx ? { ...v, stockQuantity: Number(e.target.value) } : v
                                    )
                                  )
                                }
                                className="field-shell w-20 font-bold"
                              />
                            </td>
                            <td className="p-3">
                              <label className="flex h-10 w-10 cursor-pointer items-center justify-center overflow-hidden rounded-xl border border-admin-border bg-admin-bg hover:border-orange">
                                {varItem.featuredImage ? (
                                  <img src={publicStorageUrl(varItem.featuredImage)} alt="" className="h-full w-full object-cover" />
                                ) : (
                                  <Upload size={14} className="text-admin-muted" />
                                )}
                                <input
                                  type="file"
                                  accept="image/png,image/jpeg,image/webp"
                                  className="hidden"
                                  onChange={e =>
                                    e.target.files?.length &&
                                    uploadFiles(e.target.files, urls => {
                                      setVariations(prev =>
                                        prev.map((v, i) =>
                                          i === idx ? { ...v, featuredImage: urls[0] } : v
                                        )
                                      );
                                    })
                                  }
                                />
                              </label>
                            </td>
                            <td className="p-3">
                              <select
                                value={varItem.status}
                                onChange={e =>
                                  setVariations(prev =>
                                    prev.map((v, i) =>
                                      i === idx ? { ...v, status: e.target.value as any } : v
                                    )
                                  )
                                }
                                className="field-shell w-24"
                              >
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                              </select>
                            </td>
                            <td className="p-3 text-right">
                              <button
                                type="button"
                                onClick={() => setVariations(prev => prev.filter((_, i) => i !== idx))}
                                className="text-red-500 hover:text-red-700"
                              >
                                <Trash2 size={15} />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* STEP 6: SPECIFICATIONS */}
          {step === 6 && (
            <div className="mx-auto grid max-w-4xl gap-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-navy">Product Specifications</h3>
                  <p className="mt-1 text-xs text-admin-muted">
                    Key-value technical details (e.g. Material → Stainless Steel, Weight → 500g, Capacity → 1.5L).
                  </p>
                </div>
                <button type="button" onClick={addSpecification} className="button-primary shrink-0">
                  <Plus size={15} /> Add Specification
                </button>
              </div>

              {specifications.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-admin-border bg-admin-bg/30 p-10 text-center">
                  <Settings className="mx-auto text-admin-muted" size={28} />
                  <p className="mt-3 font-bold text-navy text-sm">No specifications added</p>
                  <p className="mt-1 text-xs text-admin-muted">
                    Add non-purchasable specifications to display in the product details tab.
                  </p>
                </div>
              ) : (
                <div className="grid gap-3">
                  {specifications.map((spec, sIdx) => (
                    <div key={sIdx} className="flex items-center gap-3">
                      <input
                        value={spec.key}
                        onChange={e => updateSpecification(sIdx, e.target.value, spec.value)}
                        placeholder="Specification Name (e.g. Weight, Material)"
                        className="field-shell max-w-xs font-bold"
                      />
                      <input
                        value={spec.value}
                        onChange={e => updateSpecification(sIdx, spec.key, e.target.value)}
                        placeholder="Value (e.g. 500 grams, Stainless Steel)"
                        className="field-shell"
                      />
                      <button
                        type="button"
                        onClick={() => removeSpecification(sIdx)}
                        className="p-2 text-red-500 hover:text-red-700"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* STEP 7: DESCRIPTIONS */}
          {step === 7 && (
            <div className="mx-auto grid max-w-4xl gap-6">
              <div>
                <h3 className="text-xl font-bold text-navy">Descriptions & Product Information</h3>
                <p className="mt-1 text-xs text-admin-muted">
                  Provide customer-facing descriptions, ingredients, care instructions, and shipping policy.
                </p>
              </div>

              <label className="field-label">
                Short Summary Description
                <input
                  value={shortDescription}
                  onChange={e => setShortDescription(e.target.value)}
                  placeholder="Brief catchy summary shown next to buy button..."
                  className="field-shell mt-2"
                />
              </label>

              <label className="field-label">
                Full Description
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  rows={5}
                  placeholder="Detailed product story, features, and specs..."
                  className="field-shell mt-2"
                />
              </label>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="field-label">
                  Ingredients / Composition (Optional)
                  <textarea
                    value={ingredients}
                    onChange={e => setIngredients(e.target.value)}
                    rows={3}
                    placeholder="e.g. Cocoa solids, Dairy milk, Flour..."
                    className="field-shell mt-2"
                  />
                </label>

                <label className="field-label">
                  Care Instructions (Optional)
                  <textarea
                    value={careInstructions}
                    onChange={e => setCareInstructions(e.target.value)}
                    rows={3}
                    placeholder="e.g. Keep refrigerated, avoid direct sunlight..."
                    className="field-shell mt-2"
                  />
                </label>
              </div>
            </div>
          )}

          {/* STEP 8: SEO & TAGS */}
          {step === 8 && (
            <div className="mx-auto grid max-w-4xl gap-6">
              <div>
                <h3 className="text-xl font-bold text-navy">SEO & Search Tags</h3>
                <p className="mt-1 text-xs text-admin-muted">
                  Optimize search engine indexing and internal catalog tags.
                </p>
              </div>

              <label className="field-label">
                SEO Title
                <input
                  value={seoTitle}
                  onChange={e => setSeoTitle(e.target.value)}
                  placeholder={name || "SEO title..."}
                  className="field-shell mt-2 font-bold"
                />
              </label>

              <label className="field-label">
                SEO Description
                <textarea
                  value={seoDescription}
                  onChange={e => setSeoDescription(e.target.value)}
                  rows={3}
                  placeholder="Search engine snippet text..."
                  className="field-shell mt-2"
                />
              </label>

              <label className="field-label">
                Search Tags (Comma-separated)
                <input
                  value={tagsInput}
                  onChange={e => setTagsInput(e.target.value)}
                  placeholder="cake, chocolate, birthday, gift, watch, luxury"
                  className="field-shell mt-2"
                />
              </label>
            </div>
          )}
        </main>

        {/* Footer Navigation */}
        <footer className="flex items-center justify-between border-t border-admin-border bg-admin-bg/50 px-6 py-4">
          <button
            type="button"
            onClick={() => (step > 1 ? setStep(step - 1) : onClose())}
            className="button-secondary"
          >
            <ChevronLeft size={15} /> {step > 1 ? "Previous Step" : "Cancel"}
          </button>

          <div className="flex items-center gap-3">
            {step < steps.length && (
              <button
                type="button"
                onClick={() => setStep(step + 1)}
                className="button-primary"
              >
                Next Step <ChevronRight size={15} />
              </button>
            )}

            <button
              type="button"
              onClick={saveProduct}
              disabled={saving || uploading}
              className="button-primary bg-green hover:bg-green-dark disabled:opacity-50"
            >
              {saving ? (
                <>
                  <RefreshCw size={15} className="animate-spin" /> Saving…
                </>
              ) : (
                <>
                  <Check size={15} /> {status === "published" ? "Publish Product" : "Save Draft"}
                </>
              )}
            </button>
          </div>
        </footer>
      </div>

      {/* Image Library Selector Modal */}
      {managingTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy/70 p-4 backdrop-blur-sm animate-scale-in">
          <div className="relative flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl border border-admin-border">
            <header className="flex items-center justify-between border-b border-admin-border px-6 py-4 bg-admin-bg/50">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-orange">Image Library Selector</span>
                <h3 className="text-lg font-bold text-navy">
                  {managingTarget.type === "attribute_value"
                    ? `Manage Images for ${attributes[managingTarget.attrIndex]?.name}: ${attributes[managingTarget.attrIndex]?.values[managingTarget.valIndex]?.label}`
                    : `Manage Images for ${variations[managingTarget.varIndex]?.name}`}
                </h3>
              </div>
              <button
                onClick={() => setManagingTarget(null)}
                className="rounded-full p-2 text-admin-muted hover:bg-admin-bg hover:text-navy"
              >
                <X size={18} />
              </button>
            </header>

            <main className="flex-1 overflow-y-auto p-6 space-y-6">
              <p className="text-xs text-admin-muted">
                Select images from the product pool to link to this option. First image becomes the primary image for this option gallery.
              </p>

              {/* Upload New Image Button for Modal */}
              <div className="flex justify-between items-center bg-admin-bg/40 p-4 rounded-2xl border border-admin-border">
                <div>
                  <span className="text-xs font-bold text-navy">Upload New Image to Product Pool</span>
                  <p className="text-[10px] text-admin-muted">Uploaded images are automatically linked to this option.</p>
                </div>
                <label className="button-primary py-2 px-3 text-xs cursor-pointer">
                  <Upload size={14} /> Upload Image
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    multiple
                    className="hidden"
                    onChange={e => {
                      if (e.target.files?.length) {
                        uploadFiles(e.target.files, urls => {
                          setGalleryImages(prev => [...prev, ...urls]);
                          if (managingTarget.type === "attribute_value") {
                            const { attrIndex, valIndex } = managingTarget;
                            setAttributes(prev => {
                              const next = [...prev];
                              const targetVal = next[attrIndex]?.values[valIndex];
                              if (targetVal) {
                                next[attrIndex].values[valIndex] = {
                                  ...targetVal,
                                  images: Array.from(new Set([...(targetVal.images || []), ...urls])),
                                };
                              }
                              return next;
                            });
                          } else {
                            const { varIndex } = managingTarget;
                            setVariations(prev =>
                              prev.map((v, i) =>
                                i === varIndex
                                  ? { ...v, galleryImages: Array.from(new Set([...v.galleryImages, ...urls])) }
                                  : v
                              )
                            );
                          }
                        });
                      }
                    }}
                  />
                </label>
              </div>

              {/* Product Images Selector Grid */}
              {galleryImages.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-admin-border p-8 text-center">
                  <ImageIcon className="mx-auto text-admin-muted" size={24} />
                  <p className="mt-2 text-xs font-bold text-navy">No product images uploaded yet</p>
                  <p className="text-[10px] text-admin-muted">Upload images above to build the gallery pool.</p>
                </div>
              ) : (
                <div>
                  <span className="text-xs font-bold text-navy block mb-3">Available Product Images Pool:</span>
                  <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
                    {galleryImages.map((img, idx) => {
                      let isAssigned = false;
                      let assignedIndex = -1;

                      if (managingTarget.type === "attribute_value") {
                        const targetVal = attributes[managingTarget.attrIndex]?.values[managingTarget.valIndex];
                        const assignedList = targetVal?.images || [];
                        assignedIndex = assignedList.indexOf(img);
                        isAssigned = assignedIndex !== -1;
                      } else {
                        const targetVar = variations[managingTarget.varIndex];
                        const assignedList = targetVar?.galleryImages || [];
                        assignedIndex = assignedList.indexOf(img);
                        isAssigned = assignedIndex !== -1;
                      }

                      return (
                        <div
                          key={`${img}-${idx}`}
                          onClick={() => {
                            if (managingTarget.type === "attribute_value") {
                              const { attrIndex, valIndex } = managingTarget;
                              setAttributes(prev => {
                                const next = [...prev];
                                const targetVal = next[attrIndex]?.values[valIndex];
                                if (targetVal) {
                                  const currentImgs = targetVal.images || [];
                                  const nextImgs = currentImgs.includes(img)
                                    ? currentImgs.filter(i => i !== img)
                                    : [...currentImgs, img];
                                  next[attrIndex].values[valIndex] = { ...targetVal, images: nextImgs };
                                }
                                return next;
                              });
                            } else {
                              const { varIndex } = managingTarget;
                              setVariations(prev =>
                                prev.map((v, i) => {
                                  if (i === varIndex) {
                                    const currentImgs = v.galleryImages || [];
                                    const nextImgs = currentImgs.includes(img)
                                      ? currentImgs.filter(i => i !== img)
                                      : [...currentImgs, img];
                                    return { ...v, galleryImages: nextImgs };
                                  }
                                  return v;
                                })
                              );
                            }
                          }}
                          className={`group relative aspect-square cursor-pointer overflow-hidden rounded-xl border-2 transition-all ${
                            isAssigned ? "border-orange shadow-md ring-2 ring-orange/30" : "border-admin-border hover:border-orange/60 opacity-60"
                          }`}
                        >
                          <img src={publicStorageUrl(img)} alt="" className="h-full w-full object-cover" />

                          {isAssigned && (
                            <span className="absolute top-1.5 right-1.5 grid h-5 w-5 place-items-center rounded-full bg-orange text-white text-[10px] font-bold shadow">
                              {assignedIndex + 1}
                            </span>
                          )}

                          <div className="absolute inset-0 bg-navy/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <span className="rounded-full bg-white px-2 py-1 text-[9px] font-bold text-navy shadow">
                              {isAssigned ? "Deselect" : "Select Image"}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </main>

            <footer className="flex justify-between items-center border-t border-admin-border bg-admin-bg/50 px-6 py-3">
              <span className="text-xs font-bold text-admin-muted">
                {managingTarget.type === "attribute_value"
                  ? `${(attributes[managingTarget.attrIndex]?.values[managingTarget.valIndex]?.images || []).length} images assigned`
                  : `${(variations[managingTarget.varIndex]?.galleryImages || []).length} images assigned`}
              </span>
              <button onClick={() => setManagingTarget(null)} className="button-primary py-1.5 text-xs">
                <Check size={14} /> Save & Close
              </button>
            </footer>
          </div>
        </div>
      )}

      {/* Auto Match Confirmation Modal */}
      {showAutoMatchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy/80 p-4 backdrop-blur-sm animate-scale-in">
          <div className="relative flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl border border-admin-border">
            <header className="flex items-center justify-between border-b border-admin-border px-6 py-4 bg-blue-50">
              <div className="flex items-center gap-2">
                <Sparkles size={18} className="text-blue-600" />
                <h3 className="text-lg font-bold text-navy">Auto Match Image Suggestions</h3>
              </div>
              <button onClick={() => setShowAutoMatchModal(false)} className="rounded-full p-2 text-admin-muted hover:bg-white">
                <X size={18} />
              </button>
            </header>

            <main className="flex-1 overflow-y-auto p-6 space-y-4">
              <p className="text-xs text-admin-muted leading-relaxed">
                Found {autoMatchMatches.length} matching image filename references based on attribute option values. Confirm to apply these image mappings automatically:
              </p>

              <div className="divide-y divide-admin-border rounded-2xl border border-admin-border overflow-hidden">
                {autoMatchMatches.map((m, idx) => (
                  <div key={idx} className="flex items-center gap-3 p-3 bg-white">
                    <img src={publicStorageUrl(m.image)} alt="" className="h-10 w-10 rounded-lg object-cover border border-admin-border" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-navy truncate">{m.image.split("/").pop()}</p>
                      <p className="text-[11px] text-admin-muted">
                        Matches <strong className="text-orange">{m.attrName}</strong> → <strong className="text-navy">{m.valLabel}</strong>
                      </p>
                    </div>
                    <span className="rounded-full bg-green/10 px-2.5 py-0.5 text-[10px] font-extrabold text-green">
                      Match Found
                    </span>
                  </div>
                ))}
              </div>
            </main>

            <footer className="flex justify-end gap-3 border-t border-admin-border bg-admin-bg/50 px-6 py-4">
              <button onClick={() => setShowAutoMatchModal(false)} className="button-secondary text-xs">
                Cancel
              </button>
              <button onClick={confirmAutoMatch} className="button-primary bg-blue-600 hover:bg-blue-700 text-xs">
                <Check size={14} /> Apply {autoMatchMatches.length} Image Mappings
              </button>
            </footer>
          </div>
        </div>
      )}

      {/* Interactive Storefront Customer Preview Modal */}
      {showPreviewModal && (() => {
        const previewProduct = {
          id: current?.id || "preview-id",
          name: name || "Untitled Product",
          image: featuredImage || galleryImages[0] || "/placeholder-bake.svg",
          images: galleryImages,
          price: Number(regularPrice) || 0,
          salePrice: salePrice ? Number(salePrice) : null,
          attributes: attributes.map(a => ({
            ...a,
            controlsImages: a.controlsImages,
          })),
          variations: variations,
        };

        const resolvedGallery = resolveProductGallery(previewProduct as any, previewSelections);
        const currentMainImage = resolvedGallery[0] || previewProduct.image;

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy/80 p-4 backdrop-blur-md animate-scale-in">
            <div className="relative flex max-h-[92vh] w-full max-w-4xl flex-col overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl border border-admin-border">
              <div className="flex items-center justify-between border-b border-admin-border pb-4">
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-orange">
                    Interactive Customer Preview
                  </span>
                  <h2 className="font-display text-2xl font-bold text-navy">{name || "Untitled Product"}</h2>
                </div>
                <button
                  onClick={() => setShowPreviewModal(false)}
                  className="rounded-full bg-admin-bg p-2 text-navy hover:bg-orange hover:text-white transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="mt-6 grid gap-8 sm:grid-cols-[1.1fr_.9fr]">
                {/* Resolved Gallery View */}
                <div className="flex flex-col gap-3">
                  <div className="relative aspect-square overflow-hidden rounded-2xl border border-admin-border bg-cream-deep shadow-sm">
                    <img src={publicStorageUrl(currentMainImage)} alt="" className="h-full w-full object-cover" />
                    <span className="absolute left-3 top-3 rounded-full bg-navy/80 px-2.5 py-1 text-[10px] font-bold text-white backdrop-blur-xs">
                      {Object.keys(previewSelections).length > 0 ? "Smart Gallery Active" : "General Product Gallery"}
                    </span>
                  </div>

                  {resolvedGallery.length > 1 && (
                    <div className="flex gap-2 overflow-x-auto pb-1">
                      {resolvedGallery.map((img, i) => (
                        <div
                          key={i}
                          className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl border-2 border-orange/40"
                        >
                          <img src={publicStorageUrl(img)} alt="" className="h-full w-full object-cover" />
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Selections & Buy Box */}
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-orange">
                    {activeCategory?.name || "General"}
                  </p>
                  <div className="mt-2 font-display text-3xl font-extrabold text-navy">
                    {formatPKR(salePrice || regularPrice || 0)}
                    {salePrice && (
                      <span className="ml-2 text-sm text-admin-muted line-through">
                        {formatPKR(regularPrice)}
                      </span>
                    )}
                  </div>

                  {/* Interactive Options Selectors */}
                  {hasVariants && attributes.length > 0 && (
                    <div className="mt-6 space-y-4">
                      {attributes.map(a => (
                        <div key={a.slug}>
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-xs font-extrabold text-navy">{a.name}:</span>
                            <span className="text-[11px] text-orange font-bold">
                              {previewSelections[a.slug] || "Select..."}
                            </span>
                          </div>

                          <div className="flex flex-wrap gap-2">
                            {a.values.map(v => {
                              const isSelected = previewSelections[a.slug] === v.slug;
                              return (
                                <button
                                  key={v.slug}
                                  type="button"
                                  onClick={() =>
                                    setPreviewSelections(prev => ({
                                      ...prev,
                                      [a.slug]: v.slug,
                                    }))
                                  }
                                  className={`flex items-center gap-1.5 rounded-xl border-2 px-3 py-1.5 text-xs font-bold transition-all ${
                                    isSelected
                                      ? "border-orange bg-orange/10 text-orange shadow-xs"
                                      : "border-admin-border bg-white text-navy hover:border-orange/60"
                                  }`}
                                >
                                  {a.displayType === "color" && (
                                    <span
                                      className="h-3.5 w-3.5 rounded-full border border-black/15"
                                      style={{ backgroundColor: v.swatchColor || "#cccccc" }}
                                    />
                                  )}
                                  {v.label}
                                  {isSelected && <Check size={12} strokeWidth={3} />}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <p className="mt-5 text-xs leading-relaxed text-admin-muted">
                    {shortDescription || description || "No short description configured."}
                  </p>

                  <div className="mt-6">
                    <button className="button-primary w-full">
                      <Plus size={15} /> Add to Basket · Storefront Interactive Test
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Toast Notice */}
      {toast && (
        <div className={`toast ${toast.type === "error" ? "toast-error" : "toast-success"}`}>
          {toast.type === "error" ? <AlertTriangle size={16} /> : <Check size={16} strokeWidth={3} />}
          {toast.msg}
        </div>
      )}

      {/* Media Picker Modal */}
      <MediaPickerModal
        isOpen={isMediaPickerOpen}
        onClose={() => setIsMediaPickerOpen(false)}
        onSelect={(urls) => {
          if (urls.length > 0) {
            setGalleryImages((prev) => [...prev, ...urls]);
            if (!featuredImage) setFeaturedImage(urls[0]);
          }
        }}
        multiSelect={true}
        initialFolder="products"
        title="Choose Product Gallery Images"
      />
    </div>
  );
}

