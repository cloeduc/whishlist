import type { Metadata } from "next";
import { origin } from "../../src/auth/current";
import { DevLinkAlert } from "@/components/site/dev-link-alert";
import { ForgotPasswordForm } from "@/components/site/forgot-password-form";
import { LinkButton } from "@/components/site/link-button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getTranslations } from "@/src/i18n/server";
import { publicPageMetadata } from "@/src/site/seo";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("auth");
  return await publicPageMetadata({
    title: t("forgot.metaTitle"),
    description: t("forgot.metaDescription"),
    path: "/mot-de-passe-oublie",
  });
}

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; lien?: string; sansmail?: string }>;
}) {
  const query = await searchParams;
  const [t, siteOrigin] = await Promise.all([getTranslations("auth"), origin()]);
  const done = query.ok === "1";
  const lien = query.lien && query.lien.startsWith("http") ? query.lien : null;

  return (
    <main className="mx-auto flex w-full max-w-md flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle as="h1">{t("forgot.title")}</CardTitle>
          <CardDescription>{t("forgot.description")}</CardDescription>
        </CardHeader>
        <CardContent>
          {done ? (
            <div className="flex flex-col gap-3">
              <Alert>
                <AlertDescription>{t("forgot.sent")}</AlertDescription>
              </Alert>
              {query.sansmail === "1" && !lien ? (
                <p className="text-sm text-muted-foreground">{t("forgot.noMail")}</p>
              ) : null}
              <DevLinkAlert label={t("forgot.devLink")} url={lien} origin={siteOrigin} page="/reinitialiser/" />
              <LinkButton href="/connexion" variant="outline">
                {t("forgot.back")}
              </LinkButton>
            </div>
          ) : (
            <ForgotPasswordForm />
          )}
        </CardContent>
      </Card>
      {!done ? (
        <LinkButton href="/connexion" variant="link">
          {t("forgot.back")}
        </LinkButton>
      ) : null}
    </main>
  );
}
