import { useTranslate } from "@/hooks/use-translate";
import { UI } from "@/i18n/ui";
import { BrandLogoMark } from "@/components/brand/brand-logo-mark";

export function Footer() {
  const a = useTranslate(UI.footerOrg);
  const b = useTranslate(UI.footerTagline);
  const c = useTranslate(UI.footerTrust);
  const d = useTranslate(UI.footerTrustList);
  const e = useTranslate(UI.footerLegal);
  const f = useTranslate(UI.footerLegalList);
  return (
    <footer className="mt-16 border-t border-border/60 bg-card/20">
      <div className="container grid gap-6 py-10 md:grid-cols-3">
        <div>
          <div className="mb-3">
            <BrandLogoMark className="h-12 max-h-14" />
          </div>
          <p className="text-base font-semibold">{a}</p>
          <p className="mt-2 text-sm text-subtle">{b}</p>
        </div>
        <div>
          <p className="text-sm font-semibold">{c}</p>
          <p className="mt-2 text-sm text-subtle">{d}</p>
        </div>
        <div>
          <p className="text-sm font-semibold">{e}</p>
          <p className="mt-2 text-sm text-subtle">{f}</p>
        </div>
      </div>
    </footer>
  );
}
