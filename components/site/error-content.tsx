"use client";

import { useTranslation } from "react-i18next";
import { Button, buttonVariants } from "@/components/ui/button";

/**
 * Body of the site's error pages: what happened and « Réessayer ». `home`, when given, adds a plain
 * link to the home page (the page shown when the root layout fails has no navigation).
 */
export function ErrorContent({ retry, home }: { retry: () => void; home?: string }) {
  const { t } = useTranslation("common");
  const retryButton = (
    <Button type="button" onClick={() => retry()}>
      {t("error.retry")}
    </Button>
  );
  return (
    <main className="flex flex-col items-start gap-3">
      <h1 className="text-2xl font-bold tracking-tight">{t("error.title")}</h1>
      <p className="text-muted-foreground">{t("error.body")}</p>
      {home ? (
        <div className="flex flex-wrap gap-3">
          {retryButton}
          <a href={home} className={buttonVariants({ variant: "outline" })}>
            {t("error.home")}
          </a>
        </div>
      ) : (
        retryButton
      )}
    </main>
  );
}
