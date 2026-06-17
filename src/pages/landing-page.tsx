import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
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

  return (
    <div className="space-y-24 py-8">
      {!user ? (
        <section className="glass rounded-3xl border border-primary/20 p-6 md:p-8">
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
        </section>
      ) : null}
      <section className="grid items-center gap-10 md:grid-cols-2">
        <div>
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
            className="mt-5 text-foreground/60"
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
        </div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-3xl bg-hero-gradient p-4 md:p-6"
        >
          <LandingHeroImage className="w-full" />
        </motion.div>
      </section>

      <section className="space-y-6">
        <TranslatedText
          as="h2"
          text={copy?.howItWorksTitle}
          className="text-2xl font-semibold"
        />
        <div className="grid gap-4 md:grid-cols-3">
          {(copy?.howItWorksSteps ?? []).map((step, i) => (
            <div key={`${i}-${step.slice(0, 8)}`} className="glass rounded-3xl p-6">
              <TranslatedText as="p" text={step} className="text-foreground" />
            </div>
          ))}
        </div>
      </section>

      {profile?.fullName && profile?.city ? (
        <section className="glass rounded-3xl p-6">
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
        </section>
      ) : null}

      <section className="space-y-5">
        <TranslatedText
          as="h2"
          text={copy?.featuredProfilesTitle}
          className="text-2xl font-semibold"
        />
        {!data || data.featuredProfiles.length === 0 ? (
          <p className="text-subtle">{noProfiles}</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-3">
            {data.featuredProfiles.map((item, i) => (
              <ProfileCard
                key={`${item.name}-${item.city}-${i}`}
                name={item.name}
                age={item.age}
                city={item.city}
                score={item.score}
                bannerImageUrl={item.bannerUrl ? resolveMediaUrl(item.bannerUrl) : undefined}
                showActions={false}
                onViewProfile={() => navigate("/matrimonial")}
              />
            ))}
          </div>
        )}
      </section>

      <section className="space-y-5">
        <TranslatedText
          as="h2"
          text={copy?.donationImpactTitle}
          className="text-2xl font-semibold"
        />
        <div className="grid gap-4 md:grid-cols-3">
          <div className="glass rounded-3xl p-6">
            <p className="text-sm text-subtle">{totalRaisedL}</p>
            <p className="mt-2 text-3xl font-semibold">{totalRaised.toLocaleString()}</p>
          </div>
          <div className="glass rounded-3xl p-6">
            <p className="text-sm text-subtle">{supportersL}</p>
            <p className="mt-2 text-3xl font-semibold">{uniqueDonors.toLocaleString()}</p>
          </div>
          <div className="glass rounded-3xl p-6">
            <p className="text-sm text-subtle">{activeCampL}</p>
            <p className="mt-2 text-3xl font-semibold">{activeCampaigns.toLocaleString()}</p>
          </div>
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
          className="text-2xl font-semibold"
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
