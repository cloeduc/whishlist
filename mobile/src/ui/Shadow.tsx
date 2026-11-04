import { useState, type ReactNode } from "react";
import { Pressable, View, type PressableProps, type StyleProp, type ViewStyle } from "react-native";

import { tokens } from "@/theme/tokens";

/**
 * The site's neo-brutalist box: black border of 2, radius 5, solid black shadow offset by 4/4.
 * The shadow is a view drawn under the box (and not the native shadow, blurry and different
 * on iOS and Android, R7). `pressed`: the box « sinks » by 4/4 and the shadow disappears.
 */
export function Shadow({
  children,
  pressed = false,
  shadow = true,
  shadowColor = tokens.colors.black,
  radius = tokens.radius,
  style,
  containerStyle,
  testID,
}: {
  children?: ReactNode;
  pressed?: boolean;
  shadow?: boolean;
  shadowColor?: string;
  radius?: number;
  /** Box style (background, border, padding). */
  style?: StyleProp<ViewStyle>;
  /** Container style (width, margins). */
  containerStyle?: StyleProp<ViewStyle>;
  testID?: string;
}) {
  const offset = tokens.shadowOffset;
  return (
    <View style={containerStyle}>
      {shadow && !pressed ? (
        <View
          testID={testID ? `${testID}-shadow` : undefined}
          pointerEvents="none"
          style={{
            position: "absolute",
            top: offset,
            left: offset,
            right: -offset,
            bottom: -offset,
            borderRadius: radius,
            backgroundColor: shadowColor,
          }}
        />
      ) : null}
      {/*
        Never « flattened » by React Native: otherwise the offset on press or focus changes the
        native hierarchy, and an input inside loses focus at the first letter.
      */}
      <View
        testID={testID}
        collapsable={false}
        style={[
          {
            borderWidth: tokens.borderWidth,
            borderColor: tokens.colors.black,
            borderRadius: radius,
            backgroundColor: tokens.colors.white,
          },
          style,
          pressed ? { transform: [{ translateX: offset }, { translateY: offset }] } : null,
        ]}
      >
        {children}
      </View>
    </View>
  );
}

/**
 * Pressable element that sinks on press (button, card, pill), like the site's hover.
 * The « pressed » state is held here (onPressIn / onPressOut), the same for all and testable.
 */
export function PressableShadow({
  children,
  boxStyle,
  boxTestID,
  sink = true,
  framed = true,
  disabled,
  ...props
}: Omit<PressableProps, "children"> & {
  children: ReactNode;
  boxStyle?: StyleProp<ViewStyle>;
  boxTestID?: string;
  /** `false`: no press effect (tab already active). */
  sink?: boolean;
  /** `false`: no box at all (link, ghost button). */
  framed?: boolean;
}) {
  const [pressed, setPressed] = useState(false);
  return (
    <Pressable
      {...props}
      disabled={disabled}
      onPressIn={(event) => {
        setPressed(true);
        props.onPressIn?.(event);
      }}
      onPressOut={(event) => {
        setPressed(false);
        props.onPressOut?.(event);
      }}
    >
      {framed ? (
        <Shadow testID={boxTestID} pressed={pressed && sink && !disabled} style={boxStyle}>
          {children}
        </Shadow>
      ) : (
        children
      )}
    </Pressable>
  );
}
