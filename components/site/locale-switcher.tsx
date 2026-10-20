"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useTranslation } from "react-i18next";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Locale } from "@/src/i18n/config";

export function LocaleSwitcher({ locale }: { locale: Locale }) {
  const { t } = useTranslation("common");
  const pathname = usePathname() ?? "/";
  const searchParams = useSearchParams();

  return (
    <div
      className="flex items-center gap-0.5"
      role="group"
      aria-label={t("locale.groupAria")}
    >
      {(["fr", "en"] as const).map((lang) => {
        const active = locale === lang;
        const params = new URLSearchParams(searchParams.toString());
        params.set("lang", lang);
        return (
          <a
            key={lang}
            href={`${pathname}?${params.toString()}`}
            hrefLang={lang}
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
