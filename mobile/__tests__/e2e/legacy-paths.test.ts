import { readFileSync } from "node:fs";
import { join } from "node:path";
import { runInNewContext } from "node:vm";

import { readLegacyPaths, renderLegacyPathsScript } from "../../scripts/e2e/legacy-paths.cjs";

const repoRoot = join(__dirname, "../../..");
const formerLink = readFileSync(join(__dirname, "../../.maestro/scripts/former-link.js"), "utf8");

/** Runs the two Maestro scripts as Maestro does: one shared `output`, the script's env as globals. */
function formerAppLink(url: string): string {
  const output: Record<string, unknown> = {};
  runInNewContext(renderLegacyPathsScript(readLegacyPaths(repoRoot)), { output });
  runInNewContext(formerLink, { output, URL: url });
  return output.appLink as string;
}

describe("former site addresses for the e2e flows (018)", () => {
  it("turns an emailed link into its former French form, from the table", () => {
    expect(formerAppLink("http://localhost:3010/confirm-email/tok?next=%2Finvite%2Fit")).toBe(
      "ohyoushouldnt://confirmer-email/tok?suite=%2Finviter%2Fit",
    );
    expect(formerAppLink("http://localhost:3010/reset-password/tok")).toBe("ohyoushouldnt://reinitialiser/tok");
    expect(formerAppLink("http://localhost:3010/invite/tok")).toBe("ohyoushouldnt://inviter/tok");
  });

  it("refuses an address that has no former form", () => {
    expect(() => formerAppLink("http://localhost:3010/faq")).toThrow();
  });
});
