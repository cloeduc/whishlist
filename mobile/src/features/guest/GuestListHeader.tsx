import { View } from "react-native";

import type { Schemas } from "@/api/client";
import { tokens } from "@/theme/tokens";
import { ListCover } from "@/ui/ListCover";
import { Text } from "@/ui/Text";

/** Cover, title and subtitle of the list seen as a guest, like the header of the site public page. */
export function GuestListHeader({ list }: { list: Schemas["PublicList"] }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: tokens.space[3] }}>
      <ListCover coverImageUrl={list.coverImageUrl} theme={list.theme} size={56} />
      <View style={{ flex: 1, gap: tokens.space[1] }}>
        <Text testID="guest.title" size="title" accessibilityRole="header">
          {list.title}
        </Text>
        {list.subtitle ? <Text color={tokens.colors.mutedForeground}>{list.subtitle}</Text> : null}
      </View>
    </View>
  );
}
