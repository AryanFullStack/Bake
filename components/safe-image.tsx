"use client";

import Image, { ImageProps } from "next/image";
import { useState, useEffect } from "react";
import { resolveMediaUrl, isVpsMediaUrl, DEFAULT_FALLBACK_IMAGE } from "@/lib/media-url";
import { DEFAULT_BLUR_PLACEHOLDER } from "@/lib/image-placeholders";

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
  const transformOpts = {
    width: typeof props.width === "number" ? props.width : undefined,
    height: typeof props.height === "number" ? props.height : undefined,
    quality: typeof props.quality === "number" ? props.quality : 80,
    format: "auto" as const,
  };

  const resolvedSrc = resolveMediaUrl(src, fallbackSrc, transformOpts);
  const [imgSrc, setImgSrc] = useState<string>(resolvedSrc);
  const [hasFailed, setHasFailed] = useState<boolean>(false);

  useEffect(() => {
    const updated = resolveMediaUrl(src, fallbackSrc, transformOpts);
    setImgSrc(updated);
    setHasFailed(false);
  }, [src, fallbackSrc, props.width, props.height, props.quality]);

  // Always force unoptimized mode for VPS media / API serve URLs to prevent Next.js /_next/image 400 errors
  const shouldBeUnoptimized = unoptimized ?? isVpsMediaUrl(imgSrc);

  const activePlaceholder = placeholder ?? (blurDataURL ? "blur" : undefined);
  const activeBlurDataURL = blurDataURL ?? (activePlaceholder === "blur" ? DEFAULT_BLUR_PLACEHOLDER : undefined);

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
