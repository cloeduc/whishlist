import { parseListTab, type ListTab } from "../../../src/site/list-tabs";

/** Where a list's management address (`/lists/<id>` on the site) leads in the app (026). */
export type LinkedListTarget =
  | { kind: "screen"; path: string }
  /** Not a member (or unknown list): the help screen; `followedReadToken` if the account follows the list. */
  | { kind: "help"; followedReadToken: string | null };

const TAB_SCREEN: Record<ListTab, string> = {
  ideas: "",
  archive: "/archives",
  reservations: "/reservations",
  sharing: "/share",
  settings: "/settings",
};

/**
 * Decides from the account's lists (local copy of `GET /lists`): a member opens the list, on the
 * screen of the tab named by the address when the app has one; the site's `/lists/new` opens
 * « Nouvelle liste ». Anyone else gets the help screen, which says nothing about the list.
 */
export function linkedListTarget(
  listId: string,
  tab: string | null | undefined,
  data: { lists: readonly { id: string }[]; subscriptions: readonly { id: string; readToken: string }[] },
): LinkedListTarget {
  if (listId === "new") return { kind: "screen", path: "/lists/new" };
  if (data.lists.some((list) => list.id === listId)) {
    return { kind: "screen", path: `/lists/${encodeURIComponent(listId)}${TAB_SCREEN[parseListTab(tab)]}` };
  }
  const followed = data.subscriptions.find((subscription) => subscription.id === listId);
  return { kind: "help", followedReadToken: followed?.readToken ?? null };
}
