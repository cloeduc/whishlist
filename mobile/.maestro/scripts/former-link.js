// Site address (URL) → its former French form (feature 018) on the app's scheme (output.appLink):
// emails sent before the change still carry these addresses, and the app must keep opening them.
// The table comes from src/site/legacy-paths.json, through scripts/legacy-paths.generated.js (run it first).
const table = output.legacyPaths;
if (!table) throw new Error("Run scripts/legacy-paths.generated.js before former-link.js");

function formerPath(path) {
  for (const rule of table.paths) {
    if (rule.from.indexOf(":") !== -1) continue;
    if (path === rule.to || path.indexOf(rule.to + "/") === 0) return rule.from + path.slice(rule.to.length);
  }
  return path;
}

const match = URL.match(/^https?:\/\/[^/?#]+(\/[^?#]*)(\?[^#]*)?/);
if (!match) throw new Error("Site address expected: " + URL);
const former = formerPath(match[1]);
if (former === match[1]) throw new Error("No former form for: " + URL);
// The return path was `suite` before 018, and its value was a former address too.
const returnParam = table.params.filter((rule) => rule.to === "next" && rule.from !== "next")[0];
const query = (match[2] || "").replace(/([?&])next=([^&]*)/, (all, separator, value) =>
  separator + returnParam.from + "=" + encodeURIComponent(formerPath(decodeURIComponent(value))),
);
output.appLink = "ohyoushouldnt:/" + former + query;
