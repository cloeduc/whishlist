import { View } from "react-native";
import { useTranslation } from "react-i18next";

import { tokens } from "@/theme/tokens";

import { GiftMark } from "./GiftMark";
import { Text } from "./Text";

/** En-tête du site : cadeau encadré + nom du produit en gras. */
export function BrandHeader() {
  const { t } = useTranslation("common");
  return (
    <View accessibilityRole="header" style={{ flexDirection: "row", alignItems: "center", gap: tokens.space[3] }}>
      <GiftMark size={32} />
      <Text size="lg" weight="heading">
        {t("brand")}
      </Text>
    </View>
  );
}
