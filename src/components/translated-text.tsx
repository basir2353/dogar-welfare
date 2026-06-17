import { useTranslatedText } from "@/hooks/use-translated-content";

type Props = {
  text: string | null | undefined;
  className?: string;
  as?: "span" | "p" | "h1" | "h2" | "h3" | "div" | "strong" | "em" | "li" | "dt" | "dd" | "label" | "th" | "td" | "caption";
  /** When true, render nothing if text is empty. */
  hideIfEmpty?: boolean;
};

/**
 * Renders free-form or API-sourced copy translated for the current language
 * (MyMemory API, with cache), using English as the source of truth in the API.
 */
export function TranslatedText({ text, className, as: Tag = "span", hideIfEmpty = false }: Props) {
  const t = useTranslatedText(text);
  if ((hideIfEmpty && !t) || (t == null && !text)) {
    return null;
  }
  if (!text) {
    return null;
  }
  return <Tag className={className}>{t}</Tag>;
}
