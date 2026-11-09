import type { Metadata } from "next";
import { origin } from "../../src/auth/current";
import { DevLinkAlert } from "@/components/site/dev-link-alert";
import { ForgotPasswordForm } from "@/components/site/forgot-password-form";
import { LinkButton } from "@/components/site/link-button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getTranslations } from "@/src/i18n/server";
import { publicPageMetadata } from "@/src/site/seo";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("auth");
  return await publicPageMetadata({
    title: t("forgot.metaTitle"),
    description: t("forgot.metaDescription"),
    path: "/forgot-password",
  });
}

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; link?: string; nomail?: string }>;
}) {
  const query = await searchParams;
  const [t, siteOrigin] = await Promise.all([getTranslations("auth"), origin()]);
  const done = query.ok === "1";
  const link = query.link && query.link.startsWith("http") ? query.link : null;

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
              {query.nomail === "1" && !link ? (
                <p className="text-sm text-muted-foreground">{t("forgot.noMail")}</p>
              ) : null}
              <DevLinkAlert label={t("forgot.devLink")} url={link} origin={siteOrigin} page="/reset-password/" />
              <LinkButton href="/login" variant="outline">
                {t("forgot.back")}
              </LinkButton>
            </div>
          ) : (
            <ForgotPasswordForm />
          )}
        </CardContent>
      </Card>
      {!done ? (
        <LinkButton href="/login" variant="link">
          {t("forgot.back")}
        </LinkButton>
      ) : null}
    </main>
  );
}
