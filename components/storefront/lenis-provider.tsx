"use client";

import type { ReactNode } from "react";

// Keep the shared wrapper API while allowing native wheel, touch, anchor and
// route scrolling. Storefront content must never depend on a scroll animation.
export function LenisProvider({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
