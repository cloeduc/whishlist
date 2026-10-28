import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";

import { api, ok } from "@/api/client";
import { signOut, updateMe, useSession } from "@/auth/session";
import { usePendingCount } from "@/data/store";
import { PasswordForm } from "@/features/account/PasswordForm";
import { useServerAction } from "@/features/errors";
import { useOnline } from "@/network";
import { tokens } from "@/theme/tokens";
import { Alert } from "@/ui/Alert";
import { BackLink } from "@/ui/BackLink";
import { Button } from "@/ui/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/ui/Card";
import { ConfirmDialog } from "@/ui/ConfirmDialog";
import { Field } from "@/ui/Field";
import { Input } from "@/ui/Input";
import { NetworkNote } from "@/ui/NetworkNote";
import { PageTitle } from "@/ui/PageTitle";
import { Screen } from "@/ui/Screen";

/**
 * Mon compte, d'après `11-compte.png`, ouvert par le bouton du haut de « Mes listes » :
 * nom affiché, mot de passe, déconnexion (FR-003, FR-007).
 * Hors ligne, seul le nom se lit.
 */
export default function Account() {
  const { t } = useTranslation(["auth", "common", "mobile"]);
  const session = useSession();
  const online = useOnline();
  const pendingCount = usePendingCount();
  const user = session.status === "signedIn" ? session.user : null;
  const [displayName, setDisplayName] = useState(user?.displayName ?? "");
  const [nameSaved, setNameSaved] = useState(false);
  const [confirmLogout, setConfirmLogout] = useState(false);

  const saveName = useServerAction(
    useCallback(async () => {
      setNameSaved(false);
      await updateMe(await ok(api.PATCH("/me", { body: { displayName: displayName.trim() } })));
      setNameSaved(true);
    }, [displayName]),
  );

  function logout() {
    // Des changements jamais envoyés seraient perdus : on demande d'abord (FR-029c).
    if (pendingCount > 0) setConfirmLogout(true);
    else void signOut();
  }

  return (
    <Screen>
      <BackLink />
      <PageTitle title={t("auth:account.title")} />
      <Card>
        <CardHeader>
          <CardTitle>{t("auth:account.profile")}</CardTitle>
          <CardDescription>{t("auth:account.profileHint")}</CardDescription>
        </CardHeader>
        <CardContent>
          <Field label={t("auth:account.displayName")}>
            <Input
              accessibilityLabel={t("auth:account.displayName")}
              value={displayName}
              onChangeText={setDisplayName}
              editable={online}
              autoComplete="name"
            />
          </Field>
          <Field label={t("auth:account.email")} description={t("auth:account.emailHint")}>
            <Input accessibilityLabel={t("auth:account.email")} value={user?.email ?? ""} editable={false} muted />
          </Field>
          {saveName.error ? <Alert variant="destructive">{saveName.error}</Alert> : null}
          {nameSaved ? <Alert>{t("auth:account.nameSaved")}</Alert> : null}
          <Button title={t("auth:account.saveName")} fullWidth disabled={!online || saveName.busy} onPress={() => void saveName.run()} />
          <NetworkNote />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>{t("auth:changePassword.title")}</CardTitle>
          <CardDescription>{t("auth:changePassword.description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <PasswordForm />
        </CardContent>
      </Card>
      <Button title={t("common:nav.logout")} variant="neutral" fullWidth onPress={logout} style={{ marginBottom: tokens.space[2] }} />
      <ConfirmDialog
        visible={confirmLogout}
        title={t("mobile:offline.logoutTitle")}
        body={t("mobile:offline.logoutWarning", { count: pendingCount })}
        confirmLabel={t("mobile:offline.logoutConfirm")}
        keepLabel={t("mobile:offline.logoutKeep")}
        onConfirm={() => {
          setConfirmLogout(false);
          void signOut();
        }}
        onKeep={() => setConfirmLogout(false)}
      />
    </Screen>
  );
}
