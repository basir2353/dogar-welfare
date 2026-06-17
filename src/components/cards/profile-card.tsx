import { useState } from "react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useTranslatedText } from "@/hooks/use-translated-content";

type ProfileCardProps = {
  name: string;
  age: number;
  city: string;
  score: number;
  /** List/cover image from matrimonial gallery (banner). */
  bannerImageUrl?: string | null;
  profileViews?: number;
  interestSent?: boolean;
  onSendInterest?: () => void;
  onViewProfile?: () => void;
  /** When false, hides interest CTA (e.g. public landing preview). */
  showActions?: boolean;
};

export function ProfileCard({
  name,
  age,
  city,
  score,
  bannerImageUrl,
  profileViews = 0,
  interestSent,
  onSendInterest,
  onViewProfile,
  showActions = true
}: ProfileCardProps) {
  const tName = useTranslatedText(name);
  const tCity = useTranslatedText(city);
  const [imageFailed, setImageFailed] = useState(false);
  const showPhoto = Boolean(bannerImageUrl) && !imageFailed;
  const initials = name
    .trim()
    .split(/\s+/)
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "?";
  return (
    <motion.div whileHover={{ y: -6 }}>
      <Card className="glass cursor-pointer overflow-hidden" onClick={onViewProfile}>
        <div className="relative h-40 overflow-hidden rounded-2xl bg-gradient-to-br from-primary/20 to-secondary/10">
          {showPhoto ? (
            <img
              src={bannerImageUrl!}
              alt=""
              className="absolute inset-0 h-full w-full object-cover"
              loading="lazy"
              onError={() => setImageFailed(true)}
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="select-none text-3xl font-semibold text-foreground/90">{initials}</span>
            </div>
          )}
        </div>
        <div className="mt-4 flex items-start justify-between">
          <div>
            <h3 className="text-lg font-semibold">{tName}</h3>
            <p className="text-sm text-subtle">{age} years • {tCity}</p>
            {showActions && profileViews > 0 ? (
              <p className="mt-1 text-xs text-faint">Profile views: {profileViews}</p>
            ) : null}
          </div>
          <Badge>{score > 0 ? `${score}% match` : "Verified"}</Badge>
        </div>
        {showActions ? (
          <Button
            className="mt-4 w-full"
            onClick={(event) => {
              event.stopPropagation();
              onSendInterest?.();
            }}
            disabled={interestSent}
          >
            {interestSent ? "Interest Sent" : "Send Interest"}
          </Button>
        ) : null}
      </Card>
    </motion.div>
  );
}
