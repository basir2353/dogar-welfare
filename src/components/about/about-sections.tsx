import { useState } from "react";
import {
  BarChart3,
  Calendar,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Globe,
  Hash,
  Link2,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Play,
  Quote,
  Users,
  X
} from "lucide-react";
import type {
  AboutContact,
  AboutFaq,
  AboutGalleryImage,
  AboutPartner,
  AboutStat,
  AboutTeamMember,
  AboutTestimonial,
  AboutTimeline
} from "@/shared";
import { resolveMediaUrl } from "@/utils/api";
import { TranslatedText } from "@/components/translated-text";
import { cn } from "@/lib/cn";

export type TocItem = { id: string; label: string };

function youtubeEmbedUrl(url: string): string | null {
  const trimmed = url.trim();
  if (!trimmed) return null;
  try {
    const u = new URL(trimmed);
    if (u.hostname.includes("youtu.be")) {
      const id = u.pathname.replace(/^\//, "");
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }
    if (u.hostname.includes("youtube.com")) {
      const id = u.searchParams.get("v");
      if (id) return `https://www.youtube.com/embed/${id}`;
      const embed = u.pathname.match(/\/embed\/([^/?]+)/);
      if (embed?.[1]) return `https://www.youtube.com/embed/${embed[1]}`;
    }
  } catch {
    // not a URL
  }
  if (/^[\w-]{8,}$/.test(trimmed)) {
    return `https://www.youtube.com/embed/${trimmed}`;
  }
  return trimmed.startsWith("http") ? trimmed : null;
}

export function AboutStatsRow({ stats }: { stats: AboutStat[] }) {
  const items = stats.slice().sort((a, b) => a.order - b.order);
  if (items.length === 0) return null;

  return (
    <section id="about-stats" className="ui-card">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/15 text-primary">
          <BarChart3 className="h-6 w-6" />
        </div>
        <div>
          <h2 className="text-2xl font-semibold">Impact at a glance</h2>
          <p className="text-sm text-subtle">Key numbers from Dogar Welfare Trust</p>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((stat) => (
          <div
            key={stat.id}
            className="rounded-2xl border border-border/60 bg-gradient-to-br from-primary/5 to-accent/5 p-5 text-center"
          >
            <p className="text-3xl font-bold tabular-nums text-primary">{stat.value}</p>
            <TranslatedText as="p" text={stat.label} className="mt-2 text-sm text-subtle" />
          </div>
        ))}
      </div>
    </section>
  );
}

export function AboutTimeline({ items }: { items: AboutTimeline[] }) {
  const milestones = items.slice().sort((a, b) => a.order - b.order);
  if (milestones.length === 0) return null;

  return (
    <section id="about-timeline" className="ui-card space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/15 text-accent">
          <Calendar className="h-6 w-6" />
        </div>
        <div>
          <h2 className="text-2xl font-semibold">Our journey</h2>
          <p className="text-sm text-subtle">Milestones in welfare and community service</p>
        </div>
      </div>
      <ol className="relative space-y-6 border-l-2 border-primary/20 pl-8">
        {milestones.map((item) => (
          <li key={item.id} className="relative">
            <span className="absolute -left-[2.35rem] flex h-8 w-8 items-center justify-center rounded-full border-2 border-primary/30 bg-card text-xs font-bold text-primary">
              {item.year.slice(-2)}
            </span>
            <p className="text-xs font-medium uppercase tracking-wider text-primary">{item.year}</p>
            <TranslatedText as="h3" text={item.title} className="mt-1 text-lg font-semibold" />
            <TranslatedText as="p" text={item.body} className="mt-2 text-sm text-subtle" />
          </li>
        ))}
      </ol>
    </section>
  );
}

export function AboutTeamGrid({ members }: { members: AboutTeamMember[] }) {
  const team = members.slice().sort((a, b) => a.order - b.order);
  if (team.length === 0) return null;

  return (
    <section id="about-team" className="ui-card space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/15 text-primary">
          <Users className="h-6 w-6" />
        </div>
        <div>
          <h2 className="text-2xl font-semibold">Our team</h2>
          <p className="text-sm text-subtle">People behind the trust and community</p>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {team.map((member) => (
          <article
            key={member.id}
            className="overflow-hidden rounded-2xl border border-border/60 bg-gradient-to-br from-primary/5 to-transparent p-5"
          >
            {member.imageUrl ? (
              <div className="mb-4 overflow-hidden rounded-xl border border-border/50">
                <img
                  src={resolveMediaUrl(member.imageUrl)}
                  alt=""
                  className="h-40 w-full object-cover"
                  loading="lazy"
                />
              </div>
            ) : (
              <div className="mb-4 flex h-24 items-center justify-center rounded-xl border border-dashed border-primary/30 bg-primary/5">
                <Users className="h-10 w-10 text-primary/40" />
              </div>
            )}
            <TranslatedText as="h3" text={member.name} className="text-lg font-semibold" />
            <TranslatedText as="p" text={member.role} className="mt-1 text-sm text-primary" />
            {member.bio ? (
              <TranslatedText as="p" text={member.bio} className="mt-2 text-sm text-subtle" />
            ) : null}
          </article>
        ))}
      </div>
    </section>
  );
}

export function AboutFaqAccordion({ items }: { items: AboutFaq[] }) {
  const faqs = items.slice().sort((a, b) => a.order - b.order);
  const [openId, setOpenId] = useState<string | null>(faqs[0]?.id ?? null);
  if (faqs.length === 0) return null;

  return (
    <section id="about-faq" className="ui-card space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/15 text-accent">
          <MessageCircle className="h-6 w-6" />
        </div>
        <div>
          <h2 className="text-2xl font-semibold">Frequently asked questions</h2>
          <p className="text-sm text-subtle">Common questions about Dogar Welfare Trust</p>
        </div>
      </div>
      <div className="space-y-2">
        {faqs.map((faq) => {
          const open = openId === faq.id;
          return (
            <div key={faq.id} className="overflow-hidden rounded-2xl border border-border/60">
              <button
                type="button"
                className="flex w-full items-center justify-between gap-3 px-4 py-4 text-left transition hover:bg-muted/20"
                onClick={() => setOpenId(open ? null : faq.id)}
                aria-expanded={open}
              >
                <TranslatedText as="span" text={faq.question} className="font-medium" />
                {open ? <ChevronUp className="h-5 w-5 shrink-0 text-primary" /> : <ChevronDown className="h-5 w-5 shrink-0 text-subtle" />}
              </button>
              {open ? (
                <div className="border-t border-border/50 px-4 py-4">
                  <TranslatedText as="p" text={faq.answer} className="text-sm text-subtle" />
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </section>
  );
}

export function AboutContactCard({ contact }: { contact: AboutContact }) {
  const hasContact =
    contact.address?.trim() ||
    contact.phone?.trim() ||
    contact.whatsapp?.trim() ||
    contact.email?.trim() ||
    contact.facebook?.trim() ||
    contact.instagram?.trim() ||
    contact.mapEmbedUrl?.trim();
  if (!hasContact) return null;

  return (
    <section id="about-contact" className="ui-card space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/15 text-primary">
          <Mail className="h-6 w-6" />
        </div>
        <div>
          <h2 className="text-2xl font-semibold">Get in touch</h2>
          <p className="text-sm text-subtle">Reach the trust team directly</p>
        </div>
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-4">
          {contact.address ? (
            <div className="flex items-start gap-3">
              <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
              <TranslatedText as="p" text={contact.address} className="text-sm" />
            </div>
          ) : null}
          {contact.phone ? (
            <a href={`tel:${contact.phone.replace(/\s/g, "")}`} className="flex items-center gap-3 text-sm hover:text-primary">
              <Phone className="h-5 w-5 shrink-0 text-primary" />
              {contact.phone}
            </a>
          ) : null}
          {contact.whatsapp ? (
            <a
              href={`https://wa.me/${contact.whatsapp.replace(/[^\d+]/g, "").replace(/^\+/, "")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 text-sm hover:text-primary"
            >
              <MessageCircle className="h-5 w-5 shrink-0 text-accent" />
              WhatsApp: {contact.whatsapp}
            </a>
          ) : null}
          {contact.email ? (
            <a href={`mailto:${contact.email}`} className="flex items-center gap-3 text-sm hover:text-primary">
              <Mail className="h-5 w-5 shrink-0 text-primary" />
              {contact.email}
            </a>
          ) : null}
          <div className="flex flex-wrap gap-3 pt-2">
            {contact.facebook ? (
              <a
                href={contact.facebook}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl border border-border/60 px-3 py-2 text-sm transition hover:border-primary/40"
              >
                <Globe className="h-4 w-4 text-primary" />
                Facebook
              </a>
            ) : null}
            {contact.instagram ? (
              <a
                href={contact.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl border border-border/60 px-3 py-2 text-sm transition hover:border-primary/40"
              >
                <Link2 className="h-4 w-4 text-accent" />
                Instagram
              </a>
            ) : null}
          </div>
        </div>
        {contact.mapEmbedUrl ? (
          <div className="overflow-hidden rounded-2xl border border-border/60">
            <iframe
              src={contact.mapEmbedUrl}
              title="Location map"
              className="h-56 w-full"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        ) : null}
      </div>
    </section>
  );
}

export function AboutTestimonials({ items }: { items: AboutTestimonial[] }) {
  const reviews = items.slice().sort((a, b) => a.order - b.order);
  if (reviews.length === 0) return null;

  return (
    <section id="about-testimonials" className="ui-card space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/15 text-accent">
          <Quote className="h-6 w-6" />
        </div>
        <div>
          <h2 className="text-2xl font-semibold">What families say</h2>
          <p className="text-sm text-subtle">Stories from members and supporters</p>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {reviews.map((item) => (
          <blockquote
            key={item.id}
            className="rounded-2xl border border-border/60 bg-gradient-to-br from-accent/5 to-primary/5 p-5"
          >
            <Quote className="h-8 w-8 text-primary/20" />
            <TranslatedText as="p" text={item.quote} className="mt-3 text-sm italic text-foreground/90" />
            <div className="mt-4 flex items-center gap-3">
              {item.imageUrl ? (
                <img
                  src={resolveMediaUrl(item.imageUrl)}
                  alt=""
                  className="h-10 w-10 rounded-full object-cover"
                  loading="lazy"
                />
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/15 text-primary">
                  <Users className="h-5 w-5" />
                </div>
              )}
              <div>
                <TranslatedText as="p" text={item.name} className="text-sm font-semibold" />
                {item.role ? <TranslatedText as="p" text={item.role} className="text-xs text-subtle" /> : null}
              </div>
            </div>
          </blockquote>
        ))}
      </div>
    </section>
  );
}

export function AboutGallery({ images }: { images: AboutGalleryImage[] }) {
  const gallery = images.slice().sort((a, b) => a.order - b.order);
  const [lightbox, setLightbox] = useState<AboutGalleryImage | null>(null);
  if (gallery.length === 0) return null;

  return (
    <>
      <section id="about-gallery" className="ui-card space-y-6">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/15 text-primary">
            <Hash className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-2xl font-semibold">Photo gallery</h2>
            <p className="text-sm text-subtle">Moments from welfare work and community events</p>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {gallery.map((img) => (
            <button
              key={img.id}
              type="button"
              className="group overflow-hidden rounded-2xl border border-border/60 text-left transition hover:border-primary/40 hover:shadow-md"
              onClick={() => setLightbox(img)}
            >
              <img
                src={resolveMediaUrl(img.imageUrl)}
                alt=""
                className="h-48 w-full object-cover transition group-hover:scale-105"
                loading="lazy"
              />
              {img.caption ? (
                <div className="p-3">
                  <TranslatedText as="p" text={img.caption} className="line-clamp-2 text-sm text-subtle" />
                </div>
              ) : null}
            </button>
          ))}
        </div>
      </section>

      {lightbox ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          role="dialog"
          aria-modal="true"
          onClick={() => setLightbox(null)}
        >
          <button
            type="button"
            className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
            onClick={() => setLightbox(null)}
            aria-label="Close gallery"
          >
            <X className="h-6 w-6" />
          </button>
          <div className="max-h-[90vh] max-w-4xl" onClick={(e) => e.stopPropagation()}>
            <img
              src={resolveMediaUrl(lightbox.imageUrl)}
              alt=""
              className="max-h-[80vh] w-full rounded-2xl object-contain"
            />
            {lightbox.caption ? (
              <TranslatedText as="p" text={lightbox.caption} className="mt-3 text-center text-sm text-white/80" />
            ) : null}
          </div>
        </div>
      ) : null}
    </>
  );
}

export function AboutPartners({ partners }: { partners: AboutPartner[] }) {
  const items = partners.slice().sort((a, b) => a.order - b.order);
  if (items.length === 0) return null;

  return (
    <section id="about-partners" className="ui-card space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/15 text-accent">
          <Users className="h-6 w-6" />
        </div>
        <div>
          <h2 className="text-2xl font-semibold">Partners & collaborators</h2>
          <p className="text-sm text-subtle">Organizations we work with</p>
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-6">
        {items.map((partner) => (
          <div
            key={partner.id}
            className="flex min-w-[8rem] flex-col items-center gap-2 rounded-2xl border border-border/60 bg-card px-6 py-4"
          >
            {partner.logoUrl ? (
              <img
                src={resolveMediaUrl(partner.logoUrl)}
                alt=""
                className="h-12 max-w-[8rem] object-contain"
                loading="lazy"
              />
            ) : (
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted/30 text-subtle">
                <Users className="h-6 w-6" />
              </div>
            )}
            <TranslatedText as="p" text={partner.name} className="text-center text-sm font-medium" />
          </div>
        ))}
      </div>
    </section>
  );
}

export function AboutVideoEmbed({ videoUrl }: { videoUrl?: string }) {
  const embed = videoUrl ? youtubeEmbedUrl(videoUrl) : null;
  if (!embed) return null;

  return (
    <section id="about-video" className="ui-card space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/15 text-primary">
          <Play className="h-6 w-6" />
        </div>
        <div>
          <h2 className="text-2xl font-semibold">Watch our story</h2>
          <p className="text-sm text-subtle">Video introduction to Dogar Welfare Trust</p>
        </div>
      </div>
      <div className="overflow-hidden rounded-2xl border border-border/60">
        <div className="relative aspect-video w-full">
          <iframe
            src={embed}
            title="About video"
            className="absolute inset-0 h-full w-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      </div>
      <a
        href={videoUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
      >
        Open video in new tab
        <ExternalLink className="h-4 w-4" />
      </a>
    </section>
  );
}

export function AboutTocNav({ items }: { items: TocItem[] }) {
  const [active, setActive] = useState(items[0]?.id ?? "");

  if (items.length === 0) return null;

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      setActive(id);
    }
  };

  return (
    <nav aria-label="About page sections" className="glass sticky top-24 rounded-2xl p-4">
      <p className="mb-3 text-xs font-medium uppercase tracking-wider text-subtle">On this page</p>
      <ul className="space-y-1">
        {items.map((item) => (
          <li key={item.id}>
            <button
              type="button"
              onClick={() => scrollTo(item.id)}
              className={cn(
                "w-full rounded-xl px-3 py-2 text-left text-sm transition hover:bg-muted/30",
                active === item.id ? "bg-primary/10 font-medium text-primary" : "text-subtle"
              )}
            >
              {item.label}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}
