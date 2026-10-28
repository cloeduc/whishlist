import { Image } from "react-native";

import type { Schemas } from "@/api/client";
import { paletteFor } from "@/theme/ListTheme";
import { tokens } from "@/theme/tokens";

import { GiftMark } from "./GiftMark";
import { Shadow } from "./Shadow";

/** `components/site/wishlist-cover.tsx` : l'image de la liste, ou le cadeau à ses couleurs. */
export function ListCover({
  coverImageUrl,
  theme,
  size,
  framed = true,
}: {
  coverImageUrl: string | null;
  theme: Schemas["Theme"];
  size: number;
  framed?: boolean;
}) {
  if (coverImageUrl) {
    const image = <Image source={{ uri: coverImageUrl }} style={{ width: size, height: size }} resizeMode="cover" />;
    if (!framed) return image;
    return <Shadow style={{ overflow: "hidden", borderRadius: tokens.radius }}>{image}</Shadow>;
  }
  return <GiftMark size={size} framed={framed} colors={paletteFor(theme).gift} />;
}
