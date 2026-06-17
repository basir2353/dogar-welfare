import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { Sparkles } from "lucide-react";
import { api } from "@/utils/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { useAuthStore } from "@/store/auth-store";
import type { LandingContent } from "./types";

export function AdminLandingPage() {
  const role = useAuthStore((s) => s.user?.role);
  const canEdit = role === "ADMIN" || role === "SUPER_ADMIN";
  const [landingContent, setLandingContent] = useState<LandingContent | null>(null);
  const [message, setMessage] = useState("");
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  useEffect(() => {
    if (!canEdit) return;
    const load = async () => {
      try {
        const { data } = await api.get("/admin/content/landing");
        if (data.success && data.data) {
          setLandingContent(data.data as LandingContent);
        }
      } catch {
        setMessage("Unable to load landing copy.");
      }
    };
    void load();
  }, [canEdit]);

  if (!canEdit) {
    return <Navigate to="/admin" replace />;
  }

  const saveLandingContent = async () => {
    if (!landingContent) return;
    try {
      await api.put("/admin/content/landing", landingContent);
      setMessage("Landing content saved.");
      setTimeout(() => setMessage(""), 5000);
    } catch {
      setMessage("Unable to save landing content.");
    }
  };

  const updateLandingField = <K extends keyof LandingContent>(key: K, value: LandingContent[K]) => {
    setLandingContent((prev) => (prev ? { ...prev, [key]: value } : prev));
  };

  const moveHowItWorksStep = (from: number, to: number) => {
    if (!landingContent || from === to || to < 0 || to >= landingContent.howItWorksSteps.length) return;
    const next = [...landingContent.howItWorksSteps];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    updateLandingField("howItWorksSteps", next);
  };

  return (
    <div>
      <AdminPageHeader
        title="Landing page copy"
        subtitle="Hero text, CTAs, and section titles. Featured profiles, campaigns, and posts still come from the live database."
      />
      {message ? <p className="mb-4 text-sm text-accent">{message}</p> : null}
      <Card className="rounded-2xl border border-border/80 bg-card p-5 shadow-sm md:p-6">
        <div className="mb-6 flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent/12 text-accent">
            <Sparkles className="h-4 w-4" />
          </div>
          <p className="text-lg font-semibold">Home page strings</p>
        </div>
        {!landingContent ? (
          <p className="text-sm text-subtle">Loading…</p>
        ) : (
          <div className="space-y-6">
            <div className="grid gap-3 md:grid-cols-2">
              <Input value={landingContent.heroBadge} onChange={(e) => updateLandingField("heroBadge", e.target.value)} placeholder="Hero badge" />
              <Input value={landingContent.heroTitle} onChange={(e) => updateLandingField("heroTitle", e.target.value)} placeholder="Hero title" />
              <Input value={landingContent.heroSubtitle} onChange={(e) => updateLandingField("heroSubtitle", e.target.value)} placeholder="Hero subtitle" />
              <Input value={landingContent.howItWorksTitle} onChange={(e) => updateLandingField("howItWorksTitle", e.target.value)} placeholder="How it works title" />
              <Input
                value={landingContent.featuredProfilesTitle}
                onChange={(e) => updateLandingField("featuredProfilesTitle", e.target.value)}
                placeholder="Section: featured profiles"
              />
              <Input
                value={landingContent.donationImpactTitle}
                onChange={(e) => updateLandingField("donationImpactTitle", e.target.value)}
                placeholder="Section: donation impact"
              />
              <Input
                value={landingContent.communityPreviewTitle}
                onChange={(e) => updateLandingField("communityPreviewTitle", e.target.value)}
                placeholder="Section: community"
              />
              <Input value={landingContent.ctaFindRishta} onChange={(e) => updateLandingField("ctaFindRishta", e.target.value)} placeholder="CTA: Find rishta" />
              <Input value={landingContent.ctaCommunity} onChange={(e) => updateLandingField("ctaCommunity", e.target.value)} placeholder="CTA: Community" />
              <Input value={landingContent.ctaDonate} onChange={(e) => updateLandingField("ctaDonate", e.target.value)} placeholder="CTA: Donate" />
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-subtle">How it works steps (drag to reorder)</p>
              {landingContent.howItWorksSteps.map((step, index) => (
                <div
                  key={`${step}-${index}`}
                  draggable
                  onDragStart={() => setDragIndex(index)}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={() => {
                    if (dragIndex !== null) {
                      moveHowItWorksStep(dragIndex, index);
                    }
                    setDragIndex(null);
                  }}
                  className="cursor-grab rounded-xl border border-border/70 bg-background/50 p-3 active:cursor-grabbing"
                >
                  <Input
                    value={step}
                    onChange={(e) => {
                      const next = [...landingContent.howItWorksSteps];
                      next[index] = e.target.value;
                      updateLandingField("howItWorksSteps", next);
                    }}
                    placeholder={`Step ${index + 1}`}
                  />
                </div>
              ))}
            </div>
            <Button onClick={() => void saveLandingContent()}>Save landing content</Button>
          </div>
        )}
      </Card>
    </div>
  );
}
