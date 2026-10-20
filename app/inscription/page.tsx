import Link from "next/link";
import { registerAction } from "../../src/server/actions";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { MIN_PASSWORD_LENGTH } from "@/src/domain/passwords";
import { getTranslations } from "@/src/i18n/server";

export const dynamic = "force-dynamic";

export default async function InscriptionPage({
  searchParams,
}: {
  searchParams: Promise<{ e?: string; next?: string }>;
}) {
  const query = await searchParams;
  const t = await getTranslations("auth");
  const next = query.next && query.next.startsWith("/") ? query.next : "/";
  const error =
    query.e === "email"
      ? t("register.errorEmail")
      : query.e === "password"
        ? t("register.errorPassword")
        : query.e === "rate"
          ? t("register.rateLimited")
          : query.e === "fields"
            ? t("register.errorFields")
            : null;
  return (
    <main className="mx-auto flex w-full max-w-md flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle>{t("register.title")}</CardTitle>
          <CardDescription>{t("register.description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={registerAction}>
            <FieldGroup>
              <input type="hidden" name="next" value={next} />
              {error ? (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              ) : null}
              <Field>
                <FieldLabel htmlFor="displayName">{t("register.name")}</FieldLabel>
                <Input id="displayName" name="displayName" required autoComplete="nickname" />
                <FieldDescription>{t("register.nameHint")}</FieldDescription>
              </Field>
              <Field>
                <FieldLabel htmlFor="email">{t("register.email")}</FieldLabel>
                <Input id="email" name="email" type="email" required autoComplete="email" />
              </Field>
              <Field>
                <FieldLabel htmlFor="password">{t("register.password")}</FieldLabel>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  required
                  minLength={MIN_PASSWORD_LENGTH}
                  autoComplete="new-password"
                />
                <FieldDescription>{t("register.passwordHint")}</FieldDescription>
              </Field>
              <Button type="submit">{t("register.submit")}</Button>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
      <Button variant="link" nativeButton={false} render={<Link href={`/connexion?next=${encodeURIComponent(next)}`} />}>
        {t("register.hasAccount")}
      </Button>
    </main>
  );
}
