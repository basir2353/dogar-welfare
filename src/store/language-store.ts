import { create } from "zustand";
import { persist } from "zustand/middleware";

export type AppLanguage = "en" | "ur" | "pa";

type LanguageState = {
  language: AppLanguage;
  setLanguage: (language: AppLanguage) => void;
};

export const useLanguageStore = create<LanguageState>()(
  persist(
    (set) => ({
      language: "en",
      setLanguage: (language) => set({ language })
    }),
    { name: "dogar-lang" }
  )
);
