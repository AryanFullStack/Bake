"use client";

import Image, { ImageProps } from "next/image";
import { useState, useEffect } from "react";
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
  ...props
}: SafeImageProps) {
  const resolvedSrc = resolveMediaUrl(src, fallbackSrc);
  const [imgSrc, setImgSrc] = useState<string>(resolvedSrc);
  const [hasFailed, setHasFailed] = useState<boolean>(false);

  useEffect(() => {
    const updated = resolveMediaUrl(src, fallbackSrc);
    setImgSrc(updated);
    setHasFailed(false);
  }, [src, fallbackSrc]);

  // Always force unoptimized mode for VPS media / API serve URLs to prevent Next.js /_next/image 400 errors
  const shouldBeUnoptimized = unoptimized ?? isVpsMediaUrl(imgSrc);

  return (
    <Image
      {...props}
      src={imgSrc}
      alt={alt}
      unoptimized={shouldBeUnoptimized}
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
