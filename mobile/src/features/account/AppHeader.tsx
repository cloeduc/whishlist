import { router } from "expo-router";
import { UserRoundIcon } from "lucide-react-native";
import { View } from "react-native";
import { useTranslation } from "react-i18next";

import { tokens } from "@/theme/tokens";
import { BrandHeader } from "@/ui/BrandHeader";
import { Button } from "@/ui/Button";

/**
 * Top bar of the main screen: the site header (gift + product name) and, on the right,
 * a square button styled like the site buttons that opens « Mon compte ».
 */
export function AppHeader() {
  const { t } = useTranslation("common");
  return (
    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: tokens.space[3] }}>
      <View style={{ flexShrink: 1 }}>
        <BrandHeader />
      </View>
      <Button
        size="icon"
        variant="neutral"
        accessibilityLabel={t("nav.account")}
        icon={<UserRoundIcon size={20} color={tokens.colors.black} />}
        onPress={() => router.push("/account")}
        testID="open-account"
      />
    </View>
  );
}
