import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Filter, Search, SlidersHorizontal } from "lucide-react";
import { ProfileCard } from "@/components/cards/profile-card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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
  const [city, setCity] = useState("");
  const [ageMin, setAgeMin] = useState("");
  const [ageMax, setAgeMax] = useState("");
  const [profession, setProfession] = useState("");
  const [search, setSearch] = useState("");

  const loadProfiles = useCallback(async () => {
    try {
      const client = user ? api : publicApi;
      const path = user ? "/matrimonial/discover" : "/public/matrimonial/profiles";
      const params: Record<string, string | number> = { limit: 500 };
      if (city.trim()) params.city = city.trim();
      if (ageMin.trim()) params.ageMin = Number.parseInt(ageMin, 10);
      if (ageMax.trim()) params.ageMax = Number.parseInt(ageMax, 10);
      if (profession.trim()) params.profession = profession.trim();
      const { data } = await client.get(path, { params });
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
  }, [user, city, ageMin, ageMax, profession]);

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

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return profiles;
    return profiles.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.city.toLowerCase().includes(q) ||
        p.profession.toLowerCase().includes(q) ||
        p.education.toLowerCase().includes(q)
    );
  }, [profiles, search]);

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

  const clearFilters = () => {
    setCity("");
    setAgeMin("");
    setAgeMax("");
    setProfession("");
    setSearch("");
  };

  const hasFilters = city || ageMin || ageMax || profession || search;

  return (
    <div className="space-y-6">
      <div className="glass rounded-3xl p-6 md:p-8">
        <h1 className="text-3xl font-bold">Rishta</h1>
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
        <div className="mt-4 flex flex-wrap gap-2">
          <Badge className="bg-primary/15 text-primary">Verified only</Badge>
          <Badge className="bg-accent/15 text-accent">Match score</Badge>
          <Badge className="bg-muted/30">Private chat on interest</Badge>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
        <aside className="glass space-y-4 rounded-3xl p-6 lg:sticky lg:top-24 lg:self-start">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">Filter matches</h2>
          </div>
          <div className="space-y-3">
            <Input placeholder="City" value={city} onChange={(e) => setCity(e.target.value)} />
            <div className="grid grid-cols-2 gap-2">
              <Input placeholder="Min age" value={ageMin} onChange={(e) => setAgeMin(e.target.value)} type="number" min={18} />
              <Input placeholder="Max age" value={ageMax} onChange={(e) => setAgeMax(e.target.value)} type="number" max={80} />
            </div>
            <Input placeholder="Profession" value={profession} onChange={(e) => setProfession(e.target.value)} />
            <Button type="button" variant="primary" className="w-full gap-2" onClick={() => void loadProfiles()}>
              <Filter className="h-4 w-4" />
              Apply filters
            </Button>
            {hasFilters ? (
              <Button type="button" variant="outline" className="w-full" onClick={clearFilters}>
                Clear all
              </Button>
            ) : null}
          </div>
        </aside>

        <section className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-subtle" />
            <Input
              className="pl-10"
              placeholder="Search by name, city, profession…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <p className="text-sm text-subtle">
            {filtered.length} profile{filtered.length === 1 ? "" : "s"} found
          </p>
          <div className="grid gap-4 md:grid-cols-2">
            {filtered.map((profile) => (
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
          </div>
          {filtered.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-border p-8 text-center text-subtle">
              No profiles match your filters. Try adjusting city, age, or profession.
            </p>
          ) : null}
        </section>
      </div>
      {message ? <p className="text-sm text-accent">{message}</p> : null}
    </div>
  );
}
