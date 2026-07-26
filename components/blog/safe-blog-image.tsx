"use client";

import { useState } from "react";

type SafeBlogImageProps = {
  src: string | null | undefined;
  alt?: string;
  className?: string;
  loading?: "eager" | "lazy";
};

export function SafeBlogImage({ src, alt = "", className, loading = "lazy" }: SafeBlogImageProps) {
  const [failed, setFailed] = useState(false);
  const cleanSrc = typeof src === "string" ? src.trim() : "";

  if (!cleanSrc || failed) return null;

  // eslint-disable-next-line @next/next/no-img-element
  return <img src={cleanSrc} alt={alt} className={className} loading={loading} onError={() => setFailed(true)} />;
}
