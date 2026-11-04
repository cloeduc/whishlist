import { Redirect } from "expo-router";
import { useTranslation } from "react-i18next";

import { signOut, useSession } from "@/auth/session";
import { afterSignIn } from "@/links/pending";
import { AuthLayout } from "@/features/account/AuthLayout";
import { PasswordForm } from "@/features/account/PasswordForm";
import { Button } from "@/ui/Button";

/** Forced password change: the only reachable screen until it is done (FR-005). */
export default function ChangePassword() {
  const { t } = useTranslation(["auth", "common"]);
  const session = useSession();
  if (session.status === "signedOut") return <Redirect href="/login" />;
  if (session.status !== "mustChangePassword") return <Redirect href={afterSignIn()} />;
  return (
    <AuthLayout
      title={t("auth:changePassword.titleForced")}
      description={t("auth:changePassword.descriptionForced", { email: session.user.email })}
      below={<Button title={t("common:nav.logout")} variant="link" onPress={() => void signOut()} />}
    >
      <PasswordForm forced />
    </AuthLayout>
  );
}
