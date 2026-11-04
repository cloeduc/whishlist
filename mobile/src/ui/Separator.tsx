import { View } from "react-native";

import { tokens } from "@/theme/tokens";

/** `components/ui/separator.tsx`: horizontal line of 2, border color. Decorative. */
export function Separator() {
  return (
    <View
      style={{ height: tokens.borderWidth, alignSelf: "stretch", backgroundColor: tokens.colors.black }}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    />
  );
}
