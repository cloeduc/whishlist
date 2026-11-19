import type { Metadata } from "next";
import { origin } from "../../src/auth/current";
import { DevLinkAlert } from "@/components/site/dev-link-alert";
import { LinkButton } from "@/components/site/link-button";
import { RegisterForm } from "@/components/site/register-form";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getTranslations } from "@/src/i18n/server";
import { emailVerificationRequired } from "@/src/server/mail";
import { publicPageMetadata } from "@/src/site/seo";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("auth");
  return await publicPageMetadata({
    title: t("register.metaTitle"),
    description: t("register.metaDescription"),
    path: "/register",
  });
}

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; ok?: string; link?: string; mail?: string }>;
}) {
  const query = await searchParams;
  const [t, siteOrigin] = await Promise.all([getTranslations("auth"), origin()]);
  const next = query.next && query.next.startsWith("/") ? query.next : "/";
  const sent = query.ok === "1";
  return (
    <main className="mx-auto flex w-full max-w-md flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle as="h1">{t("register.title")}</CardTitle>
          <CardDescription>{t("register.description")}</CardDescription>
        </CardHeader>
        <CardContent>
          {sent ? (
            <div className="flex flex-col gap-4">
              <Alert>
                <AlertDescription>
                  {query.mail === "failed"
                    ? t("register.sendFailed")
                    : emailVerificationRequired()
                      ? t("register.sentVerify")
                      : t("register.sent")}
                </AlertDescription>
              </Alert>
              <DevLinkAlert label={t("register.devLink")} url={query.link} origin={siteOrigin} page="/confirm-email/" />
              <LinkButton href={next}>{t("register.sentContinue")}</LinkButton>
            </div>
          ) : (
            <RegisterForm next={next} />
          )}
        </CardContent>
      </Card>
      <LinkButton href={`/login?next=${encodeURIComponent(next)}`} variant="link">
        {t("register.hasAccount")}
      </LinkButton>
    </main>
  );
}
