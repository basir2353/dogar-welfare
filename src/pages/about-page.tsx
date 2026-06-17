import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Award,
  Download,
  FileText,
  Printer,
  Share2,
  Shield
} from "lucide-react";
import type { AboutContent, AboutDocument } from "@/shared";
import { DEFAULT_ABOUT_CONTENT } from "@/shared";
import { Button } from "@/components/ui/button";
import { publicApi, resolveMediaUrl } from "@/utils/api";
import { TranslatedText } from "@/components/translated-text";
import { UI } from "@/i18n/ui";
import { useTranslate } from "@/hooks/use-translate";
import { BrandLogoMark } from "@/components/brand/brand-logo-mark";
import {
  AboutContactCard,
  AboutFaqAccordion,
  AboutGallery,
  AboutPartners,
  AboutStatsRow,
  AboutTeamGrid,
  AboutTestimonials,
  AboutTimeline,
  AboutTocNav,
  AboutVideoEmbed,
  type TocItem
} from "@/components/about/about-sections";
import { cn } from "@/lib/cn";

function BlockImage({ url, alt }: { url?: string; alt: string }) {
  if (!url?.trim()) return null;
  return (
    <div className="mt-4 overflow-hidden rounded-2xl border border-border/60">
      <img src={resolveMediaUrl(url)} alt={alt} className="h-56 w-full object-cover md:h-72" loading="lazy" />
    </div>
  );
}

const DOC_CATEGORY_LABEL: Record<string, string> = {
  award: "Award",
  registration: "Registration",
  certificate: "Certificate",
  sodo: "SODO",
  other: "Document"
};

const DOC_CATEGORIES: Array<AboutDocument["category"] | "all"> = [
  "all",
  "registration",
  "sodo",
  "certificate",
  "award",
  "other"
];

function mergeAboutContent(raw: AboutContent): AboutContent {
  return {
    ...DEFAULT_ABOUT_CONTENT,
    ...raw,
    hero: { ...DEFAULT_ABOUT_CONTENT.hero, ...raw.hero },
    developer: { ...DEFAULT_ABOUT_CONTENT.developer, ...raw.developer },
    contact: { ...DEFAULT_ABOUT_CONTENT.contact, ...raw.contact },
    blocks: raw.blocks ?? DEFAULT_ABOUT_CONTENT.blocks,
    awards: raw.awards ?? DEFAULT_ABOUT_CONTENT.awards,
    documents: raw.documents ?? DEFAULT_ABOUT_CONTENT.documents,
    stats: raw.stats ?? DEFAULT_ABOUT_CONTENT.stats,
    timeline: raw.timeline ?? DEFAULT_ABOUT_CONTENT.timeline,
    team: raw.team ?? DEFAULT_ABOUT_CONTENT.team,
    faq: raw.faq ?? DEFAULT_ABOUT_CONTENT.faq,
    testimonials: raw.testimonials ?? DEFAULT_ABOUT_CONTENT.testimonials,
    gallery: raw.gallery ?? DEFAULT_ABOUT_CONTENT.gallery,
    partners: raw.partners ?? DEFAULT_ABOUT_CONTENT.partners,
    videoUrl: raw.videoUrl ?? DEFAULT_ABOUT_CONTENT.videoUrl
  };
}

export function AboutPage() {
  const [data, setData] = useState<AboutContent | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [awardYear, setAwardYear] = useState<string>("all");
  const [docCategory, setDocCategory] = useState<AboutDocument["category"] | "all">("all");
  const [shareHint, setShareHint] = useState("");
  const loading = useTranslate(UI.aboutLoading);
  const loadErrorMsg = useTranslate(UI.aboutLoadError);
  const cta = useTranslate(UI.aboutExplore);

  useEffect(() => {
    const load = async () => {
      setLoadError(false);
      try {
        const { data: res } = await publicApi.get("/public/about");
        if (res.success && res.data) {
          setData(mergeAboutContent(res.data as AboutContent));
          return;
        }
      } catch {
        // Network error, 5xx, CORS, etc.
      }
      setData(mergeAboutContent(DEFAULT_ABOUT_CONTENT));
      setLoadError(true);
    };
    void load();
  }, []);

  const awards = useMemo(
    () => data?.awards?.slice().sort((a, b) => a.order - b.order) ?? [],
    [data?.awards]
  );
  const awardYears = useMemo(() => {
    const years = new Set(awards.map((a) => a.year).filter(Boolean) as string[]);
    return ["all", ...[...years].sort((a, b) => b.localeCompare(a))];
  }, [awards]);
  const filteredAwards = awardYear === "all" ? awards : awards.filter((a) => a.year === awardYear);

  const documents = useMemo(
    () =>
      (data?.documents?.slice().sort((a, b) => a.order - b.order) ?? []).filter((d) => d.fileUrl?.trim()),
    [data?.documents]
  );
  const filteredDocuments =
    docCategory === "all" ? documents : documents.filter((d) => d.category === docCategory);

  const tocItems = useMemo((): TocItem[] => {
    if (!data) return [];
    const items: TocItem[] = [{ id: "about-hero", label: "Introduction" }];
    if (data.stats?.length) items.push({ id: "about-stats", label: "Impact" });
    data.blocks
      .slice()
      .sort((a, b) => a.order - b.order)
      .forEach((b) => items.push({ id: `about-block-${b.id}`, label: b.title }));
    if (data.timeline?.length) items.push({ id: "about-timeline", label: "Timeline" });
    if (data.team?.length) items.push({ id: "about-team", label: "Team" });
    if (data.faq?.length) items.push({ id: "about-faq", label: "FAQ" });
    if (data.testimonials?.length) items.push({ id: "about-testimonials", label: "Testimonials" });
    if (data.gallery?.length) items.push({ id: "about-gallery", label: "Gallery" });
    if (data.videoUrl?.trim()) items.push({ id: "about-video", label: "Video" });
    if (awards.length) items.push({ id: "about-awards", label: "Awards" });
    if (documents.length) items.push({ id: "about-documents", label: "Documents" });
    if (data.partners?.length) items.push({ id: "about-partners", label: "Partners" });
    if (
      data.contact?.address ||
      data.contact?.phone ||
      data.contact?.email ||
      data.contact?.whatsapp
    ) {
      items.push({ id: "about-contact", label: "Contact" });
    }
    items.push({ id: "about-developer", label: "Developer" });
    return items;
  }, [data, awards.length, documents.length]);

  const handleShare = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: document.title, url });
        setShareHint("Shared!");
      } else {
        await navigator.clipboard.writeText(url);
        setShareHint("Link copied!");
      }
    } catch {
      try {
        await navigator.clipboard.writeText(url);
        setShareHint("Link copied!");
      } catch {
        setShareHint("Could not share");
      }
    }
    setTimeout(() => setShareHint(""), 2500);
  };

  if (!data) {
    return <div className="py-24 text-center text-subtle">{loading}</div>;
  }

  return (
    <div className="relative py-4 print:py-0">
      <div className="flex gap-8 lg:items-start">
        <div className="min-w-0 flex-1 space-y-16">
          {loadError ? (
            <p className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-foreground">
              {loadErrorMsg}
            </p>
          ) : null}

          <header id="about-hero" className="ui-card space-y-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="mb-1">
                <BrandLogoMark className="h-14 max-h-16 max-w-[240px]" />
              </div>
              <div className="flex flex-wrap gap-2 print:hidden">
                <Button type="button" size="sm" variant="outline" onClick={() => void handleShare()}>
                  <Share2 className="mr-2 h-4 w-4" />
                  Share
                </Button>
                <Button type="button" size="sm" variant="outline" onClick={() => window.print()}>
                  <Printer className="mr-2 h-4 w-4" />
                  Print
                </Button>
              </div>
            </div>
            {shareHint ? <p className="text-sm text-primary print:hidden">{shareHint}</p> : null}
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
            <div className="flex flex-wrap gap-2 pt-2 print:hidden">
              <Link to="/matrimonial">
                <Button>{cta}</Button>
              </Link>
            </div>
          </header>

          <AboutStatsRow stats={data.stats} />

          {data.blocks
            .slice()
            .sort((a, b) => a.order - b.order)
            .map((b) => (
              <section key={b.id} id={`about-block-${b.id}`} className="ui-card space-y-2">
                <TranslatedText as="h2" text={b.title} className="text-2xl font-semibold" />
                <div className="prose prose-sm max-w-none text-foreground/95 dark:prose-invert">
                  <TranslatedText as="p" text={b.body} className="whitespace-pre-wrap" />
                </div>
                <BlockImage url={b.imageUrl} alt="" />
              </section>
            ))}

          <AboutTimeline items={data.timeline} />
          <AboutTeamGrid members={data.team} />
          <AboutFaqAccordion items={data.faq} />
          <AboutTestimonials items={data.testimonials} />
          <AboutGallery images={data.gallery} />
          <AboutVideoEmbed videoUrl={data.videoUrl} />

          {awards.length > 0 ? (
            <section id="about-awards" className="ui-card space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/15 text-primary">
                    <Award className="h-6 w-6" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-semibold">Awards & recognition</h2>
                    <p className="text-sm text-subtle">Certificates and honours earned by Dogar Welfare Trust</p>
                  </div>
                </div>
                {awardYears.length > 2 ? (
                  <label className="flex items-center gap-2 text-sm print:hidden">
                    <span className="text-subtle">Year</span>
                    <select
                      value={awardYear}
                      onChange={(e) => setAwardYear(e.target.value)}
                      className="rounded-xl border border-border bg-card px-3 py-2 text-sm outline-none focus:border-primary"
                    >
                      {awardYears.map((y) => (
                        <option key={y} value={y}>
                          {y === "all" ? "All years" : y}
                        </option>
                      ))}
                    </select>
                  </label>
                ) : null}
              </div>
              {filteredAwards.length === 0 ? (
                <p className="text-sm text-subtle">No awards for the selected year.</p>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {filteredAwards.map((award) => (
                    <article
                      key={award.id}
                      className="overflow-hidden rounded-2xl border border-border/60 bg-gradient-to-br from-primary/5 to-accent/5 p-5"
                    >
                      {award.imageUrl ? (
                        <div className="mb-4 overflow-hidden rounded-xl border border-border/50">
                          <img
                            src={resolveMediaUrl(award.imageUrl)}
                            alt=""
                            className="h-40 w-full object-cover"
                            loading="lazy"
                          />
                        </div>
                      ) : (
                        <div className="mb-4 flex h-24 items-center justify-center rounded-xl border border-dashed border-primary/30 bg-primary/5">
                          <Award className="h-10 w-10 text-primary/50" />
                        </div>
                      )}
                      <TranslatedText as="h3" text={award.title} className="text-lg font-semibold" />
                      {award.year ? (
                        <p className="mt-1 text-xs font-medium uppercase tracking-wider text-primary">{award.year}</p>
                      ) : null}
                      <TranslatedText as="p" text={award.description} className="mt-2 text-sm text-subtle" />
                    </article>
                  ))}
                </div>
              )}
            </section>
          ) : null}

          {documents.length > 0 ? (
            <section id="about-documents" className="ui-card space-y-6">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/15 text-accent">
                  <Shield className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-2xl font-semibold">Trust documents & SODO</h2>
                  <p className="text-sm text-subtle">Registration, society (SODO) records, and official certificates</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 print:hidden">
                {DOC_CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setDocCategory(cat)}
                    className={cn(
                      "rounded-xl border px-3 py-1.5 text-sm transition",
                      docCategory === cat
                        ? "border-primary bg-primary/10 font-medium text-primary"
                        : "border-border/60 text-subtle hover:border-primary/30"
                    )}
                  >
                    {cat === "all" ? "All" : DOC_CATEGORY_LABEL[cat]}
                  </button>
                ))}
              </div>
              {filteredDocuments.length === 0 ? (
                <p className="text-sm text-subtle">No documents in this category.</p>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {filteredDocuments.map((doc) => {
                    const url = resolveMediaUrl(doc.fileUrl);
                    const isPdf = url.toLowerCase().includes(".pdf");
                    return (
                      <a
                        key={doc.id}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group flex items-start gap-4 rounded-2xl border border-border/60 bg-card p-4 transition hover:border-primary/40 hover:shadow-md"
                      >
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-muted/30 text-primary group-hover:bg-primary/15">
                          {isPdf ? <FileText className="h-5 w-5" /> : <Download className="h-5 w-5" />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-medium uppercase tracking-wide text-accent">
                            {DOC_CATEGORY_LABEL[doc.category] ?? "Document"}
                          </p>
                          <TranslatedText as="p" text={doc.title} className="font-semibold text-foreground" />
                          {doc.description ? (
                            <TranslatedText as="p" text={doc.description} className="mt-1 line-clamp-2 text-sm text-subtle" />
                          ) : null}
                          <p className="mt-2 text-xs text-primary group-hover:underline">
                            {isPdf ? "Open PDF in new tab — preview in browser →" : "View / download →"}
                          </p>
                        </div>
                      </a>
                    );
                  })}
                </div>
              )}
            </section>
          ) : null}

          <AboutPartners partners={data.partners} />
          <AboutContactCard contact={data.contact} />

          <section
            id="about-developer"
            className="ui-card border-accent/30 bg-gradient-to-br from-accent/5 to-primary/5 space-y-4"
          >
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

        <aside className="hidden w-52 shrink-0 lg:block print:hidden">
          <AboutTocNav items={tocItems} />
        </aside>
      </div>
    </div>
  );
}
