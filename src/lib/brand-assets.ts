/**
 * Drop files into `frontend/public/` (or `public/brand/`). The hero tries each path in order until one loads.
 * First match wins — put your preferred file first, or set `VITE_LANDING_HERO` in `.env` (e.g. `/my-hero.png`).
 */
const envHero = (import.meta.env.VITE_LANDING_HERO as string | undefined)?.trim();
const envHeroPath =
  envHero && (envHero.startsWith("/") || envHero.startsWith("http")) ? [envHero] : [];

export const BRAND_LOGO_CANDIDATES = [
  "/logo.png",
  "/logo.svg",
  "/logo.webp",
  "/brand/logo.png",
  "/brand/logo.svg"
] as const;

/** Main illustrated hero first, then `bg-hero` card/alt, then generic names. */
export const LANDING_HERO_CANDIDATES: readonly string[] = [
  ...envHeroPath,
  "/f33c10e3-1fe7-42f0-86c5-2bed6df6180a.png",
  "/bg-hero.png",
  "/hero.jpg",
  "/hero.png",
  "/hero.webp",
  "/brand/hero.jpg",
  "/brand/hero.png",
  "/brand/bg-hero.png"
];
