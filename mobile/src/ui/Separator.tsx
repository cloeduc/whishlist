import { View } from "react-native";

import { tokens } from "@/theme/tokens";

/** `components/ui/separator.tsx` : trait horizontal de 2, couleur de bordure. Décoratif. */
export function Separator() {
  return (
    <View
      style={{ height: tokens.borderWidth, alignSelf: "stretch", backgroundColor: tokens.colors.black }}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    />
  );
}
