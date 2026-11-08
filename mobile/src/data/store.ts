import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { AppState } from "react-native";

import { api, ApiError, done, NetworkError, ok, type Schemas } from "@/api/client";
import { currentLocale, intlLocale } from "@/i18n";
import { viewList, viewLists, type ViewList, type ViewListSummary } from "@/offline/optimistic";
import { createListBody, discardList, listChanges, onOutboxChange, resetSending, type Change } from "@/offline/outbox";
import {
  getSnapshot,
  listKey,
  listsKey,
  putSnapshot,
  removeSnapshot,
  subscriptionsKey,
  type Snapshot,
} from "@/offline/snapshot";
import { setTransport, syncNow, type Transport } from "@/offline/sync";
import { onNetworkChange, getOnline } from "@/network";

type ListsBody = Schemas["ListSummary"][];
type SubscriptionsBody = Schemas["SubscribedListSummary"][];
type ListBody = Schemas["MemberList"];

/** What the screens read: server copies and write queue (in memory, reloaded from SQLite). */
type State = {
  lists: Snapshot<ListsBody> | null;
  subscriptions: Snapshot<SubscriptionsBody> | null;
  list: Record<string, Snapshot<ListBody> | null>;
  /** Lists deleted on the server or that the person is no longer a member of (404). */
  missing: Record<string, true>;
  changes: Change[];
  /** The queue has been read at least once from SQLite. */
  changesLoaded: boolean;
};

const empty: State = {
  lists: null,
  subscriptions: null,
  list: {},
  missing: {},
  changes: [],
  changesLoaded: false,
};
let state: State = empty;
const listeners = new Set<() => void>();

function update(next: Partial<State>) {
  state = { ...state, ...next };
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function useStore(): State {
  return useSyncExternalStore(subscribe, () => state);
}

async function reloadChanges() {
  update({ changes: await listChanges(), changesLoaded: true });
}

/** Screens read the queue even before the engine starts (list created offline). */
async function ensureChanges() {
  if (!state.changesLoaded) await reloadChanges();
}

async function loadLists() {
  const [lists, subscriptions] = await Promise.all([
    getSnapshot<ListsBody>(listsKey),
    getSnapshot<SubscriptionsBody>(subscriptionsKey),
  ]);
  update({ lists, subscriptions });
}

async function loadList(listId: string) {
  update({ list: { ...state.list, [listId]: await getSnapshot<ListBody>(listKey(listId)) } });
}

/** Reloads « Mes listes » and the followed lists from the server; without network, keeps the copy. */
export async function refreshLists(): Promise<void> {
  try {
    const body = await ok(api.GET("/lists"));
    const fetchedAt = new Date().toISOString();
    await putSnapshot(listsKey, body.lists, fetchedAt);
    await putSnapshot(subscriptionsKey, body.subscriptions ?? [], fetchedAt);
    await loadLists();
  } catch (error) {
    if (!(error instanceof NetworkError || error instanceof ApiError)) throw error;
  }
}

/**
 * Reloads a list. A 404 (list deleted, or the account no longer a member) removes it from the
 * phone: its copy and its unsent changes, which the server would refuse anyway (017, research R3).
 */
export async function refreshList(listId: string): Promise<void> {
  // A list still waiting to be created does not exist on the server.
  if (state.changes.some((change) => change.kind === "createList" && change.targetId === listId)) return;
  try {
    const list = await ok(api.GET("/lists/{listId}", { params: { path: { listId } } }));
    await putSnapshot(listKey(listId), list);
    update({ missing: Object.fromEntries(Object.entries(state.missing).filter(([id]) => id !== listId)) });
    await loadList(listId);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      await discardList(listId);
      await removeSnapshot(listKey(listId));
      update({ missing: { ...state.missing, [listId]: true }, list: { ...state.list, [listId]: null } });
      return;
    }
    if (!(error instanceof NetworkError || error instanceof ApiError)) throw error;
  }
}

/**
 * The person left or deleted the list (017): its copy goes, without the « liste introuvable »
 * message that a 404 brings, then « Mes listes » is reloaded.
 */
export async function forgetList(listId: string): Promise<void> {
  await removeSnapshot(listKey(listId));
  const { [listId]: _dropped, ...list } = state.list;
  update({ list, missing: Object.fromEntries(Object.entries(state.missing).filter(([id]) => id !== listId)) });
  await refreshLists();
}

/** Sends a change from the queue, route by route (contract 004 + api-v1-additions). */
async function send(change: Change): Promise<void> {
  const path = { listId: change.listId };
  switch (change.kind) {
    case "createList":
      await ok(api.POST("/lists", { body: createListBody(change.payload) }));
      return;
    case "createItem":
      await ok(api.POST("/lists/{listId}/items", { params: { path }, body: change.payload }));
      return;
    case "updateItem":
      await ok(api.PUT("/lists/{listId}/items/{itemId}", { params: { path: { ...path, itemId: change.targetId } }, body: change.payload }));
      return;
    case "patchItem":
      await ok(api.PATCH("/lists/{listId}/items/{itemId}", { params: { path: { ...path, itemId: change.targetId } }, body: change.payload }));
      return;
    case "deleteItem":
      await done(api.DELETE("/lists/{listId}/items/{itemId}", { params: { path: { ...path, itemId: change.targetId } } }));
      return;
    case "moveItem": {
      const { preview: _preview, ...body } = change.payload;
      await ok(api.POST("/lists/{listId}/items/{itemId}/move", { params: { path: { ...path, itemId: change.targetId } }, body }));
      return;
    }
    case "copyItem": {
      const { preview, ...body } = change.payload;
      await ok(api.POST("/lists/{listId}/items/{itemId}/copy", { params: { path: { ...path, itemId: preview.id } }, body }));
      return;
    }
  }
}

export const apiTransport: Transport = {
  send,
  refresh: async (listIds) => {
    await Promise.all([refreshLists(), ...listIds.map(refreshList)]);
  },
};

let started = false;

/**
 * Starts the offline engine (once, when signed in): the queue resumes where it was, then
 * is sent at startup, when the network comes back, and when the app returns to the foreground (R6).
 */
export async function startOfflineEngine(): Promise<void> {
  if (started) return;
  started = true;
  setTransport(apiTransport);
  await resetSending();
  await reloadChanges();
  onOutboxChange(() => void reloadChanges());
  onNetworkChange(() => {
    if (getOnline()) void syncNow();
  });
  AppState.addEventListener("change", (status) => {
    if (status === "active") void syncNow();
  });
  void syncNow();
}

/** After a sign-out: nothing of the previous account stays in memory. */
export function resetStore(): void {
  update(empty);
}

/** Refreshes on mount and when the app returns to the foreground (FR-017). */
function useRefreshing(refresh: () => Promise<void>) {
  const [refreshing, setRefreshing] = useState(false);
  // The first load of this source (list) is done, successful or not.
  const [settledFor, setSettledFor] = useState<(() => Promise<void>) | null>(null);
  const run = useCallback(async () => {
    setRefreshing(true);
    try {
      await refresh();
    } finally {
      setRefreshing(false);
    }
  }, [refresh]);
  useEffect(() => {
    void refresh().finally(() => setSettledFor(() => refresh));
    const subscription = AppState.addEventListener("change", (status) => {
      if (status === "active") void refresh();
    });
    return () => subscription.remove();
  }, [refresh]);
  return { refreshing, settled: settledFor === refresh, refresh: run };
}

export function useMyLists(): {
  lists: ViewListSummary[];
  subscriptions: SubscriptionsBody;
  loaded: boolean;
  fetchedAt: string | null;
  refreshing: boolean;
  settled: boolean;
  refresh: () => Promise<void>;
} {
  const store = useStore();
  const refresh = useCallback(async () => {
    await ensureChanges();
    if (!state.lists || !state.subscriptions) await loadLists();
    await refreshLists();
  }, []);
  const refreshing = useRefreshing(refresh);
  const lists = useMemo(() => viewLists(store.lists?.body ?? null, store.changes), [store.lists, store.changes]);
  const subscriptions = store.subscriptions?.body ?? [];
  return {
    lists,
    subscriptions,
    loaded: store.lists !== null || lists.length > 0 || subscriptions.length > 0,
    fetchedAt: store.lists?.fetchedAt ?? store.subscriptions?.fetchedAt ?? null,
    ...refreshing,
  };
}

/**
 * The list of this link is in « Listes suivies » (local copy of `GET /lists`). Used when the list
 * itself cannot be read (password changed): it can still be unfollowed.
 */
export function useIsFollowed(readToken: string): boolean {
  const store = useStore();
  useEffect(() => {
    if (!state.subscriptions) void loadLists();
  }, []);
  return store.subscriptions?.body.some((subscription) => subscription.readToken === readToken) ?? false;
}

export function useMemberList(listId: string): {
  list: ViewList | null;
  /** Local copy and queue read: a null `list` then means « unknown on this phone ». */
  loaded: boolean;
  /** The list no longer exists for this account (404). */
  missing: boolean;
  fetchedAt: string | null;
  refreshing: boolean;
  settled: boolean;
  refresh: () => Promise<void>;
} {
  const store = useStore();
  const refresh = useCallback(async () => {
    await ensureChanges();
    if (state.list[listId] === undefined) await loadList(listId);
    await refreshList(listId);
  }, [listId]);
  const refreshing = useRefreshing(refresh);
  const snapshot = store.list[listId] ?? null;
  const list = useMemo(
    () => viewList(snapshot?.body ?? null, listId, store.changes, intlLocale(currentLocale())),
    [snapshot, listId, store.changes],
  );
  const loaded = store.changesLoaded && store.list[listId] !== undefined;
  return { list, loaded, missing: store.missing[listId] === true, fetchedAt: snapshot?.fetchedAt ?? null, ...refreshing };
}

/** Changes not yet accepted (offline banner, warning on sign-out). */
export function usePendingCount(): number {
  return useStore().changes.filter((change) => change.state !== "rejected").length;
}

/** Changes of one list still on the phone, rejected ones included: lost if the list is left or deleted (017). */
export function usePendingCountFor(listId: string): number {
  return useStore().changes.filter((change) => change.listId === listId).length;
}

/** Date of the most recent copy shown (« dernière mise à jour à … » banner). */
export function useLastFetchedAt(listId?: string): string | null {
  const store = useStore();
  return (listId ? store.list[listId]?.fetchedAt : store.lists?.fetchedAt) ?? null;
}
