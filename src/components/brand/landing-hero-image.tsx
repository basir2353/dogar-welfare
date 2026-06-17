import { LANDING_HERO_CANDIDATES } from "@/lib/brand-assets";
import { useFallbackImageSrc } from "./use-fallback-image-src";
import { cn } from "@/lib/cn";

type Props = {
  className?: string;
  minHeightClass?: string;
};

/**
 * Home hero visual: prefers `public/bg-hero.png`, then other names in `LANDING_HERO_CANDIDATES`.
 * If no file matches, shows the soft gradient placeholder.
 */
export function LandingHeroImage({ className, minHeightClass = "min-h-[280px] md:min-h-[320px]" }: Props) {
  const { src, onError, exhausted } = useFallbackImageSrc(LANDING_HERO_CANDIDATES);
  if (src && !exhausted) {
    return (
      <div className={cn("overflow-hidden rounded-3xl border border-border/50 bg-card shadow-sm", className)}>
        <img
          src={src}
          alt=""
          decoding="async"
          fetchPriority="high"
          className={cn("h-full w-full object-cover object-center", minHeightClass)}
          onError={onError}
        />
      </div>
    );
  }
  return (
    <div
      className={cn(
        "rounded-3xl border border-border/50 bg-gradient-to-br from-primary/20 via-transparent to-accent/20",
        minHeightClass,
        className
      )}
    />
  );
}
