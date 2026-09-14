"use client";

import Image, { ImageProps } from "next/image";
import { useState, useMemo } from "react";
import { resolveMediaUrl, isVpsMediaUrl, DEFAULT_FALLBACK_IMAGE } from "@/lib/media-url";
import { DEFAULT_BLUR_PLACEHOLDER } from "@/lib/image-placeholders";

export interface SafeImageProps extends Omit<ImageProps, "src"> {
  src: string | null | undefined;
  fallbackSrc?: string;
}

/**
 * Generates an ImageKit LQIP (Low Quality Image Placeholder) URL.
 * Uses a 20px-wide, heavily-blurred, q-1 version of the same image.
 * The browser fetches this tiny variant (<1 KB) immediately as the blur backdrop.
 */
function getImageKitLqip(src: string): string | null {
  if (!src || (!src.includes("ik.imagekit.io") && !src.includes("imagekit.io"))) {
    return null;
  }
  try {
    const url = new URL(src);
    url.searchParams.set("tr", "w-20,q-1,bl-30,f-auto");
    return url.toString();
  } catch {
    return null;
  }
}

export function SafeImage({
  src,
  fallbackSrc = DEFAULT_FALLBACK_IMAGE,
  alt = "",
  unoptimized,
  onError,
  placeholder,
  blurDataURL,
  ...props
}: SafeImageProps) {
  // Resolve canonical media URL synchronously without extra render cycles
  const resolvedSrc = useMemo(() => resolveMediaUrl(src, fallbackSrc), [src, fallbackSrc]);
  const [failedSrc, setFailedSrc] = useState<string | null>(null);

  const isFailed = failedSrc === resolvedSrc;
  const currentSrc = isFailed ? fallbackSrc : resolvedSrc;

  // VPS media API routes can't go through /_next/image — keep unoptimized for those.
  // ImageKit URLs use the custom loader, so they should NOT be unoptimized.
  const isVps = useMemo(() => isVpsMediaUrl(currentSrc), [currentSrc]);
  const shouldBeUnoptimized = unoptimized ?? isVps;

  // Blur placeholder: use caller-supplied value OR auto-generate ImageKit LQIP URL
  // OR fall back to our SVG colour placeholder.
  const lqipUrl = useMemo(
    () => blurDataURL ?? getImageKitLqip(currentSrc) ?? DEFAULT_BLUR_PLACEHOLDER,
    [blurDataURL, currentSrc]
  );
  const activePlaceholder: ImageProps["placeholder"] =
    placeholder ?? (lqipUrl ? "blur" : undefined);
  const activeBlurDataURL =
    activePlaceholder === "blur" ? lqipUrl : undefined;

  return (
    <Image
      {...props}
      src={currentSrc}
      alt={alt}
      unoptimized={shouldBeUnoptimized}
      placeholder={activePlaceholder}
      blurDataURL={activeBlurDataURL}
      onError={(e) => {
        if (!isFailed) {
          setFailedSrc(resolvedSrc);
        }
        if (onError) {
          onError(e);
        }
      }}
    />
  );
}
