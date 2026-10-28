import NetInfo, { type NetInfoState } from "@react-native-community/netinfo";
import { useSyncExternalStore } from "react";

let online = true;
const listeners = new Set<() => void>();

function isOnline(state: NetInfoState): boolean {
  // `isInternetReachable` vaut null tant que le système ne sait pas : on suppose le réseau là.
  return state.isConnected !== false && state.isInternetReachable !== false;
}

function update(state: NetInfoState) {
  const next = isOnline(state);
  if (next === online) return;
  online = next;
  for (const listener of listeners) listener();
}

let started = false;

/** Démarre l'écoute du réseau (une fois, au lancement de l'app). */
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
