"use client";

import { usePathname } from "next/navigation";

const GITHUB = "https://github.com/cloeduc/whishlist";

/** Footer global — masqué sur la homepage. */
export function SiteFooter({
  selfHost,
  github,
  support,
  supportUrl,
}: {
  selfHost: string;
  github: string;
  support: string;
  supportUrl: string | null;
}) {
  const pathname = usePathname();
  if (pathname === "/") return null;

  return (
    <footer className="border-t-2 border-border pt-4 text-sm text-muted-foreground">
      <p className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <span>
          {selfHost}{" "}
          <a
            href={GITHUB}
            target="_blank"
            rel="noreferrer"
            className="font-medium text-foreground underline underline-offset-4 hover:no-underline"
          >
            {github}
          </a>
        </span>
        {supportUrl ? (
          <a
            href={supportUrl}
            target="_blank"
            rel="noreferrer"
            className="font-medium text-foreground underline underline-offset-4 hover:no-underline"
          >
            {support}
          </a>
        ) : null}
      </p>
    </footer>
  );
}
