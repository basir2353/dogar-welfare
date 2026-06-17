import { Link } from "react-router-dom";
import { BRAND_LOGO_CANDIDATES } from "@/lib/brand-assets";
import { useFallbackImageSrc } from "./use-fallback-image-src";
import { cn } from "@/lib/cn";

type Props = {
  className?: string;
  withLink?: boolean;
};

/** Inline mark only (no title). Renders nothing if no public logo file exists. */
export function BrandLogoMark({ className, withLink = true }: Props) {
  const { src, onError, exhausted } = useFallbackImageSrc(BRAND_LOGO_CANDIDATES);
  if (!src || exhausted) {
    return null;
  }
  const img = (
    <img
      src={src}
      alt="Dogar Welfare"
      className={cn("h-10 w-auto max-w-[180px] object-contain object-left", className)}
      onError={onError}
    />
  );
  if (withLink) {
    return (
      <Link to="/" className="inline-block">
        {img}
      </Link>
    );
  }
  return img;
}
