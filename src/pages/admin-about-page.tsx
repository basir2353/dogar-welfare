import { useEffect, useState, type ChangeEvent } from "react";
import { Navigate } from "react-router-dom";
import type {
  AboutAward,
  AboutBlock,
  AboutContent,
  AboutDocument,
  AboutFaq,
  AboutGalleryImage,
  AboutPartner,
  AboutStat,
  AboutTeamMember,
  AboutTestimonial,
  AboutTimeline
} from "@/shared";
import { DEFAULT_ABOUT_CONTENT } from "@/shared";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/utils/api";
import type { AxiosError } from "axios";
import { useAuthStore } from "@/store/auth-store";
import { AdminPageHeader } from "@/components/admin/admin-page-header";

function newId() {
  return globalThis.crypto?.randomUUID?.() ?? `b-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function mergeAboutForm(raw: AboutContent): AboutContent {
  return {
    ...DEFAULT_ABOUT_CONTENT,
    ...raw,
    hero: { ...DEFAULT_ABOUT_CONTENT.hero, ...raw.hero },
    developer: { ...DEFAULT_ABOUT_CONTENT.developer, ...raw.developer },
    contact: { ...DEFAULT_ABOUT_CONTENT.contact, ...raw.contact },
    blocks: raw.blocks ?? DEFAULT_ABOUT_CONTENT.blocks,
    awards: raw.awards ?? DEFAULT_ABOUT_CONTENT.awards,
    documents: raw.documents ?? DEFAULT_ABOUT_CONTENT.documents,
    stats: raw.stats ?? DEFAULT_ABOUT_CONTENT.stats,
    timeline: raw.timeline ?? DEFAULT_ABOUT_CONTENT.timeline,
    team: raw.team ?? DEFAULT_ABOUT_CONTENT.team,
    faq: raw.faq ?? DEFAULT_ABOUT_CONTENT.faq,
    testimonials: raw.testimonials ?? DEFAULT_ABOUT_CONTENT.testimonials,
    gallery: raw.gallery ?? DEFAULT_ABOUT_CONTENT.gallery,
    partners: raw.partners ?? DEFAULT_ABOUT_CONTENT.partners,
    videoUrl: raw.videoUrl ?? DEFAULT_ABOUT_CONTENT.videoUrl
  };
}

async function uploadAdminFile(file: File): Promise<string | null> {
  const body = new FormData();
  body.append("file", file);
  const { data } = await api.post("/admin/upload", body, {
    headers: { "Content-Type": "multipart/form-data" }
  });
  return data.success ? ((data.data as { url?: string })?.url ?? null) : null;
}

export function AdminAboutPage() {
  const role = useAuthStore((s) => s.user?.role);
  const canEdit = role === "ADMIN" || role === "SUPER_ADMIN";
  const [form, setForm] = useState<AboutContent | null>(null);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    setMessage("");
    try {
      const { data } = await api.get("/admin/content/about");
      if (data.success && data.data) {
        setForm(mergeAboutForm(data.data as AboutContent));
      } else {
        setForm(mergeAboutForm(DEFAULT_ABOUT_CONTENT));
        setMessage("Server returned no About payload; showing defaults. Apply Prisma migrations if the SiteAbout table is missing.");
      }
    } catch {
      setForm(mergeAboutForm(DEFAULT_ABOUT_CONTENT));
      setMessage(
        "Could not load About from the API (network, auth, or database). Showing defaults — fix API/DB then refresh. Saving may fail until the SiteAbout table exists."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!canEdit) return;
    void load();
  }, [canEdit]);

  if (!canEdit) {
    return <Navigate to="/admin" replace />;
  }

  const setHero = (patch: Partial<AboutContent["hero"]>) => {
    setForm((prev) => (prev ? { ...prev, hero: { ...prev.hero, ...patch } } : prev));
  };

  const setDev = (patch: Partial<AboutContent["developer"]>) => {
    setForm((prev) => (prev ? { ...prev, developer: { ...prev.developer, ...patch } } : prev));
  };

  const setContact = (patch: Partial<AboutContent["contact"]>) => {
    setForm((prev) => (prev ? { ...prev, contact: { ...prev.contact, ...patch } } : prev));
  };

  const setBlock = (id: string, patch: Partial<AboutBlock>) => {
    setForm((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        blocks: prev.blocks.map((b) => (b.id === id ? { ...b, ...patch } : b))
      };
    });
  };

  const addBlock = () => {
    setForm((prev) => {
      if (!prev) return prev;
      const n = prev.blocks.length;
      const block: AboutBlock = {
        id: newId(),
        order: n,
        title: "New section",
        body: "Add your copy here. All content is in English; the app translates for Urdu and Punjabi (Shahmukhi) on the public page.",
        imageUrl: undefined
      };
      return { ...prev, blocks: [...prev.blocks, block] };
    });
  };

  const removeBlock = (id: string) => {
    setForm((prev) => {
      if (!prev) return prev;
      return { ...prev, blocks: prev.blocks.filter((b) => b.id !== id) };
    });
  };

  const setAward = (id: string, patch: Partial<AboutAward>) => {
    setForm((prev) => {
      if (!prev) return prev;
      return { ...prev, awards: prev.awards.map((a) => (a.id === id ? { ...a, ...patch } : a)) };
    });
  };

  const addAward = () => {
    setForm((prev) => {
      if (!prev) return prev;
      const award: AboutAward = {
        id: newId(),
        order: prev.awards.length,
        title: "New award",
        year: new Date().getFullYear().toString(),
        description: "Describe the award or recognition.",
        imageUrl: undefined
      };
      return { ...prev, awards: [...prev.awards, award] };
    });
  };

  const removeAward = (id: string) => {
    setForm((prev) => (prev ? { ...prev, awards: prev.awards.filter((a) => a.id !== id) } : prev));
  };

  const setDocument = (id: string, patch: Partial<AboutDocument>) => {
    setForm((prev) => {
      if (!prev) return prev;
      return { ...prev, documents: prev.documents.map((d) => (d.id === id ? { ...d, ...patch } : d)) };
    });
  };

  const addDocument = () => {
    setForm((prev) => {
      if (!prev) return prev;
      const doc: AboutDocument = {
        id: newId(),
        order: prev.documents.length,
        title: "New document",
        description: "Upload a PDF or image certificate.",
        fileUrl: "",
        category: "sodo"
      };
      return { ...prev, documents: [...prev.documents, doc] };
    });
  };

  const removeDocument = (id: string) => {
    setForm((prev) => (prev ? { ...prev, documents: prev.documents.filter((d) => d.id !== id) } : prev));
  };

  const setStat = (id: string, patch: Partial<AboutStat>) => {
    setForm((prev) => {
      if (!prev) return prev;
      return { ...prev, stats: prev.stats.map((s) => (s.id === id ? { ...s, ...patch } : s)) };
    });
  };

  const addStat = () => {
    setForm((prev) => {
      if (!prev) return prev;
      const stat: AboutStat = { id: newId(), order: prev.stats.length, label: "New stat", value: "0" };
      return { ...prev, stats: [...prev.stats, stat] };
    });
  };

  const removeStat = (id: string) => {
    setForm((prev) => (prev ? { ...prev, stats: prev.stats.filter((s) => s.id !== id) } : prev));
  };

  const setTimeline = (id: string, patch: Partial<AboutTimeline>) => {
    setForm((prev) => {
      if (!prev) return prev;
      return { ...prev, timeline: prev.timeline.map((t) => (t.id === id ? { ...t, ...patch } : t)) };
    });
  };

  const addTimeline = () => {
    setForm((prev) => {
      if (!prev) return prev;
      const item: AboutTimeline = {
        id: newId(),
        order: prev.timeline.length,
        year: new Date().getFullYear().toString(),
        title: "New milestone",
        body: "Describe what happened."
      };
      return { ...prev, timeline: [...prev.timeline, item] };
    });
  };

  const removeTimeline = (id: string) => {
    setForm((prev) => (prev ? { ...prev, timeline: prev.timeline.filter((t) => t.id !== id) } : prev));
  };

  const setTeamMember = (id: string, patch: Partial<AboutTeamMember>) => {
    setForm((prev) => {
      if (!prev) return prev;
      return { ...prev, team: prev.team.map((m) => (m.id === id ? { ...m, ...patch } : m)) };
    });
  };

  const addTeamMember = () => {
    setForm((prev) => {
      if (!prev) return prev;
      const member: AboutTeamMember = {
        id: newId(),
        order: prev.team.length,
        name: "New team member",
        role: "Role",
        bio: "Short bio."
      };
      return { ...prev, team: [...prev.team, member] };
    });
  };

  const removeTeamMember = (id: string) => {
    setForm((prev) => (prev ? { ...prev, team: prev.team.filter((m) => m.id !== id) } : prev));
  };

  const setFaq = (id: string, patch: Partial<AboutFaq>) => {
    setForm((prev) => {
      if (!prev) return prev;
      return { ...prev, faq: prev.faq.map((f) => (f.id === id ? { ...f, ...patch } : f)) };
    });
  };

  const addFaq = () => {
    setForm((prev) => {
      if (!prev) return prev;
      const item: AboutFaq = {
        id: newId(),
        order: prev.faq.length,
        question: "New question?",
        answer: "Answer here."
      };
      return { ...prev, faq: [...prev.faq, item] };
    });
  };

  const removeFaq = (id: string) => {
    setForm((prev) => (prev ? { ...prev, faq: prev.faq.filter((f) => f.id !== id) } : prev));
  };

  const setTestimonial = (id: string, patch: Partial<AboutTestimonial>) => {
    setForm((prev) => {
      if (!prev) return prev;
      return { ...prev, testimonials: prev.testimonials.map((t) => (t.id === id ? { ...t, ...patch } : t)) };
    });
  };

  const addTestimonial = () => {
    setForm((prev) => {
      if (!prev) return prev;
      const item: AboutTestimonial = {
        id: newId(),
        order: prev.testimonials.length,
        name: "Name",
        role: "Member",
        quote: "Their quote."
      };
      return { ...prev, testimonials: [...prev.testimonials, item] };
    });
  };

  const removeTestimonial = (id: string) => {
    setForm((prev) => (prev ? { ...prev, testimonials: prev.testimonials.filter((t) => t.id !== id) } : prev));
  };

  const setGalleryImage = (id: string, patch: Partial<AboutGalleryImage>) => {
    setForm((prev) => {
      if (!prev) return prev;
      return { ...prev, gallery: prev.gallery.map((g) => (g.id === id ? { ...g, ...patch } : g)) };
    });
  };

  const addGalleryImage = () => {
    setForm((prev) => {
      if (!prev) return prev;
      const item: AboutGalleryImage = {
        id: newId(),
        order: prev.gallery.length,
        imageUrl: "",
        caption: "Optional caption"
      };
      return { ...prev, gallery: [...prev.gallery, item] };
    });
  };

  const removeGalleryImage = (id: string) => {
    setForm((prev) => (prev ? { ...prev, gallery: prev.gallery.filter((g) => g.id !== id) } : prev));
  };

  const setPartner = (id: string, patch: Partial<AboutPartner>) => {
    setForm((prev) => {
      if (!prev) return prev;
      return { ...prev, partners: prev.partners.map((p) => (p.id === id ? { ...p, ...patch } : p)) };
    });
  };

  const addPartner = () => {
    setForm((prev) => {
      if (!prev) return prev;
      const item: AboutPartner = { id: newId(), order: prev.partners.length, name: "Partner name" };
      return { ...prev, partners: [...prev.partners, item] };
    });
  };

  const removePartner = (id: string) => {
    setForm((prev) => (prev ? { ...prev, partners: prev.partners.filter((p) => p.id !== id) } : prev));
  };

  const handleFileUpload = async (file: File, onUrl: (url: string) => void) => {
    setMessage("Uploading…");
    try {
      const url = await uploadAdminFile(file);
      if (url) {
        onUrl(url);
        setMessage("File uploaded. Save the page to publish.");
      } else {
        setMessage("Upload failed.");
      }
    } catch {
      setMessage("Upload failed. Check file type (image or PDF) and try again.");
    }
  };

  const save = async () => {
    if (!form) return;
    if (form.blocks.length === 0) {
      setMessage("Add at least one content block.");
      return;
    }
    setSaving(true);
    setMessage("");
    try {
      const { data } = await api.put("/admin/content/about", {
        ...form,
        blocks: form.blocks.map((b, i) => ({ ...b, order: i })),
        awards: form.awards.map((a, i) => ({ ...a, order: i })),
        documents: form.documents.map((d, i) => ({ ...d, order: i })),
        stats: form.stats.map((s, i) => ({ ...s, order: i })),
        timeline: form.timeline.map((t, i) => ({ ...t, order: i })),
        team: form.team.map((m, i) => ({ ...m, order: i })),
        faq: form.faq.map((f, i) => ({ ...f, order: i })),
        testimonials: form.testimonials.map((t, i) => ({ ...t, order: i })),
        gallery: form.gallery.map((g, i) => ({ ...g, order: i })),
        partners: form.partners.map((p, i) => ({ ...p, order: i }))
      });
      if (data.success && data.data) {
        setForm(mergeAboutForm(data.data as AboutContent));
        setMessage("About page saved. Public /about is updated.");
      }
    } catch (error) {
      const msg = (error as AxiosError<{ error?: { message?: string } }>)?.response?.data?.error?.message;
      setMessage(msg ?? "Save failed. Check field lengths and try again.");
    } finally {
      setSaving(false);
    }
  };

  if (loading || !form) {
    return (
      <div className="flex min-h-[12rem] items-center justify-center rounded-2xl border border-border/60 bg-card/50">
        <p className="text-sm text-subtle">Loading About editor…</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl space-y-6">
      <AdminPageHeader
        title="About page (public)"
        subtitle="All fields are stored in English; the site translates for Urdu and Punjabi (Shahmukhi). Image fields accept /uploads/… paths or full https URLs."
      />
      {message ? <p className="text-sm text-accent">{message}</p> : null}
      <Card className="space-y-4 rounded-2xl border border-border/80 bg-card p-5 shadow-sm md:p-6">
        <p className="text-sm font-medium text-foreground">Hero</p>
        <div className="grid gap-3 md:grid-cols-2">
          <Input value={form.hero.title} onChange={(e) => setHero({ title: e.target.value })} placeholder="Title" />
          <Input
            value={form.hero.imageUrl ?? ""}
            onChange={(e) => setHero({ imageUrl: e.target.value || undefined })}
            placeholder="Hero image URL (optional)"
          />
        </div>
        <textarea
          value={form.hero.subtitle}
          onChange={(e) => setHero({ subtitle: e.target.value })}
          placeholder="Subtitle / intro paragraph"
          className="min-h-24 w-full rounded-2xl border border-border bg-card p-3 text-sm outline-none focus:border-primary"
        />
      </Card>

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Impact stats</h2>
        <Button type="button" size="sm" variant="outline" onClick={addStat}>
          Add stat
        </Button>
      </div>
      {form.stats.map((s, i) => (
        <Card key={s.id} className="space-y-3 rounded-2xl border border-border/80 bg-card p-5 shadow-sm md:p-6">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-subtle">Stat {i + 1}</p>
            <Button type="button" size="sm" variant="ghost" className="text-secondary" onClick={() => removeStat(s.id)}>
              Remove
            </Button>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <Input value={s.label} onChange={(e) => setStat(s.id, { label: e.target.value })} placeholder="Label" />
            <Input value={s.value} onChange={(e) => setStat(s.id, { value: e.target.value })} placeholder="Value (e.g. 500+)" />
          </div>
        </Card>
      ))}

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Content blocks</h2>
        <Button type="button" size="sm" variant="outline" onClick={addBlock}>
          Add block
        </Button>
      </div>

      {form.blocks.map((b, i) => (
        <Card key={b.id} className="space-y-3 rounded-2xl border border-border/80 bg-card p-5 shadow-sm md:p-6">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-subtle">Block {i + 1}</p>
            <Button type="button" size="sm" variant="ghost" className="text-secondary" onClick={() => removeBlock(b.id)}>
              Remove
            </Button>
          </div>
          <Input value={b.title} onChange={(e) => setBlock(b.id, { title: e.target.value })} placeholder="Section title" />
          <textarea
            value={b.body}
            onChange={(e) => setBlock(b.id, { body: e.target.value })}
            className="min-h-32 w-full rounded-2xl border border-border bg-card p-3 text-sm outline-none focus:border-primary"
            placeholder="Body (English)"
          />
          <Input
            value={b.imageUrl ?? ""}
            onChange={(e) => setBlock(b.id, { imageUrl: e.target.value || undefined })}
            placeholder="Image URL (optional)"
          />
        </Card>
      ))}

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Timeline</h2>
        <Button type="button" size="sm" variant="outline" onClick={addTimeline}>
          Add milestone
        </Button>
      </div>
      {form.timeline.map((t, i) => (
        <Card key={t.id} className="space-y-3 rounded-2xl border border-border/80 bg-card p-5 shadow-sm md:p-6">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-subtle">Milestone {i + 1}</p>
            <Button type="button" size="sm" variant="ghost" className="text-secondary" onClick={() => removeTimeline(t.id)}>
              Remove
            </Button>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <Input value={t.year} onChange={(e) => setTimeline(t.id, { year: e.target.value })} placeholder="Year" />
            <Input value={t.title} onChange={(e) => setTimeline(t.id, { title: e.target.value })} placeholder="Title" />
          </div>
          <textarea
            value={t.body}
            onChange={(e) => setTimeline(t.id, { body: e.target.value })}
            className="min-h-24 w-full rounded-2xl border border-border bg-card p-3 text-sm outline-none focus:border-primary"
            placeholder="Description"
          />
        </Card>
      ))}

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Team</h2>
        <Button type="button" size="sm" variant="outline" onClick={addTeamMember}>
          Add member
        </Button>
      </div>
      {form.team.map((m, i) => (
        <Card key={m.id} className="space-y-3 rounded-2xl border border-border/80 bg-card p-5 shadow-sm md:p-6">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-subtle">Member {i + 1}</p>
            <Button type="button" size="sm" variant="ghost" className="text-secondary" onClick={() => removeTeamMember(m.id)}>
              Remove
            </Button>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <Input value={m.name} onChange={(e) => setTeamMember(m.id, { name: e.target.value })} placeholder="Name" />
            <Input value={m.role} onChange={(e) => setTeamMember(m.id, { role: e.target.value })} placeholder="Role" />
          </div>
          <textarea
            value={m.bio ?? ""}
            onChange={(e) => setTeamMember(m.id, { bio: e.target.value || undefined })}
            className="min-h-20 w-full rounded-2xl border border-border bg-card p-3 text-sm outline-none focus:border-primary"
            placeholder="Bio (optional)"
          />
          <Input
            value={m.imageUrl ?? ""}
            onChange={(e) => setTeamMember(m.id, { imageUrl: e.target.value || undefined })}
            placeholder="Photo URL (optional)"
          />
          <Input
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            onChange={(e: ChangeEvent<HTMLInputElement>) => {
              const f = e.target.files?.[0];
              if (f) void handleFileUpload(f, (url) => setTeamMember(m.id, { imageUrl: url }));
              e.target.value = "";
            }}
          />
        </Card>
      ))}

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">FAQ</h2>
        <Button type="button" size="sm" variant="outline" onClick={addFaq}>
          Add FAQ
        </Button>
      </div>
      {form.faq.map((f, i) => (
        <Card key={f.id} className="space-y-3 rounded-2xl border border-border/80 bg-card p-5 shadow-sm md:p-6">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-subtle">FAQ {i + 1}</p>
            <Button type="button" size="sm" variant="ghost" className="text-secondary" onClick={() => removeFaq(f.id)}>
              Remove
            </Button>
          </div>
          <Input value={f.question} onChange={(e) => setFaq(f.id, { question: e.target.value })} placeholder="Question" />
          <textarea
            value={f.answer}
            onChange={(e) => setFaq(f.id, { answer: e.target.value })}
            className="min-h-24 w-full rounded-2xl border border-border bg-card p-3 text-sm outline-none focus:border-primary"
            placeholder="Answer"
          />
        </Card>
      ))}

      <Card className="space-y-3 rounded-2xl border border-border/80 bg-card p-5 shadow-sm md:p-6">
        <h2 className="text-lg font-semibold">Contact</h2>
        <Input
          value={form.contact.address ?? ""}
          onChange={(e) => setContact({ address: e.target.value || undefined })}
          placeholder="Address (optional)"
        />
        <div className="grid gap-3 md:grid-cols-2">
          <Input value={form.contact.phone ?? ""} onChange={(e) => setContact({ phone: e.target.value || undefined })} placeholder="Phone" />
          <Input
            value={form.contact.whatsapp ?? ""}
            onChange={(e) => setContact({ whatsapp: e.target.value || undefined })}
            placeholder="WhatsApp"
          />
          <Input value={form.contact.email ?? ""} onChange={(e) => setContact({ email: e.target.value || undefined })} placeholder="Email" />
          <Input
            value={form.contact.facebook ?? ""}
            onChange={(e) => setContact({ facebook: e.target.value || undefined })}
            placeholder="Facebook URL"
          />
          <Input
            value={form.contact.instagram ?? ""}
            onChange={(e) => setContact({ instagram: e.target.value || undefined })}
            placeholder="Instagram URL"
          />
          <Input
            value={form.contact.mapEmbedUrl ?? ""}
            onChange={(e) => setContact({ mapEmbedUrl: e.target.value || undefined })}
            placeholder="Map embed URL (optional)"
            className="md:col-span-2"
          />
        </div>
      </Card>

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Testimonials</h2>
        <Button type="button" size="sm" variant="outline" onClick={addTestimonial}>
          Add testimonial
        </Button>
      </div>
      {form.testimonials.map((t, i) => (
        <Card key={t.id} className="space-y-3 rounded-2xl border border-border/80 bg-card p-5 shadow-sm md:p-6">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-subtle">Testimonial {i + 1}</p>
            <Button type="button" size="sm" variant="ghost" className="text-secondary" onClick={() => removeTestimonial(t.id)}>
              Remove
            </Button>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <Input value={t.name} onChange={(e) => setTestimonial(t.id, { name: e.target.value })} placeholder="Name" />
            <Input
              value={t.role ?? ""}
              onChange={(e) => setTestimonial(t.id, { role: e.target.value || undefined })}
              placeholder="Role (optional)"
            />
          </div>
          <textarea
            value={t.quote}
            onChange={(e) => setTestimonial(t.id, { quote: e.target.value })}
            className="min-h-24 w-full rounded-2xl border border-border bg-card p-3 text-sm outline-none focus:border-primary"
            placeholder="Quote"
          />
          <Input
            value={t.imageUrl ?? ""}
            onChange={(e) => setTestimonial(t.id, { imageUrl: e.target.value || undefined })}
            placeholder="Photo URL (optional)"
          />
          <Input
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            onChange={(e: ChangeEvent<HTMLInputElement>) => {
              const f = e.target.files?.[0];
              if (f) void handleFileUpload(f, (url) => setTestimonial(t.id, { imageUrl: url }));
              e.target.value = "";
            }}
          />
        </Card>
      ))}

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Gallery</h2>
        <Button type="button" size="sm" variant="outline" onClick={addGalleryImage}>
          Add image
        </Button>
      </div>
      {form.gallery.map((g, i) => (
        <Card key={g.id} className="space-y-3 rounded-2xl border border-border/80 bg-card p-5 shadow-sm md:p-6">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-subtle">Image {i + 1}</p>
            <Button type="button" size="sm" variant="ghost" className="text-secondary" onClick={() => removeGalleryImage(g.id)}>
              Remove
            </Button>
          </div>
          <Input
            value={g.imageUrl}
            onChange={(e) => setGalleryImage(g.id, { imageUrl: e.target.value })}
            placeholder="Image URL"
          />
          <Input
            value={g.caption ?? ""}
            onChange={(e) => setGalleryImage(g.id, { caption: e.target.value || undefined })}
            placeholder="Caption (optional)"
          />
          <Input
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            onChange={(e: ChangeEvent<HTMLInputElement>) => {
              const f = e.target.files?.[0];
              if (f) void handleFileUpload(f, (url) => setGalleryImage(g.id, { imageUrl: url }));
              e.target.value = "";
            }}
          />
        </Card>
      ))}

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Partners</h2>
        <Button type="button" size="sm" variant="outline" onClick={addPartner}>
          Add partner
        </Button>
      </div>
      {form.partners.map((p, i) => (
        <Card key={p.id} className="space-y-3 rounded-2xl border border-border/80 bg-card p-5 shadow-sm md:p-6">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-subtle">Partner {i + 1}</p>
            <Button type="button" size="sm" variant="ghost" className="text-secondary" onClick={() => removePartner(p.id)}>
              Remove
            </Button>
          </div>
          <Input value={p.name} onChange={(e) => setPartner(p.id, { name: e.target.value })} placeholder="Partner name" />
          <Input
            value={p.logoUrl ?? ""}
            onChange={(e) => setPartner(p.id, { logoUrl: e.target.value || undefined })}
            placeholder="Logo URL (optional)"
          />
          <Input
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            onChange={(e: ChangeEvent<HTMLInputElement>) => {
              const f = e.target.files?.[0];
              if (f) void handleFileUpload(f, (url) => setPartner(p.id, { logoUrl: url }));
              e.target.value = "";
            }}
          />
        </Card>
      ))}

      <Card className="space-y-3 rounded-2xl border border-border/80 bg-card p-5 shadow-sm md:p-6">
        <h2 className="text-lg font-semibold">Video</h2>
        <Input
          value={form.videoUrl ?? ""}
          onChange={(e) => setForm((prev) => (prev ? { ...prev, videoUrl: e.target.value || undefined } : prev))}
          placeholder="YouTube URL or embed link (optional)"
        />
      </Card>

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Awards & recognition</h2>
        <Button type="button" size="sm" variant="outline" onClick={addAward}>
          Add award
        </Button>
      </div>
      {form.awards.map((a, i) => (
        <Card key={a.id} className="space-y-3 rounded-2xl border border-border/80 bg-card p-5 shadow-sm md:p-6">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-subtle">Award {i + 1}</p>
            <Button type="button" size="sm" variant="ghost" className="text-secondary" onClick={() => removeAward(a.id)}>
              Remove
            </Button>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <Input value={a.title} onChange={(e) => setAward(a.id, { title: e.target.value })} placeholder="Award title" />
            <Input value={a.year ?? ""} onChange={(e) => setAward(a.id, { year: e.target.value || undefined })} placeholder="Year (optional)" />
          </div>
          <textarea
            value={a.description}
            onChange={(e) => setAward(a.id, { description: e.target.value })}
            className="min-h-24 w-full rounded-2xl border border-border bg-card p-3 text-sm outline-none focus:border-primary"
            placeholder="Description"
          />
          <Input
            value={a.imageUrl ?? ""}
            onChange={(e) => setAward(a.id, { imageUrl: e.target.value || undefined })}
            placeholder="Certificate image URL (optional)"
          />
          <Input
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            onChange={(e: ChangeEvent<HTMLInputElement>) => {
              const f = e.target.files?.[0];
              if (f) void handleFileUpload(f, (url) => setAward(a.id, { imageUrl: url }));
              e.target.value = "";
            }}
          />
        </Card>
      ))}

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Trust documents & SODO</h2>
        <Button type="button" size="sm" variant="outline" onClick={addDocument}>
          Add document
        </Button>
      </div>
      {form.documents.map((d, i) => (
        <Card key={d.id} className="space-y-3 rounded-2xl border border-border/80 bg-card p-5 shadow-sm md:p-6">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-subtle">Document {i + 1}</p>
            <Button type="button" size="sm" variant="ghost" className="text-secondary" onClick={() => removeDocument(d.id)}>
              Remove
            </Button>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <Input value={d.title} onChange={(e) => setDocument(d.id, { title: e.target.value })} placeholder="Document title" />
            <select
              value={d.category}
              onChange={(e) => setDocument(d.id, { category: e.target.value as AboutDocument["category"] })}
              className="rounded-2xl border border-border bg-card px-3 py-2 text-sm outline-none focus:border-primary"
            >
              <option value="registration">Registration</option>
              <option value="sodo">SODO / Society</option>
              <option value="certificate">Certificate</option>
              <option value="award">Award</option>
              <option value="other">Other</option>
            </select>
          </div>
          <textarea
            value={d.description ?? ""}
            onChange={(e) => setDocument(d.id, { description: e.target.value || undefined })}
            className="min-h-20 w-full rounded-2xl border border-border bg-card p-3 text-sm outline-none focus:border-primary"
            placeholder="Short description (optional)"
          />
          <Input
            value={d.fileUrl}
            onChange={(e) => setDocument(d.id, { fileUrl: e.target.value })}
            placeholder="File URL (/uploads/… or https://…)"
          />
          <Input
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif,application/pdf"
            onChange={(e: ChangeEvent<HTMLInputElement>) => {
              const f = e.target.files?.[0];
              if (f) void handleFileUpload(f, (url) => setDocument(d.id, { fileUrl: url }));
              e.target.value = "";
            }}
          />
        </Card>
      ))}

      <Card className="space-y-3 rounded-2xl border border-border/80 bg-card p-5 shadow-sm md:p-6">
        <h2 className="text-lg font-semibold">Technical partner / developer</h2>
        <p className="text-sm text-subtle">Shown in a highlighted section on the public About page (name, role, contact).</p>
        <Input
          value={form.developer.sectionTitle}
          onChange={(e) => setDev({ sectionTitle: e.target.value })}
          placeholder="Section title (e.g. Technical partner)"
        />
        <div className="grid gap-3 md:grid-cols-2">
          <Input value={form.developer.name} onChange={(e) => setDev({ name: e.target.value })} placeholder="Name" />
          <Input value={form.developer.role} onChange={(e) => setDev({ role: e.target.value })} placeholder="Role" />
        </div>
        <textarea
          value={form.developer.bio}
          onChange={(e) => setDev({ bio: e.target.value })}
          className="min-h-28 w-full rounded-2xl border border-border bg-card p-3 text-sm outline-none focus:border-primary"
          placeholder="Short bio (English)"
        />
        <div className="grid gap-3 md:grid-cols-2">
          <Input
            value={form.developer.imageUrl ?? ""}
            onChange={(e) => setDev({ imageUrl: e.target.value || undefined })}
            placeholder="Photo URL (optional)"
          />
          <Input
            value={form.developer.website ?? ""}
            onChange={(e) => setDev({ website: e.target.value || undefined })}
            placeholder="Website (https://…)"
          />
          <Input
            value={form.developer.email ?? ""}
            onChange={(e) => setDev({ email: e.target.value || undefined })}
            placeholder="Email (optional)"
            className="md:col-span-2"
          />
        </div>
      </Card>

      <Button onClick={() => void save()} disabled={saving}>
        {saving ? "Saving…" : "Save about page"}
      </Button>
    </div>
  );
}
