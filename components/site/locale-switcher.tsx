"use client";

import { usePathname } from "next/navigation";
import { useTranslation } from "react-i18next";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Locale } from "@/src/i18n/config";
import { withLocale } from "@/src/i18n/locale-path";

export function LocaleSwitcher({ locale }: { locale: Locale }) {
  const { t } = useTranslation("common");
  const pathname = usePathname() ?? "/";

  return (
    <div
      className="flex items-center gap-0.5"
      role="group"
      aria-label={t("locale.groupAria")}
    >
      {(["fr", "en"] as const).map((lang) => {
        const active = locale === lang;
        return (
          <a
            key={lang}
            href={withLocale(lang, pathname)}
            hrefLang={lang}
            lang={lang}
            aria-current={active ? "true" : undefined}
            className={cn(
              buttonVariants({ variant: active ? "default" : "ghost", size: "sm" }),
              "min-w-9 px-2 font-semibold uppercase tracking-wide",
            )}
          >
            {t(`locale.${lang}`)}
          </a>
        );
      })}
    </div>
  );
}
