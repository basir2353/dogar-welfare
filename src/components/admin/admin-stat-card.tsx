import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type Tint = "primary" | "accent" | "secondary" | "muted";

const tintRing: Record<Tint, string> = {
  primary: "from-primary/15 to-primary/[0.02]",
  accent: "from-accent/15 to-accent/[0.02]",
  secondary: "from-secondary/12 to-secondary/[0.02]",
  muted: "from-muted/10 to-muted/[0.02]"
};

const iconWrap: Record<Tint, string> = {
  primary: "bg-primary/15 text-primary",
  accent: "bg-accent/15 text-accent",
  secondary: "bg-secondary/12 text-secondary",
  muted: "bg-muted/15 text-muted"
};

type Props = {
  label: string;
  value: string | number;
  icon: ReactNode;
  tint?: Tint;
  className?: string;
};

export function AdminStatCard({ label, value, icon, tint = "primary", className }: Props) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border border-border/70 bg-gradient-to-br p-5 shadow-sm",
        tintRing[tint],
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl", iconWrap[tint])}>{icon}</div>
      </div>
      <p className="mt-4 text-xs font-medium uppercase tracking-wide text-faint">{label}</p>
      <p className="mt-1 text-2xl font-bold tracking-tight text-foreground md:text-3xl">{value}</p>
    </div>
  );
}
