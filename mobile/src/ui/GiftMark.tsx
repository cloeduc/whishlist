import Svg, { Circle, Ellipse, Path, Rect } from "react-native-svg";

import { useTheme, type Palette } from "@/theme/ListTheme";

/**
 * Le cadeau du site (`components/site/gift-mark.tsx`) : même viewBox, mêmes formes.
 * Couvercle `accent`, corps `primary`, ruban `highlight`, aux couleurs du thème courant.
 */
export function GiftMark({
  size = 40,
  framed = true,
  colors,
  accessibilityLabel,
}: {
  size?: number;
  /** Cadre blanc + ombre brute ; `false` = le cadeau sur fond blanc. */
  framed?: boolean;
  /** Couleurs d'une liste précise (carte de « Mes listes ») ; sinon le thème courant. */
  colors?: Palette["gift"];
  accessibilityLabel?: string;
}) {
  const theme = useTheme();
  const { primary, accent, highlight } = colors ?? theme.gift;
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 136 136"
      accessible={accessibilityLabel !== undefined}
      accessibilityRole={accessibilityLabel ? "image" : undefined}
      accessibilityLabel={accessibilityLabel}
    >
      {framed ? (
        <>
          <Rect x={12} y={12} width={116} height={116} rx={24} fill="#000" />
          <Rect x={6} y={6} width={116} height={116} rx={24} fill="#fff" stroke="#000" strokeWidth={4} />
        </>
      ) : (
        <Rect x={6} y={6} width={116} height={116} rx={24} fill="#fff" />
      )}
      <Rect x={30} y={44} width={72} height={18} rx={4} fill={accent} stroke="#000" strokeWidth={4} />
      <Rect x={36} y={62} width={60} height={42} rx={4} fill={primary} stroke="#000" strokeWidth={4} />
      <Rect x={60} y={44} width={12} height={60} fill={highlight} stroke="#000" strokeWidth={3.5} />
      <Ellipse cx={54} cy={38} rx={12} ry={9} fill={highlight} stroke="#000" strokeWidth={3.5} />
      <Ellipse cx={78} cy={38} rx={12} ry={9} fill={highlight} stroke="#000" strokeWidth={3.5} />
      <Circle cx={66} cy={40} r={5} fill={highlight} stroke="#000" strokeWidth={3} />
      <Path
        d="M80 80c0-3.5 2.8-6 5.5-6 1.8 0 3.2.9 4.5 2.4 1.3-1.5 2.7-2.4 4.5-2.4 2.7 0 5.5 2.5 5.5 6 0 5.5-10 11-10 11s-10-5.5-10-11z"
        fill={accent}
        stroke="#000"
        strokeWidth={3}
        strokeLinejoin="round"
      />
    </Svg>
  );
}
