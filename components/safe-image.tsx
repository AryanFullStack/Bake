"use client";

import Image, { ImageProps } from "next/image";
import { useState, useMemo } from "react";
import imagekitLoader from "@/lib/imagekit-loader";
import { resolveMediaUrl, isVpsMediaUrl, DEFAULT_FALLBACK_IMAGE } from "@/lib/media-url";

export interface SafeImageProps extends Omit<ImageProps, "src"> {
  src: string | null | undefined;
  fallbackSrc?: string;
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

  // Only use a blur when the caller supplies an actual image preview.
  // Remote placeholders add a second request and generic colours hide the image.
  const activePlaceholder: ImageProps["placeholder"] =
    placeholder ?? (blurDataURL ? "blur" : "empty");
  const activeBlurDataURL = activePlaceholder === "blur" ? blurDataURL : undefined;

  return (
    <Image
      {...props}
      loader={currentSrc.includes("imagekit.io") ? imagekitLoader : undefined}
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
