"use client";

import { useEffect, useMemo, useState } from "react";

type CloudinaryImageProps = {
  src: string;
  alt: string;
  width: number;
  height: number;
  className?: string;
};

const LOCAL_FALLBACK_IMAGE = "/listing-placeholder.svg";

function buildCloudinaryUrl(
  src: string,
  width: number,
  height: number,
): string {
  if (src.startsWith("http")) return src;

  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  if (!cloudName) return LOCAL_FALLBACK_IMAGE;

  const encodedSrc = src
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");

  return `https://res.cloudinary.com/${cloudName}/image/upload/f_auto,q_auto,c_fill,g_auto,w_${width},h_${height}/${encodedSrc}`;
}

export default function CloudinaryImage({
  src,
  alt,
  width,
  height,
  className,
}: CloudinaryImageProps) {
  const resolvedSrc = useMemo(
    () => buildCloudinaryUrl(src, width, height),
    [src, width, height],
  );
  const [imgSrc, setImgSrc] = useState(resolvedSrc);

  useEffect(() => {
    setImgSrc(resolvedSrc);
  }, [resolvedSrc]);

  return (
    <img
      src={imgSrc}
      alt={alt}
      className={className}
      width={width}
      height={height}
      loading="lazy"
      decoding="async"
      referrerPolicy="no-referrer"
      onError={() => {
        if (imgSrc !== LOCAL_FALLBACK_IMAGE) {
          setImgSrc(LOCAL_FALLBACK_IMAGE);
        }
      }}
    />
  );
}
