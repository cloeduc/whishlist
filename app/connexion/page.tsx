import type { Metadata } from "next";
import { loginAction } from "../../src/server/actions";
import { LinkButton } from "@/components/site/link-button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { getTranslations } from "@/src/i18n/server";
import { publicPageMetadata } from "@/src/site/seo";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("auth");
  return await publicPageMetadata({
    title: t("login.metaTitle"),
    description: t("login.metaDescription"),
    path: "/connexion",
  });
}

export default async function ConnexionPage({
  searchParams,
}: {
  searchParams: Promise<{ e?: string; next?: string; deleted?: string }>;
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
          <form action={loginAction}>
            <FieldGroup>
              <input type="hidden" name="next" value={next} />
              {query.deleted === "1" ? (
                <Alert>
                  <AlertDescription>{t("account.deleted")}</AlertDescription>
                </Alert>
              ) : null}
              {query.e ? (
                <Alert variant="destructive">
                  <AlertDescription>
                    {query.e === "rate" ? t("login.rateLimited") : t("login.badCredentials")}
                  </AlertDescription>
                </Alert>
              ) : null}
              <Field>
                <FieldLabel htmlFor="email">{t("login.email")}</FieldLabel>
                <Input id="email" name="email" type="email" required autoComplete="email" />
              </Field>
              <Field>
                <FieldLabel htmlFor="password">{t("login.password")}</FieldLabel>
                <Input id="password" name="password" type="password" required autoComplete="current-password" />
              </Field>
              <Button type="submit">{t("login.submit")}</Button>
              <LinkButton href="/mot-de-passe-oublie" variant="link" className="h-auto justify-start px-0">
                {t("login.forgot")}
              </LinkButton>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
      <LinkButton href={`/inscription?next=${encodeURIComponent(next)}`} variant="link">
        {t("login.createAccount")}
      </LinkButton>
    </main>
  );
}
