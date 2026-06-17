import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Mail, MapPin, MessageSquare, Phone, Send } from "lucide-react";
import type { AboutContact, AboutContent } from "@/shared";
import { DEFAULT_ABOUT_CONTENT } from "@/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { publicApi } from "@/utils/api";
import { useAuthStore } from "@/store/auth-store";
import { useTranslate } from "@/hooks/use-translate";
import { UI } from "@/i18n/ui";
import type { AxiosError } from "axios";

const SUBJECT_OPTIONS = [
  "General inquiry",
  "Rishta / matrimonial",
  "Welfare & donations",
  "Community support",
  "Technical issue",
  "Other"
];

export function ContactPage() {
  const user = useAuthStore((s) => s.user);
  const profile = useAuthStore((s) => s.profile);
  const navAbout = useTranslate(UI.navAbout);

  const [contact, setContact] = useState<AboutContact>(DEFAULT_ABOUT_CONTENT.contact);
  const [name, setName] = useState(profile?.fullName ?? "");
  const [email, setEmail] = useState(user?.email ?? profile?.emailContact ?? "");
  const [phone, setPhone] = useState(profile?.phone ?? profile?.whatsapp ?? "");
  const [subject, setSubject] = useState(SUBJECT_OPTIONS[0]);
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await publicApi.get("/public/about");
        if (data.success && data.data) {
          const about = data.data as AboutContent;
          setContact({ ...DEFAULT_ABOUT_CONTENT.contact, ...about.contact });
        }
      } catch {
        // Keep defaults
      }
    };
    void load();
  }, []);

  useEffect(() => {
    if (profile?.fullName) setName(profile.fullName);
    if (user?.email) setEmail(user.email);
    if (profile?.phone || profile?.whatsapp) setPhone(profile.phone ?? profile.whatsapp ?? "");
  }, [profile, user]);

  const submit = async () => {
    if (!name.trim() || !email.trim() || !subject.trim() || message.trim().length < 10) {
      setStatus("error");
      setErrorMsg("Please fill all required fields. Message must be at least 10 characters.");
      return;
    }
    setStatus("sending");
    setErrorMsg("");
    try {
      const { data } = await publicApi.post("/public/contact", {
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim() || undefined,
        subject: subject.trim(),
        message: message.trim()
      });
      if (data.success) {
        setStatus("sent");
        setMessage("");
      } else {
        setStatus("error");
        setErrorMsg("Could not send your message. Try again.");
      }
    } catch (err) {
      const msg = (err as AxiosError<{ error?: { message?: string } }>)?.response?.data?.error?.message;
      setStatus("error");
      setErrorMsg(msg ?? "Could not send your message. Check your connection and try again.");
    }
  };

  return (
    <div className="space-y-8 py-4">
      <header className="glass rounded-3xl p-6 md:p-8">
        <p className="text-sm uppercase tracking-[0.2em] text-primary">Get in touch</p>
        <h1 className="mt-2 text-3xl font-bold md:text-4xl">Contact us</h1>
        <p className="mt-3 max-w-2xl text-subtle">
          Send a message to Dogar Welfare Trust. Our team reads every submission and responds as soon as possible.
          You can also review trust details on the{" "}
          <Link to="/about" className="text-primary underline-offset-2 hover:underline">
            {navAbout}
          </Link>{" "}
          page.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <Card className="glass space-y-5 p-6 md:p-8">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">Send a message</h2>
          </div>

          {status === "sent" ? (
            <div className="rounded-2xl border border-accent/40 bg-accent/10 px-4 py-4 text-sm text-foreground">
              Thank you! Your message was received. Our admin team will review it and get back to you by email or phone.
            </div>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-subtle">Full name *</label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-subtle">Email *</label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@email.com" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-subtle">Phone / WhatsApp</label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+92 300 0000000" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-subtle">Subject *</label>
              <select
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full rounded-2xl border border-border bg-card px-3 py-2.5 text-sm outline-none focus:border-primary"
              >
                {SUBJECT_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-subtle">Message *</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="How can we help you?"
              className="min-h-36 w-full rounded-2xl border border-border bg-card p-3 text-sm outline-none focus:border-primary"
              maxLength={5000}
            />
            <p className="text-right text-xs text-faint">{message.length}/5000</p>
          </div>

          {status === "error" && errorMsg ? (
            <p className="text-sm text-secondary">{errorMsg}</p>
          ) : null}

          <Button className="gap-2" onClick={() => void submit()} disabled={status === "sending"}>
            <Send className="h-4 w-4" />
            {status === "sending" ? "Sending…" : "Send message"}
          </Button>
        </Card>

        <aside className="space-y-4">
          <Card className="glass space-y-4 p-5">
            <h2 className="font-semibold">Office & contact</h2>
            {contact.address ? (
              <p className="flex items-start gap-2 text-sm text-subtle">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                {contact.address}
              </p>
            ) : null}
            {contact.phone ? (
              <a href={`tel:${contact.phone.replace(/\s/g, "")}`} className="flex items-center gap-2 text-sm hover:text-primary">
                <Phone className="h-4 w-4 text-primary" />
                {contact.phone}
              </a>
            ) : null}
            {contact.email ? (
              <a href={`mailto:${contact.email}`} className="flex items-center gap-2 text-sm hover:text-primary">
                <Mail className="h-4 w-4 text-primary" />
                {contact.email}
              </a>
            ) : null}
            {contact.whatsapp ? (
              <a
                href={`https://wa.me/${contact.whatsapp.replace(/[^\d+]/g, "").replace(/^\+/, "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm hover:text-primary"
              >
                WhatsApp: {contact.whatsapp}
              </a>
            ) : null}
          </Card>

          <Card className="glass p-5 text-sm text-subtle">
            <p className="font-medium text-foreground">Response time</p>
            <p className="mt-2">We usually reply within 1–2 business days. Urgent welfare matters are prioritised.</p>
          </Card>
        </aside>
      </div>
    </div>
  );
}
