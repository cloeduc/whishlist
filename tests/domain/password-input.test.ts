import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";
import { test } from "node:test";

const renderer = join(import.meta.dirname, "helpers/render-password-input.tsx");

/** Server-rendered HTML of the site's PasswordInput (what a browser without JavaScript gets). */
function render(props: Record<string, unknown>, locale = "fr"): string {
  return execFileSync(process.execPath, ["--import", "tsx", renderer, locale, JSON.stringify(props)], {
    encoding: "utf8",
  });
}

/** Attributes of the first `<tag …>` of the HTML, names in lower case (HTML ignores their case). */
function attributes(html: string, tag: string): Map<string, string> {
  const element = new RegExp(`<${tag}\\b([^>]*)>`).exec(html);
  assert.ok(element, `no <${tag}> in ${html}`);
  return new Map([...element[1].matchAll(/([\w-]+)(?:="([^"]*)")?/g)].map((match) => [match[1].toLowerCase(), match[2] ?? ""]));
}

test("the password field is masked and the keyboard neither capitalises nor corrects", () => {
  const input = attributes(render({ id: "password", name: "password", autoComplete: "current-password", required: true }), "input");
  assert.equal(input.get("type"), "password");
  assert.equal(input.get("autocapitalize"), "none");
  assert.equal(input.get("autocorrect"), "off");
  assert.equal(input.get("spellcheck"), "false");
  assert.equal(input.get("autocomplete"), "current-password");
  assert.equal(input.get("name"), "password");
  assert.ok(input.has("required"));
});

test("the password field keeps a new-password hint and ignores a type passed by the caller", () => {
  const input = attributes(render({ id: "password", autoComplete: "new-password", type: "text", autoCapitalize: "sentences" }), "input");
  assert.equal(input.get("type"), "password");
  assert.equal(input.get("autocapitalize"), "none");
  assert.equal(input.get("autocomplete"), "new-password");
});

test("the eye is a button that never submits the form, labelled for the masked state, in French (FR-003, FR-004)", () => {
  const html = render({ id: "password", name: "password" });
  const button = attributes(html, "button");
  assert.equal(button.get("type"), "button");
  assert.equal(button.get("aria-controls"), "password");
  assert.equal(button.get("aria-label"), "Afficher le mot de passe");
  assert.equal(attributes(html, "svg").get("aria-hidden"), "true");
  // The text stops before the eye (long password).
  assert.match(attributes(html, "input").get("class") ?? "", /\bpr-11\b/);
});

test("the eye's label in English (FR-003)", () => {
  assert.equal(attributes(render({ id: "password" }, "en"), "button").get("aria-label"), "Show password");
});

test("the hide label exists in both languages", async () => {
  const { resources } = await import("../../src/i18n/resources");
  assert.equal(resources.fr.common.passwordField.hide, "Masquer le mot de passe");
  assert.equal(resources.en.common.passwordField.hide, "Hide password");
});

// Spec 016, FR-009: every password field of the site goes through `PasswordInput`.
test("no password field outside PasswordInput, and the 10 fields of the spec use it", () => {
  const root = join(import.meta.dirname, "../..");
  const files = ["components", "app"].flatMap((dir) =>
    readdirSync(join(root, dir), { withFileTypes: true, recursive: true })
      .filter((entry) => entry.isFile() && entry.name.endsWith(".tsx"))
      .map((entry) => relative(root, join(entry.parentPath, entry.name))),
  );
  const own = "components/ui/password-input.tsx";
  const masked = files.filter((file) => file !== own && /type=["{]*password/.test(readFileSync(join(root, file), "utf8")));
  assert.deepEqual(masked, []);
  const uses = files.flatMap((file) => [...readFileSync(join(root, file), "utf8").matchAll(/<PasswordInput\b/g)].map(() => file));
  assert.equal(uses.length, 10, uses.join("\n"));
});
