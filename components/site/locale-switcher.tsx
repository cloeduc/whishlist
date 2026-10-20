"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { setLocaleAction } from "@/src/server/actions";
import { locales, type Locale } from "@/src/i18n/config";

export function LocaleSwitcher({ locale }: { locale: Locale }) {
  const { t } = useTranslation("common");
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex items-center gap-0.5" role="group" aria-label={t("locale.groupAria")}>
      {locales.map((code) => {
        const active = code === locale;
        return (
          <Button
            key={code}
            type="button"
            variant={active ? "secondary" : "ghost"}
            size="sm"
            disabled={pending || active}
            aria-current={active ? "true" : undefined}
            aria-label={t("locale.switchAria", { locale: code.toUpperCase() })}
            onClick={() => {
              startTransition(async () => {
                await setLocaleAction(code);
                router.refresh();
              });
            }}
          >
            {code.toUpperCase()}
          </Button>
        );
      })}
    </div>
  );
}
