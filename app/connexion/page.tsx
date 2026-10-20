import Link from "next/link";
import { loginAction } from "../../src/server/actions";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { getTranslations } from "@/src/i18n/server";

export const dynamic = "force-dynamic";

export default async function ConnexionPage({
  searchParams,
}: {
  searchParams: Promise<{ e?: string; next?: string }>;
}) {
  const query = await searchParams;
  const t = await getTranslations("auth");
  const next = query.next && query.next.startsWith("/") ? query.next : "/";
  return (
    <main className="mx-auto flex w-full max-w-md flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle>{t("login.title")}</CardTitle>
          <CardDescription>{t("login.description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={loginAction}>
            <FieldGroup>
              <input type="hidden" name="next" value={next} />
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
              <Button
                variant="link"
                className="h-auto justify-start px-0"
                nativeButton={false}
                render={<Link href="/mot-de-passe-oublie" />}
              >
                {t("login.forgot")}
              </Button>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
      <Button variant="link" nativeButton={false} render={<Link href={`/inscription?next=${encodeURIComponent(next)}`} />}>
        {t("login.createAccount")}
      </Button>
    </main>
  );
}
