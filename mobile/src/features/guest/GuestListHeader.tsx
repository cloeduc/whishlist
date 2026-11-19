import { View } from "react-native";

import { followedDisplay } from "../../../../src/domain/followed-display";
import type { Schemas } from "@/api/client";
import { tokens } from "@/theme/tokens";
import { ListCover } from "@/ui/ListCover";
import { Text } from "@/ui/Text";

/** Cover, title and subtitle of the list seen as a guest, like the header of the site public page. */
export function GuestListHeader({ list }: { list: Schemas["PublicList"] }) {
  // A followed list shows the subscriber's own names (024).
  const shown = list.follow ? followedDisplay({ title: list.title, ...list.follow }) : { title: list.title, person: null };
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: tokens.space[3] }}>
      <ListCover coverImageUrl={list.coverImageUrl} theme={list.theme} size={56} />
      <View style={{ flex: 1, gap: tokens.space[1] }}>
        <Text testID="guest.title" size="title" accessibilityRole="header">
          {shown.title}
        </Text>
        {shown.person ? (
          <Text testID="guest.person">
            {shown.person}
          </Text>
        ) : null}
        {list.subtitle ? <Text color={tokens.colors.mutedForeground}>{list.subtitle}</Text> : null}
      </View>
    </View>
  );
}
