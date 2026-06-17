import { useEffect, useState } from "react";
import { Megaphone } from "lucide-react";
import type { AxiosError } from "axios";
import { api } from "@/utils/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AdminPageHeader } from "@/components/admin/admin-page-header";

export function AdminCampaignsPage() {
  const [campaigns, setCampaigns] = useState<
    Array<{ id: string; title: string; raisedAmount: number; goalAmount: number; isVerified: boolean }>
  >([]);
  const [campaignForm, setCampaignForm] = useState({ title: "", description: "", goalAmount: "" });
  const [campaignMessage, setCampaignMessage] = useState("");
  const [isCreatingCampaign, setIsCreatingCampaign] = useState(false);

  const loadCampaigns = async () => {
    try {
      const campaignsRes = await api.get("/donations/campaigns");
      if (campaignsRes.data.success) {
        setCampaigns(
          campaignsRes.data.data as Array<{ id: string; title: string; raisedAmount: number; goalAmount: number; isVerified: boolean }>
        );
      }
    } catch {
      setCampaignMessage("Unable to load campaigns.");
    }
  };

  useEffect(() => {
    void loadCampaigns();
  }, []);

  const createCampaign = async () => {
    if (isCreatingCampaign) return;
    const title = campaignForm.title.trim();
    const description = campaignForm.description.trim();
    const goal = Number(campaignForm.goalAmount.replaceAll(",", "").trim());
    if (title.length < 3) {
      setCampaignMessage("Campaign title must be at least 3 characters.");
      return;
    }
    if (description.length < 10) {
      setCampaignMessage("Campaign description must be at least 10 characters.");
      return;
    }
    if (Number.isNaN(goal) || goal <= 0) {
      setCampaignMessage("Goal amount must be a valid positive number.");
      return;
    }
    try {
      setIsCreatingCampaign(true);
      setCampaignMessage("");
      await api.post("/admin/campaigns", {
        title,
        description,
        goalAmount: goal,
        isVerified: true
      });
      setCampaignForm({ title: "", description: "", goalAmount: "" });
      setCampaignMessage("Campaign created successfully.");
      void loadCampaigns();
    } catch (error) {
      const backendMessage = (error as AxiosError<{ error?: { message?: string } }>)?.response?.data?.error?.message;
      setCampaignMessage(backendMessage ?? "Unable to create campaign.");
    } finally {
      setIsCreatingCampaign(false);
    }
  };

  return (
    <div>
      <AdminPageHeader
        title="Campaigns"
        subtitle="Create verified welfare campaigns and review fundraising progress."
      />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="rounded-2xl border border-border/80 bg-card p-5 shadow-sm md:p-6">
          <div className="mb-4 flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/12 text-primary">
              <Megaphone className="h-4 w-4" />
            </div>
            <p className="text-lg font-semibold">New campaign</p>
          </div>
          <div className="space-y-3">
            <Input placeholder="Campaign title" value={campaignForm.title} onChange={(e) => setCampaignForm((v) => ({ ...v, title: e.target.value }))} />
            <textarea
              placeholder="Campaign description"
              value={campaignForm.description}
              onChange={(e) => setCampaignForm((v) => ({ ...v, description: e.target.value }))}
              className="min-h-28 w-full rounded-2xl border border-border bg-background/60 p-3 text-sm outline-none transition-colors focus:border-primary"
            />
            <Input placeholder="Goal amount (PKR)" value={campaignForm.goalAmount} onChange={(e) => setCampaignForm((v) => ({ ...v, goalAmount: e.target.value }))} />
            <p className="text-xs text-faint">Title: min 3 characters. Description: min 10. Goal: positive number.</p>
            <Button onClick={() => void createCampaign()} disabled={isCreatingCampaign}>
              {isCreatingCampaign ? "Creating…" : "Create campaign"}
            </Button>
            {campaignMessage ? <p className="text-sm text-subtle">{campaignMessage}</p> : null}
          </div>
        </Card>
        <Card className="rounded-2xl border border-border/80 bg-card p-5 shadow-sm md:p-6">
          <p className="mb-4 text-lg font-semibold">All campaigns</p>
          {campaigns.length === 0 ? <p className="text-sm text-subtle">No campaigns yet.</p> : null}
          <div className="max-h-[32rem] space-y-3 overflow-y-auto pr-1">
            {campaigns.map((campaign) => (
              <div key={campaign.id} className="rounded-xl border border-border/60 bg-background/40 p-4">
                <p className="font-medium">{campaign.title}</p>
                <p className="mt-1 text-xs text-subtle">
                  Goal: PKR {campaign.goalAmount.toLocaleString()} · Raised: PKR {campaign.raisedAmount.toLocaleString()}
                  {campaign.isVerified ? <span className="ml-2 text-accent">· Verified</span> : null}
                </p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
