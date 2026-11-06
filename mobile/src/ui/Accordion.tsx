import { createContext, useContext, useState, type ReactNode } from "react";
import { ChevronDownIcon } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { Animated, Easing, Keyboard, Pressable, View, type StyleProp, type ViewStyle } from "react-native";

import { useReduceMotion } from "@/theme/motion";
import { tokens } from "@/theme/tokens";

/**
 * Mechanics of `components/ui/accordion.tsx`: open state, animated value (0 collapsed, 1 expanded),
 * 200 ms, no animation if the device asks to reduce them. Collapsing dismisses the keyboard.
 * `shown`: the content is on screen (expanded, or collapsing); it becomes `false`
 * once the collapse is done, to mount heavy content only when it is used (see `AccordionContent`).
 * The header: `AccordionTrigger`.
 */
export function useAccordion(defaultExpanded = false) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const [shown, setShown] = useState(defaultExpanded);
  const [progress] = useState(() => new Animated.Value(defaultExpanded ? 1 : 0));
  const reduceMotion = useReduceMotion();

  function toggle() {
    const next = !expanded;
    if (!next) Keyboard.dismiss();
    setExpanded(next);
    if (next) setShown(true);
    const toValue = next ? 1 : 0;
    if (reduceMotion) {
      progress.setValue(toValue);
      if (!next) setShown(false);
      return;
    }
    Animated.timing(progress, { toValue, duration: 200, easing: Easing.out(Easing.quad), useNativeDriver: false }).start(
      // A collapse interrupted by a new press (`finished: false`) keeps the content.
      ({ finished }) => {
        if (finished && !next) setShown(false);
      },
    );
  }

  return { expanded, shown, toggle, progress };
}

/**
 * Pressable header: a button that announces its state (expanded or not) and what pressing does.
 * Its layout (title, counter, chevron) is up to the caller.
 */
export function AccordionTrigger({
  expanded,
  onPress,
  label,
  style,
  testID,
  children,
}: {
  expanded: boolean;
  onPress: () => void;
  /** Name read by screen readers, when the header content is not enough. */
  label?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
  children: ReactNode;
}) {
  const { t } = useTranslation("mobile");
  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ expanded }}
      accessibilityLabel={label}
      accessibilityHint={expanded ? t("collapsible.collapse") : t("collapsible.expand")}
      style={style}
    >
      {children}
    </Pressable>
  );
}

/** Down chevron that turns up when the content is expanded. */
export function AccordionChevron({
  progress,
  color = tokens.colors.mutedForeground,
  testID,
}: {
  progress: Animated.Value;
  color?: string;
  testID?: string;
}) {
  const rotate = progress.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "180deg"] });
  return (
    <Animated.View testID={testID} style={{ transform: [{ rotate }] }}>
      <ChevronDownIcon size={16} color={color} />
    </Animated.View>
  );
}

/**
 * Collapsible content, hidden from screen readers and presses when collapsed. Mounted by default
 * (form input survives a collapse); `mounted={shown}` mounts it only when expanded (a
 * list of ideas, a license text). Its natural height is measured (`<testID>-measure`) outside
 * the animated height, and followed when it changes (an alert that appears, an idea added).
 */
/** `false` inside the content of a collapsed accordion, which stays mounted (`PasswordInput` masks itself). */
const AccordionExpanded = createContext(true);

export function useAccordionExpanded(): boolean {
  return useContext(AccordionExpanded);
}

export function AccordionContent({
  expanded,
  progress,
  children,
  mounted = true,
  style,
  testID,
}: {
  expanded: boolean;
  progress: Animated.Value;
  children: ReactNode;
  /** `false`: content removed (the `shown` of `useAccordion`, for heavy content). */
  mounted?: boolean;
  /** Style of the measured view (padding, spacing). */
  style?: StyleProp<ViewStyle>;
  testID?: string;
}) {
  const [height, setHeight] = useState(0);
  return (
    <Animated.View
      testID={testID}
      accessibilityElementsHidden={!expanded}
      importantForAccessibility={expanded ? "auto" : "no-hide-descendants"}
      pointerEvents={expanded ? "auto" : "none"}
      style={{
        overflow: "hidden",
        height: progress.interpolate({ inputRange: [0, 1], outputRange: [0, height] }),
        opacity: progress,
      }}
    >
      <View
        testID={testID ? `${testID}-measure` : undefined}
        style={[{ position: "absolute", top: 0, left: 0, right: 0 }, style]}
        onLayout={(event) => setHeight(event.nativeEvent.layout.height)}
      >
        <AccordionExpanded.Provider value={expanded}>{mounted ? children : null}</AccordionExpanded.Provider>
      </View>
    </Animated.View>
  );
}
