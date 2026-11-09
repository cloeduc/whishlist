import type { Metadata } from "next";
import { LinkButton } from "@/components/site/link-button";
import { LoginForm } from "@/components/site/login-form";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getTranslations } from "@/src/i18n/server";
import { publicPageMetadata } from "@/src/site/seo";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("auth");
  return await publicPageMetadata({
    title: t("login.metaTitle"),
    description: t("login.metaDescription"),
    path: "/login",
  });
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; deleted?: string }>;
}) {
  const query = await searchParams;
  const t = await getTranslations("auth");
  const next = query.next && query.next.startsWith("/") ? query.next : "/";
  return (
    <main className="mx-auto flex w-full max-w-md flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle as="h1">{t("login.title")}</CardTitle>
          <CardDescription>{t("login.description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <LoginForm
            next={next}
            notice={
              query.deleted === "1" ? (
                <Alert>
                  <AlertDescription>{t("account.deleted")}</AlertDescription>
                </Alert>
              ) : null
            }
            footer={
              <LinkButton href="/forgot-password" variant="link" className="h-auto justify-start px-0">
                {t("login.forgot")}
              </LinkButton>
            }
          />
        </CardContent>
      </Card>
      <LinkButton href={`/register?next=${encodeURIComponent(next)}`} variant="link">
        {t("login.createAccount")}
      </LinkButton>
    </main>
  );
}
