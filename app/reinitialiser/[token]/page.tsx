import Link from "next/link";
import { notFound } from "next/navigation";
import { findValidPasswordReset } from "../../../src/domain/password-reset";
import { resetPasswordAction } from "../../../src/server/actions";
import { getDocument } from "../../../src/store/db";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { getTranslations } from "@/src/i18n/server";

export const dynamic = "force-dynamic";

export default async function ReinitialiserPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ e?: string }>;
}) {
  const { token } = await params;
  const query = await searchParams;
  const [t, doc] = await Promise.all([getTranslations("auth"), getDocument()]);
  if (!findValidPasswordReset(doc, token)) notFound();

  return (
    <main className="mx-auto flex w-full max-w-md flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle>{t("reset.title")}</CardTitle>
          <CardDescription>{t("reset.description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={resetPasswordAction}>
            <FieldGroup>
              <input type="hidden" name="token" value={token} />
              {query.e ? (
                <Alert variant="destructive">
                  <AlertDescription>{t("reset.errorGeneric")}</AlertDescription>
                </Alert>
              ) : null}
              <Field>
                <FieldLabel htmlFor="password">{t("reset.password")}</FieldLabel>
                <Input id="password" name="password" type="password" required autoComplete="new-password" />
              </Field>
              <Button type="submit">{t("reset.submit")}</Button>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
      <Button variant="link" nativeButton={false} render={<Link href="/mot-de-passe-oublie" />}>
        {t("reset.newLink")}
      </Button>
    </main>
  );
}
