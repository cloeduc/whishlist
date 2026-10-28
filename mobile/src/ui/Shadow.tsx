import { useState, type ReactNode } from "react";
import { Pressable, View, type PressableProps, type StyleProp, type ViewStyle } from "react-native";

import { tokens } from "@/theme/tokens";

/**
 * Boîte néo-brutaliste du site : bordure noire de 2, rayon 5, ombre noire pleine décalée de 4/4.
 * L'ombre est une vue dessinée sous la boîte (et non l'ombre native, floue et différente
 * sur iOS et Android, R7). `pressed` : la boîte « s'enfonce » de 4/4 et l'ombre disparaît.
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
  /** Style de la boîte (fond, bordure, marges internes). */
  style?: StyleProp<ViewStyle>;
  /** Style du conteneur (largeur, marges externes). */
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
        Jamais « aplatie » par React Native : sinon le décalage à l'appui ou au focus change la
        hiérarchie native, et un champ de saisie à l'intérieur perd le focus à la première lettre.
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
 * Élément cliquable qui s'enfonce à l'appui (bouton, carte, pastille), comme le survol du site.
 * L'état « appuyé » est tenu ici (onPressIn / onPressOut), le même pour tous et testable.
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
  /** `false` : pas d'effet d'appui (onglet déjà actif). */
  sink?: boolean;
  /** `false` : pas de boîte du tout (lien, bouton fantôme). */
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
