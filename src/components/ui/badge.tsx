import { cn } from "@/lib/cn";
import type { HTMLAttributes } from "react";

export function Badge({ className, ...props }: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary",
        "dark:border-primary/30 dark:bg-primary/15",
        className
      )}
      {...props}
    />
  );
}
