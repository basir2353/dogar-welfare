import { Moon, Sun } from "lucide-react";
import { Button } from "./button";
import { useUiStore } from "@/store/ui-store";

export function ThemeToggle() {
  const { theme, toggleTheme } = useUiStore();
  return (
    <Button variant="ghost" size="sm" onClick={toggleTheme} aria-label="Toggle theme">
      {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </Button>
  );
}
