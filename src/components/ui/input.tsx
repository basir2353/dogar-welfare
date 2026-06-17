import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

const inputClass =
  "h-11 w-full rounded-2xl border border-border bg-card px-4 text-sm text-foreground shadow-sm transition-[border-color,box-shadow] " +
  "placeholder:text-foreground/40 " +
  "hover:border-foreground/15 " +
  "focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/25 focus:ring-offset-0 " +
  "disabled:cursor-not-allowed disabled:opacity-50";

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(inputClass, className)} {...props} />;
}
