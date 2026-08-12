import type { RatingDistribution } from "@/lib/types";

/**
 * Safely formats a customer name for public display.
 * Example: "Aisha Khan" -> "Aisha K."
 * Example: "aisha@example.com" -> "Aisha E."
 */
export function formatReviewerName(name?: string | null, email?: string | null): string {
  if (name && name.trim()) {
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) {
      return parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
    }
    const firstName = parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
    const lastInitial = parts[parts.length - 1].charAt(0).toUpperCase();
    return `${firstName} ${lastInitial}.`;
  }

  if (email && email.includes("@")) {
    const handle = email.split("@")[0];
    if (handle) {
      const formatted = handle.charAt(0).toUpperCase() + handle.slice(1);
      return `${formatted}`;
    }
  }

  return "Verified Customer";
}

/**
 * Normalizes phone numbers by stripping non-digit characters for matching.
 */
export function cleanPhone(phone: string): string {
  return phone.replace(/[^0-9]/g, "");
}

/**
 * Computes 1★–5★ breakdown, percentage distribution, average rating, and total count.
 */
export function calculateRatingDistribution(reviews: Array<{ rating: number }>): RatingDistribution {
  const total = reviews.length;
  const counts: Record<1 | 2 | 3 | 4 | 5, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

  if (total === 0) {
    return {
      average: 0,
      total: 0,
      counts,
      percentages: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    };
  }

  let sum = 0;
  for (const r of reviews) {
    const rating = Math.min(5, Math.max(1, Math.round(r.rating))) as 1 | 2 | 3 | 4 | 5;
    counts[rating] = (counts[rating] || 0) + 1;
    sum += rating;
  }

  const average = Number((sum / total).toFixed(1));
  const percentages: Record<1 | 2 | 3 | 4 | 5, number> = {
    1: Math.round((counts[1] / total) * 100),
    2: Math.round((counts[2] / total) * 100),
    3: Math.round((counts[3] / total) * 100),
    4: Math.round((counts[4] / total) * 100),
    5: Math.round((counts[5] / total) * 100),
  };

  return { average, total, counts, percentages };
}
