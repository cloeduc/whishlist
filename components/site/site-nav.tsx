"use client";

import Link from "next/link";
import { Heart } from "lucide-react";
import { usePathname } from "next/navigation";
import { Suspense } from "react";
import { useTranslation } from "react-i18next";
import { LocaleSwitcher } from "@/components/site/locale-switcher";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { logoutAction } from "@/src/server/actions";
import type { Locale } from "@/src/i18n/config";

function isActive(pathname: string, href: string): boolean {
  if (href === "/") {
    return pathname === "/" || pathname.startsWith("/listes");
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function SiteNav({
  locale,
  user,
  supportUrl,
}: {
  locale: Locale;
  user: { mustChangePassword: boolean } | null;
  supportUrl: string | null;
}) {
  const { t } = useTranslation("common");
  const pathname = usePathname() ?? "/";

  function navLink(href: string, label: string) {
    const active = isActive(pathname, href);
    return (
      <Link
        href={href}
        prefetch
        aria-current={active ? "page" : undefined}
        className={cn(buttonVariants({ variant: active ? "default" : "ghost", size: "sm" }))}
      >
        {label}
      </Link>
    );
  }

  return (
    <nav className="ml-auto flex flex-wrap items-center gap-2" aria-label={t("nav.menuAria")}>
      {user ? (
        <>
          {!user.mustChangePassword ? (
            <>
              {navLink("/", t("nav.myLists"))}
              {navLink("/compte", t("nav.account"))}
            </>
          ) : null}
          <form action={logoutAction}>
            <Button type="submit" variant="ghost" size="sm">
              {t("nav.logout")}
            </Button>
          </form>
        </>
      ) : (
        <>
          {navLink("/connexion", t("nav.login"))}
          {navLink("/inscription", t("nav.register"))}
        </>
      )}
      <Suspense fallback={null}>
        <LocaleSwitcher locale={locale} />
      </Suspense>
      {supportUrl ? (
        <a
          href={supportUrl}
          target="_blank"
          rel="noreferrer"
          aria-label={t("footer.support")}
          title={t("footer.support")}
          className={cn(buttonVariants({ variant: "ghost", size: "icon-sm" }))}
        >
          <Heart
            className="size-5 fill-destructive text-foreground"
            strokeWidth={3.5}
            aria-hidden
          />
        </a>
      ) : null}
    </nav>
  );
}
