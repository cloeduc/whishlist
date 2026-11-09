import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import * as formState from "../../src/server/form-state";
import { keptValues, refusal } from "../../src/server/form-state";

function form(entries: Record<string, string | Blob>): FormData {
  const data = new FormData();
  for (const [name, value] of Object.entries(entries)) data.append(name, value);
  return data;
}

test("keptValues returns exactly the listed fields", () => {
  const data = form({ email: "ana@example.test", displayName: "Ana", next: "/lists" });
  assert.deepEqual(keptValues(data, ["email", "displayName"]), {
    email: "ana@example.test",
    displayName: "Ana",
  });
});

test("keptValues gives an empty string for a missing field or a file", () => {
  const data = form({ cover: new Blob(["x"]) });
  assert.deepEqual(keptValues(data, ["title", "cover"]), { title: "", cover: "" });
});

test("keptValues never returns a field that is not listed, such as a password", () => {
  const data = form({ email: "ana@example.test", password: "secret-secret" });
  const values = keptValues(data, ["email"]);
  assert.equal("password" in values, false);
});

test("refusal keeps the listed fields and counts the attempts", () => {
  const data = form({ email: "ana@example.test", password: "short" });
  const first = refusal(null, "password", data, ["email"]);
  assert.deepEqual(first, { error: "password", values: { email: "ana@example.test" }, attempt: 1 });
  assert.equal(refusal(first, "password", data, ["email"]).attempt, 2);
});

test("no list of kept fields holds a password or the anti-bot field", () => {
  const lists = (Object.entries(formState) as [string, unknown][]).filter(
    (entry): entry is [string, readonly string[]] => entry[0].endsWith("_KEPT_FIELDS") && Array.isArray(entry[1]),
  );
  assert.equal(lists.length, 13);
  for (const [name, fields] of lists) {
    for (const field of fields) {
      assert.doesNotMatch(field, /password|confirm/i, `${name} keeps ${field}`);
      assert.notEqual(field, "website", `${name} keeps the anti-bot field`);
    }
  }
});

// Static check of src/server/actions.ts (it cannot run outside Next: cookies, redirect): each
// action refuses with its own list of kept fields, and the cases that are not a refusal stay a redirect.
const actionsSource = readFileSync(join(import.meta.dirname, "../../src/server/actions.ts"), "utf8");

function actionBody(name: string): string {
  const start = actionsSource.indexOf(`export async function ${name}(`);
  assert.notEqual(start, -1, `${name} not found in actions.ts`);
  const next = actionsSource.indexOf("\nexport ", start + 1);
  return actionsSource.slice(start, next === -1 ? undefined : next);
}

const KEPT_FIELDS_BY_ACTION: Record<string, string> = {
  registerAction: "REGISTER_KEPT_FIELDS",
  loginAction: "LOGIN_KEPT_FIELDS",
  requestPasswordResetAction: "FORGOT_PASSWORD_KEPT_FIELDS",
  resetPasswordAction: "RESET_PASSWORD_KEPT_FIELDS",
  changePasswordAction: "CHANGE_PASSWORD_KEPT_FIELDS",
  updateDisplayNameAction: "DISPLAY_NAME_KEPT_FIELDS",
  requestEmailChangeAction: "EMAIL_CHANGE_KEPT_FIELDS",
  createListAction: "NEW_LIST_KEPT_FIELDS",
  updateWishlistSettingsAction: "LIST_SETTINGS_KEPT_FIELDS",
  reserveAction: "RESERVATION_KEPT_FIELDS",
  unlockPublicListAction: "READ_UNLOCK_KEPT_FIELDS",
  sendInviteAction: "INVITE_EMAIL_KEPT_FIELDS",
  setReadPasswordAction: "READ_PASSWORD_KEPT_FIELDS",
};

test("each form action refuses with its own list of kept fields", () => {
  assert.equal(Object.keys(KEPT_FIELDS_BY_ACTION).length, 13);
  for (const [action, list] of Object.entries(KEPT_FIELDS_BY_ACTION)) {
    const lists = [...actionBody(action).matchAll(/refusal\([^)]*?\b(\w+_KEPT_FIELDS)\)/g)].map((match) => match[1]);
    assert.ok(lists.length > 0, `${action} never calls refusal()`);
    for (const used of lists) assert.equal(used, list, `${action} refuses with ${used}`);
  }
});

test("a filled anti-bot field and a missing list stay redirects, not refusals", () => {
  const reserve = actionBody("reserveAction");
  const honeypot = reserve.indexOf('formData.get("website")');
  assert.notEqual(honeypot, -1);
  assert.match(reserve.slice(honeypot, honeypot + 200), /return localeRedirect\(`\/l\/\$\{readToken\}\?ok=1`\)/);
  assert.ok(honeypot < reserve.indexOf("refusal("), "the anti-bot check comes before any refusal");
  assert.match(reserve, /"listMissing"\) return localeRedirect\("\/"\)/);
  assert.match(reserve, /"readPasswordRequired"\) return localeRedirect\(`\/l\/\$\{readToken\}`\)/);
  assert.match(actionBody("unlockPublicListAction"), /"listMissing"\) return localeRedirect\("\/"\)/);
});
