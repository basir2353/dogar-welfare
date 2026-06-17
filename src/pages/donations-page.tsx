import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/auth-store";
import { CampaignCard } from "@/components/cards/campaign-card";
import { Card } from "@/components/ui/card";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useTranslate } from "@/hooks/use-translate";
import { api, publicApi, setAuthToken } from "@/utils/api";
import type { AxiosError } from "axios";

type CampaignApi = {
  id: string;
  title: string;
  raisedAmount: number;
  goalAmount: number;
  isVerified: boolean;
};

export function DonationsPage() {
  const accessToken = useAuthStore((s) => s.accessToken);
  const user = useAuthStore((s) => s.user);
  const profile = useAuthStore((s) => s.profile);
  const [open, setOpen] = useState(false);
  const [campaignName, setCampaignName] = useState("");
  const [campaignId, setCampaignId] = useState("");
  const [campaigns, setCampaigns] = useState<Array<{ id: string; title: string; raisedAmount: number; goalAmount: number; isVerified: boolean }>>([]);
  const [impact, setImpact] = useState<{ totalRaised: number; uniqueDonors: number; activeCampaigns: number } | null>(null);
  const [amount, setAmount] = useState("");
  const [donorName, setDonorName] = useState("");
  const [donorEmail, setDonorEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [donationType, setDonationType] = useState("Sadaqah");
  const [note, setNote] = useState("");
  const [donateSuccess, setDonateSuccess] = useState("");
  const [donateError, setDonateError] = useState("");
  const [loadError, setLoadError] = useState("");
  const donateNow = useTranslate("Donate Now");
  const submitDonation = useTranslate("Submit Donation");

  const loadDonationData = async () => {
    setLoadError("");
    const [campaignOutcome, impactOutcome] = await Promise.allSettled([
      publicApi.get("/donations/campaigns"),
      publicApi.get("/donations/impact")
    ]);

    if (campaignOutcome.status === "fulfilled" && campaignOutcome.value.data.success) {
      setCampaigns(campaignOutcome.value.data.data as CampaignApi[]);
    }

    if (impactOutcome.status === "fulfilled" && impactOutcome.value.data.success) {
      setImpact(impactOutcome.value.data.data);
    }

    const campaignFailed = campaignOutcome.status === "rejected"
      || (campaignOutcome.status === "fulfilled" && !campaignOutcome.value.data.success);
    const impactFailed = impactOutcome.status === "rejected"
      || (impactOutcome.status === "fulfilled" && !impactOutcome.value.data.success);

    if (campaignFailed || impactFailed) {
      const firstAxiosError = [campaignOutcome, impactOutcome].find(
        (o): o is PromiseRejectedResult => o.status === "rejected"
      )?.reason as AxiosError<{ error?: { message?: string } }> | undefined;
      const backendMessage = firstAxiosError?.response?.data?.error?.message;
      setLoadError(
        backendMessage
          ?? "Could not refresh donation data. Start the API (npm run dev:backend, default http://localhost:4000) or set VITE_API_BASE_URL in frontend."
      );
    }
  };

  useEffect(() => {
    setAuthToken(accessToken);
  }, [accessToken]);

  useEffect(() => {
    const timer = setTimeout(() => {
      void loadDonationData();
    }, 0);
    const interval = setInterval(() => {
      void loadDonationData();
    }, 10000);
    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, []);

  const handleDonate = async () => {
    const parsedAmount = Number(amount);
    if (!campaignId || Number.isNaN(parsedAmount) || parsedAmount <= 0) {
      setDonateError("Enter a valid amount in PKR.");
      return;
    }
    try {
      setDonateError("");
      setDonateSuccess("");
      const parts = [donationType, note.trim()].filter(Boolean);
      await api.post(`/donations/campaigns/${campaignId}/donate`, {
        amount: parsedAmount,
        message: parts.length ? parts.join(" — ") : undefined
      });
      const who = donorName.trim() || user?.email || "You";
      setDonateSuccess(`Donation recorded: ${who} — PKR ${parsedAmount.toLocaleString()} to “${campaignName}”${parts.length ? ` (${parts[0]})` : ""}.`);
      setOpen(false);
      void loadDonationData();
    } catch (error) {
      const ax = error as AxiosError<{ error?: { message?: string } }>;
      const backendMessage = ax.response?.data?.error?.message;
      if (ax.response?.status === 401) {
        setDonateError(backendMessage ?? "Session expired or missing token. Sign out and sign in again.");
        return;
      }
      if (!ax.response) {
        setDonateError(ax.message || "Network error — could not reach the API. Check that the backend is running.");
        return;
      }
      setDonateError(backendMessage ?? "Unable to submit donation. See message above or try again.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="glass"><p className="text-sm text-subtle">Raised Funds</p><p className="mt-2 text-3xl font-bold">PKR {(impact?.totalRaised ?? 0).toLocaleString()}</p></Card>
        <Card className="glass"><p className="text-sm text-subtle">Families Helped</p><p className="mt-2 text-3xl font-bold">{(impact?.uniqueDonors ?? 0).toLocaleString()}</p></Card>
        <Card className="glass"><p className="text-sm text-subtle">Verified Campaigns</p><p className="mt-2 text-3xl font-bold">{impact?.activeCampaigns ?? 0}</p></Card>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {campaigns.map((campaign) => (
          <CampaignCard
            key={campaign.id}
            title={campaign.title}
            raised={campaign.raisedAmount}
            goal={campaign.goalAmount}
            verified={campaign.isVerified}
            donateLabel={donateNow}
            onDonate={() => {
              setCampaignName(campaign.title);
              setCampaignId(campaign.id);
              setDonorName(profile?.fullName?.trim() || "");
              setDonorEmail(user?.email || "");
              setPhone((profile?.phone || profile?.whatsapp || "").trim());
              setAmount("");
              setNote("");
              setDonateError("");
              setOpen(true);
            }}
          />
        ))}
      </div>
      {loadError ? <p className="text-sm text-amber-300">{loadError}</p> : null}
      {donateError ? <p className="text-sm text-rose-300">{donateError}</p> : null}
      {donateSuccess ? <p className="text-sm text-accent">{donateSuccess}</p> : null}
      <Modal open={open} onClose={() => setOpen(false)} title={`Donate - ${campaignName}`}>
        <div className="space-y-3">
          <Input value={donorName} onChange={(e) => setDonorName(e.target.value)} placeholder="Full name" />
          <Input value={donorEmail} onChange={(e) => setDonorEmail(e.target.value)} placeholder="Email address" />
          <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone number" />
          <Input value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Amount PKR" />
          <select
            value={donationType}
            onChange={(e) => setDonationType(e.target.value)}
            className="h-11 w-full rounded-2xl border border-border bg-card px-3 text-sm outline-none"
          >
            <option>Sadaqah</option>
            <option>Zakat</option>
            <option>General Charity</option>
          </select>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Message / intention (optional)"
            className="min-h-20 w-full rounded-2xl border border-border bg-card p-3 text-sm outline-none focus:border-primary"
          />
          <Button className="w-full" variant="accent" onClick={handleDonate}>{submitDonation}</Button>
        </div>
      </Modal>
    </div>
  );
}
