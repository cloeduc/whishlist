import type { Metadata } from "next";
import { Geist } from "next/font/google";
import Link from "next/link";
import { currentUser } from "../src/auth/current";
import { logoutAction } from "../src/server/actions";
import { LocaleSwitcher } from "@/components/site/locale-switcher";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { I18nProvider } from "@/src/i18n/client";
import { getLocale, getTranslations } from "@/src/i18n/server";
import "./globals.css";

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" });

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("common");
  return {
    title: t("meta.title"),
    description: t("meta.description"),
  };
}

export const dynamic = "force-dynamic";

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [user, locale, t] = await Promise.all([currentUser(), getLocale(), getTranslations("common")]);
  return (
    <html lang={locale} className={cn("overflow-x-clip font-sans", geist.variable)}>
      <body className="overflow-x-clip">
        <I18nProvider locale={locale}>
          <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-4 py-6">
            <header className="flex flex-wrap items-center justify-between gap-3">
              <Link href="/" className="text-lg font-medium tracking-tight text-foreground">
                {t("brand")}
              </Link>
              <nav className="flex flex-wrap items-center gap-2">
                <LocaleSwitcher locale={locale} />
                {user ? (
                  <>
                    <span className="px-1 text-sm text-muted-foreground">{user.displayName}</span>
                    {!user.mustChangePassword ? (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          nativeButton={false}
                          render={<Link href="/changer-mot-de-passe" />}
                        >
                          {t("nav.password")}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          nativeButton={false}
                          render={<Link href="/listes/new" />}
                        >
                          {t("nav.newList")}
                        </Button>
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
                    <Button variant="ghost" size="sm" nativeButton={false} render={<Link href="/connexion" />}>
                      {t("nav.login")}
                    </Button>
                    <Button size="sm" nativeButton={false} render={<Link href="/inscription" />}>
                      {t("nav.register")}
                    </Button>
                  </>
                )}
              </nav>
            </header>
            {children}
          </div>
        </I18nProvider>
      </body>
    </html>
  );
}
