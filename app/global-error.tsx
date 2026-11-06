"use client";

import { usePathname } from "next/navigation";
import { ErrorContent } from "@/components/site/error-content";
import { RootShell } from "@/components/site/root-shell";
import { stripLocalePrefix, withLocale } from "@/src/i18n/locale-path";
import "./globals.css";

/**
 * Replaces the root layout when it fails: its own <html> and <body> (the shared `RootShell`), and
 * nothing that reads the session or the database, so it still shows when they are down. The
 * language comes from the URL.
 */
export default function GlobalError({ retry }: { error: unknown; retry: () => void }) {
  const { locale } = stripLocalePrefix(usePathname() ?? "/");
  return (
    <RootShell locale={locale}>
      <ErrorContent home={withLocale(locale, "/")} retry={retry} />
    </RootShell>
  );
}
