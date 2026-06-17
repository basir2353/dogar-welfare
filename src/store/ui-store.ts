import { create } from "zustand";
import { persist } from "zustand/middleware";

type Theme = "light" | "dark";

type UiStore = {
  theme: Theme;
  setTheme: (t: Theme) => void;
  toggleTheme: () => void;
};

function applyThemeClass(theme: Theme) {
  document.documentElement.classList.toggle("dark", theme === "dark");
}

export const useUiStore = create<UiStore>()(
  persist(
    (set, get) => ({
      theme: "light",
      setTheme: (t) => {
        applyThemeClass(t);
        set({ theme: t });
      },
      toggleTheme: () => {
        const next = get().theme === "dark" ? "light" : "dark";
        applyThemeClass(next);
        set({ theme: next });
      }
    }),
    {
      name: "dogar-ui",
      onRehydrateStorage: () => (state) => {
        if (state?.theme) {
          applyThemeClass(state.theme);
        }
      }
    }
  )
);
