"use client";

import Image, { ImageProps } from "next/image";
import { useState, useEffect } from "react";
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
  // For ImageKit URLs: pass raw URL — the custom Next.js loader (imagekit-loader.ts)
  // will apply width/quality transforms directly on ImageKit's CDN side.
  // For VPS/local URLs: resolveMediaUrl turns them into /api/media/serve/... paths.
  const resolvedSrc = resolveMediaUrl(src, fallbackSrc);
  const [imgSrc, setImgSrc] = useState<string>(resolvedSrc);
  const [hasFailed, setHasFailed] = useState<boolean>(false);

  useEffect(() => {
    const updated = resolveMediaUrl(src, fallbackSrc);
    setImgSrc(updated);
    setHasFailed(false);
  }, [src, fallbackSrc]);

  // VPS media API routes can't go through /_next/image — keep unoptimized for those.
  // ImageKit URLs use the custom loader, so they should NOT be unoptimized.
  const isVps = isVpsMediaUrl(imgSrc);
  const shouldBeUnoptimized = unoptimized ?? isVps;

  // Blur placeholder: use caller-supplied value OR auto-generate ImageKit LQIP URL
  // OR fall back to our SVG colour placeholder.
  const lqipUrl = blurDataURL ?? getImageKitLqip(imgSrc) ?? DEFAULT_BLUR_PLACEHOLDER;
  const activePlaceholder: ImageProps["placeholder"] =
    placeholder ?? (lqipUrl ? "blur" : undefined);
  const activeBlurDataURL =
    activePlaceholder === "blur" ? lqipUrl : undefined;

  return (
    <Image
      {...props}
      src={imgSrc}
      alt={alt}
      unoptimized={shouldBeUnoptimized}
      placeholder={activePlaceholder}
      blurDataURL={activeBlurDataURL}
      onError={(e) => {
        if (imgSrc !== fallbackSrc && !hasFailed) {
          setHasFailed(true);
          setImgSrc(fallbackSrc);
        }
        if (onError) {
          onError(e);
        }
      }}
    />
  );
}
