/**
 * Utility functions to resolve color swatches for variable products.
 * Handles hex codes, RGB/HSL, CSS named colors, and slugified/friendly color names
 * (e.g., "light-green", "pink", "off-white", "peach", "navy-blue", etc.).
 */

const KNOWN_COLORS: Record<string, string> = {
  // Greens
  "lightgreen": "#b1ee91",
  "light-green": "#b1ee91",
  "green": "#22c55e",
  "darkgreen": "#15803d",
  "dark-green": "#15803d",
  "mint": "#a7f3d0",
  "mint-green": "#a7f3d0",
  "olive": "#84cc16",
  "lime": "#84cc16",
  "sage": "#9caf88",
  "emerald": "#10b981",
  "forest-green": "#228b22",

  // Pinks & Peaches
  "pink": "#ff7575",
  "lightpink": "#ffb6c1",
  "light-pink": "#ffb6c1",
  "baby-pink": "#fbcfe8",
  "hotpink": "#ff69b4",
  "hot-pink": "#ff69b4",
  "deep-pink": "#ff1493",
  "rose": "#f43f5e",
  "dusty-rose": "#dcae96",
  "peach": "#f9a4a4",
  "coral": "#fb7185",
  "salmon": "#fa8072",
  "blush": "#de5d83",
  "magenta": "#d946ef",
  "fuchsia": "#c026d3",

  // Whites, Grays, Blacks
  "white": "#ffffff",
  "offwhite": "#fcffd6",
  "off-white": "#fcffd6",
  "cream": "#fffdd0",
  "ivory": "#fffff0",
  "beige": "#f5f5dc",
  "nude": "#e3bc9a",
  "tan": "#d2b48c",
  "black": "#111827",
  "gray": "#9ca3af",
  "grey": "#9ca3af",
  "lightgray": "#d1d5db",
  "light-gray": "#d1d5db",
  "lightgrey": "#d1d5db",
  "light-grey": "#d1d5db",
  "darkgray": "#4b5563",
  "dark-gray": "#4b5563",
  "darkgrey": "#4b5563",
  "dark-grey": "#4b5563",
  "charcoal": "#374151",
  "silver": "#c0c0c0",

  // Blues
  "blue": "#3b82f6",
  "lightblue": "#93c5fd",
  "light-blue": "#93c5fd",
  "sky-blue": "#38bdf8",
  "baby-blue": "#89cff0",
  "navy": "#1e3a8a",
  "navyblue": "#1e3a8a",
  "navy-blue": "#1e3a8a",
  "darkblue": "#00008b",
  "dark-blue": "#00008b",
  "royal-blue": "#4169e1",
  "teal": "#14b8a6",
  "cyan": "#06b6d4",
  "turquoise": "#2dd4bf",
  "aqua": "#00ffff",
  "indigo": "#6366f1",

  // Reds & Browns
  "red": "#ef4444",
  "darkred": "#8b0000",
  "dark-red": "#8b0000",
  "crimson": "#dc143c",
  "maroon": "#800000",
  "burgundy": "#800020",
  "wine": "#722f37",
  "brown": "#78350f",
  "chocolate": "#7b3f00",
  "coffee": "#6f4e37",
  "caramel": "#ffd59a",
  "khaki": "#f0e68c",

  // Yellows & Oranges
  "yellow": "#fff700",
  "lightyellow": "#ffffe0",
  "light-yellow": "#ffffe0",
  "lemon": "#fff44f",
  "mustard": "#ffdb58",
  "gold": "#ffd700",
  "golden": "#ffd700",
  "orange": "#f97316",
  "darkorange": "#ff8c00",
  "dark-orange": "#ff8c00",
  "amber": "#f59e0b",
  "rust": "#b7410e",

  // Purples & Violets
  "purple": "#a855f7",
  "violet": "#8b5cf6",
  "lavender": "#e9d5ff",
  "lilac": "#c8a2c8",
  "plum": "#dda0dd",
};

/**
 * Normalizes a text string for color key comparison.
 */
function normalizeColorName(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]/g, "");
}

/**
 * Returns a valid CSS color string for an attribute value.
 *
 * @param swatchColor - Explicit color code/name from database
 * @param label - Human-readable label (e.g., "Light Green")
 * @param slug - Value slug (e.g., "light-green")
 * @param defaultFallback - Fallback hex if nothing matches (default "#e6ddd0")
 */
export function resolveColorSwatch(
  swatchColor?: string | null,
  label?: string | null,
  slug?: string | null,
  defaultFallback = "#e6ddd0"
): string {
  // 1. If explicit swatchColor is provided and non-empty
  if (swatchColor && typeof swatchColor === "string") {
    const trimmed = swatchColor.trim();
    if (trimmed.length > 0) {
      // Valid hex, rgb, rgba, hsl, hsla
      if (/^#(?:[0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(trimmed)) {
        return trimmed;
      }
      if (/^(?:rgb|hsl)a?\(.+?\)$/i.test(trimmed)) {
        return trimmed;
      }

      // Check if it's a known name or standard CSS named color
      const norm = normalizeColorName(trimmed);
      if (KNOWN_COLORS[norm]) {
        return KNOWN_COLORS[norm];
      }
      if (KNOWN_COLORS[trimmed.toLowerCase()]) {
        return KNOWN_COLORS[trimmed.toLowerCase()];
      }

      // If user typed a single-word valid color like "red", "pink", "black"
      if (/^[a-zA-Z]+$/.test(trimmed)) {
        return trimmed.toLowerCase();
      }
    }
  }

  // 2. Try slug matching
  if (slug && typeof slug === "string") {
    const s = slug.toLowerCase().trim();
    if (KNOWN_COLORS[s]) return KNOWN_COLORS[s];
    const normSlug = normalizeColorName(s);
    if (KNOWN_COLORS[normSlug]) return KNOWN_COLORS[normSlug];

    // Check if slug contains a known color substring (e.g., "matt-black" -> black, "pastel-pink" -> pink)
    for (const [key, hex] of Object.entries(KNOWN_COLORS)) {
      if (s === key || s.endsWith(`-${key}`) || s.startsWith(`${key}-`)) {
        return hex;
      }
    }
  }

  // 3. Try label matching
  if (label && typeof label === "string") {
    const l = label.toLowerCase().trim();
    if (KNOWN_COLORS[l]) return KNOWN_COLORS[l];
    const normLabel = normalizeColorName(l);
    if (KNOWN_COLORS[normLabel]) return KNOWN_COLORS[normLabel];

    // Check words in label
    const words = l.split(/[\s\-_]+/);
    for (const word of words) {
      if (KNOWN_COLORS[word]) return KNOWN_COLORS[word];
    }
  }

  return defaultFallback;
}

/**
 * Prettifies a slug or raw attribute value into a human-readable title.
 * e.g., "light-green" -> "Light Green"
 */
export function prettifyAttributeLabel(str: string): string {
  if (!str) return "";
  return str
    .replace(/[-_]+/g, " ")
    .trim()
    .replace(/\b[a-z]/g, (char) => char.toUpperCase());
}
