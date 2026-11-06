import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { join } from "node:path";
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
