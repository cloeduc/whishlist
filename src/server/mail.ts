import { appendFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { getTranslations } from "../i18n/server";

export function mailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY && process.env.MAIL_FROM);
}

async function sendMail(input: {
  to: string;
  subject: string;
  text: string;
  html: string;
  logTag: string;
}): Promise<{ sent: boolean }> {
  if (mailConfigured()) {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.MAIL_FROM,
        to: [input.to],
        subject: input.subject,
        text: input.text,
        html: input.html,
      }),
    });
    if (!res.ok) {
      const body = await res.text();
      console.error("Resend error", res.status, body);
      await logMailFallback(input.logTag, input.to, input.text, `resend ${res.status}`);
      return { sent: false };
    }
    return { sent: true };
  }

  await logMailFallback(input.logTag, input.to, input.text, "mail non configuré");
  return { sent: false };
}

export async function sendPasswordResetMail(input: {
  to: string;
  resetUrl: string;
}): Promise<{ sent: boolean }> {
  const t = await getTranslations("mail");
  const subject = t("reset.subject");
  const text = [t("reset.intro"), "", t("reset.openLink"), input.resetUrl, "", t("reset.ignore")].join("\n");
  const html = `<p>${escapeHtml(t("reset.intro"))}</p>
<p><a href="${input.resetUrl}">${escapeHtml(t("reset.cta"))}</a></p>
<p>${escapeHtml(t("reset.openLink"))}<br/><a href="${input.resetUrl}">${escapeHtml(input.resetUrl)}</a></p>
<p>${escapeHtml(t("reset.ignore"))}</p>`;

  return sendMail({
    to: input.to,
    subject,
    text,
    html,
    logTag: "password-reset",
  });
}

export async function sendAlreadyRegisteredMail(input: {
  to: string;
  loginUrl: string;
}): Promise<{ sent: boolean }> {
  const t = await getTranslations("mail");
  const subject = t("already.subject");
  const text = [t("already.intro"), "", t("already.openLink"), input.loginUrl, "", t("already.ignore")].join(
    "\n",
  );
  const html = `<p>${escapeHtml(t("already.intro"))}</p>
<p><a href="${input.loginUrl}">${escapeHtml(t("already.cta"))}</a></p>
<p>${escapeHtml(t("already.ignore"))}</p>`;
  return sendMail({
    to: input.to,
    subject,
    text,
    html,
    logTag: "register-existing",
  });
}

export async function sendInviteMail(input: {
  to: string;
  inviteUrl: string;
  listTitle: string;
  fromName: string;
}): Promise<{ sent: boolean }> {
  const t = await getTranslations("mail");
  const vars = { fromName: input.fromName, listTitle: input.listTitle };
  const subject = t("invite.subject", vars);
  const text = [
    t("invite.intro", vars),
    "",
    t("invite.openLink"),
    input.inviteUrl,
    "",
    t("invite.ignore"),
  ].join("\n");
  const html = `<p>${escapeHtml(t("invite.intro", vars))}</p>
<p><a href="${input.inviteUrl}">${escapeHtml(t("invite.cta"))}</a> (${escapeHtml(t("invite.ctaHint"))}).</p>
<p>${escapeHtml(t("invite.openLink"))}<br/><a href="${input.inviteUrl}">${escapeHtml(input.inviteUrl)}</a></p>
<p>${escapeHtml(t("invite.ignore"))}</p>`;

  return sendMail({
    to: input.to,
    subject,
    text,
    html,
    logTag: "invite",
  });
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function redactMailLogBody(tag: string, text: string): string {
  // Évite de stocker tokens reset / invite en clair dans data/mail.log (surtout en prod).
  if (tag !== "password-reset" && tag !== "invite") return text;
  if (process.env.NODE_ENV !== "production") return text;
  return text.replace(/https?:\/\/\S+/g, "[redacted-url]");
}

async function logMailFallback(tag: string, to: string, text: string, reason: string) {
  try {
    const dir = path.join(process.cwd(), "data");
    await mkdir(dir, { recursive: true });
    const body = redactMailLogBody(tag, text);
    await appendFile(
      path.join(dir, "mail.log"),
      `\n--- ${new Date().toISOString()} ${tag} (${reason}) -> ${to}\n${body}\n`,
      "utf8",
    );
  } catch (error) {
    console.error("Impossible d'écrire mail.log", error);
  }
}
