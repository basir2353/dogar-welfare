import { ChevronDown, Globe } from "lucide-react";
import { useLanguageStore } from "@/store/language-store";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";

const LANG_LABELS = { en: "English", ur: "Urdu", pa: "Punjabi" } as const;

type LanguageSwitcherProps = {
  variant?: "select" | "icon";
};

export function LanguageSwitcher({ variant = "select" }: LanguageSwitcherProps) {
  const language = useLanguageStore((s) => s.language);
  const setLanguage = useLanguageStore((s) => s.setLanguage);

  if (variant === "icon") {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger
          className={cn(
            buttonVariants({ variant: "outline", size: "sm" }),
            "h-9 gap-1.5 px-2.5 font-semibold"
          )}
          aria-label="Language"
        >
          <Globe className="h-4 w-4 shrink-0" aria-hidden />
          <span className="max-w-[5.5rem] truncate text-xs sm:text-sm">{LANG_LABELS[language]}</span>
          <ChevronDown className="h-3.5 w-3.5 shrink-0 opacity-70" aria-hidden />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {(["en", "ur", "pa"] as const).map((code) => (
            <DropdownMenuItem key={code} onSelect={() => setLanguage(code)}>
              {LANG_LABELS[code]}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <select
      className="h-9 rounded-xl border border-border bg-card px-2 text-sm"
      value={language}
      onChange={(e) => setLanguage(e.target.value as "en" | "ur" | "pa")}
      aria-label="Language switcher"
    >
      <option value="en">English</option>
      <option value="ur">Urdu</option>
      <option value="pa">Punjabi</option>
    </select>
  );
}
