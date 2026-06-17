import { cn } from "@/lib/cn";
import type { HTMLAttributes } from "react";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("rounded-2xl border border-border/90 bg-card p-5 shadow-card md:p-6", className)}
      {...props}
    />
  );
}
