import { useEffect, useState } from "react";
import { useLanguageStore } from "@/store/language-store";
import { translateText } from "@/utils/translate";

/** Translates dynamic/API text (English source) when language changes. */
export function useTranslatedText(text: string | null | undefined): string {
  const language = useLanguageStore((s) => s.language);
  const src = text?.trim() ?? "";
  const [out, setOut] = useState("");

  useEffect(() => {
    if (!src) {
      setOut("");
      return;
    }
    if (language === "en") {
      setOut(src);
      return;
    }
    let active = true;
    void translateText(text ?? "", language).then((t) => {
      if (active) {
        setOut(t);
      }
    });
    return () => {
      active = false;
    };
  }, [src, language, text]);
  return out;
}
