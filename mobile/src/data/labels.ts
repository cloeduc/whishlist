import { api, done, ok } from "@/api/client";

import { refreshList } from "./store";

// List settings and reservation cancelling: direct calls, unavailable offline (FR-029b).
// After each success, the copy of the list is reloaded.

export type LabelKind = "types" | "people";

export async function addLabel(listId: string, kind: LabelKind, label: string): Promise<void> {
  const path = { listId };
  if (kind === "types") await ok(api.POST("/lists/{listId}/types", { params: { path }, body: { label } }));
  else await ok(api.POST("/lists/{listId}/people", { params: { path }, body: { label } }));
  await refreshList(listId);
}

export async function renameLabel(listId: string, kind: LabelKind, id: string, label: string): Promise<void> {
  if (kind === "types") {
    await ok(api.PATCH("/lists/{listId}/types/{typeId}", { params: { path: { listId, typeId: id } }, body: { label } }));
  } else {
    await ok(api.PATCH("/lists/{listId}/people/{personId}", { params: { path: { listId, personId: id } }, body: { label } }));
  }
  await refreshList(listId);
}

export async function deleteLabel(listId: string, kind: LabelKind, id: string): Promise<void> {
  if (kind === "types") {
    await done(api.DELETE("/lists/{listId}/types/{typeId}", { params: { path: { listId, typeId: id } } }));
  } else {
    await done(api.DELETE("/lists/{listId}/people/{personId}", { params: { path: { listId, personId: id } } }));
  }
  await refreshList(listId);
}

export async function reorderTypes(listId: string, typeIds: string[]): Promise<void> {
  await done(api.PUT("/lists/{listId}/types/order", { params: { path: { listId } }, body: { typeIds } }));
  await refreshList(listId);
}

/** Cancelling a reservation is a member action (constitution, principle III). */
export async function cancelReservation(listId: string, reservationId: string): Promise<void> {
  await done(api.DELETE("/lists/{listId}/reservations/{reservationId}", { params: { path: { listId, reservationId } } }));
  await refreshList(listId);
}
