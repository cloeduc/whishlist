import NetInfo, { type NetInfoState } from "@react-native-community/netinfo";
import { useSyncExternalStore } from "react";

let online = true;
const listeners = new Set<() => void>();

function isOnline(state: NetInfoState): boolean {
  // `isInternetReachable` is null while the system does not know: we assume the network is there.
  return state.isConnected !== false && state.isInternetReachable !== false;
}

function update(state: NetInfoState) {
  const next = isOnline(state);
  if (next === online) return;
  online = next;
  for (const listener of listeners) listener();
}

let started = false;

/** Starts listening to the network (once, at app launch). */
export function watchNetwork(): void {
  if (started) return;
  started = true;
  NetInfo.addEventListener(update);
  void NetInfo.fetch().then(update);
}

export function getOnline(): boolean {
  return online;
}

export function onNetworkChange(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useOnline(): boolean {
  return useSyncExternalStore(onNetworkChange, getOnline);
}
