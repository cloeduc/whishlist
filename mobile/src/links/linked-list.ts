import { parseListTab } from "../../../src/site/list-tabs";
import { APP_TAB_OF_SITE_TAB, LIST_TAB_ROUTES } from "@/features/lists/tab-routes";

/** Where a list's management address (`/lists/<id>` on the site) leads in the app (026). */
export type LinkedListTarget =
  | { kind: "screen"; path: string }
  /** Not a member (or unknown list): the help screen; `followedReadToken` if the account follows the list. */
  | { kind: "help"; followedReadToken: string | null };

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
    return { kind: "screen", path: `/lists/${encodeURIComponent(listId)}${LIST_TAB_ROUTES[APP_TAB_OF_SITE_TAB[parseListTab(tab)]]}` };
  }
  const followed = data.subscriptions.find((subscription) => subscription.id === listId);
  return { kind: "help", followedReadToken: followed?.readToken ?? null };
}
