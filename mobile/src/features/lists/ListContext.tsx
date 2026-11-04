import { createContext, useContext, type ReactNode } from "react";

import { useMemberList } from "@/data/store";

type MemberListState = ReturnType<typeof useMemberList> & { listId: string };

const ListContext = createContext<MemberListState | null>(null);

/** A list read once for all its screens (tabs, idea form). */
export function ListProvider({ listId, children }: { listId: string; children: ReactNode }) {
  const state = useMemberList(listId);
  return <ListContext.Provider value={{ ...state, listId }}>{children}</ListContext.Provider>;
}

export function useList(): MemberListState {
  const state = useContext(ListContext);
  if (!state) throw new Error("useList must be used inside ListProvider");
  return state;
}
