import type { ListTab as SiteListTab } from "../../../../src/site/list-tabs";

/** Tabs of a list in the app (keys of the `tabs.*` labels in `locales/<lang>/list.json`). */
export type ListTab = "idees" | "archives" | "reservations" | "partage" | "reglages";

/** Path of each tab's screen, after `/lists/<id>`. */
export const LIST_TAB_ROUTES: Record<ListTab, string> = {
  idees: "",
  archives: "/archives",
  reservations: "/reservations",
  partage: "/share",
  reglages: "/settings",
};

/** The app tab of each tab of the site's management page (`?tab=…`, 026). */
export const APP_TAB_OF_SITE_TAB: Record<SiteListTab, ListTab> = {
  ideas: "idees",
  archive: "archives",
  reservations: "reservations",
  sharing: "partage",
  settings: "reglages",
};
