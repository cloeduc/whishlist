"use client";

import Link from "next/link";
import { SupportLabel } from "@/components/site/support-label";
import type { Locale } from "@/src/i18n/config";
import { withLocale } from "@/src/i18n/locale-path";

const GITHUB = "https://github.com/cloeduc/whishlist";

/** Footer global — masqué sur la homepage. */
export function SiteFooter({
  infoLabel,
  tagline,
  github,
  support,
  supportUrl,
  project,
  faq,
  guide,
  legal,
  locale,
}: {
  infoLabel: string;
  tagline: string;
  github: string;
  support: string;
  supportUrl: string | null;
  project: string;
  faq: string;
  guide: string;
  legal: string;
  locale: Locale;
}) {
  return (
    <footer className="border-t-2 border-border pt-4 text-sm text-muted-foreground">
      <nav className="flex flex-wrap gap-x-4 gap-y-2" aria-label={infoLabel}>
        <Link href={withLocale(locale, "/projet")} className="font-medium text-foreground underline-offset-4 hover:underline">
          {project}
        </Link>
        <Link href={withLocale(locale, "/faq")} className="font-medium text-foreground underline-offset-4 hover:underline">
          {faq}
        </Link>
        <Link href={withLocale(locale, "/guide")} className="font-medium text-foreground underline-offset-4 hover:underline">
          {guide}
        </Link>
        <Link
          href={withLocale(locale, "/mentions-legales")}
          className="font-medium text-foreground underline-offset-4 hover:underline"
        >
          {legal}
        </Link>
      </nav>
      <p className="mt-4 text-pretty">{tagline}</p>
      <p className="mt-2 flex flex-wrap items-baseline gap-x-2 gap-y-1">
        <a
          href={GITHUB}
          target="_blank"
          rel="noreferrer"
          className="font-medium text-foreground underline underline-offset-4 hover:no-underline"
        >
          {github}
        </a>
        {supportUrl ? (
          <>
            <span aria-hidden>·</span>
            <a
              href={supportUrl}
              target="_blank"
              rel="noreferrer"
              className="font-medium text-foreground underline underline-offset-4 hover:no-underline"
            >
              <SupportLabel>{support}</SupportLabel>
            </a>
          </>
        ) : null}
      </p>
    </footer>
  );
}
