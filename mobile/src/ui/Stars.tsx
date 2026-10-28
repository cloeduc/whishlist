import { StarIcon } from "lucide-react-native";
import { Pressable, View } from "react-native";
import { useTranslation } from "react-i18next";

import { parsePriority, PRIORITY_MAX } from "../../../src/domain/priority";
import { useTheme } from "@/theme/ListTheme";
import { tokens } from "@/theme/tokens";

/** Niveau d'envie en lecture, comme `components/site/priority-stars.tsx`. */
export function Stars({ value }: { value: string | null | undefined }) {
  const { t } = useTranslation("public");
  const palette = useTheme();
  const count = parsePriority(value);
  if (!count) return null;
  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel={t("wishLevel", { rating: count, max: PRIORITY_MAX })}
      style={{ flexDirection: "row", gap: 2 }}
    >
      {Array.from({ length: count }, (_, i) => (
        <StarIcon key={i} size={14} color={tokens.colors.black} fill={palette.highlight} strokeWidth={1.75} />
      ))}
    </View>
  );
}

/** Saisie du niveau d'envie, comme `components/site/priority-star-picker.tsx` : un 2e appui efface. */
export function StarPicker({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const { t } = useTranslation("list");
  const palette = useTheme();
  const selected = parsePriority(value) ?? 0;
  return (
    <View accessibilityRole="radiogroup" accessibilityLabel={t("form.priority")} style={{ flexDirection: "row", gap: 2 }}>
      {Array.from({ length: PRIORITY_MAX }, (_, i) => {
        const n = i + 1;
        const filled = n <= selected;
        return (
          <Pressable
            key={n}
            accessibilityRole="radio"
            accessibilityState={{ checked: selected === n }}
            accessibilityLabel={t("form.priorityStar", { count: n, max: PRIORITY_MAX })}
            onPress={() => onChange(selected === n ? "" : String(n))}
            style={{ width: tokens.touchTarget, height: tokens.touchTarget, alignItems: "center", justifyContent: "center" }}
          >
            <StarIcon
              size={22}
              color={filled ? tokens.colors.black : tokens.colors.mutedForeground}
              fill={filled ? palette.highlight : "none"}
              strokeWidth={filled ? 1.75 : 1.5}
            />
          </Pressable>
        );
      })}
    </View>
  );
}
