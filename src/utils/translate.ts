import type { AppLanguage } from "@/store/language-store";

const fallback: Record<string, Record<AppLanguage, string>> = {
  "Donate Now": { en: "Donate Now", ur: "ابھی عطیہ کریں", pa: "ਹੁਣ ਦਾਨ ਕਰੋ" },
  "Create Post": { en: "Create Post", ur: "پوسٹ بنائیں", pa: "ਪੋਸਟ ਬਣਾਓ" },
  Donations: { en: "Donations", ur: "عطیات", pa: "ਦਾਨ" },
  Community: { en: "Community", ur: "کمیونٹی", pa: "ਕਮਿਊਨਿਟੀ" },
  "Submit Donation": { en: "Submit Donation", ur: "عطیہ جمع کریں", pa: "ਦਾਨ ਜਮ੍ਹਾਂ ਕਰੋ" }
};

const cache = new Map<string, string>();
function cacheKey(lang: AppLanguage, text: string) {
  return `${lang}\t${text}`;
}

export async function translateText(text: string, target: AppLanguage): Promise<string> {
  if (target === "en" || !text) return text;
  const fromFallback = fallback[text];
  if (fromFallback) {
    const f = fromFallback[target];
    if (f) return f;
  }
  const c = cacheKey(target, text);
  const hit = cache.get(c);
  if (hit !== undefined) {
    return hit;
  }
  let result = text;
  try {
    const response = await fetch(
      `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|${target === "ur" ? "ur-PK" : "pa-IN"}`
    );
    const data = await response.json();
    const translated = data?.responseData?.translatedText;
    if (typeof translated === "string" && translated.length > 0) {
      result = translated;
    }
  } catch {
    // keep result as source text
  }
  if (result.length < 10_000) {
    cache.set(c, result);
  }
  return result;
}
