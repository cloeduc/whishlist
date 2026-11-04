/** Default name of a list, numbered to stay unique for a given account. */
export function numberedTitle(base: string, existing: Iterable<string>): string {
  const taken = new Set<string>();
  for (const title of existing) taken.add(title.trim().toLocaleLowerCase());
  if (!taken.has(base.trim().toLocaleLowerCase())) return base;
  for (let n = 2; ; n++) {
    const candidate = `${base} ${n}`;
    if (!taken.has(candidate.trim().toLocaleLowerCase())) return candidate;
  }
}

/** Titles of the lists this account is a member of (owner or not), to number a default name. */
export function memberListTitles(
  memberships: readonly { userId: string; wishlistId: string }[],
  wishlists: readonly { id: string; title: string }[],
  userId: string,
): string[] {
  const byId = new Map(wishlists.map((w) => [w.id, w.title]));
  return memberships
    .filter((m) => m.userId === userId)
    .map((m) => byId.get(m.wishlistId))
    .filter((title): title is string => typeof title === "string");
}

type Translate = (key: string, vars?: Record<string, string>) => string;

/**
 * Values taken by the fields left empty when a list is created. Shared by the page
 * (placeholders) and by the command, so that what is shown is what is created.
 * An empty display name (possible for an account imported from the old format) has its own labels.
 */
export function listDefaults(
  displayName: string,
  t: Translate,
): { titleBase: string; category: string; person: string } {
  const name = displayName.trim();
  return {
    titleBase: name ? t("newList.defaultName", { name }) : t("newList.defaultNameNoName"),
    category: t("newList.defaultCategory"),
    person: name || t("newList.defaultPerson"),
  };
}
