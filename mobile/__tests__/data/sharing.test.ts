import { renderHook, waitFor } from "@testing-library/react-native";

import type { Schemas } from "@/api/client";
import {
  clearReadPassword,
  deleteList,
  leaveList,
  regenerateInvite,
  removeMember,
  sendInvite,
  setReadPassword,
} from "@/data/sharing";
import { resetStore, useMemberList, usePendingCountFor } from "@/data/store";
import { enqueue, listChanges, reject } from "@/offline/outbox";
import { getSnapshot, putSnapshot } from "@/offline/snapshot";

import { fakeFetch, json } from "../helpers/fetch";
import { freshDb } from "../helpers/memory-db";

const list: Schemas["MemberList"] = {
  id: "w",
  title: "Nos envies",
  subtitle: null,
  coverImageUrl: null,
  theme: {},
  role: "owner",
  readUrl: "https://ohyoushouldnt.example.test/l/rt",
  inviteUrl: "https://ohyoushouldnt.example.test/inviter/it",
  hasReadPassword: false,
  categories: [],
  people: [],
  items: [],
  reservations: [],
  members: [
    { userId: "alex", displayName: "Alex", role: "owner" },
    { userId: "camille", displayName: "Camille", role: "member" },
  ],
};

const empty = () => new Response(null, { status: 204 });
const refusal = (status: number, code: string) => () => json(status, { error: { code, message: code } });
const createItem = (listId: string, id: string) =>
  enqueue({ kind: "createItem", listId, targetId: id, payload: { id, name: "Puzzle", typeId: "t", personId: "p" } });

beforeEach(async () => {
  await freshDb();
  resetStore();
  await putSnapshot("list:w", list);
});

test("sendInvite posts the address and reloads nothing", async () => {
  const server = fakeFetch({ "POST /lists/w/invitations": () => new Response(null, { status: 202 }) });
  await sendInvite("w", "sam@example.test");
  expect(server.calls).toEqual(["POST /lists/w/invitations"]);
  const request = server.mock.mock.calls[0][0] as Request;
  expect(await request.json()).toEqual({ email: "sam@example.test" });
});

test.each([
  ["regenerateInvite", () => regenerateInvite("w"), "POST /lists/w/invite-link", () => json(200, { inviteUrl: "u", inviteToken: "t" })],
  ["setReadPassword", () => setReadPassword("w", "secretliste"), "PUT /lists/w/read-password", empty],
  ["clearReadPassword", () => clearReadPassword("w"), "DELETE /lists/w/read-password", empty],
  ["removeMember", () => removeMember("w", "camille"), "DELETE /lists/w/members/camille", empty],
] as const)("%s calls its route, then reloads the list", async (_name, action, route, answer) => {
  const server = fakeFetch({ [route]: answer, "GET /lists/w": () => json(200, { ...list, hasReadPassword: true }) });
  await action();
  expect(server.calls).toEqual([route, "GET /lists/w"]);
  expect((await getSnapshot<Schemas["MemberList"]>("list:w"))?.body.hasReadPassword).toBe(true);
});

test.each([
  ["leaveList", () => leaveList("w"), "POST /lists/w/leave"],
  ["deleteList", () => deleteList("w"), "DELETE /lists/w"],
] as const)("%s forgets the list on the phone: copy and its changes, without « introuvable »", async (_name, action, route) => {
  await createItem("w", "a");
  await createItem("other", "b");
  const server = fakeFetch({
    "GET /lists/w": () => json(200, list),
    [route]: empty,
    "GET /lists": () => json(200, { lists: [], subscriptions: [] }),
  });
  const { result } = await renderHook(() => useMemberList("w"));
  await waitFor(() => expect(result.current.list?.id).toBe("w"));
  server.calls.length = 0;
  await action();
  expect(server.calls).toEqual([route, "GET /lists"]);
  expect(await getSnapshot("list:w")).toBeNull();
  expect((await listChanges()).map((change) => change.listId)).toEqual(["other"]);
  await waitFor(() => expect(result.current.missing).toBe(false));
});

test("leaving alone is refused (aloneMustDelete): nothing is forgotten", async () => {
  await createItem("w", "a");
  const server = fakeFetch({ "POST /lists/w/leave": refusal(400, "aloneMustDelete") });
  await expect(leaveList("w")).rejects.toMatchObject({ code: "aloneMustDelete" });
  expect(server.calls).toEqual(["POST /lists/w/leave"]);
  expect(await getSnapshot("list:w")).not.toBeNull();
  expect(await listChanges()).toHaveLength(1);
});

test("a refusal about rights reloads the list before the error goes up (role changed elsewhere)", async () => {
  const server = fakeFetch({
    "DELETE /lists/w/members/camille": refusal(403, "ownerRemoveMember"),
    "GET /lists/w": () => json(200, { ...list, role: "member" }),
  });
  await expect(removeMember("w", "camille")).rejects.toMatchObject({ code: "ownerRemoveMember" });
  expect(server.calls).toEqual(["DELETE /lists/w/members/camille", "GET /lists/w"]);
  expect((await getSnapshot<Schemas["MemberList"]>("list:w"))?.body.role).toBe("member");
});

test("refused because the account is no longer a member: the list and its unsent changes leave the phone", async () => {
  await createItem("w", "a");
  await createItem("other", "b");
  const server = fakeFetch({
    "POST /lists/w/invitations": refusal(403, "notMember"),
    "GET /lists/w": refusal(404, "listMissing"),
  });
  await expect(sendInvite("w", "sam@example.test")).rejects.toMatchObject({ code: "notMember" });
  expect(server.calls).toEqual(["POST /lists/w/invitations", "GET /lists/w"]);
  expect(await getSnapshot("list:w")).toBeNull();
  expect((await listChanges()).map((change) => change.listId)).toEqual(["other"]);
  // The screen says « liste introuvable ».
  const { result } = await renderHook(() => useMemberList("w"));
  await waitFor(() => expect(result.current.missing).toBe(true));
});

test("another refusal does not reload the list", async () => {
  const server = fakeFetch({ "POST /lists/w/invitations": refusal(503, "mailNotConfigured") });
  await expect(sendInvite("w", "sam@example.test")).rejects.toMatchObject({ code: "mailNotConfigured" });
  expect(server.calls).toEqual(["POST /lists/w/invitations"]);
});

test("usePendingCountFor counts the changes of one list only, rejected ones included", async () => {
  await createItem("w", "a");
  await reject((await createItem("w", "b")) ?? 0, "itemNeedsName");
  await createItem("other", "c");
  fakeFetch({ "GET /lists/w": () => json(200, list) });
  await renderHook(() => useMemberList("w"));
  const { result } = await renderHook(() => usePendingCountFor("w"));
  await waitFor(() => expect(result.current).toBe(2));
});
