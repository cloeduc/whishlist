import { api, ApiError, done } from "@/api/client";
import { discardList } from "@/offline/outbox";

import { forgetList, refreshList } from "./store";

// Sharing a list (017): invitations, read password, members, leaving and deleting.
// Direct calls, unavailable offline, like the list settings (research R2): never through the queue.

/**
 * Runs a call; a refusal about rights (role changed elsewhere, research R7) reloads the list
 * before the error goes up, so the screen follows the account's current role.
 */
async function guarded(listId: string, call: () => Promise<unknown>): Promise<void> {
  try {
    await call();
  } catch (error) {
    if (error instanceof ApiError && (error.code.startsWith("owner") || error.code === "notMember")) await refreshList(listId);
    throw error;
  }
}

/** Sends the invite link by email; nothing changes in the list. */
export async function sendInvite(listId: string, email: string): Promise<void> {
  await guarded(listId, () => done(api.POST("/lists/{listId}/invitations", { params: { path: { listId } }, body: { email } })));
}

/** Owner: the previous invite link stops working. */
export async function regenerateInvite(listId: string): Promise<void> {
  await guarded(listId, () => done(api.POST("/lists/{listId}/invite-link", { params: { path: { listId } } })));
  await refreshList(listId);
}

/** Owner: sets or replaces the read password (the server checks its length). */
export async function setReadPassword(listId: string, password: string): Promise<void> {
  await guarded(listId, () => done(api.PUT("/lists/{listId}/read-password", { params: { path: { listId } }, body: { password } })));
  await refreshList(listId);
}

export async function clearReadPassword(listId: string): Promise<void> {
  await guarded(listId, () => done(api.DELETE("/lists/{listId}/read-password", { params: { path: { listId } } })));
  await refreshList(listId);
}

/** Owner: removes another member. */
export async function removeMember(listId: string, userId: string): Promise<void> {
  await guarded(listId, () => done(api.DELETE("/lists/{listId}/members/{userId}", { params: { path: { listId, userId } } })));
  await refreshList(listId);
}

/** Nothing of the list stays on the phone: its unsent changes, then its copy (research R3). */
async function dropList(listId: string): Promise<void> {
  await discardList(listId);
  await forgetList(listId);
}

/** Leaves the list; an owner hands it to the oldest member (server rule). Alone: `aloneMustDelete`. */
export async function leaveList(listId: string): Promise<void> {
  await guarded(listId, () => done(api.POST("/lists/{listId}/leave", { params: { path: { listId } } })));
  await dropList(listId);
}

/** Owner: deletes the list, its ideas and its reservations, for every member. */
export async function deleteList(listId: string): Promise<void> {
  await guarded(listId, () => done(api.DELETE("/lists/{listId}", { params: { path: { listId } } })));
  await dropList(listId);
}
