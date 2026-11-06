"use client";

import { Geist } from "next/font/google";
import { usePathname } from "next/navigation";
import { useTranslation } from "react-i18next";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { I18nProvider } from "@/src/i18n/client";
import { stripLocalePrefix, withLocale } from "@/src/i18n/locale-path";
import "./globals.css";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist" });

/**
 * Replaces the root layout when it fails: its own <html> and <body>, and nothing that reads the
 * session or the database, so it still shows when they are down. The language comes from the URL.
 */
export default function GlobalError({ retry }: { error: unknown; retry: () => void }) {
  const { locale } = stripLocalePrefix(usePathname() ?? "/");
  return (
    <html lang={locale} className={cn("overflow-x-clip font-sans", geist.variable)}>
      <body className="overflow-x-clip">
        <I18nProvider locale={locale}>
          <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-4 py-6">
            <GlobalErrorContent home={withLocale(locale, "/")} retry={retry} />
          </div>
        </I18nProvider>
      </body>
    </html>
  );
}

function GlobalErrorContent({ home, retry }: { home: string; retry: () => void }) {
  const { t } = useTranslation("common");
  return (
    <main className="flex flex-col items-start gap-3">
      <h1 className="text-2xl font-bold tracking-tight">{t("error.title")}</h1>
      <p className="text-muted-foreground">{t("error.body")}</p>
      <div className="flex flex-wrap gap-3">
        <Button type="button" onClick={() => retry()}>
          {t("error.retry")}
        </Button>
        <a href={home} className={buttonVariants({ variant: "outline" })}>
          {t("error.home")}
        </a>
      </div>
    </main>
  );
}
