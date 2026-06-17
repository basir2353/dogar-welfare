import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ProfileCard } from "@/components/cards/profile-card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { api, publicApi, resolveMediaUrl } from "@/utils/api";
import { useAuthStore } from "@/store/auth-store";
import { useAuthRedirect } from "@/hooks/use-auth-redirect";
import { useTranslate } from "@/hooks/use-translate";
import { UI } from "@/i18n/ui";
import type { AxiosError } from "axios";

type DiscoverProfile = {
  userId: string;
  name: string;
  age: number;
  city: string;
  score: number;
  profession: string;
  education: string;
  bannerUrl: string | null;
};

type DiscoverApiRecord = {
  userId: string;
  age: number;
  profession?: string | null;
  education?: string | null;
  aboutFamily?: string | null;
  matchScore: number;
  bannerUrl: string | null;
  user?: {
    profile?: {
      fullName?: string | null;
      city?: string | null;
    };
  };
};

export function MatrimonialPage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const redirectToAuth = useAuthRedirect();
  const signInToInterest = useTranslate(UI.signInToInterest);
  const [profiles, setProfiles] = useState<DiscoverProfile[]>([]);
  const [sent, setSent] = useState<Record<string, boolean>>({});
  const [message, setMessage] = useState("");

  const loadProfiles = useCallback(async () => {
    try {
      const client = user ? api : publicApi;
      const path = user ? "/matrimonial/discover" : "/public/matrimonial/profiles";
      const { data } = await client.get(path, { params: { limit: 500 } });
      if (data.success) {
        const list = data.data as DiscoverApiRecord[];
        const mapped = list.map((profile) => ({
          userId: profile.userId,
          name: profile.user?.profile?.fullName ?? "Member",
          age: profile.age,
          city: profile.user?.profile?.city ?? "Unknown",
          score: profile.matchScore,
          profession: profile.profession ?? "Not specified",
          education: profile.education ?? "Not specified",
          bannerUrl: profile.bannerUrl
        }));
        setProfiles(mapped);
      }
    } catch (error) {
      const backendMessage = (error as AxiosError<{ error?: { message?: string } }>)?.response?.data?.error?.message;
      setMessage(backendMessage ?? "Unable to load matchmaking profiles. Ensure backend API is running.");
    }
  }, [user]);

  useEffect(() => {
    void loadProfiles();
  }, [loadProfiles]);

  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState === "visible") {
        void loadProfiles();
      }
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [loadProfiles]);

  const sendInterest = async (profile: DiscoverProfile) => {
    if (!user) {
      redirectToAuth();
      return;
    }
    try {
      await api.post("/matrimonial/interests", {
        receiverId: profile.userId
      });
      setSent((prev) => ({ ...prev, [profile.userId]: true }));
      setMessage(`Interest sent to ${profile.name}`);
    } catch (error) {
      const msg =
        (error as AxiosError<{ error?: { message?: string } }>)?.response?.data?.error?.message
        ?? "Unable to send interest right now.";
      setMessage(msg);
    }
    setTimeout(() => setMessage(""), 3500);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Rishta</h1>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-subtle">
          Browse verified profiles freely. Sign in only when you want to send interest or start a private chat.
          {!user ? (
            <>
              {" "}
              <Link to="/auth" className="text-primary underline decoration-primary/40 hover:text-primary/90">
                {signInToInterest}
              </Link>
            </>
          ) : null}
        </p>
      </div>
    <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
      <aside className="glass rounded-3xl p-6">
        <h2 className="text-lg font-semibold">Filter Matches</h2>
        <div className="mt-4 space-y-3">
          <Input placeholder="City" />
          <Input placeholder="Age range" />
          <Input placeholder="Profession" />
        </div>
        <Badge className="mt-5">Swipe-ready UI enabled next phase</Badge>
      </aside>
      <section className="grid gap-4 md:grid-cols-2">
        {profiles.map((profile) => (
          <ProfileCard
            key={profile.userId}
            name={profile.name}
            age={profile.age}
            city={profile.city}
            score={profile.score}
            bannerImageUrl={profile.bannerUrl ? resolveMediaUrl(profile.bannerUrl) : undefined}
            interestSent={!!sent[profile.userId]}
            onSendInterest={() => void sendInterest(profile)}
            onViewProfile={() => navigate(`/matrimonial/${profile.userId}`)}
          />
        ))}
      </section>
    </div>
      {message ? <p className="text-sm text-accent">{message}</p> : null}
    </div>
  );
}
