import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  Briefcase,
  GraduationCap,
  Heart,
  MapPin,
  MessageCircle,
  Users,
  Wallet,
  Church
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { api, publicApi, resolveMediaUrl } from "@/utils/api";
import { useAuthStore } from "@/store/auth-store";
import { useAuthRedirect } from "@/hooks/use-auth-redirect";
import { useTranslate } from "@/hooks/use-translate";
import { UI } from "@/i18n/ui";
import type { AxiosError } from "axios";

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
  images: MatrimonialImage[];
};

type PublicProfile = {
  fullName?: string;
  city?: string | null;
  bio?: string | null;
};

type ProfileResponse = {
  userId: string;
  profile: PublicProfile | null;
  matrimonial: MatrimonialBlock;
  matchScore: number | null;
  bannerUrl: string | null;
};

export function MatrimonialProfilePage() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const redirectToAuth = useAuthRedirect();
  const signInToInterest = useTranslate(UI.signInToInterest);
  const signInLabel = useTranslate(UI.signIn);
  const [data, setData] = useState<ProfileResponse | null>(null);
  const [error, setError] = useState("");
  const [interestNote, setInterestNote] = useState("");
  const [interestDone, setInterestDone] = useState(false);
  const [sending, setSending] = useState(false);

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

  const detailItems = [
    { icon: GraduationCap, label: "Education", value: m.education },
    { icon: Briefcase, label: "Profession", value: m.profession },
    { icon: Church, label: "Sect", value: m.sect },
    { icon: Heart, label: "Marital status", value: m.maritalStatus },
    { icon: Wallet, label: "Income", value: m.incomeRange }
  ].filter((item) => item.value != null && String(item.value).trim() !== "");

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button variant="outline" onClick={() => navigate("/matrimonial")}>
          ← Back to matches
        </Button>
        <Link to={`/chat?with=${data.userId}`} onClick={(e) => { if (!user) { e.preventDefault(); redirectToAuth(); } }}>
          <Button variant="outline" className="gap-2">
            <MessageCircle className="h-4 w-4" />
            Open chat
          </Button>
        </Link>
      </div>

      <div className="overflow-hidden rounded-3xl border border-border/50 bg-card shadow-lg">
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

      {m.images.length > 0 ? (
        <Card className="glass p-5 md:p-6">
          <h2 className="text-lg font-semibold">Photos</h2>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {m.images.map((img) => (
              <div key={img.id} className="group overflow-hidden rounded-2xl border border-border/50">
                <img
                  src={resolveMediaUrl(img.url)}
                  alt=""
                  className="h-32 w-full object-cover transition group-hover:scale-105 sm:h-40"
                />
                {img.isBanner ? (
                  <p className="px-2 py-1 text-center text-xs text-primary">Banner</p>
                ) : null}
              </div>
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

      <Card className="glass border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5 p-5 md:p-6">
        <h2 className="text-lg font-semibold">Show interest</h2>
        {user ? (
          <>
            <p className="mt-1 text-sm text-subtle">
              Sending interest opens a private WhatsApp-style chat and delivers your message instantly.
            </p>
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
    </div>
  );
}
