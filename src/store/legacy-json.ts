import { readFileSync } from "node:fs";
import { resolveTheme } from "../domain/theme";
import type { Database } from "../domain/types";

/** The old file cannot be imported; `problems` only cites collections and identifiers. */
export class LegacyImportError extends Error {
  readonly problems: string[];

  constructor(file: string, problems: string[]) {
    super(`Cannot import ${file}:\n- ${problems.join("\n- ")}`);
    this.name = "LegacyImportError";
    this.problems = problems;
  }
}

const REQUIRED = ["users", "wishlists", "memberships", "types", "people", "views", "items", "reservations"] as const;
const OPTIONAL = ["subscriptions", "passwordResets", "apiSessions", "emailConfirmations", "apiKeys"] as const;

/**
 * Expected shape of each field in the old file, before normalization.
 * `?`: may be missing (normalized later, or a column that accepts NULL); an array: allowed values.
 */
type FieldCheck = "string" | "string?" | "number" | "number?" | "boolean" | "boolean?" | "string[]" | readonly string[];

const FIELDS: { [K in keyof Database]: Record<string, FieldCheck> } = {
  users: {
    id: "string",
    email: "string",
    passwordHash: "string",
    displayName: "string",
    createdAt: "string",
    mustChangePassword: "boolean?",
    sessionVersion: "number?",
    emailVerifiedAt: "string?",
  },
  wishlists: {
    id: "string",
    title: "string",
    subtitle: "string?",
    coverImageUrl: "string?",
    readToken: "string",
    inviteToken: "string",
    readPasswordHash: "string?",
    fromTemplate: "boolean",
    createdAt: "string",
  },
  memberships: { wishlistId: "string", userId: "string", role: ["owner", "member"], joinedAt: "string" },
  subscriptions: {
    wishlistId: "string",
    userId: "string",
    readPasswordHash: "string?",
    createdAt: "string",
  },
  types: { id: "string", wishlistId: "string", label: "string", sortOrder: "number?" },
  people: { id: "string", wishlistId: "string", label: "string" },
  views: {
    id: "string",
    wishlistId: "string",
    label: "string",
    kind: ["all", "types", "person"],
    typeIds: "string[]",
    personId: "string?",
    pinned: "boolean",
  },
  items: {
    id: "string",
    wishlistId: "string",
    name: "string",
    typeId: "string",
    url: "string?",
    imageUrl: "string?",
    priceCents: "number?",
    priority: "string?",
    secondHandOk: "boolean?",
    description: "string?",
    personId: "string",
    sortOrder: "number",
    archived: "boolean?",
  },
  reservations: {
    id: "string",
    wishlistId: "string",
    itemId: "string",
    fromName: "string?",
    note: "string?",
    userId: "string?",
    createdAt: "string",
  },
  passwordResets: { id: "string", userId: "string", tokenHash: "string", expiresAt: "string", createdAt: "string" },
  apiSessions: {
    id: "string",
    userId: "string",
    tokenHash: "string",
    sessionVersion: "number",
    createdAt: "string",
    expiresAt: "string",
  },
  emailConfirmations: {
    id: "string",
    userId: "string",
    purpose: ["verify", "change"],
    email: "string",
    tokenHash: "string",
    expiresAt: "string",
    createdAt: "string",
  },
  apiKeys: {
    id: "string",
    userId: "string",
    name: "string",
    tokenHash: "string",
    hint: "string",
    createdAt: "string",
    lastUsedAt: "string?",
  },
};

function fieldOk(value: unknown, check: FieldCheck): boolean {
  if (typeof check !== "string") return typeof value === "string" && check.includes(value);
  const optional = check.endsWith("?");
  if (optional && (value === undefined || value === null)) return true;
  switch (check.replace("?", "")) {
    case "string":
      return typeof value === "string";
    case "number":
      return typeof value === "number" && Number.isFinite(value);
    case "boolean":
      return typeof value === "boolean";
    case "string[]":
      return Array.isArray(value) && value.every((entry) => typeof entry === "string");
    default:
      return false;
  }
}

/** Required fields present and of the right type; only cites the collection, the identifier and the field. */
function checkFields(raw: Record<string, unknown>): string[] {
  const problems: string[] = [];
  for (const name of [...REQUIRED, ...OPTIONAL]) {
    const rows = raw[name];
    if (!Array.isArray(rows)) continue;
    rows.forEach((row: unknown, index) => {
      if (!row || typeof row !== "object" || Array.isArray(row)) {
        problems.push(`${name}: #${index} n'est pas un objet`);
        return;
      }
      const values = new Map(Object.entries(row));
      const id = values.get("id");
      const label =
        name === "memberships" || name === "subscriptions"
          ? `${String(values.get("wishlistId"))}/${String(values.get("userId"))}`
          : typeof id === "string"
            ? id
            : `#${index}`;
      for (const [field, check] of Object.entries(FIELDS[name])) {
        if (!fieldOk(values.get(field), check)) problems.push(`${name}: ${label} → ${field} missing or invalid`);
      }
    });
  }
  return problems;
}

/** Fills in the fields added over the versions (formerly the JSON file read). */
export function normalizeDocument(doc: Database): Database {
  if (!doc.subscriptions) doc.subscriptions = [];
  if (!doc.passwordResets) doc.passwordResets = [];
  if (!doc.apiSessions) doc.apiSessions = [];
  if (!doc.emailConfirmations) doc.emailConfirmations = [];
  if (!doc.apiKeys) doc.apiKeys = [];
  for (const subscription of doc.subscriptions) {
    if (subscription.readPasswordHash === undefined) subscription.readPasswordHash = null;
  }
  for (const user of doc.users) {
    // Accounts from before address validation: verified by default (010, FR-005b).
    if (user.emailVerifiedAt === undefined) user.emailVerifiedAt = user.createdAt;
    if (user.mustChangePassword === undefined) user.mustChangePassword = false;
    if (typeof user.sessionVersion !== "number") user.sessionVersion = 0;
  }
  for (const list of doc.wishlists) {
    if (list.subtitle === undefined) list.subtitle = null;
    if (list.coverImageUrl === undefined) list.coverImageUrl = null;
    if (list.readPasswordHash === undefined) list.readPasswordHash = null;
    list.theme = resolveTheme(list.theme);
  }
  for (const item of doc.items) {
    if (item.imageUrl === undefined) item.imageUrl = null;
    if (item.archived === undefined) item.archived = false;
    if (item.secondHandOk === undefined) item.secondHandOk = false;
    if (item.description === undefined) item.description = null;
  }
  const typesByList = new Map<string, typeof doc.types>();
  for (const type of doc.types) {
    if (typeof type.sortOrder !== "number") type.sortOrder = 0;
    const bucket = typesByList.get(type.wishlistId) ?? [];
    bucket.push(type);
    typesByList.set(type.wishlistId, bucket);
  }
  for (const types of typesByList.values()) {
    const needsOrder = types.every((type) => type.sortOrder === 0);
    if (!needsOrder) continue;
    [...types]
      .sort((a, b) => a.label.localeCompare(b.label, "fr") || a.id.localeCompare(b.id))
      .forEach((type, index) => {
        type.sortOrder = index;
      });
  }
  for (const reservation of doc.reservations) {
    if (reservation.userId === undefined) reservation.userId = null;
  }
  return doc;
}

/** Groups of identifiers that share the same `key` value (null values ignored). */
function duplicates<T>(rows: T[], key: (row: T) => string | null, id: (row: T) => string): string[][] {
  const seen = new Map<string, string[]>();
  for (const row of rows) {
    const value = key(row);
    if (value === null) continue;
    seen.set(value, [...(seen.get(value) ?? []), id(row)]);
  }
  return [...seen.values()].filter((ids) => ids.length > 1);
}

/**
 * Integrity check (data-model.md): duplicates, uniqueness, references.
 * One line per problem; never an email, a name or a token in the message.
 */
export function checkDocument(doc: Database): string[] {
  const problems: string[] = [];
  const byId = (row: { id: string }) => row.id;
  const doubled = (name: string, label: string, groups: string[][]) => {
    for (const group of groups) problems.push(`${name}: ${label} (${group.join(", ")})`);
  };
  // A duplicate identifier: citing it once is enough.
  const sameId = (groups: string[][]) => groups.map((group) => [group[0]]);
  const idDoubled = (name: string, rows: { id: string }[]) =>
    doubled(name, "duplicate id", sameId(duplicates(rows, byId, byId)));

  idDoubled("users", doc.users);
  idDoubled("wishlists", doc.wishlists);
  idDoubled("types", doc.types);
  idDoubled("people", doc.people);
  idDoubled("views", doc.views);
  idDoubled("items", doc.items);
  idDoubled("reservations", doc.reservations);
  idDoubled("passwordResets", doc.passwordResets);
  idDoubled("apiSessions", doc.apiSessions);
  idDoubled("emailConfirmations", doc.emailConfirmations);
  idDoubled("apiKeys", doc.apiKeys);
  const membership = (m: Database["memberships"][number]) => `${m.wishlistId}/${m.userId}`;
  doubled("memberships", "duplicate membership", sameId(duplicates(doc.memberships, membership, membership)));
  const subscription = (s: Database["subscriptions"][number]) => `${s.wishlistId}/${s.userId}`;
  doubled("subscriptions", "duplicate subscription", sameId(duplicates(doc.subscriptions ?? [], subscription, subscription)));

  doubled("users", "duplicate email", duplicates(doc.users, (u) => u.email, byId));
  doubled("wishlists", "duplicate readToken", duplicates(doc.wishlists, (w) => w.readToken, byId));
  doubled("wishlists", "duplicate inviteToken", duplicates(doc.wishlists, (w) => w.inviteToken, byId));
  doubled("passwordResets", "duplicate tokenHash", duplicates(doc.passwordResets, (r) => r.tokenHash, byId));
  doubled("apiSessions", "duplicate tokenHash", duplicates(doc.apiSessions, (s) => s.tokenHash, byId));
  doubled("apiKeys", "duplicate tokenHash", duplicates(doc.apiKeys, (k) => k.tokenHash, byId));
  doubled(
    "emailConfirmations",
    "duplicate tokenHash",
    duplicates(doc.emailConfirmations, (c) => c.tokenHash, byId),
  );
  doubled(
    "emailConfirmations",
    "several requests with the same purpose for one account",
    duplicates(doc.emailConfirmations, (c) => `${c.userId}/${c.purpose}`, byId),
  );
  doubled(
    "reservations",
    "several reservations for the same idea",
    duplicates(doc.reservations, (r) => r.itemId, byId),
  );

  const ids = (rows: { id: string }[]) => new Set(rows.map(byId));
  const users = ids(doc.users);
  const lists = ids(doc.wishlists);
  const types = ids(doc.types);
  const people = ids(doc.people);
  const items = ids(doc.items);
  const missing = (name: string, id: string, field: string, value: string) =>
    problems.push(`${name}: ${id} → ${field} missing (${value})`);

  for (const m of doc.memberships) {
    if (!lists.has(m.wishlistId)) missing("memberships", membership(m), "wishlistId", m.wishlistId);
    if (!users.has(m.userId)) missing("memberships", membership(m), "userId", m.userId);
  }
  for (const s of doc.subscriptions ?? []) {
    if (!lists.has(s.wishlistId)) missing("subscriptions", subscription(s), "wishlistId", s.wishlistId);
    if (!users.has(s.userId)) missing("subscriptions", subscription(s), "userId", s.userId);
  }
  const inList = (name: string, rows: { id: string; wishlistId: string }[]) => {
    for (const row of rows) if (!lists.has(row.wishlistId)) missing(name, row.id, "wishlistId", row.wishlistId);
  };
  inList("types", doc.types);
  inList("people", doc.people);
  inList("views", doc.views);
  inList("items", doc.items);
  inList("reservations", doc.reservations);
  for (const view of doc.views) {
    for (const typeId of view.typeIds) if (!types.has(typeId)) missing("views", view.id, "typeIds", typeId);
    if (view.personId !== null && !people.has(view.personId)) missing("views", view.id, "personId", view.personId);
  }
  for (const item of doc.items) {
    if (!types.has(item.typeId)) missing("items", item.id, "typeId", item.typeId);
    if (!people.has(item.personId)) missing("items", item.id, "personId", item.personId);
  }
  for (const reservation of doc.reservations) {
    if (!items.has(reservation.itemId)) missing("reservations", reservation.id, "itemId", reservation.itemId);
    if (reservation.userId !== null && !users.has(reservation.userId)) {
      missing("reservations", reservation.id, "userId", reservation.userId);
    }
  }
  const ofUser = (name: string, rows: { id: string; userId: string }[]) => {
    for (const row of rows) if (!users.has(row.userId)) missing(name, row.id, "userId", row.userId);
  };
  ofUser("passwordResets", doc.passwordResets);
  ofUser("apiSessions", doc.apiSessions);
  ofUser("emailConfirmations", doc.emailConfirmations);
  ofUser("apiKeys", doc.apiKeys);
  return problems;
}

/**
 * The JSON.parse message quotes an excerpt of the file (so sometimes an email or a hash):
 * only the position is kept.
 */
function parseErrorPosition(error: unknown): string {
  const message = error instanceof Error ? error.message : "";
  const lineColumn = /line (\d+) column (\d+)/.exec(message);
  if (lineColumn) return ` (line ${lineColumn[1]}, column ${lineColumn[2]})`;
  const position = /position (\d+)/.exec(message);
  return position ? ` (position ${position[1]})` : "";
}

/** Reads, checks and normalizes an old file. Never changes it. */
export function loadLegacyDocument(file: string): Database {
  let text: string;
  try {
    text = readFileSync(/*turbopackIgnore: true*/ file, "utf8");
  } catch {
    throw new LegacyImportError(file, ["unreadable file"]);
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch (error) {
    throw new LegacyImportError(file, [`invalid JSON${parseErrorPosition(error)}`]);
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new LegacyImportError(file, ["the file does not contain a JSON object"]);
  }
  const raw = new Map(Object.entries(parsed));
  const absent = REQUIRED.filter((name) => !Array.isArray(raw.get(name)));
  const wrong = OPTIONAL.filter((name) => raw.get(name) !== undefined && !Array.isArray(raw.get(name)));
  if (absent.length > 0 || wrong.length > 0) {
    throw new LegacyImportError(
      file,
      [...absent, ...wrong].map((name) => `${name}: collection missing or not an array`),
    );
  }
  const fieldProblems = checkFields(Object.fromEntries(raw));
  if (fieldProblems.length > 0) throw new LegacyImportError(file, fieldProblems);
  // Collections and fields checked above: the content has the shape of a Database (old fields filled in afterwards).
  const doc = normalizeDocument(parsed as Database);
  const problems = checkDocument(doc);
  if (problems.length > 0) throw new LegacyImportError(file, problems);
  return doc;
}
