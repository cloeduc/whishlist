import { router } from "expo-router";
import { View } from "react-native";
import { useTranslation } from "react-i18next";

import { tokens } from "@/theme/tokens";
import { Button } from "@/ui/Button";

import { AuthLayout } from "./AuthLayout";

/**
 * A link screen opened without a session (invitation, a list's management address): « Créer un compte »
 * and « Se connecter ». The screen keeps its link for after sign-in (`useResumableLink`).
 */
export function SignInChoices({
  title,
  description,
  screenTestID,
  registerTestID,
  loginTestID,
}: {
  title: string;
  description?: string;
  screenTestID: string;
  registerTestID: string;
  loginTestID: string;
}) {
  const { t } = useTranslation("public");
  return (
    <AuthLayout title={title} description={description} testID={screenTestID}>
      <View style={{ gap: tokens.space[2] }}>
        <Button testID={registerTestID} title={t("invite.register")} fullWidth onPress={() => router.push("/register")} />
        <Button testID={loginTestID} title={t("invite.login")} variant="neutral" fullWidth onPress={() => router.push("/login")} />
      </View>
    </AuthLayout>
  );
}
