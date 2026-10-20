import { requireUser } from "../../src/auth/guard";
import { changePasswordAction } from "../../src/server/actions";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { getTranslations } from "@/src/i18n/server";

export const dynamic = "force-dynamic";

export default async function ChangerMotDePassePage({
  searchParams,
}: {
  searchParams: Promise<{ e?: string; ok?: string }>;
}) {
  const user = await requireUser({ allowMustChangePassword: true });
  const query = await searchParams;
  const t = await getTranslations("auth");
  const forced = user.mustChangePassword;
  const error =
    query.e === "mismatch"
      ? t("changePassword.errorMismatch")
      : query.e === "current"
        ? t("changePassword.errorCurrent")
        : query.e
          ? t("changePassword.errorGeneric")
          : null;

  return (
    <main className="mx-auto flex w-full max-w-md flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle>{forced ? t("changePassword.titleForced") : t("changePassword.title")}</CardTitle>
          <CardDescription>
            {forced
              ? t("changePassword.descriptionForced", { email: user.email })
              : t("changePassword.description", { email: user.email })}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={changePasswordAction}>
            <FieldGroup>
              {query.ok === "1" ? (
                <Alert>
                  <AlertDescription>{t("changePassword.success")}</AlertDescription>
                </Alert>
              ) : null}
              {error ? (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              ) : null}
              {!forced ? (
                <Field>
                  <FieldLabel htmlFor="currentPassword">{t("changePassword.current")}</FieldLabel>
                  <Input
                    id="currentPassword"
                    name="currentPassword"
                    type="password"
                    required
                    autoComplete="current-password"
                  />
                </Field>
              ) : null}
              <Field>
                <FieldLabel htmlFor="password">{t("changePassword.next")}</FieldLabel>
                <Input id="password" name="password" type="password" required autoComplete="new-password" />
              </Field>
              <Field>
                <FieldLabel htmlFor="confirm">{t("changePassword.confirm")}</FieldLabel>
                <Input id="confirm" name="confirm" type="password" required autoComplete="new-password" />
              </Field>
              <Button type="submit">
                {forced ? t("changePassword.submitForced") : t("changePassword.submit")}
              </Button>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
