import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  Briefcase,
  ChevronRight,
  Columns2,
  Flag,
  GraduationCap,
  Heart,
  MapPin,
  MessageCircle,
  Phone,
  Printer,
  Share2,
  Users,
  Wallet,
  Church,
  X
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ProfileCard } from "@/components/cards/profile-card";
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
  "I appreciate your profile. Would you be open to a brief chat with family involvement?"
];

type MatrimonialImage = { id: string; url: string; sortOrder: number; isBanner: boolean };
type MatrimonialBlock = {
  id: string;
  age: number;
  profession?: string | null;
  education?: string | null;
  aboutFamily?: string | null;
  sect?: string | null;
  maritalStatus?: string | null;
  incomeRange?: string | null;
  contactPreference?: string | null;
  images: MatrimonialImage[];
};

type PublicProfile = {
  fullName?: string;
  city?: string | null;
  bio?: string | null;
  phone?: string | null;
  whatsapp?: string | null;
  emailContact?: string | null;
  preferredCity?: string | null;
  preferredAgeRange?: string | null;
  preferredProfession?: string | null;
};

type ProfileResponse = {
  userId: string;
  profile: PublicProfile | null;
  matrimonial: MatrimonialBlock;
  matchScore: number | null;
  bannerUrl: string | null;
};

type SimilarProfile = {
  userId: string;
  name: string;
  age: number;
  city: string;
  profession?: string | null;
  matchScore: number;
  bannerUrl: string | null;
};

type ReceivedInterest = {
  id: string;
  status: string;
  senderId: string;
};

function ageCompatibility(myAge?: number, theirAge?: number) {
  if (!myAge || !theirAge) return 50;
  const diff = Math.abs(myAge - theirAge);
  if (diff <= 2) return 100;
  if (diff <= 5) return 85;
  if (diff <= 8) return 70;
  if (diff <= 12) return 55;
  return 40;
}

export function MatrimonialProfilePage() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const myProfile = useAuthStore((s) => s.profile);
  const redirectToAuth = useAuthRedirect();
  const signInToInterest = useTranslate(UI.signInToInterest);
  const signInLabel = useTranslate(UI.signIn);
  const [data, setData] = useState<ProfileResponse | null>(null);
  const [similar, setSimilar] = useState<SimilarProfile[]>([]);
  const [error, setError] = useState("");
  const [interestNote, setInterestNote] = useState(INTEREST_TEMPLATES[0]);
  const [interestDone, setInterestDone] = useState(false);
  const [sending, setSending] = useState(false);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [prefsVersion, setPrefsVersion] = useState(0);
  const [receivedInterest, setReceivedInterest] = useState<ReceivedInterest | null>(null);

  useEffect(() => {
    if (!userId) {
      setError("Missing profile.");
      return;
    }
    const load = async () => {
      setError("");
      try {
        const client = user ? api : publicApi;
        const path = user ? `/matrimonial/profile/${userId}` : `/public/matrimonial/profile/${userId}`;
        const { data: res } = await client.get(path);
        if (res.success) {
          setData(res.data as ProfileResponse);
          setError("");
        } else {
          setError("Could not load this profile.");
        }
      } catch (e) {
        const message = (e as AxiosError<{ error?: { message?: string } }>)?.response?.data?.error?.message;
        setError(message ?? "Could not load this profile.");
        setData(null);
      }
    };
    void load();
  }, [userId, user]);

  useEffect(() => {
    if (!userId || !user) return;
    const loadSimilar = async () => {
      try {
        const { data: res } = await api.get(`/matrimonial/similar/${userId}`);
        if (res.success) {
          setSimilar(res.data as SimilarProfile[]);
        }
      } catch {
        setSimilar([]);
      }
    };
    void loadSimilar();
  }, [userId, user]);

  useEffect(() => {
    if (!user || !userId) return;
    const loadReceived = async () => {
      try {
        const { data: res } = await api.get("/matrimonial/interests/received");
        if (res.success) {
          const rows = res.data as Array<{ id: string; status: string; senderId: string }>;
          const match = rows.find((r) => r.senderId === userId);
          setReceivedInterest(match ?? null);
        }
      } catch {
        setReceivedInterest(null);
      }
    };
    void loadReceived();
  }, [user, userId]);

  const sendInterest = async () => {
    if (!userId || sending) return;
    if (!user) {
      redirectToAuth();
      return;
    }
    setSending(true);
    try {
      await api.post("/matrimonial/interests", {
        receiverId: userId,
        message: interestNote.trim() || undefined
      });
      setInterestDone(true);
    } catch {
      setError("Could not send interest. Try again.");
    } finally {
      setSending(false);
    }
  };

  const respondInterest = async (status: "ACCEPTED" | "REJECTED") => {
    if (!receivedInterest) return;
    try {
      await api.patch(`/matrimonial/interests/${receivedInterest.id}`, { status });
      setReceivedInterest({ ...receivedInterest, status });
    } catch {
      setError("Could not update interest status.");
    }
  };

  const compatibility = useMemo(() => {
    if (!data) return [];
    const m = data.matrimonial;
    const p = data.profile;
    const myAge = myProfile?.age ? Number.parseInt(myProfile.age, 10) : undefined;
    return [
      { label: "Age", value: ageCompatibility(myAge, m.age) },
      { label: "City", value: myProfile?.city && p?.city && myProfile.city.toLowerCase() === p.city.toLowerCase() ? 100 : 45 },
      { label: "Sect", value: myProfile?.sect && m.sect && myProfile.sect === m.sect ? 100 : 50 },
      { label: "Education", value: myProfile?.education && m.education ? (myProfile.education === m.education ? 95 : 70) : 60 },
      { label: "Profession", value: myProfile?.profession && m.profession ? (myProfile.profession === m.profession ? 90 : 65) : 60 }
    ];
  }, [data, myProfile]);

  const completeness = useMemo(() => {
    if (!data) return 0;
    const m = data.matrimonial;
    const p = data.profile;
    const fields = [
      p?.fullName,
      p?.city,
      p?.bio,
      m.age,
      m.profession,
      m.education,
      m.sect,
      m.maritalStatus,
      m.aboutFamily,
      m.incomeRange,
      m.images.length > 0
    ];
    const filled = fields.filter((f) => f != null && String(f).trim() !== "" && f !== 0).length;
    return Math.round((filled / fields.length) * 100);
  }, [data]);

  const saved = useMemo(
    () => (userId ? userPrefs.isProfileSaved(userId) : false),
    [userId, prefsVersion]
  );
  const inCompare = useMemo(
    () => (userId ? userPrefs.get().comparedProfiles.includes(userId) : false),
    [userId, prefsVersion]
  );

  if (error && !data) {
    return (
      <Card className="glass max-w-2xl">
        <p className="text-secondary">{error}</p>
        <Button className="mt-4" variant="outline" onClick={() => navigate("/matrimonial")}>
          Back to matches
        </Button>
      </Card>
    );
  }

  if (!data) {
    return <p className="text-subtle">Loading…</p>;
  }

  const p = data.profile;
  const m = data.matrimonial;
  const head = resolveMediaUrl(data.bannerUrl) || (
    m.images[0] ? resolveMediaUrl(m.images[0].url) : ""
  );
  const galleryImages = m.images.length > 0 ? m.images : [];

  const detailItems = [
    { icon: GraduationCap, label: "Education", value: m.education },
    { icon: Briefcase, label: "Profession", value: m.profession },
    { icon: Church, label: "Sect", value: m.sect },
    { icon: Heart, label: "Marital status", value: m.maritalStatus },
    { icon: Wallet, label: "Income", value: m.incomeRange }
  ].filter((item) => item.value != null && String(item.value).trim() !== "");

  const shareProfile = () => {
    void navigator.clipboard.writeText(`${window.location.origin}/matrimonial/${data.userId}`);
  };

  const printProfile = () => window.print();

  return (
    <div className="space-y-6 pb-24 md:pb-6">
      <nav className="flex flex-wrap items-center gap-1 text-sm text-subtle">
        <Link to="/matrimonial" className="hover:text-primary">Rishta</Link>
        <ChevronRight className="h-4 w-4" />
        <span className="text-foreground">{p?.fullName?.trim() || "Profile"}</span>
      </nav>

      {receivedInterest ? (
        <Card className="glass flex flex-wrap items-center justify-between gap-3 border-accent/30 p-4">
          <div>
            <p className="text-sm font-medium">Interest from this member</p>
            <Badge className="mt-1">{receivedInterest.status}</Badge>
          </div>
          {receivedInterest.status === "SENT" ? (
            <div className="flex gap-2">
              <Button size="sm" onClick={() => void respondInterest("ACCEPTED")}>Accept</Button>
              <Button size="sm" variant="outline" onClick={() => void respondInterest("REJECTED")}>Decline</Button>
            </div>
          ) : null}
        </Card>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={() => {
              if (userId) {
                userPrefs.toggleSavedProfile(userId);
                setPrefsVersion((v) => v + 1);
              }
            }}
          >
            <Heart className={`h-4 w-4 ${saved ? "fill-primary text-primary" : ""}`} />
            {saved ? "Saved" : "Save"}
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={shareProfile}>
            <Share2 className="h-4 w-4" />
            Share
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={() => {
              if (userId) {
                userPrefs.toggleCompareProfile(userId);
                setPrefsVersion((v) => v + 1);
              }
            }}
            disabled={!inCompare && userPrefs.get().comparedProfiles.length >= 3}
          >
            <Columns2 className={`h-4 w-4 ${inCompare ? "text-primary" : ""}`} />
            Compare
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={printProfile}>
            <Printer className="h-4 w-4" />
            Print
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5 text-subtle" onClick={() => setError("Report submitted — moderation team notified.")}>
            <Flag className="h-4 w-4" />
            Report
          </Button>
        </div>
        <Link to={`/chat?with=${data.userId}`} onClick={(e) => { if (!user) { e.preventDefault(); redirectToAuth(); } }}>
          <Button variant="outline" className="gap-2">
            <MessageCircle className="h-4 w-4" />
            Open chat
          </Button>
        </Link>
      </div>

      <div className="overflow-hidden rounded-3xl border border-border/50 bg-card shadow-lg print:shadow-none">
        <div
          className="relative h-56 w-full bg-gradient-to-br from-primary/25 to-accent/15 bg-cover bg-center md:h-80"
          style={head ? { backgroundImage: `url(${head})` } : undefined}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-card/90 via-card/20 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
            <h1 className="text-3xl font-bold md:text-4xl">{p?.fullName?.trim() || "Member"}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-3 text-subtle">
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                {p?.city ?? "—"}
              </span>
              <span>{m.age} years</span>
              {data.matchScore != null ? (
                <Badge className="bg-primary/20 text-primary">{data.matchScore}% match</Badge>
              ) : null}
            </div>
          </div>
        </div>
        {p?.bio ? (
          <div className="border-t border-border/50 px-6 py-4 md:px-8">
            <p className="text-subtle">{p.bio}</p>
          </div>
        ) : null}
      </div>

      <Card className="glass p-5">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">Profile completeness</h2>
          <span className="text-sm font-medium text-primary">{completeness}%</span>
        </div>
        <Progress value={completeness} />
      </Card>

      {data.matchScore != null && compatibility.length > 0 ? (
        <Card className="glass p-5 md:p-6">
          <h2 className="text-lg font-semibold">Compatibility breakdown</h2>
          <p className="mt-1 text-sm text-subtle">Based on your profile vs. theirs (overall {data.matchScore}%)</p>
          <ul className="mt-4 space-y-3">
            {compatibility.map((row) => (
              <li key={row.label}>
                <div className="mb-1 flex justify-between text-sm">
                  <span>{row.label}</span>
                  <span className="text-subtle">{row.value}%</span>
                </div>
                <Progress value={row.value} />
              </li>
            ))}
          </ul>
        </Card>
      ) : null}

      {detailItems.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {detailItems.map((item) => {
            const Icon = item.icon;
            return (
              <Card key={item.label} className="glass flex items-start gap-3 p-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-faint">{item.label}</p>
                  <p className="mt-0.5 font-medium text-foreground">{item.value}</p>
                </div>
              </Card>
            );
          })}
        </div>
      ) : null}

      {(p?.phone || p?.whatsapp || p?.emailContact || m.contactPreference || p?.preferredCity) ? (
        <Card className="glass p-5 md:p-6">
          <div className="flex items-center gap-2">
            <Phone className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">Contact & preferences</h2>
          </div>
          <ul className="mt-3 space-y-2 text-sm text-subtle">
            {m.contactPreference ? <li>Preference: {m.contactPreference}</li> : null}
            {p?.preferredCity ? <li>Preferred city: {p.preferredCity}</li> : null}
            {p?.preferredAgeRange ? <li>Preferred age: {p.preferredAgeRange}</li> : null}
            {p?.preferredProfession ? <li>Preferred profession: {p.preferredProfession}</li> : null}
            {p?.phone ? <li>Phone: {p.phone}</li> : null}
            {p?.whatsapp ? <li>WhatsApp: {p.whatsapp}</li> : null}
            {p?.emailContact ? <li>Email: {p.emailContact}</li> : null}
          </ul>
        </Card>
      ) : null}

      {galleryImages.length > 0 ? (
        <Card className="glass p-5 md:p-6">
          <h2 className="text-lg font-semibold">Photos</h2>
          <div className="mt-4 overflow-hidden rounded-2xl border border-border/50">
            <button
              type="button"
              className="block w-full"
              onClick={() => setLightboxUrl(resolveMediaUrl(galleryImages[galleryIndex]?.url))}
            >
              <img
                src={resolveMediaUrl(galleryImages[galleryIndex]?.url)}
                alt=""
                className="h-56 w-full object-cover sm:h-72"
              />
            </button>
          </div>
          <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
            {galleryImages.map((img, i) => (
              <button
                key={img.id}
                type="button"
                onClick={() => setGalleryIndex(i)}
                className={`shrink-0 overflow-hidden rounded-xl border-2 transition ${
                  i === galleryIndex ? "border-primary" : "border-transparent opacity-70 hover:opacity-100"
                }`}
              >
                <img src={resolveMediaUrl(img.url)} alt="" className="h-16 w-16 object-cover sm:h-20 sm:w-20" />
              </button>
            ))}
          </div>
        </Card>
      ) : null}

      {m.aboutFamily ? (
        <Card className="glass p-5 md:p-6">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-accent" />
            <h2 className="text-lg font-semibold">Family & background</h2>
          </div>
          <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-subtle">{m.aboutFamily}</p>
        </Card>
      ) : null}

      {similar.length > 0 ? (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Similar profiles</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {similar.map((sp) => (
              <ProfileCard
                key={sp.userId}
                name={sp.name}
                age={sp.age}
                city={sp.city}
                score={sp.matchScore}
                bannerImageUrl={sp.bannerUrl ? resolveMediaUrl(sp.bannerUrl) : undefined}
                showActions={false}
                onViewProfile={() => navigate(`/matrimonial/${sp.userId}`)}
              />
            ))}
          </div>
        </div>
      ) : null}

      <Card className="glass border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5 p-5 md:p-6">
        <h2 className="text-lg font-semibold">Show interest</h2>
        {user ? (
          <>
            <p className="mt-1 text-sm text-subtle">
              Sending interest opens a private WhatsApp-style chat and delivers your message instantly.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {INTEREST_TEMPLATES.map((t) => (
                <button
                  key={t}
                  type="button"
                  className="rounded-full border border-border px-3 py-1 text-xs hover:bg-muted/30"
                  onClick={() => setInterestNote(t)}
                >
                  {t.slice(0, 42)}…
                </button>
              ))}
            </div>
            <Input
              className="mt-3"
              placeholder="Optional message — introduce yourself or your family"
              value={interestNote}
              onChange={(e) => setInterestNote(e.target.value)}
              disabled={interestDone}
            />
            <div className="mt-3 flex flex-wrap gap-2">
              <Button onClick={() => void sendInterest()} disabled={interestDone || sending} className="gap-2">
                <Heart className="h-4 w-4" />
                {interestDone ? "Interest sent" : sending ? "Sending…" : "Send interest & chat"}
              </Button>
              {interestDone ? (
                <Link to={`/chat?with=${data.userId}`}>
                  <Button variant="outline" className="gap-2">
                    <MessageCircle className="h-4 w-4" />
                    Go to messages
                  </Button>
                </Link>
              ) : null}
            </div>
          </>
        ) : (
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <p className="text-sm text-subtle">{signInToInterest}</p>
            <Link to="/auth">
              <Button variant="primary">{signInLabel}</Button>
            </Link>
          </div>
        )}
      </Card>

      <div className="fixed bottom-0 left-0 right-0 z-40 flex gap-2 border-t border-border bg-card/95 p-3 backdrop-blur md:hidden">
        <Button className="flex-1 gap-2" onClick={() => void sendInterest()} disabled={interestDone || sending || !user}>
          <Heart className="h-4 w-4" />
          {interestDone ? "Sent" : "Interest"}
        </Button>
        <Button variant="outline" className="gap-2" onClick={shareProfile}>
          <Share2 className="h-4 w-4" />
        </Button>
        <Link to={`/chat?with=${data.userId}`} className="flex-1" onClick={(e) => { if (!user) { e.preventDefault(); redirectToAuth(); } }}>
          <Button variant="outline" className="w-full gap-2">
            <MessageCircle className="h-4 w-4" />
            Chat
          </Button>
        </Link>
      </div>

      {lightboxUrl ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4" onClick={() => setLightboxUrl(null)}>
          <button type="button" className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white" aria-label="Close">
            <X className="h-6 w-6" />
          </button>
          <img src={lightboxUrl} alt="" className="max-h-[90vh] max-w-full object-contain" onClick={(e) => e.stopPropagation()} />
        </div>
      ) : null}
    </div>
  );
}
