import { Link } from "react-router-dom";
import { BRAND_LOGO_CANDIDATES } from "@/lib/brand-assets";
import { useFallbackImageSrc } from "./use-fallback-image-src";
import { cn } from "@/lib/cn";

type Props = {
  title: string;
  className?: string;
  /** When true, show the text title next to the logo. */
  showTitle?: boolean;
  imgClassName?: string;
};

/**
 * Site header logo: add `public/logo.png` or `public/logo.svg` (or `public/brand/logo.png`).
 */
export function BrandLogoLink({ title, className, showTitle = true, imgClassName }: Props) {
  const { src, onError, exhausted } = useFallbackImageSrc(BRAND_LOGO_CANDIDATES);
  return (
    <Link to="/" className={cn("flex min-w-0 items-center gap-2.5", className)}>
      {src && !exhausted ? (
        <img
          src={src}
          alt=""
          width={160}
          height={40}
          className={cn("h-9 w-auto max-h-10 object-contain object-left", imgClassName)}
          onError={onError}
        />
      ) : null}
      {showTitle || exhausted ? <span className="truncate text-lg font-bold tracking-tight text-foreground">{title}</span> : null}
    </Link>
  );
}
