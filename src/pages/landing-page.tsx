import { Link, useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowUp,
  Award,
  BadgeCheck,
  ChevronDown,
  ChevronUp,
  HandHeart,
  Hash,
  HeartHandshake,
  Lock,
  MessageCircle,
  Play,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Users,
  Eye
} from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { ProfileCard } from "@/components/cards/profile-card";
import { CampaignCard } from "@/components/cards/campaign-card";
import { PostCard } from "@/components/cards/post-card";
import { useImpact } from "@/hooks/use-impact";
import { useAuthStore } from "@/store/auth-store";
import { publicApi, resolveMediaUrl } from "@/utils/api";
import { TranslatedText } from "@/components/translated-text";
import { useTranslate } from "@/hooks/use-translate";
import { UI } from "@/i18n/ui";
import { LandingHeroImage } from "@/components/brand/landing-hero-image";

type LandingCopy = {
  heroBadge: string;
  heroTitle: string;
  heroSubtitle: string;
  ctaFindRishta: string;
  ctaCommunity: string;
  ctaDonate: string;
  howItWorksTitle: string;
  howItWorksSteps: string[];
  featuredProfilesTitle: string;
  donationImpactTitle: string;
  communityPreviewTitle: string;
};

type LiveStats = {
  verifiedMembers: number;
  totalPosts: number;
  activeCampaigns: number;
  interestsSent: number;
};

type TrendingTag = { tag: string; count: number; posts: number };

type PublicLanding = {
  copy: LandingCopy;
  featuredProfiles: Array<{ name: string; age: number; city: string; score: number; bannerUrl: string | null }>;
  featuredCampaigns: Array<{ title: string; raised: number; goal: number; verified: boolean }>;
  communityPreviewPosts: Array<{ author: string; content: string; likes: number; comments: number }>;
  liveStats?: LiveStats;
  trendingHashtags?: TrendingTag[];
};

const FEATURE_ICONS = [ShieldCheck, Users, HandHeart, Sparkles, Award, Eye, Lock, TrendingUp];
const STEP_ICONS = [Users, HeartHandshake, MessageCircle];
const TRUST_BADGES = [
  { icon: BadgeCheck, label: "Verified", desc: "Staff-reviewed profiles" },
  { icon: Lock, label: "Secure", desc: "Private data protection" },
  { icon: Eye, label: "Transparent", desc: "Open welfare tracking" }
];

const STATIC_FAQS = [
  {
    id: "f1",
    question: "Do I need an account to browse rishta profiles?",
    answer: "You can explore featured profiles and community posts as a guest. Sign up when you are ready to send interest or post."
  },
  {
    id: "f2",
    question: "How are welfare campaigns verified?",
    answer: "Active campaigns are reviewed by our team and show raised amounts versus goals on the Donations page."
  },
  {
    id: "f3",
    question: "Is the community moderated?",
    answer: "Yes. Posts and profiles go through moderation so families can connect in a respectful, safe space."
  }
];

const STATIC_TESTIMONIALS = [
  { name: "Family from Lahore", role: "Member", quote: "We found a respectful match through Dogar with clear verification." },
  { name: "Community donor", role: "Supporter", quote: "Campaign updates are transparent — we know where help goes." },
  { name: "New member", role: "Rishta seeker", quote: "The platform feels modern yet rooted in family values." }
];

const WHY_CHOOSE = [
  { title: "Verified rishta", desc: "Profiles reviewed before they go live — not open listings.", highlight: "Dogar" },
  { title: "Welfare + community", desc: "Donations, campaigns, and social feed in one trusted place.", highlight: "Dogar" },
  { title: "Documents on About", desc: "Awards, SODO, and registration visible for family peace of mind.", highlight: "Dogar" }
];

const PARTNER_LOGOS = ["Welfare partners", "Community volunteers", "Local donors", "Family networks"];

const SECTION_PILLS = [
  { id: "landing-features", label: "Features" },
  { id: "landing-stats", label: "Live stats" },
  { id: "landing-how", label: "How it works" },
  { id: "landing-profiles", label: "Profiles" },
  { id: "landing-impact", label: "Impact" },
  { id: "landing-community", label: "Community" },
  { id: "landing-faq", label: "FAQ" }
];

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.45 }
  })
};

function useAnimatedCounter(target: number, duration = 1200) {
  const [value, setValue] = useState(0);
  const started = useRef(false);

  useEffect(() => {
    if (started.current || target <= 0) {
      setValue(target);
      return;
    }
    started.current = true;
    const start = performance.now();
    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / duration);
      setValue(Math.round(target * progress));
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [target, duration]);

  return value;
}

function AnimatedStat({ label, value, icon: Icon }: { label: string; value: number; icon: typeof Users }) {
  const animated = useAnimatedCounter(value);
  return (
    <motion.div
      custom={0}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true }}
      variants={fadeUp}
      className="glass rounded-3xl p-6"
    >
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
          <Icon className="h-5 w-5" />
        </div>
        <p className="text-sm text-subtle">{label}</p>
      </div>
      <p className="mt-3 text-3xl font-semibold tabular-nums">{animated.toLocaleString()}</p>
    </motion.div>
  );
}

function LandingFaq() {
  const [openId, setOpenId] = useState<string | null>(STATIC_FAQS[0]?.id ?? null);
  return (
    <section id="landing-faq" className="space-y-6">
      <h2 className="text-2xl font-semibold md:text-3xl">Frequently asked questions</h2>
      <div className="space-y-2">
        {STATIC_FAQS.map((faq) => {
          const open = openId === faq.id;
          return (
            <div key={faq.id} className="glass overflow-hidden rounded-2xl">
              <button
                type="button"
                className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left"
                onClick={() => setOpenId(open ? null : faq.id)}
              >
                <span className="font-medium">{faq.question}</span>
                {open ? <ChevronUp className="h-5 w-5 shrink-0 text-primary" /> : <ChevronDown className="h-5 w-5 shrink-0 text-subtle" />}
              </button>
              {open ? (
                <div className="border-t border-border/50 px-5 py-4">
                  <p className="text-sm text-subtle">{faq.answer}</p>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </section>
  );
}

export function LandingPage() {
  const navigate = useNavigate();
  const impact = useImpact();
  const user = useAuthStore((s) => s.user);
  const profile = useAuthStore((s) => s.profile);
  const [data, setData] = useState<PublicLanding | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const errMsg = useTranslate(UI.homeLoadError);
  const loadingMsg = useTranslate(UI.homeLoading);
  const guestHint = useTranslate(UI.guestBrowseHint);
  const signInOptional = useTranslate(UI.signInOptional);
  const signInLabel = useTranslate(UI.signIn);
  const signUpLabel = useTranslate(UI.signUp);
  const yourProfile = useTranslate(UI.yourProfile);
  const yourProfileHint = useTranslate(UI.yourProfileHint);
  const myProfile = useTranslate(UI.myProfile);
  const noProfiles = useTranslate(UI.noFeaturedProfiles);
  const totalRaisedL = useTranslate(UI.totalRaisedPkr);
  const supportersL = useTranslate(UI.supporters);
  const activeCampL = useTranslate(UI.activeCampaigns);
  const noCamp = useTranslate(UI.noCampaignsHint);
  const noPosts = useTranslate(UI.noCommunityPosts);
  const openCommunity = useTranslate(UI.openCommunity);

  useEffect(() => {
    const load = async () => {
      setLoadError(false);
      try {
        const { data: res } = await publicApi.get("/public/landing");
        if (res.success && res.data) {
          setData(res.data as PublicLanding);
        }
      } catch {
        setData(null);
        setLoadError(true);
      }
    };
    void load();
  }, []);

  useEffect(() => {
    const onScroll = () => setShowScrollTop(window.scrollY > 400);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const copy = data?.copy;
  const totalRaised = impact?.totalRaised ?? 0;
  const uniqueDonors = impact?.uniqueDonors ?? 0;
  const activeCampaigns = impact?.activeCampaigns ?? 0;
  const liveStats = data?.liveStats ?? {
    verifiedMembers: 0,
    totalPosts: 0,
    activeCampaigns: 0,
    interestsSent: 0
  };
  const trendingHashtags = data?.trendingHashtags ?? [];

  if (!data) {
    return (
      <div className="py-24 text-center text-foreground/55">
        {loadError ? errMsg : loadingMsg}
      </div>
    );
  }

  const features = [
    { icon: ShieldCheck, title: "Verified profiles", desc: "Every rishta profile is reviewed by our team before going live." },
    { icon: TrendingUp, title: "Trending community", desc: "Share updates, use hashtags, and connect like a modern social feed." },
    { icon: HandHeart, title: "Transparent welfare", desc: "Track donations and campaign impact with full visibility." },
    { icon: Award, title: "Trust & documents", desc: "Awards, SODO records, and certificates on our About page." },
    { icon: MessageCircle, title: "Private chat", desc: "Connect safely after mutual interest — no public phone numbers." },
    { icon: Users, title: "Family-first design", desc: "Built for Dogar families with Urdu and Punjabi support." },
    { icon: Hash, title: "Hashtag discovery", desc: "Find posts by topic — welfare, rishta tips, and local events." },
    { icon: Sparkles, title: "One platform", desc: "Rishta, donations, community, and trust docs together." }
  ];

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="relative space-y-28 py-8 pb-24 md:pb-8">
      {!user ? (
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-3xl border border-primary/20 p-6 md:p-8"
        >
          <p className="text-xs uppercase tracking-[0.2em] text-primary">{signInOptional}</p>
          <p className="mt-3 max-w-3xl text-foreground/80">{guestHint}</p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              to="/auth"
              className={cn(buttonVariants({ variant: "outline", size: "md" }), "inline-flex items-center justify-center")}
            >
              {signInLabel}
            </Link>
            <Link
              to="/auth"
              state={{ mode: "signup" }}
              className={cn(buttonVariants({ variant: "primary", size: "md" }), "inline-flex items-center justify-center")}
            >
              {signUpLabel}
            </Link>
          </div>
        </motion.section>
      ) : null}

      <section className="grid items-center gap-10 md:grid-cols-2">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }}>
          <TranslatedText
            as="p"
            text={copy?.heroBadge}
            className="text-sm uppercase tracking-[0.2em] text-primary"
          />
          <TranslatedText
            as="h1"
            text={copy?.heroTitle}
            className="mt-4 text-4xl font-bold leading-tight md:text-6xl"
          />
          <TranslatedText
            as="p"
            text={copy?.heroSubtitle}
            className="mt-5 text-lg text-foreground/60"
          />
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              to="/matrimonial"
              className={cn(buttonVariants({ variant: "primary", size: "md" }), "inline-flex items-center justify-center")}
            >
              <TranslatedText text={copy?.ctaFindRishta} />
            </Link>
            <Link
              to="/community"
              className={cn(buttonVariants({ variant: "outline", size: "md" }), "inline-flex items-center justify-center")}
            >
              <TranslatedText text={copy?.ctaCommunity} />
            </Link>
            <Link
              to="/donations"
              className={cn(buttonVariants({ variant: "accent", size: "md" }), "inline-flex items-center justify-center")}
            >
              <TranslatedText text={copy?.ctaDonate} />
            </Link>
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.5 }}
          className="glass rounded-3xl bg-hero-gradient p-4 md:p-6"
        >
          <LandingHeroImage className="w-full" />
        </motion.div>
      </section>

      <div className="flex flex-wrap justify-center gap-2">
        {SECTION_PILLS.map((pill) => (
          <button
            key={pill.id}
            type="button"
            onClick={() => scrollToSection(pill.id)}
            className="rounded-full border border-border/60 bg-card px-4 py-1.5 text-sm transition hover:border-primary/40 hover:bg-primary/5"
          >
            {pill.label}
          </button>
        ))}
      </div>

      {trendingHashtags.length > 0 ? (
        <section className="glass flex flex-wrap items-center gap-3 rounded-2xl px-4 py-3">
          <TrendingUp className="h-5 w-5 shrink-0 text-primary" />
          <span className="text-sm font-medium">Trending:</span>
          {trendingHashtags.map((item) => (
            <Link
              key={item.tag}
              to="/community"
              className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-sm text-primary transition hover:bg-primary/20"
            >
              <Hash className="h-3.5 w-3.5" />
              {item.tag}
              <span className="text-xs text-subtle">({item.posts})</span>
            </Link>
          ))}
        </section>
      ) : null}

      <div className="flex flex-wrap items-center justify-center gap-6">
        {TRUST_BADGES.map((badge) => {
          const Icon = badge.icon;
          return (
            <div key={badge.label} className="flex items-center gap-2 text-sm">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/15 text-primary">
                <Icon className="h-4 w-4" />
              </div>
              <div>
                <p className="font-semibold">{badge.label}</p>
                <p className="text-xs text-subtle">{badge.desc}</p>
              </div>
            </div>
          );
        })}
      </div>

      <section id="landing-stats" className="space-y-6">
        <h2 className="text-center text-2xl font-semibold md:text-3xl">Live community stats</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <AnimatedStat label="Verified members" value={liveStats.verifiedMembers} icon={BadgeCheck} />
          <AnimatedStat label="Community posts" value={liveStats.totalPosts} icon={MessageCircle} />
          <AnimatedStat label="Active campaigns" value={liveStats.activeCampaigns} icon={HandHeart} />
          <AnimatedStat label="Interests sent" value={liveStats.interestsSent} icon={HeartHandshake} />
        </div>
      </section>

      <section id="landing-features" className="space-y-8">
        <motion.div initial="hidden" whileInView="show" viewport={{ once: true }} variants={fadeUp} custom={0}>
          <h2 className="text-center text-2xl font-semibold md:text-3xl">Everything in one trusted place</h2>
          <p className="mx-auto mt-2 max-w-2xl text-center text-subtle">
            Rishta search, community, welfare, and private chat — built for Dogar families.
          </p>
        </motion.div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f, i) => {
            const Icon = FEATURE_ICONS[i] ?? Sparkles;
            return (
              <motion.div
                key={f.title}
                custom={i}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true }}
                variants={fadeUp}
                whileHover={{ y: -4 }}
                className="glass group rounded-3xl p-6 transition-shadow hover:shadow-lg"
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/15 text-primary transition group-hover:scale-110">
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="font-semibold">{f.title}</h3>
                <p className="mt-2 text-sm text-subtle">{f.desc}</p>
              </motion.div>
            );
          })}
        </div>
        <div className="text-center">
          <Link to="/about" className={cn(buttonVariants({ variant: "outline", size: "sm" }), "inline-flex")}>
            View awards & trust documents →
          </Link>
        </div>
      </section>

      <section className="space-y-6">
        <h2 className="text-center text-2xl font-semibold md:text-3xl">Why choose Dogar?</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {WHY_CHOOSE.map((item) => (
            <div key={item.title} className="glass rounded-3xl p-6">
              <p className="text-xs font-medium uppercase tracking-wider text-primary">{item.highlight}</p>
              <h3 className="mt-2 text-lg font-semibold">{item.title}</h3>
              <p className="mt-2 text-sm text-subtle">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="glass rounded-3xl border border-primary/25 bg-gradient-to-r from-primary/10 to-accent/10 p-8 text-center md:p-12">
        <h2 className="text-2xl font-bold md:text-3xl">Ready to join Dogar Welfare?</h2>
        <p className="mx-auto mt-3 max-w-xl text-subtle">
          Create your profile, explore verified rishta, and support welfare campaigns today.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link to="/auth" state={{ mode: "signup" }} className={cn(buttonVariants({ variant: "primary", size: "md" }), "inline-flex")}>
            Sign up free
          </Link>
          <Link to="/matrimonial" className={cn(buttonVariants({ variant: "outline", size: "md" }), "inline-flex")}>
            Browse rishta
          </Link>
        </div>
      </section>

      <section id="landing-how" className="space-y-6">
        <TranslatedText
          as="h2"
          text={copy?.howItWorksTitle}
          className="text-2xl font-semibold md:text-3xl"
        />
        <div className="grid gap-4 md:grid-cols-3">
          {(copy?.howItWorksSteps ?? []).map((step, i) => {
            const Icon = STEP_ICONS[i] ?? Sparkles;
            return (
              <motion.div
                key={`${i}-${step.slice(0, 8)}`}
                custom={i}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true }}
                variants={fadeUp}
                className="glass relative overflow-hidden rounded-3xl p-6"
              >
                <span className="absolute -right-2 -top-2 text-6xl font-bold text-primary/10">{i + 1}</span>
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-accent/15 text-accent">
                  <Icon className="h-5 w-5" />
                </div>
                <TranslatedText as="p" text={step} className="relative text-foreground" />
              </motion.div>
            );
          })}
        </div>
      </section>

      <section className="glass overflow-hidden rounded-3xl">
        <div className="grid md:grid-cols-2">
          <div className="flex aspect-video items-center justify-center bg-gradient-to-br from-primary/20 to-accent/20 md:aspect-auto">
            <Link to="/about" className="flex flex-col items-center gap-3 text-primary transition hover:scale-105">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/20">
                <Play className="h-8 w-8" />
              </div>
              <span className="text-sm font-medium">Watch our story on About →</span>
            </Link>
          </div>
          <div className="flex flex-col justify-center p-8">
            <h2 className="text-2xl font-semibold">See how Dogar helps families</h2>
            <p className="mt-3 text-subtle">
              Visit the About page for our video, timeline, trust documents, and team behind the platform.
            </p>
            <Link to="/about" className={cn(buttonVariants({ variant: "outline", size: "sm" }), "mt-4 inline-flex w-fit")}>
              Go to About page
            </Link>
          </div>
        </div>
      </section>

      {profile?.fullName && profile?.city ? (
        <motion.section
          initial={{ opacity: 0, scale: 0.98 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="glass rounded-3xl p-6 md:p-8"
        >
          <h2 className="text-2xl font-semibold">{yourProfile}</h2>
          <p className="mt-2 text-subtle">{yourProfileHint}</p>
          <div className="mt-4">
            <Link
              to="/profile"
              className={cn(buttonVariants({ variant: "primary", size: "md" }), "inline-flex items-center justify-center")}
            >
              {myProfile}
            </Link>
          </div>
        </motion.section>
      ) : null}

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Explore community topics</h2>
        <div className="flex flex-wrap gap-2">
          {(trendingHashtags.length > 0
            ? trendingHashtags.map((t) => t.tag)
            : ["dogarwelfare", "rishta", "lahore", "welfare", "family"]
          ).map((tag) => (
            <Link
              key={tag}
              to="/community"
              className="inline-flex items-center gap-1 rounded-full border border-border/60 px-3 py-1.5 text-sm transition hover:border-primary/40 hover:bg-primary/5"
            >
              <Hash className="h-3.5 w-3.5 text-primary" />
              {tag}
            </Link>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-center text-lg font-semibold text-subtle">Trusted by families & partners</h2>
        <div className="flex flex-wrap items-center justify-center gap-6">
          {PARTNER_LOGOS.map((name) => (
            <div
              key={name}
              className="flex h-14 min-w-[8rem] items-center justify-center rounded-2xl border border-border/60 bg-card px-6 text-sm font-medium text-subtle"
            >
              {name}
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-6">
        <h2 className="text-2xl font-semibold md:text-3xl">What families say</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {STATIC_TESTIMONIALS.map((item) => (
            <blockquote key={item.name} className="glass rounded-3xl p-6">
              <p className="text-sm italic text-foreground/90">&ldquo;{item.quote}&rdquo;</p>
              <footer className="mt-4">
                <p className="font-semibold">{item.name}</p>
                <p className="text-xs text-subtle">{item.role}</p>
              </footer>
            </blockquote>
          ))}
        </div>
      </section>

      <section id="landing-profiles" className="space-y-5">
        <TranslatedText
          as="h2"
          text={copy?.featuredProfilesTitle}
          className="text-2xl font-semibold md:text-3xl"
        />
        {data.featuredProfiles.length === 0 ? (
          <p className="text-subtle">{noProfiles}</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-3">
            {data.featuredProfiles.map((item, i) => (
              <motion.div
                key={`${item.name}-${item.city}-${i}`}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06 }}
              >
                <ProfileCard
                  name={item.name}
                  age={item.age}
                  city={item.city}
                  score={item.score}
                  bannerImageUrl={item.bannerUrl ? resolveMediaUrl(item.bannerUrl) : undefined}
                  showActions={false}
                  onViewProfile={() => navigate("/matrimonial")}
                />
              </motion.div>
            ))}
          </div>
        )}
        <div className="text-center">
          <Link to="/matrimonial" className={cn(buttonVariants({ variant: "primary", size: "sm" }), "inline-flex")}>
            Browse all rishta profiles
          </Link>
        </div>
      </section>

      <section id="landing-impact" className="space-y-5">
        <TranslatedText
          as="h2"
          text={copy?.donationImpactTitle}
          className="text-2xl font-semibold md:text-3xl"
        />
        <div className="grid gap-4 md:grid-cols-3">
          {[
            { label: totalRaisedL, value: totalRaised.toLocaleString(), icon: HandHeart },
            { label: supportersL, value: uniqueDonors.toLocaleString(), icon: Users },
            { label: activeCampL, value: activeCampaigns.toLocaleString(), icon: TrendingUp }
          ].map((stat, i) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.label}
                custom={i}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true }}
                variants={fadeUp}
                className="glass rounded-3xl p-6"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <p className="text-sm text-subtle">{stat.label}</p>
                </div>
                <p className="mt-3 text-3xl font-semibold tabular-nums">{stat.value}</p>
              </motion.div>
            );
          })}
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {data.featuredCampaigns.length === 0 ? (
            <p className="text-subtle md:col-span-2">{noCamp}</p>
          ) : (
            data.featuredCampaigns.map((campaign) => (
              <CampaignCard
                key={campaign.title}
                title={campaign.title}
                raised={campaign.raised}
                goal={campaign.goal}
                verified={campaign.verified}
                onDonate={() => navigate("/donations")}
              />
            ))
          )}
        </div>
      </section>

      <section id="landing-community" className="space-y-5">
        <TranslatedText
          as="h2"
          text={copy?.communityPreviewTitle}
          className="text-2xl font-semibold md:text-3xl"
        />
        {data.communityPreviewPosts.length === 0 ? (
          <p className="text-subtle">{noPosts}</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {data.communityPreviewPosts.map((post, index) => (
              <PostCard
                key={`${post.author}-${index}`}
                author={post.author}
                content={post.content}
                likes={post.likes}
                comments={post.comments}
                ctaTo="/community"
                ctaLabel={openCommunity}
              />
            ))}
          </div>
        )}
      </section>

      <LandingFaq />

      {showScrollTop ? (
        <button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="fixed bottom-20 right-4 z-40 flex h-11 w-11 items-center justify-center rounded-full bg-primary text-on-primary shadow-lg transition hover:brightness-110 md:bottom-8"
          aria-label="Scroll to top"
        >
          <ArrowUp className="h-5 w-5" />
        </button>
      ) : null}

      {!user ? (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border/80 bg-card/95 p-3 backdrop-blur-md md:hidden">
          <div className="container flex gap-2">
            <Link
              to="/auth"
              state={{ mode: "signup" }}
              className={cn(buttonVariants({ variant: "primary", size: "sm" }), "flex-1 justify-center")}
            >
              Sign up
            </Link>
            <Link
              to="/matrimonial"
              className={cn(buttonVariants({ variant: "outline", size: "sm" }), "flex-1 justify-center")}
            >
              Find rishta
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}
