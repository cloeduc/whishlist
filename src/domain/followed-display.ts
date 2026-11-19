/**
 * What a subscriber sees for a list they follow (024): their own name for the list, otherwise its title;
 * their own name for the person, otherwise the owner's display name. Pure: the app reuses it.
 */
export function followedDisplay(names: {
  title: string;
  customTitle: string | null;
  ownerName: string | null;
  customOwnerName: string | null;
}): { title: string; person: string | null } {
  return { title: names.customTitle ?? names.title, person: names.customOwnerName ?? names.ownerName };
}
