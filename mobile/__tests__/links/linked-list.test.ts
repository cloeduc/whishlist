import { linkedListTarget } from "@/links/linked-list";

const data = {
  lists: [{ id: "mine" }, { id: "both" }],
  subscriptions: [
    { id: "followed", readToken: "read-followed" },
    { id: "both", readToken: "read-both" },
  ],
};

test("a member opens the list", () => {
  expect(linkedListTarget("mine", undefined, data)).toEqual({ kind: "screen", path: "/lists/mine" });
});

test("a member opens the screen of the tab named by the address", () => {
  expect(linkedListTarget("mine", "sharing", data)).toEqual({ kind: "screen", path: "/lists/mine/share" });
  expect(linkedListTarget("mine", "archive", data)).toEqual({ kind: "screen", path: "/lists/mine/archives" });
  expect(linkedListTarget("mine", "reservations", data)).toEqual({ kind: "screen", path: "/lists/mine/reservations" });
  expect(linkedListTarget("mine", "settings", data)).toEqual({ kind: "screen", path: "/lists/mine/settings" });
  expect(linkedListTarget("mine", "ideas", data)).toEqual({ kind: "screen", path: "/lists/mine" });
});

test("a former French tab value and an unknown tab", () => {
  expect(linkedListTarget("mine", "partage", data)).toEqual({ kind: "screen", path: "/lists/mine/share" });
  expect(linkedListTarget("mine", "nope", data)).toEqual({ kind: "screen", path: "/lists/mine" });
});

test("the site's /lists/new opens « Nouvelle liste »", () => {
  expect(linkedListTarget("new", undefined, data)).toEqual({ kind: "screen", path: "/lists/new" });
});

test("a list both managed and followed opens as a member", () => {
  expect(linkedListTarget("both", undefined, data)).toEqual({ kind: "screen", path: "/lists/both" });
});

test("a follower gets the help screen with the followed list", () => {
  expect(linkedListTarget("followed", "sharing", data)).toEqual({ kind: "help", followedReadToken: "read-followed" });
});

test("anyone else, or an unknown list, gets the help screen alone", () => {
  expect(linkedListTarget("someone-else", undefined, data)).toEqual({ kind: "help", followedReadToken: null });
  expect(linkedListTarget("x", undefined, { lists: [], subscriptions: [] })).toEqual({ kind: "help", followedReadToken: null });
});
