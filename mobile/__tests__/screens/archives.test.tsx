import { render, screen } from "@testing-library/react-native";

import Archives from "../../app/(app)/lists/[listId]/archives";
import type { Schemas } from "@/api/client";
import { resetStore } from "@/data/store";
import { ListProvider } from "@/features/lists/ListContext";
import { i18n } from "@/i18n";
import { putSnapshot } from "@/offline/snapshot";

import { fakeFetch, json } from "../helpers/fetch";
import { freshDb } from "../helpers/memory-db";

jest.mock("expo-router", () => ({
  router: { push: jest.fn(), replace: jest.fn(), back: jest.fn(), canGoBack: () => true },
  useFocusEffect: jest.fn(),
}));
jest.mock("react-native-safe-area-context", () => require("react-native-safe-area-context/jest/mock").default);

function item(id: string): Schemas["MemberItem"] {
  return {
    id,
    name: `Idée ${id}`,
    typeId: "t",
    personId: "p",
    url: null,
    imageUrl: null,
    priceCents: null,
    priceLabel: null,
    priority: null,
    secondHandOk: false,
    description: null,
    archived: true,
    sortOrder: 0,
  };
}

const list: Schemas["MemberList"] = {
  id: "w",
  title: "Nos envies",
  subtitle: null,
  coverImageUrl: null,
  theme: {},
  role: "owner",
  readUrl: "https://ohyoushouldnt.example.test/l/rt",
  inviteUrl: "https://ohyoushouldnt.example.test/i/it",
  hasReadPassword: false,
  categories: [{ id: "t", label: "Jeux", sortOrder: 0 }],
  people: [{ id: "p", label: "Alex" }],
  items: [item("archived"), item("taken")],
  reservations: [
    { id: "r", itemId: "taken", itemName: "Idée taken", fromName: "Sam", note: null, createdAt: "2026-01-02T00:00:00.000Z" },
  ],
  members: [],
};

beforeEach(async () => {
  await freshDb();
  resetStore();
  await i18n.changeLanguage("fr");
});

test("a reserved idea in the archives says to cancel its reservation instead of offering « Remettre dans la liste » (020)", async () => {
  await putSnapshot("list:w", list);
  fakeFetch({ "GET /lists/w": () => json(200, list) });
  await render(
    <ListProvider listId="w">
      <Archives />
    </ListProvider>,
  );
  expect(await screen.findByTestId("archives.item-taken")).toBeTruthy();
  expect(screen.getAllByTestId("archives.restore")).toHaveLength(1);
  expect(screen.getByTestId("archives.reserved-hint")).toHaveTextContent(i18n.t("list:archives.reservedHint"));
});
