/**
 * Tabs of a list's management page (`/lists/<id>?tab=…`). Pure module: the page reads the tab from
 * the address, the server actions from the form that was posted.
 */
import { LEGACY_PARAMS } from "./legacy-paths";

export const LIST_TABS = ["ideas", "archive", "reservations", "sharing", "settings"] as const;
export type ListTab = (typeof LIST_TABS)[number];

/** Label key of each tab in `locales/{fr,en}/list.json` (`tabs.*`), shared with the app. */
export const LIST_TAB_LABEL_KEY: Record<ListTab, string> = {
  ideas: "tabs.idees",
  archive: "tabs.archives",
  reservations: "tabs.reservations",
  sharing: "tabs.partage",
  settings: "tabs.reglages",
};

const FORMER_VALUES = LEGACY_PARAMS.find((rule) => rule.from === "onglet")?.values ?? {};

function isListTab(value: string): value is ListTab {
  return LIST_TABS.some((tab) => tab === value);
}

/**
 * Tab named in an address or a form. Accepts the former French values (a page opened before
 * feature 018 still posts them) and the old `categories` tab; anything else is the ideas tab.
 */
export function parseListTab(value: string | null | undefined): ListTab {
  if (!value) return "ideas";
  if (value === "categories") return "settings";
  const tab = Object.prototype.hasOwnProperty.call(FORMER_VALUES, value) ? FORMER_VALUES[value] : value;
  return tab !== undefined && isListTab(tab) ? tab : "ideas";
}
