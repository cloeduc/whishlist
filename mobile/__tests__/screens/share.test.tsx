import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import * as Clipboard from "expo-clipboard";
import { router } from "expo-router";
import { Linking, Share } from "react-native";

import ShareTab from "../../app/(app)/lists/[listId]/share";
import type { Schemas } from "@/api/client";
import { resetStore } from "@/data/store";
import { ListProvider } from "@/features/lists/ListContext";
import { i18n, translateError } from "@/i18n";
import { enqueue } from "@/offline/outbox";
import { putSnapshot } from "@/offline/snapshot";

import { fakeFetch, json } from "../helpers/fetch";
import { freshDb } from "../helpers/memory-db";
import { setOnline } from "../helpers/network";

jest.mock("expo-router", () => ({
  router: { push: jest.fn(), replace: jest.fn(), back: jest.fn(), canGoBack: () => true },
  useFocusEffect: jest.fn(),
}));
jest.mock("react-native-safe-area-context", () => require("react-native-safe-area-context/jest/mock").default);
jest.mock("expo-clipboard", () => ({ setStringAsync: jest.fn(async () => true) }));
// The QR code is replaced by a view that exposes the encoded value.
jest.mock("react-native-qrcode-svg", () => {
  const { Text } = require("react-native");
  return ({ value }: { value: string }) => <Text testID="qr-value">{value}</Text>;
});

const READ_URL = "https://ohyoushouldnt.example.test/l/rt";
const INVITE_URL = "https://ohyoushouldnt.example.test/i/it";

const list: Schemas["MemberList"] = {
  id: "w",
  title: "Nos envies",
  subtitle: null,
  coverImageUrl: null,
  theme: {},
  role: "owner",
  readUrl: READ_URL,
  inviteUrl: INVITE_URL,
  hasReadPassword: false,
  categories: [{ id: "t", label: "Jeux", sortOrder: 0 }],
  people: [{ id: "p", label: "Alex" }],
  items: [],
  reservations: [],
  members: [],
};

/** Renders the tab on a copy of `body` (none for a list not sent yet), served with `routes`. */
async function renderShare(body: Schemas["MemberList"] | null = list, routes: Parameters<typeof fakeFetch>[0] = {}, listId = "w") {
  if (body) await putSnapshot(`list:${listId}`, body);
  const server = fakeFetch({ ...(body ? { [`GET /lists/${listId}`]: () => json(200, body) } : {}), ...routes });
  await render(
    <ListProvider listId={listId}>
      <ShareTab />
    </ListProvider>,
  );
  return server;
}

beforeEach(async () => {
  await freshDb();
  resetStore();
  await i18n.changeLanguage("fr");
  await putSnapshot("list:w", list);
});

afterEach(async () => {
  await setOnline(true);
  jest.restoreAllMocks();
});

test("the QR code and the public link field carry readUrl, never inviteUrl (FR-023)", async () => {
  await renderShare();
  expect(await screen.findByTestId("qr-value")).toHaveTextContent(READ_URL);
  expect(screen.getByTestId("share.read-link").props.value).toBe(READ_URL);
});

test("Share opens the share sheet with the title and readUrl (FR-021)", async () => {
  const share = jest.spyOn(Share, "share").mockResolvedValue({ action: "sharedAction", activityType: undefined });
  await renderShare();
  await fireEvent.press(await screen.findByRole("button", { name: "Partager" }));
  expect(share).toHaveBeenCalledWith({ title: "Nos envies", message: `Nos envies — ${READ_URL}` });
});

test("Copy puts readUrl in the clipboard, then confirms (FR-022)", async () => {
  await renderShare();
  await fireEvent.press(await screen.findByTestId("copy-link"));
  expect(Clipboard.setStringAsync).toHaveBeenCalledWith(READ_URL);
  expect(await screen.findByText("Lien copié.")).toBeOnTheScreen();
});

test("a list with a read password says so, without the password (FR-024)", async () => {
  await renderShare({ ...list, hasReadPassword: true });
  expect(await screen.findByTestId("password-notice")).toHaveTextContent(i18n.t("mobile:share.passwordNotice"));
});

test("a list not sent yet shows neither QR code nor sharing, but the explanation", async () => {
  await enqueue({
    kind: "createList",
    listId: "new-list-id-00001",
    targetId: "new-list-id-00001",
    payload: { id: "new-list-id-00001", title: "Anniversaire", category: "Jeux", person: "Lou", categoryId: "c-new-list-00001", personId: "p-new-list-00001" },
  });
  await renderShare(null, {}, "new-list-id-00001");
  expect(await screen.findByText(i18n.t("mobile:share.pendingList"))).toBeOnTheScreen();
  expect(screen.queryByTestId("qr-value")).toBeNull();
  expect(screen.queryByRole("button", { name: "Partager" })).toBeNull();
});

test("« Voir comme un invité » opens the app's guest view, without sending the member back to their list (011)", async () => {
  await renderShare({ ...list, readUrl: "https://api.example.test/en/l/rt" });
  await fireEvent.press(await screen.findByText(i18n.t("list:viewAsGuest")));
  expect(router.push).toHaveBeenCalledWith("/guest/rt?preview=1");
});

test("« Voir comme un invité » to another server than the app's: the browser", async () => {
  const openURL = jest.spyOn(Linking, "openURL").mockResolvedValue(undefined);
  await renderShare();
  await fireEvent.press(await screen.findByText(i18n.t("list:viewAsGuest")));
  expect(openURL).toHaveBeenCalledWith(READ_URL);
  openURL.mockRestore();
});

// 017 US1: inviting someone to manage the list.

test("the tab opens like the site's: title, description, then the invite link card", async () => {
  await renderShare();
  expect(await screen.findByText(i18n.t("list:share.title"))).toBeOnTheScreen();
  expect(screen.getByText(i18n.t("list:share.description"))).toBeOnTheScreen();
  expect(screen.getByText(i18n.t("list:share.collabTitle"))).toBeOnTheScreen();
  expect(screen.getByTestId("share.invite-link").props.value).toBe(INVITE_URL);
});

test("copying the invite link puts inviteUrl in the clipboard, then confirms", async () => {
  await renderShare();
  await fireEvent.press(await screen.findByTestId("share.copy-invite"));
  expect(Clipboard.setStringAsync).toHaveBeenCalledWith(INVITE_URL);
  expect(await screen.findByTestId("share.invite-copied")).toHaveTextContent("Lien copié.");
});

test("the invite link has its own share button, with the title and inviteUrl, without url", async () => {
  const share = jest.spyOn(Share, "share").mockResolvedValue({ action: "sharedAction", activityType: undefined });
  await renderShare();
  await fireEvent.press(await screen.findByTestId("share.share-invite"));
  expect(share).toHaveBeenCalledWith({ title: "Nos envies", message: `Rejoignez-moi pour gérer la liste « Nos envies » : ${INVITE_URL}` });
  // The public link's « Partager » still sends readUrl only.
  await fireEvent.press(screen.getByTestId("share.share"));
  expect(share).toHaveBeenLastCalledWith({ title: "Nos envies", message: `Nos envies — ${READ_URL}` });
});

test("inviting by email sends the address, confirms and empties the field", async () => {
  const server = await renderShare(list, { "POST /lists/w/invitations": () => new Response(null, { status: 202 }) });
  await fireEvent.changeText(await screen.findByTestId("share.invite-email"), " sam@example.test ");
  await fireEvent.press(screen.getByTestId("share.send-invite"));
  expect(await screen.findByTestId("share.invite-sent")).toHaveTextContent(i18n.t("list:inviteSent"));
  expect(screen.getByTestId("share.invite-email").props.value).toBe("");
  const request = server.mock.mock.calls.map(([input]) => input as Request).find((r) => r.method === "POST");
  expect(await request?.json()).toEqual({ email: "sam@example.test" });
});

test.each([
  [400, "emailRequired"],
  [403, "emailNotVerified"],
  [429, "rateLimited"],
  [502, "inviteSendFailed"],
  [503, "mailNotConfigured"],
])("a refused invitation (%i %s) shows the site's message and keeps the address", async (status, code) => {
  await renderShare(list, { "POST /lists/w/invitations": () => json(status, { error: { code, message: code } }) });
  await fireEvent.changeText(await screen.findByTestId("share.invite-email"), "sam@example.test");
  await fireEvent.press(screen.getByTestId("share.send-invite"));
  expect(await screen.findByTestId("share.invite-error")).toHaveTextContent(translateError(code));
  expect(screen.getByTestId("share.invite-email").props.value).toBe("sam@example.test");
  expect(screen.queryByTestId("share.invite-sent")).toBeNull();
});

test("while an invitation is sent, the button is busy: a second tap sends nothing more", async () => {
  let answer: (response: Response) => void = () => undefined;
  const server = await renderShare(list, { "POST /lists/w/invitations": () => new Promise<Response>((resolve) => (answer = resolve)) });
  await fireEvent.changeText(await screen.findByTestId("share.invite-email"), "sam@example.test");
  await fireEvent.press(screen.getByTestId("share.send-invite"));
  expect(screen.getByTestId("share.send-invite")).toBeDisabled();
  await fireEvent.press(screen.getByTestId("share.send-invite"));
  expect(server.calls.filter((call) => call === "POST /lists/w/invitations")).toHaveLength(1);
  answer(new Response(null, { status: 202 }));
  expect(await screen.findByTestId("share.invite-sent")).toBeOnTheScreen();
});

test("a list not sent yet shows no invite card", async () => {
  await enqueue({
    kind: "createList",
    listId: "new-list-id-00002",
    targetId: "new-list-id-00002",
    payload: { id: "new-list-id-00002", title: "Anniversaire", category: "Jeux", person: "Lou", categoryId: "c-new-list-00002", personId: "p-new-list-00002" },
  });
  await renderShare(null, {}, "new-list-id-00002");
  await screen.findByText(i18n.t("mobile:share.pendingList"));
  expect(screen.queryByTestId("share.invite-link")).toBeNull();
  expect(screen.queryByTestId("share.send-invite")).toBeNull();
});

test("offline: an explanation, invitation by email disabled, invite link still copyable and shareable", async () => {
  const share = jest.spyOn(Share, "share").mockResolvedValue({ action: "sharedAction", activityType: undefined });
  await renderShare();
  await screen.findByTestId("share.invite-link");
  await setOnline(false);
  expect(await screen.findByTestId("share.offline")).toHaveTextContent(i18n.t("mobile:sharing.offline"));
  expect(screen.getByTestId("share.send-invite")).toBeDisabled();
  await fireEvent.press(screen.getByTestId("share.copy-invite"));
  expect(Clipboard.setStringAsync).toHaveBeenCalledWith(INVITE_URL);
  await fireEvent.press(screen.getByTestId("share.share-invite"));
  expect(share).toHaveBeenCalled();
});

// 017 US2: members, removing one, leaving.

const team: Schemas["MemberList"] = {
  ...list,
  members: [
    { userId: "alex", displayName: "Alex", role: "owner" },
    { userId: "camille", displayName: "Camille", role: "member" },
    { userId: "sam", displayName: "", role: "member" },
  ],
};

async function renderTeam(body: Schemas["MemberList"], routes: Parameters<typeof fakeFetch>[0] = {}) {
  const server = await renderShare(body, routes);
  await screen.findByTestId("share.member-alex");
  return server;
}

test("each member with their role, in the server's order; « Membre » when the name is empty", async () => {
  await renderTeam(team);
  expect(screen.getByText(i18n.t("list:share.members"))).toBeOnTheScreen();
  expect(screen.getByTestId("share.member-alex")).toHaveTextContent("Alex — Propriétaire");
  expect(screen.getByTestId("share.member-camille")).toHaveTextContent(/^Camille — Membre/);
  expect(screen.getByTestId("share.member-sam")).toHaveTextContent(/^Membre — Membre/);
});

test("the owner can remove the others, not themself", async () => {
  await renderTeam(team);
  expect(screen.queryByTestId("share.remove-alex")).toBeNull();
  expect(screen.getByTestId("share.remove-camille")).toBeEnabled();
  expect(screen.getByTestId("share.remove-sam")).toBeEnabled();
});

test("a member who is not the owner removes no one", async () => {
  await renderTeam({ ...team, role: "member" });
  expect(screen.queryByTestId("share.remove-camille")).toBeNull();
  expect(screen.queryByTestId("share.remove-sam")).toBeNull();
  expect(screen.getByTestId("share.leave")).toBeEnabled();
});

test("removing, confirmed: the server is asked, then the list reloaded without the member", async () => {
  const after = { ...team, members: team.members.filter((member) => member.userId !== "camille") };
  let removed = false;
  await renderTeam(team);
  // The list is served without camille once removed.
  fakeFetch({
    "GET /lists/w": () => json(200, removed ? after : team),
    "DELETE /lists/w/members/camille": () => {
      removed = true;
      return new Response(null, { status: 204 });
    },
  });
  await fireEvent.press(screen.getByTestId("share.remove-camille"));
  expect(screen.getByText("Retirer Camille de la liste ?")).toBeOnTheScreen();
  await fireEvent.press(screen.getByTestId("share.remove-confirm"));
  await waitFor(() => expect(screen.queryByTestId("share.member-camille")).toBeNull());
  expect(removed).toBe(true);
});

test("« Garder ce membre » sends nothing", async () => {
  const server = await renderTeam(team);
  await fireEvent.press(screen.getByTestId("share.remove-camille"));
  await fireEvent.press(screen.getByTestId("share.remove-confirm-keep"));
  expect(server.calls).not.toContain("DELETE /lists/w/members/camille");
  expect(screen.getByTestId("share.member-camille")).toBeOnTheScreen();
});

test("leaving, confirmed: the list is left and the app goes back to « Mes listes »", async () => {
  jest.mocked(router.replace).mockClear();
  const server = await renderTeam({ ...team, role: "member" }, {
    "POST /lists/w/leave": () => new Response(null, { status: 204 }),
    "GET /lists": () => json(200, { lists: [], subscriptions: [] }),
  });
  await fireEvent.press(screen.getByTestId("share.leave"));
  // Nothing waits to be sent: no warning.
  expect(screen.queryByText(/pas encore envoyé/)).toBeNull();
  await fireEvent.press(screen.getByTestId("share.leave-confirm"));
  await waitFor(() => expect(router.replace).toHaveBeenCalledWith("/"));
  expect(server.calls).toContain("POST /lists/w/leave");
});

test("leaving with unsent changes on the list: the confirmation says they will be lost", async () => {
  await enqueue({ kind: "createItem", listId: "w", targetId: "a", payload: { id: "a", name: "Puzzle", typeId: "t", personId: "p" } });
  await enqueue({ kind: "createItem", listId: "w", targetId: "b", payload: { id: "b", name: "Lego", typeId: "t", personId: "p" } });
  await renderTeam({ ...team, role: "member" });
  await fireEvent.press(screen.getByTestId("share.leave"));
  expect(screen.getByText(/2 changements pas encore envoyés sur cette liste seront perdus\./)).toBeOnTheScreen();
});

test("alone in the list, leaving is refused with the site's message, and the app stays", async () => {
  jest.mocked(router.replace).mockClear();
  await renderTeam(
    { ...team, members: [team.members[0]] },
    { "POST /lists/w/leave": () => json(400, { error: { code: "aloneMustDelete", message: "x" } }) },
  );
  await fireEvent.press(screen.getByTestId("share.leave"));
  await fireEvent.press(screen.getByTestId("share.leave-confirm"));
  expect(await screen.findByTestId("share.members-error")).toHaveTextContent(translateError("aloneMustDelete"));
  expect(router.replace).not.toHaveBeenCalled();
});

test("while leaving, the button is busy: a second tap sends nothing more", async () => {
  let answer: (response: Response) => void = () => undefined;
  const server = await renderTeam({ ...team, role: "member" }, {
    "POST /lists/w/leave": () => new Promise<Response>((resolve) => (answer = resolve)),
    "GET /lists": () => json(200, { lists: [], subscriptions: [] }),
  });
  await fireEvent.press(screen.getByTestId("share.leave"));
  await fireEvent.press(screen.getByTestId("share.leave-confirm"));
  expect(screen.getByTestId("share.leave")).toBeDisabled();
  await fireEvent.press(screen.getByTestId("share.leave"));
  expect(screen.queryByTestId("share.leave-confirm")).toBeNull();
  expect(server.calls.filter((call) => call === "POST /lists/w/leave")).toHaveLength(1);
  answer(new Response(null, { status: 204 }));
  await waitFor(() => expect(router.replace).toHaveBeenCalledWith("/"));
});

test("offline: members stay visible, removing and leaving are disabled", async () => {
  await renderTeam(team);
  await setOnline(false);
  expect(await screen.findByTestId("share.offline")).toBeOnTheScreen();
  expect(screen.getByTestId("share.member-camille")).toBeOnTheScreen();
  expect(screen.getByTestId("share.remove-camille")).toBeDisabled();
  expect(screen.getByTestId("share.leave")).toBeDisabled();
});

// 017 US3: the read password, owner only.

async function renderOwner(body: Schemas["MemberList"], routes: Parameters<typeof fakeFetch>[0] = {}) {
  await renderShare(body, routes);
  await screen.findByTestId("share.password-state");
}

test("the owner sees the card, unprotected; saving sends the password, then the list says protected", async () => {
  let saved: unknown = null;
  await renderOwner(list);
  expect(screen.getByTestId("share.password-state")).toHaveTextContent(i18n.t("list:share.readPasswordUnset"));
  expect(screen.queryByTestId("share.clear-password")).toBeNull();
  fakeFetch({
    "GET /lists/w": () => json(200, { ...list, hasReadPassword: saved !== null }),
    "PUT /lists/w/read-password": async (request) => {
      saved = await request.json();
      return new Response(null, { status: 204 });
    },
  });
  await fireEvent.changeText(screen.getByTestId("share.read-password"), "secretliste");
  await fireEvent.press(screen.getByTestId("share.save-password"));
  expect(await screen.findByTestId("share.password-saved")).toHaveTextContent(i18n.t("list:share.readPasswordSaved"));
  expect(saved).toEqual({ password: "secretliste" });
  expect(screen.getByTestId("share.read-password").props.value).toBe("");
  expect(screen.getByTestId("share.password-state")).toHaveTextContent(i18n.t("list:share.readPasswordSet"));
  // The public link card says so too, without reloading the screen.
  expect(screen.getByTestId("password-notice")).toBeOnTheScreen();
});

test.each(["readPasswordTooShort", "passwordRequired"])("a refused password (%s) shows the site's message", async (code) => {
  await renderOwner(list, { "PUT /lists/w/read-password": () => json(400, { error: { code, message: code } }) });
  await fireEvent.changeText(screen.getByTestId("share.read-password"), "court");
  await fireEvent.press(screen.getByTestId("share.save-password"));
  expect(await screen.findByTestId("share.password-error")).toHaveTextContent(translateError(code));
  expect(screen.queryByTestId("share.password-saved")).toBeNull();
});

test("refused because the account is no longer the owner: the card goes, the message stays", async () => {
  await renderOwner(list);
  const server = fakeFetch({
    "GET /lists/w": () => json(200, { ...list, role: "member" }),
    "PUT /lists/w/read-password": () => json(403, { error: { code: "ownerSetReadPassword", message: "x" } }),
  });
  await fireEvent.changeText(screen.getByTestId("share.read-password"), "secretliste");
  await fireEvent.press(screen.getByTestId("share.save-password"));
  await waitFor(() => expect(server.calls).toContain("GET /lists/w"));
  await waitFor(() => expect(screen.queryByTestId("share.password-state")).toBeNull());
  expect(screen.getByTestId("share.password-error")).toHaveTextContent(translateError("ownerSetReadPassword"));
});

test("removing the password, confirmed: cleared, and the notice goes away", async () => {
  let cleared = false;
  await renderOwner({ ...list, hasReadPassword: true });
  fakeFetch({
    "GET /lists/w": () => json(200, { ...list, hasReadPassword: !cleared }),
    "DELETE /lists/w/read-password": () => {
      cleared = true;
      return new Response(null, { status: 204 });
    },
  });
  expect(screen.getByTestId("share.password-state")).toHaveTextContent(i18n.t("list:share.readPasswordSet"));
  await fireEvent.press(screen.getByTestId("share.clear-password"));
  expect(screen.getByText(i18n.t("list:confirm.clearPasswordTitle"))).toBeOnTheScreen();
  await fireEvent.press(screen.getByTestId("share.clear-password-confirm"));
  expect(await screen.findByTestId("share.password-cleared")).toHaveTextContent(i18n.t("list:share.readPasswordCleared"));
  expect(cleared).toBe(true);
  expect(screen.queryByTestId("password-notice")).toBeNull();
  expect(screen.queryByTestId("share.clear-password")).toBeNull();
});

test("« Garder le mot de passe » sends nothing", async () => {
  const server = fakeFetch({});
  await renderOwner({ ...list, hasReadPassword: true });
  await fireEvent.press(screen.getByTestId("share.clear-password"));
  await fireEvent.press(screen.getByTestId("share.clear-password-confirm-keep"));
  expect(server.calls).not.toContain("DELETE /lists/w/read-password");
});

test("a member who is not the owner has no password card, only the notice", async () => {
  await renderShare({ ...list, role: "member", hasReadPassword: true });
  expect(await screen.findByTestId("password-notice")).toBeOnTheScreen();
  expect(screen.queryByTestId("share.password-state")).toBeNull();
  expect(screen.queryByTestId("share.read-password")).toBeNull();
});

test("offline: the password cannot be changed", async () => {
  await renderOwner({ ...list, hasReadPassword: true });
  await setOnline(false);
  expect(screen.getByTestId("share.save-password")).toBeDisabled();
  expect(screen.getByTestId("share.clear-password")).toBeDisabled();
  expect(screen.getByTestId("share.read-password").props.editable).toBe(false);
});

test("the link « Gérer le partage sur le site » is gone: everything is in the app", async () => {
  await renderShare();
  await screen.findByTestId("share.invite-link");
  expect(screen.queryByText("Gérer le partage sur le site")).toBeNull();
});

// 017 US4: replacing the invite link, owner only.

test("the owner replaces the invite link after confirming: the new link shows", async () => {
  const NEW_URL = "https://ohyoushouldnt.example.test/inviter/new";
  let replaced = false;
  await renderOwner(list);
  expect(screen.getByText(i18n.t("list:share.regenerateHint"))).toBeOnTheScreen();
  fakeFetch({
    "GET /lists/w": () => json(200, { ...list, inviteUrl: replaced ? NEW_URL : INVITE_URL }),
    "POST /lists/w/invite-link": () => {
      replaced = true;
      return json(200, { inviteUrl: NEW_URL, inviteToken: "new" });
    },
  });
  await fireEvent.press(screen.getByTestId("share.regenerate"));
  expect(screen.getByText(i18n.t("list:confirm.regenTitle"))).toBeOnTheScreen();
  await fireEvent.press(screen.getByTestId("share.regenerate-confirm"));
  await waitFor(() => expect(screen.getByTestId("share.invite-link").props.value).toBe(NEW_URL));
});

test("« Conserver le lien » sends nothing", async () => {
  const server = fakeFetch({});
  await renderOwner(list);
  await fireEvent.press(screen.getByTestId("share.regenerate"));
  await fireEvent.press(screen.getByTestId("share.regenerate-confirm-keep"));
  expect(server.calls).not.toContain("POST /lists/w/invite-link");
});

test("a member who is not the owner cannot replace the link", async () => {
  await renderShare({ ...list, role: "member" });
  await screen.findByTestId("share.invite-link");
  expect(screen.queryByTestId("share.regenerate")).toBeNull();
});

test("refused because the account is no longer the owner: message, and the list reloaded as member", async () => {
  await renderOwner(list);
  const server = fakeFetch({
    "GET /lists/w": () => json(200, { ...list, role: "member" }),
    "POST /lists/w/invite-link": () => json(403, { error: { code: "ownerRegenerateInvite", message: "x" } }),
  });
  await fireEvent.press(screen.getByTestId("share.regenerate"));
  await fireEvent.press(screen.getByTestId("share.regenerate-confirm"));
  await waitFor(() => expect(server.calls).toContain("GET /lists/w"));
  expect(await screen.findByTestId("share.regenerate-error")).toHaveTextContent(translateError("ownerRegenerateInvite"));
  // Back to a member's view: the button goes, the message stays.
  await waitFor(() => expect(screen.queryByTestId("share.regenerate")).toBeNull());
  expect(screen.getByTestId("share.regenerate-error")).toBeOnTheScreen();
});

test("offline: replacing is disabled", async () => {
  await renderOwner(list);
  await setOnline(false);
  expect(screen.getByTestId("share.regenerate")).toBeDisabled();
});

// 017 US5: alone in the list, leaving offers the deletion.

test("alone, after the refusal, « Supprimer la liste » deletes the list and goes back to « Mes listes »", async () => {
  jest.mocked(router.replace).mockClear();
  const server = await renderTeam(
    { ...team, members: [team.members[0]] },
    {
      "POST /lists/w/leave": () => json(400, { error: { code: "aloneMustDelete", message: "x" } }),
      "DELETE /lists/w": () => new Response(null, { status: 204 }),
      "GET /lists": () => json(200, { lists: [], subscriptions: [] }),
    },
  );
  expect(screen.queryByTestId("share.alone-delete")).toBeNull();
  await fireEvent.press(screen.getByTestId("share.leave"));
  await fireEvent.press(screen.getByTestId("share.leave-confirm"));
  await fireEvent.press(await screen.findByTestId("share.alone-delete"));
  expect(screen.getByText("Supprimer « Nos envies » ?")).toBeOnTheScreen();
  await fireEvent.press(screen.getByTestId("share.delete-confirm"));
  await waitFor(() => expect(router.replace).toHaveBeenCalledWith("/"));
  expect(server.calls).toContain("DELETE /lists/w");
});

test("alone, after the refusal, « Supprimer la liste » is disabled once offline", async () => {
  await renderTeam(
    { ...team, members: [team.members[0]] },
    { "POST /lists/w/leave": () => json(400, { error: { code: "aloneMustDelete", message: "x" } }) },
  );
  await fireEvent.press(screen.getByTestId("share.leave"));
  await fireEvent.press(screen.getByTestId("share.leave-confirm"));
  expect(await screen.findByTestId("share.alone-delete")).toBeEnabled();
  await setOnline(false);
  expect(screen.getByTestId("share.alone-delete")).toBeDisabled();
});
