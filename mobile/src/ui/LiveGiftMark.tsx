import { useEffect, useState } from "react";
import { AccessibilityInfo, Animated, Easing, View } from "react-native";
import { useTranslation } from "react-i18next";

import { useTheme } from "@/theme/ListTheme";

import { GiftMark } from "./GiftMark";

/**
 * Indicateur de chargement : le cadeau du site qui se balance doucement, plutôt qu'un spinner
 * (design-reference.md, « Chargement »). Immobile si le téléphone demande moins d'animations.
 */
export function LiveGiftMark({ size = 72 }: { size?: number }) {
  const { t } = useTranslation("mobile");
  const palette = useTheme();
  const [swing] = useState(() => new Animated.Value(0));

  useEffect(() => {
    let loop: Animated.CompositeAnimation | null = null;
    void AccessibilityInfo.isReduceMotionEnabled().then((reduced) => {
      if (reduced) return;
      loop = Animated.loop(
        Animated.sequence([
          Animated.timing(swing, { toValue: 1, duration: 450, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
          Animated.timing(swing, { toValue: -1, duration: 900, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
          Animated.timing(swing, { toValue: 0, duration: 450, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        ]),
      );
      loop.start();
    });
    return () => loop?.stop();
  }, [swing]);

  const rotate = swing.interpolate({ inputRange: [-1, 1], outputRange: ["-6deg", "6deg"] });
  return (
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={t("loading")}
      style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: palette.background }}
    >
      <Animated.View style={{ transform: [{ rotate }] }}>
        <GiftMark size={size} />
      </Animated.View>
    </View>
  );
}
