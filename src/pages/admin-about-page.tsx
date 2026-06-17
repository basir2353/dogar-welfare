import { useEffect, useState, type ChangeEvent } from "react";
import { Navigate } from "react-router-dom";
import type { AboutAward, AboutBlock, AboutContent, AboutDocument } from "@/shared";
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
        const payload = data.data as AboutContent;
        setForm({
          ...payload,
          awards: payload.awards ?? [],
          documents: payload.documents ?? []
        });
      } else {
        setForm({ ...DEFAULT_ABOUT_CONTENT, blocks: [...DEFAULT_ABOUT_CONTENT.blocks], awards: [...DEFAULT_ABOUT_CONTENT.awards], documents: [...DEFAULT_ABOUT_CONTENT.documents] });
        setMessage("Server returned no About payload; showing defaults. Apply Prisma migrations if the SiteAbout table is missing.");
      }
    } catch {
      setForm({ ...DEFAULT_ABOUT_CONTENT, blocks: [...DEFAULT_ABOUT_CONTENT.blocks], awards: [...DEFAULT_ABOUT_CONTENT.awards], documents: [...DEFAULT_ABOUT_CONTENT.documents] });
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
        documents: form.documents.map((d, i) => ({ ...d, order: i }))
      });
      if (data.success && data.data) {
        setForm(data.data as AboutContent);
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
