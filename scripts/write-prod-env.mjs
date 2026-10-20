import { readFileSync, writeFileSync } from "node:fs";

const env = {};
for (const line of readFileSync(".env", "utf8").split(/\r?\n/)) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) continue;
  const i = trimmed.indexOf("=");
  if (i < 1) continue;
  let value = trimmed.slice(i + 1).trim();
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    value = value.slice(1, -1);
  }
  env[trimmed.slice(0, i)] = value;
}

const out = [
  `WHISHLIST_SESSION_SECRET=${env.SESSION_SECRET ?? ""}`,
  `WHISHLIST_APP_ORIGIN=${env.APP_ORIGIN ?? "https://wishlist.mesdamesduc.fr"}`,
  `WHISHLIST_SUPPORT_URL=${env.SUPPORT_URL ?? ""}`,
  `WHISHLIST_RESEND_API_KEY=${env.RESEND_API_KEY ?? ""}`,
  `WHISHLIST_MAIL_FROM=${env.MAIL_FROM ?? ""}`,
  `WHISHLIST_GEMINI_API_KEY=${env.GEMINI_API_KEY ?? ""}`,
  `WHISHLIST_OPENAI_API_KEY=${env.OPENAI_API_KEY ?? ""}`,
  "",
].join("\n");

writeFileSync("deploy/.whishlist.env.tmp", out);
console.log("wrote deploy/.whishlist.env.tmp");
console.log("has_session", Boolean(env.SESSION_SECRET));
console.log("has_app_origin", Boolean(env.APP_ORIGIN ?? "https://wishlist.mesdamesduc.fr"));
console.log("has_resend", Boolean(env.RESEND_API_KEY));
console.log("has_from", Boolean(env.MAIL_FROM));
