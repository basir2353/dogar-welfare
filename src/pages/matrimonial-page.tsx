import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Columns2,
  Eye,
  Filter,
  GitCompare,
  Grid3x3,
  Heart,
  LayoutList,
  Search,
  Share2,
  SlidersHorizontal,
  X
} from "lucide-react";
import { ProfileCard } from "@/components/cards/profile-card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Modal } from "@/components/ui/modal";
import { api, publicApi, resolveMediaUrl } from "@/utils/api";
import { useAuthStore } from "@/store/auth-store";
import { useAuthRedirect } from "@/hooks/use-auth-redirect";
import { useTranslate } from "@/hooks/use-translate";
import { UI } from "@/i18n/ui";
import { userPrefs } from "@/lib/user-prefs";
import type { AxiosError } from "axios";

const INTEREST_TEMPLATES = [
  "Assalam-o-Alaikum, I found your profile suitable and would like to connect respectfully.",
  "Our families are interested — may we arrange a formal introduction?",
  "I appreciate your profile. Would you be open to a brief chat with family involvement?",
  "We share similar values and background. I'd like to explore a rishta match."
];

type DiscoverProfile = {
  userId: string;
  name: string;
  age: number;
  city: string;
  score: number;
  profession: string;
  education: string;
  sect: string;
  maritalStatus: string;
  bannerUrl: string | null;
};

type DiscoverApiRecord = {
  userId: string;
  age: number;
  profession?: string | null;
  education?: string | null;
  sect?: string | null;
  maritalStatus?: string | null;
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

type ListTab = "all" | "saved";

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
  const [sect, setSect] = useState("");
  const [education, setEducation] = useState("");
  const [maritalStatus, setMaritalStatus] = useState("");
  const [search, setSearch] = useState("");
  const [listTab, setListTab] = useState<ListTab>("all");
  const [viewMode, setViewMode] = useState(userPrefs.get().rishtaViewMode);
  const [sort, setSort] = useState(userPrefs.get().rishtaSort);
  const [prefsVersion, setPrefsVersion] = useState(0);
  const [quickView, setQuickView] = useState<DiscoverProfile | null>(null);
  const [interestTemplate, setInterestTemplate] = useState(INTEREST_TEMPLATES[0]);
  const [pendingInterest, setPendingInterest] = useState<DiscoverProfile | null>(null);

  const loadProfiles = useCallback(async () => {
    try {
      const client = user ? api : publicApi;
      const path = user ? "/matrimonial/discover" : "/public/matrimonial/profiles";
      const params: Record<string, string | number> = { limit: 500 };
      if (city.trim()) params.city = city.trim();
      if (ageMin.trim()) params.ageMin = Number.parseInt(ageMin, 10);
      if (ageMax.trim()) params.ageMax = Number.parseInt(ageMax, 10);
      if (profession.trim()) params.profession = profession.trim();
      if (sect.trim()) params.sect = sect.trim();
      if (education.trim()) params.education = education.trim();
      if (maritalStatus.trim()) params.maritalStatus = maritalStatus.trim();
      if (user && sort) params.sort = sort;
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
          sect: profile.sect ?? "",
          maritalStatus: profile.maritalStatus ?? "",
          bannerUrl: profile.bannerUrl
        }));
        setProfiles(mapped);
      }
    } catch (error) {
      const backendMessage = (error as AxiosError<{ error?: { message?: string } }>)?.response?.data?.error?.message;
      setMessage(backendMessage ?? "Unable to load matchmaking profiles. Ensure backend API is running.");
    }
  }, [user, city, ageMin, ageMax, profession, sect, education, maritalStatus, sort]);

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

  const compared = userPrefs.get().comparedProfiles;

  const filtered = useMemo(() => {
    let list = profiles;
    if (listTab === "saved") {
      const saved = new Set(userPrefs.get().savedProfiles);
      list = list.filter((p) => saved.has(p.userId));
    }
    const q = search.trim().toLowerCase();
    if (!q) return list;
    return list.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.city.toLowerCase().includes(q) ||
        p.profession.toLowerCase().includes(q) ||
        p.education.toLowerCase().includes(q) ||
        p.sect.toLowerCase().includes(q)
    );
  }, [profiles, search, listTab, prefsVersion]);

  const sendInterest = async (profile: DiscoverProfile, note?: string) => {
    if (!user) {
      redirectToAuth();
      return;
    }
    try {
      await api.post("/matrimonial/interests", {
        receiverId: profile.userId,
        message: note?.trim() || undefined
      });
      setSent((prev) => ({ ...prev, [profile.userId]: true }));
      setPendingInterest(null);
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
    setSect("");
    setEducation("");
    setMaritalStatus("");
    setSearch("");
    void loadProfiles();
  };

  const hasFilters = city || ageMin || ageMax || profession || sect || education || maritalStatus || search;

  const toggleSave = (userId: string) => {
    userPrefs.toggleSavedProfile(userId);
    setPrefsVersion((v) => v + 1);
  };

  const toggleCompare = (userId: string) => {
    userPrefs.toggleCompareProfile(userId);
    setPrefsVersion((v) => v + 1);
  };

  const shareProfile = (userId: string) => {
    const url = `${window.location.origin}/matrimonial/${userId}`;
    void navigator.clipboard.writeText(url);
    setMessage("Profile link copied.");
    setTimeout(() => setMessage(""), 2500);
  };

  const changeViewMode = (mode: "grid" | "list") => {
    setViewMode(mode);
    userPrefs.setRishtaViewMode(mode);
  };

  const changeSort = (next: "score" | "age" | "recent") => {
    setSort(next);
    userPrefs.setRishtaSort(next);
  };

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

      {compared.length > 0 ? (
        <Card className="glass flex flex-wrap items-center gap-3 p-4">
          <GitCompare className="h-5 w-5 text-primary" />
          <span className="text-sm font-medium">Compare ({compared.length}/3)</span>
          {compared.map((id) => {
            const p = profiles.find((x) => x.userId === id);
            return (
              <Badge key={id} className="gap-1 bg-muted/40">
                {p?.name ?? id.slice(0, 8)}
                <button type="button" onClick={() => toggleCompare(id)} aria-label="Remove">
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            );
          })}
        </Card>
      ) : null}

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
            <Input placeholder="Sect" value={sect} onChange={(e) => setSect(e.target.value)} />
            <Input placeholder="Education" value={education} onChange={(e) => setEducation(e.target.value)} />
            <Input placeholder="Marital status" value={maritalStatus} onChange={(e) => setMaritalStatus(e.target.value)} />
            <Button type="button" variant="primary" className="w-full gap-2" onClick={() => void loadProfiles()}>
              <Filter className="h-4 w-4" />
              Apply filters
            </Button>
            {hasFilters ? (
              <Button type="button" variant="outline" className="w-full" onClick={clearFilters}>
                Clear all filters
              </Button>
            ) : null}
          </div>
        </aside>

        <section className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Button size="sm" variant={listTab === "all" ? "primary" : "outline"} onClick={() => setListTab("all")}>
              All profiles
            </Button>
            <Button size="sm" variant={listTab === "saved" ? "primary" : "outline"} onClick={() => setListTab("saved")} className="gap-1.5">
              <Heart className="h-3.5 w-3.5" />
              Saved
            </Button>
            {user ? (
              <>
                <Button size="sm" variant={sort === "score" ? "primary" : "outline"} onClick={() => changeSort("score")}>
                  Match score
                </Button>
                <Button size="sm" variant={sort === "age" ? "primary" : "outline"} onClick={() => changeSort("age")}>
                  Age
                </Button>
                <Button size="sm" variant={sort === "recent" ? "primary" : "outline"} onClick={() => changeSort("recent")}>
                  Recent
                </Button>
              </>
            ) : null}
            <div className="ml-auto flex gap-1">
              <Button size="sm" variant={viewMode === "grid" ? "primary" : "outline"} onClick={() => changeViewMode("grid")} aria-label="Grid view">
                <Grid3x3 className="h-4 w-4" />
              </Button>
              <Button size="sm" variant={viewMode === "list" ? "primary" : "outline"} onClick={() => changeViewMode("list")} aria-label="List view">
                <LayoutList className="h-4 w-4" />
              </Button>
            </div>
          </div>

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
            <strong className="text-foreground">{filtered.length}</strong> profile{filtered.length === 1 ? "" : "s"} found
            {hasFilters ? (
              <button type="button" className="ml-2 text-primary underline" onClick={clearFilters}>
                Clear filters
              </button>
            ) : null}
          </p>

          <div className={viewMode === "grid" ? "grid gap-4 md:grid-cols-2" : "flex flex-col gap-3"}>
            {filtered.map((profile) => {
              const saved = userPrefs.isProfileSaved(profile.userId);
              const inCompare = compared.includes(profile.userId);
              return (
                <div key={profile.userId} className={viewMode === "list" ? "flex gap-3" : ""}>
                  <div className={viewMode === "list" ? "min-w-0 flex-1" : ""}>
                    <ProfileCard
                      name={profile.name}
                      age={profile.age}
                      city={profile.city}
                      score={profile.score}
                      bannerImageUrl={profile.bannerUrl ? resolveMediaUrl(profile.bannerUrl) : undefined}
                      interestSent={!!sent[profile.userId]}
                      onSendInterest={() => setPendingInterest(profile)}
                      onViewProfile={() => navigate(`/matrimonial/${profile.userId}`)}
                    />
                  </div>
                  <div className={`flex gap-1 ${viewMode === "list" ? "flex-col justify-center" : "mt-2 justify-end"}`}>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 w-8 p-0"
                      onClick={() => toggleSave(profile.userId)}
                      aria-label={saved ? "Unsave" : "Save profile"}
                    >
                      <Heart className={`h-4 w-4 ${saved ? "fill-primary text-primary" : ""}`} />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 w-8 p-0"
                      onClick={() => toggleCompare(profile.userId)}
                      aria-label="Compare"
                      disabled={!inCompare && compared.length >= 3}
                    >
                      <Columns2 className={`h-4 w-4 ${inCompare ? "text-primary" : ""}`} />
                    </Button>
                    <Button size="sm" variant="outline" className="h-8 w-8 p-0" onClick={() => shareProfile(profile.userId)} aria-label="Share">
                      <Share2 className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="outline" className="h-8 w-8 p-0" onClick={() => setQuickView(profile)} aria-label="Quick view">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
          {filtered.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-border p-8 text-center text-subtle">
              {listTab === "saved"
                ? "No saved profiles yet. Tap the heart on any card to save it here."
                : "No profiles match your filters. Try adjusting city, age, or profession."}
            </p>
          ) : null}
        </section>
      </div>

      {message ? <p className="text-sm text-accent">{message}</p> : null}

      <Modal open={Boolean(quickView)} title={quickView?.name ?? "Profile"} onClose={() => setQuickView(null)}>
        {quickView ? (
          <div className="space-y-3">
            {quickView.bannerUrl ? (
              <img src={resolveMediaUrl(quickView.bannerUrl)} alt="" className="h-40 w-full rounded-2xl object-cover" />
            ) : null}
            <p className="text-sm text-subtle">
              {quickView.age} years · {quickView.city}
            </p>
            <p className="text-sm">{quickView.profession} · {quickView.education}</p>
            <Badge>{quickView.score > 0 ? `${quickView.score}% match` : "Verified"}</Badge>
            <div className="flex gap-2 pt-2">
              <Button className="flex-1" onClick={() => { setQuickView(null); navigate(`/matrimonial/${quickView.userId}`); }}>
                Full profile
              </Button>
              <Button variant="outline" onClick={() => { setQuickView(null); setPendingInterest(quickView); }}>
                Send interest
              </Button>
            </div>
          </div>
        ) : null}
      </Modal>

      <Modal open={Boolean(pendingInterest)} title="Send interest" onClose={() => setPendingInterest(null)}>
        {pendingInterest ? (
          <div className="space-y-3">
            <p className="text-sm text-subtle">To {pendingInterest.name}</p>
            <label className="text-xs font-medium text-subtle">Message template</label>
            <select
              className="w-full rounded-xl border border-border bg-card px-3 py-2 text-sm"
              value={interestTemplate}
              onChange={(e) => setInterestTemplate(e.target.value)}
            >
              {INTEREST_TEMPLATES.map((t) => (
                <option key={t} value={t}>{t.slice(0, 60)}…</option>
              ))}
            </select>
            <textarea
              className="min-h-24 w-full rounded-xl border border-border bg-card p-3 text-sm"
              value={interestTemplate}
              onChange={(e) => setInterestTemplate(e.target.value)}
            />
            <Button className="w-full gap-2" onClick={() => void sendInterest(pendingInterest, interestTemplate)}>
              <Heart className="h-4 w-4" />
              Send interest
            </Button>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
