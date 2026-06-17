import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api, resolveMediaUrl } from "@/utils/api";
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
        const { data: res } = await api.get(`/matrimonial/profile/${userId}`);
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
  }, [userId]);

  const sendInterest = async () => {
    if (!userId || sending) return;
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

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button variant="outline" onClick={() => navigate("/matrimonial")}>
          ← Back to matches
        </Button>
        <Link to={`/chat?with=${data.userId}`}>
          <Button variant="outline">Open chat</Button>
        </Link>
      </div>

      <div className="overflow-hidden rounded-3xl border border-border/50 bg-card">
        <div
          className="h-56 w-full bg-gradient-to-br from-primary/20 to-secondary/10 bg-cover bg-center md:h-72"
          style={head ? { backgroundImage: `url(${head})` } : undefined}
        />
        <div className="p-6 md:p-8">
          <h1 className="text-2xl font-semibold md:text-3xl">{p?.fullName?.trim() || "Member"}</h1>
          <p className="mt-1 text-subtle">
            {m.age} years
            {p?.city ? ` · ${p.city}` : null}
            {data.matchScore != null ? ` · ${data.matchScore}% compatibility` : null}
          </p>
          {p?.bio ? <p className="mt-4 text-subtle">{p.bio}</p> : null}
        </div>
      </div>

      {m.images.length > 0 ? (
        <Card className="glass p-4">
          <h2 className="text-lg font-semibold">Photos</h2>
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {m.images.map((img) => (
              <div key={img.id} className="overflow-hidden rounded-2xl border border-border/50">
                <img
                  src={resolveMediaUrl(img.url)}
                  alt=""
                  className="h-32 w-full object-cover sm:h-40"
                />
                {img.isBanner ? (
                  <p className="px-2 py-1 text-center text-xs text-primary">Banner</p>
                ) : null}
              </div>
            ))}
          </div>
        </Card>
      ) : null}

      <Card className="glass p-6">
        <h2 className="text-lg font-semibold">Rishta details</h2>
        <dl className="mt-4 grid gap-2 text-sm md:grid-cols-2">
          <Item label="Education" value={m.education} />
          <Item label="Profession" value={m.profession} />
          <Item label="Sect" value={m.sect} />
          <Item label="Marital status" value={m.maritalStatus} />
          <Item label="Income" value={m.incomeRange} />
        </dl>
        {m.aboutFamily ? (
          <p className="mt-4 text-sm text-subtle">
            <span className="text-faint">Family / about: </span>
            {m.aboutFamily}
          </p>
        ) : null}
      </Card>

      <Card className="glass p-6">
        <h2 className="text-lg font-semibold">Show interest</h2>
        <p className="mt-1 text-sm text-subtle">
          This opens a private chat and sends a short interest message. You can add a note (optional).
        </p>
        <Input
          className="mt-3"
          placeholder="Optional message with your interest"
          value={interestNote}
          onChange={(e) => setInterestNote(e.target.value)}
          disabled={interestDone}
        />
        <div className="mt-3 flex flex-wrap gap-2">
          <Button onClick={() => void sendInterest()} disabled={interestDone || sending}>
            {interestDone ? "Interest sent" : sending ? "Sending…" : "Send interest & chat"}
          </Button>
          {interestDone ? (
            <Link to={`/chat?with=${data.userId}`}>
              <Button variant="outline">Go to messages</Button>
            </Link>
          ) : null}
        </div>
      </Card>
    </div>
  );
}

function Item({ label, value }: { label: string; value?: string | null }) {
  if (value == null || String(value).trim() === "") return null;
  return (
    <div>
      <dt className="text-faint">{label}</dt>
      <dd className="text-foreground">{value}</dd>
    </div>
  );
}
