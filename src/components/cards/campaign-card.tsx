import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useTranslatedText } from "@/hooks/use-translated-content";
import { useTranslate } from "@/hooks/use-translate";
import { UI } from "@/i18n/ui";

type CampaignCardProps = {
  title: string;
  raised: number;
  goal: number;
  verified?: boolean;
  onDonate?: () => void;
  donateLabel?: string;
};

export function CampaignCard({ title, raised, goal, verified, onDonate, donateLabel = "Donate Now" }: CampaignCardProps) {
  const tTitle = useTranslatedText(title);
  const tVerified = useTranslate(UI.campaignVerified);
  const tDonateDefault = useTranslate(UI.donateNow);
  const btnLabel = donateLabel === "Donate Now" ? tDonateDefault : donateLabel;
  const percentage = Math.round((raised / goal) * 100);

  return (
    <Card className="glass">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold">{tTitle}</h3>
        {verified ? <Badge className="bg-accent/20 text-accent">{tVerified}</Badge> : null}
      </div>
      <p className="mt-2 text-sm text-subtle">PKR {raised.toLocaleString()} raised of PKR {goal.toLocaleString()}</p>
      <div className="mt-3">
        <Progress value={percentage} />
      </div>
      <Button variant="accent" className="mt-4 w-full" onClick={onDonate}>{btnLabel}</Button>
    </Card>
  );
}
