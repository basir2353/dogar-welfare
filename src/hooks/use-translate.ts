import { useEffect, useState } from "react";
import { useLanguageStore } from "@/store/language-store";
import { translateText } from "@/utils/translate";

export function useTranslate(text: string) {
  const language = useLanguageStore((s) => s.language);
  const [value, setValue] = useState(text);

  useEffect(() => {
    let mounted = true;
    translateText(text, language).then((translated) => {
      if (mounted) setValue(translated);
    });
    return () => {
      mounted = false;
    };
  }, [language, text]);

  return value;
}
