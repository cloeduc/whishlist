import { readFileSync } from "node:fs";
import { mailConfigured, sendPasswordResetMail } from "../src/server/mail";

for (const line of readFileSync(".env", "utf8").split(/\r?\n/)) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) continue;
  const i = trimmed.indexOf("=");
  if (i < 1) continue;
  const key = trimmed.slice(0, i);
  let value = trimmed.slice(i + 1).trim();
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    value = value.slice(1, -1);
  }
  process.env[key] = value;
}

async function main() {
  const to = process.argv[2] ?? "cloe@example.com";
  console.log("configured=", mailConfigured());
  const result = await sendPasswordResetMail({
    to,
    resetUrl: "http://localhost:3000/reinitialiser/test-token-local",
  });
  console.log("sent=", result.sent);
  if (!result.sent) process.exitCode = 1;
}

main();
