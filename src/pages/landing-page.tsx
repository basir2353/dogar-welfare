import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  HeartHandshake,
  MessageCircle,
  ShieldCheck,
  Sparkles,
  Users,
  Award,
  TrendingUp,
  HandHeart
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

type PublicLanding = {
  copy: LandingCopy;
  featuredProfiles: Array<{ name: string; age: number; city: string; score: number; bannerUrl: string | null }>;
  featuredCampaigns: Array<{ title: string; raised: number; goal: number; verified: boolean }>;
  communityPreviewPosts: Array<{ author: string; content: string; likes: number; comments: number }>;
};

const FEATURE_ICONS = [ShieldCheck, Users, HandHeart, Sparkles];
const STEP_ICONS = [Users, HeartHandshake, MessageCircle];

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.45 }
  })
};

export function LandingPage() {
  const navigate = useNavigate();
  const impact = useImpact();
  const user = useAuthStore((s) => s.user);
  const profile = useAuthStore((s) => s.profile);
  const [data, setData] = useState<PublicLanding | null>(null);
  const [loadError, setLoadError] = useState(false);
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

  const copy = data?.copy;
  const totalRaised = impact?.totalRaised ?? 0;
  const uniqueDonors = impact?.uniqueDonors ?? 0;
  const activeCampaigns = impact?.activeCampaigns ?? 0;

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
    { icon: Award, title: "Trust & documents", desc: "Awards, SODO records, and certificates on our About page." }
  ];

  return (
    <div className="space-y-28 py-8">
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

      <section className="space-y-8">
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

      <section className="space-y-5">
        <TranslatedText
          as="h2"
          text={copy?.featuredProfilesTitle}
          className="text-2xl font-semibold md:text-3xl"
        />
        {!data || data.featuredProfiles.length === 0 ? (
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

      <section className="space-y-5">
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
          {!data || data.featuredCampaigns.length === 0 ? (
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

      <section className="space-y-5">
        <TranslatedText
          as="h2"
          text={copy?.communityPreviewTitle}
          className="text-2xl font-semibold md:text-3xl"
        />
        {!data || data.communityPreviewPosts.length === 0 ? (
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
    </div>
  );
}
