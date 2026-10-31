import { readFileSync } from "node:fs";
import { join } from "node:path";

import licenses from "@/legal/licenses.json";

test("every direct dependency of the app has its license and its text (npm run licenses after a change)", () => {
  const { dependencies } = JSON.parse(readFileSync(join(__dirname, "../../package.json"), "utf8")) as {
    dependencies: Record<string, string>;
  };
  for (const name of Object.keys(dependencies)) {
    const entry = licenses.find((license) => license.name === name);
    expect({ name, found: Boolean(entry) }).toEqual({ name, found: true });
    expect(entry!.version).not.toBe("");
    expect(entry!.license).not.toBe("");
    expect({ name, text: entry!.text !== "" }).toEqual({ name, text: true });
  }
});
