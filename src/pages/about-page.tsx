import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import type { AboutContent } from "@/shared";
import { DEFAULT_ABOUT_CONTENT } from "@/shared";
import { Button } from "@/components/ui/button";
import { publicApi, resolveMediaUrl } from "@/utils/api";
import { TranslatedText } from "@/components/translated-text";
import { UI } from "@/i18n/ui";
import { useTranslate } from "@/hooks/use-translate";
import { BrandLogoMark } from "@/components/brand/brand-logo-mark";

function BlockImage({ url, alt }: { url?: string; alt: string }) {
  if (!url?.trim()) return null;
  return (
    <div className="mt-4 overflow-hidden rounded-2xl border border-border/60">
      <img src={resolveMediaUrl(url)} alt={alt} className="h-56 w-full object-cover md:h-72" loading="lazy" />
    </div>
  );
}

export function AboutPage() {
  const [data, setData] = useState<AboutContent | null>(null);
  /** True only when the API returned an error after we already had no cached payload. */
  const [loadError, setLoadError] = useState(false);
  const loading = useTranslate(UI.aboutLoading);
  const loadErrorMsg = useTranslate(UI.aboutLoadError);
  const cta = useTranslate(UI.aboutExplore);

  useEffect(() => {
    const load = async () => {
      setLoadError(false);
      try {
        const { data: res } = await publicApi.get("/public/about");
        if (res.success && res.data) {
          setData(res.data as AboutContent);
          return;
        }
      } catch {
        // Network error, 5xx, CORS, etc.
      }
      // Still show the site: use packaged defaults (same as API fallback when DB/table is unavailable).
      setData({ ...DEFAULT_ABOUT_CONTENT, blocks: [...DEFAULT_ABOUT_CONTENT.blocks] });
      setLoadError(true);
    };
    void load();
  }, []);

  if (!data) {
    return <div className="py-24 text-center text-subtle">{loading}</div>;
  }

  return (
    <div className="space-y-16 py-4">
      {loadError ? (
        <p className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-foreground">
          {loadErrorMsg}
        </p>
      ) : null}
      <header className="ui-card space-y-4">
        <div className="mb-1">
          <BrandLogoMark className="h-14 max-h-16 max-w-[240px]" />
        </div>
        {data.hero.imageUrl ? (
          <div className="overflow-hidden rounded-2xl border border-border/50">
            <img
              src={resolveMediaUrl(data.hero.imageUrl)}
              alt=""
              className="h-64 w-full object-cover md:h-80"
              loading="eager"
            />
          </div>
        ) : null}
        <p className="ui-label text-primary">Dogar welfare trust</p>
        <TranslatedText as="h1" text={data.hero.title} className="text-3xl font-bold leading-tight md:text-4xl" />
        <TranslatedText as="p" text={data.hero.subtitle} className="text-lg text-subtle" />
        <div className="flex flex-wrap gap-2 pt-2">
          <Link to="/matrimonial">
            <Button>{cta}</Button>
          </Link>
        </div>
      </header>

      {data.blocks
        .slice()
        .sort((a, b) => a.order - b.order)
        .map((b) => (
          <section key={b.id} className="ui-card space-y-2">
            <TranslatedText as="h2" text={b.title} className="text-2xl font-semibold" />
            <div className="prose prose-sm max-w-none text-foreground/95 dark:prose-invert">
              <TranslatedText as="p" text={b.body} className="whitespace-pre-wrap" />
            </div>
            <BlockImage url={b.imageUrl} alt="" />
          </section>
        ))}

      <section className="ui-card border-accent/30 bg-gradient-to-br from-accent/5 to-primary/5 space-y-4">
        <TranslatedText as="h2" text={data.developer.sectionTitle} className="text-2xl font-semibold" />
        <div className="grid gap-6 md:grid-cols-[1fr,2fr] md:items-start">
          {data.developer.imageUrl ? (
            <div className="mx-auto w-full max-w-xs overflow-hidden rounded-2xl border border-border/60">
              <img
                src={resolveMediaUrl(data.developer.imageUrl)}
                alt=""
                className="h-48 w-full object-cover"
                loading="lazy"
              />
            </div>
          ) : null}
          <div className="space-y-2">
            <TranslatedText as="p" text={data.developer.name} className="text-xl font-semibold" />
            <TranslatedText as="p" text={data.developer.role} className="text-sm text-primary" />
            <div className="pt-1">
              <TranslatedText as="p" text={data.developer.bio} className="whitespace-pre-wrap text-subtle" />
            </div>
            <div className="flex flex-wrap gap-2 pt-2 text-sm">
              {data.developer.website ? (
                <a
                  href={data.developer.website}
                  className="text-primary underline-offset-2 hover:underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {data.developer.website.replace(/^https?:\/\//, "")}
                </a>
              ) : null}
              {data.developer.email ? (
                <a href={`mailto:${data.developer.email}`} className="text-accent hover:underline">
                  {data.developer.email}
                </a>
              ) : null}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
