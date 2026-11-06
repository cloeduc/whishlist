import { readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";

const mobile = join(__dirname, "../..");

function files(dir: string, extension: string): string[] {
  return readdirSync(dir, { withFileTypes: true, recursive: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith(extension))
    .map((entry) => join(entry.parentPath, entry.name));
}

/** testIDs of the code: literals (`testID="a"`, `testID={"a"}`) and prefixes of dynamic identifiers (`` `a-${x}` ``). */
function declaredIds() {
  const literals = new Set<string>();
  const prefixes = new Set<string>();
  for (const file of [...files(join(mobile, "app"), ".tsx"), ...files(join(mobile, "src"), ".tsx")]) {
    const source = readFileSync(file, "utf8");
    // `testID`, and the props that pass it on to an inner element (`errorTestID` of `Field`).
    for (const match of source.matchAll(/\b(?:testID|[a-z]\w*TestID)=(?:"([^"]+)"|\{\s*"([^"]+)"\s*\}|\{\s*`([^`]+)`\s*\})/g)) {
      const template = match[3];
      if (template === undefined) literals.add(match[1] ?? match[2]);
      else if (!template.startsWith("${")) prefixes.add(template.split("${")[0]);
    }
  }
  return { literals, prefixes };
}

/** `id:` values of the flows and subflows, with their file. */
function usedIds() {
  const used: { id: string; file: string }[] = [];
  for (const dir of ["flows", "subflows"]) {
    for (const file of files(join(mobile, ".maestro", dir), ".yaml")) {
      for (const match of readFileSync(file, "utf8").matchAll(/^\s*id:\s*["']?([^"'\s#]+)/gm)) {
        // An `id:` is a regex: we strip its escapes (`lists\\.card-…`) before comparing it.
        used.push({ id: match[1].replace(/\\/g, ""), file: relative(mobile, file) });
      }
    }
  }
  return used;
}

// System elements (iOS share sheet, Safari) and dev client elements (developer menu), absent from the app's code.
const systemIds = new Set(["ShareSheet.RemoteContainerView", "PopoverDismissRegion", "shareCell", "MoreMenuButton", "ShareButton", "xmark"]);

test("every id: used by a flow is a testID of the app", () => {
  const { literals, prefixes } = declaredIds();
  const known = (id: string) =>
    systemIds.has(id) ||
    // Android identifiers (`<package>:id/<name>`), specific to the system.
    id.includes(":id/") ||
    literals.has(id) ||
    // `Button` sets `<testID>-box` on its box, `ConfirmDialog` `<testID>-keep` on « Conserver »,
    // `CollapsibleCard` `<testID>-toggle` on its header, `-chevron` on the indicator and `-content` on its content,
    // `PasswordForm` `<testID>-current`, `-next`, `-confirm` and `-submit` on its fields and its button,
    // `PasswordInput` `<testID>-reveal` on its eye.
    ["-box", "-keep", "-toggle", "-chevron", "-content", "-current", "-next", "-confirm", "-submit", "-reveal"].some((suffix) => id.endsWith(suffix) && literals.has(id.slice(0, -suffix.length))) ||
    [...prefixes].some((prefix) => id.startsWith(prefix) && id.length > prefix.length);
  const used = usedIds();
  expect(used.length).toBeGreaterThan(20);
  expect(used.filter(({ id }) => !known(id))).toEqual([]);
});

test("no testID holds an e-mail address or a space", () => {
  const { literals, prefixes } = declaredIds();
  expect([...literals, ...prefixes].filter((id) => /[@\s]/.test(id))).toEqual([]);
});
