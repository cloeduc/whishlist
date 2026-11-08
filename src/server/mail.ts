import "server-only";
import { appendFile, mkdir } from "node:fs/promises";
import path from "node:path";
import type { Locale } from "../i18n/config";
import { getTranslations, getTranslationsFor } from "../i18n/server";
import { CONTACT_EMAIL } from "../site/contact";

/** Real sending: Resend, or the development SMTP server (`MAIL_SMTP_URL`). */
export function mailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY && process.env.MAIL_FROM) || mailSmtpUrl() !== null;
}

/**
 * `MAIL_SMTP_URL` (e.g. `smtp://localhost:1025`, MailDev): emails go through this SMTP server instead of
 * Resend, to read them during tests (e2e suite). Ignored in production: prod only sends through Resend.
 */
export function mailSmtpUrl(): string | null {
  const url = process.env.MAIL_SMTP_URL;
  if (!url || process.env.NODE_ENV === "production") return null;
  return url.startsWith("smtp://") || url.startsWith("smtps://") ? url : null;
}

/** `MAIL_DRY_RUN=1`: emails go to `data/mail.log` instead of being sent. Ignored in production. */
export function mailDryRun(): boolean {
  return process.env.MAIL_DRY_RUN === "1" && process.env.NODE_ENV !== "production";
}

/** Address validation exists only with email sending (real or simulated), otherwise it is absent. */
export function emailVerificationRequired(): boolean {
  return mailConfigured() || mailDryRun();
}

/**
 * Does an unconfirmed address block the account (write guard, banner, the API's `emailVerified`)?
 * `EMAIL_VERIFICATION_OPTIONAL=1` lifts that block without turning sending off: the confirmation link is still sent
 * on sign-up and an address change still waits for its confirmation. Temporary production measure, until every app
 * version in use handles the confirmation.
 */
export function emailConfirmationEnforced(): boolean {
  return emailVerificationRequired() && process.env.EMAIL_VERIFICATION_OPTIONAL !== "1";
}

/** `sent`: handed to Resend. `failed`: Resend refused it (neither the simulated sending nor the missing configuration). */
type MailResult = { sent: boolean; failed: boolean };

async function sendMail(input: {
  to: string;
  subject: string;
  text: string;
  html: string;
  logTag: string;
}): Promise<MailResult> {
  if (mailDryRun()) {
    await logMailFallback(input.logTag, input.to, input.text, "dry run");
    return { sent: false, failed: false };
  }
  const smtpUrl = mailSmtpUrl();
  if (smtpUrl) return sendSmtp(smtpUrl, input);
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
      return { sent: false, failed: true };
    }
    return { sent: true, failed: false };
  }

  await logMailFallback(input.logTag, input.to, input.text, "mail not configured");
  return { sent: false, failed: false };
}

/** Sending through the development SMTP server; loaded on demand, never in production. */
async function sendSmtp(
  url: string,
  input: { to: string; subject: string; text: string; html: string; logTag: string },
): Promise<MailResult> {
  const { createTransport } = await import("nodemailer");
  try {
    await createTransport(url).sendMail({
      from: process.env.MAIL_FROM || "Oh, You Shouldn't! <noreply@example.test>",
      to: input.to,
      subject: input.subject,
      text: input.text,
      html: input.html,
    });
    return { sent: true, failed: false };
  } catch (error) {
    console.error("SMTP error", error);
    await logMailFallback(input.logTag, input.to, input.text, "smtp");
    return { sent: false, failed: true };
  }
}

/**
 * Single-link email: intro, button, plain link, « ignorez ce message ».
 * Texts `<prefix>.subject|intro|cta|openLink|ignore` of the `mail` namespace.
 */
async function sendLinkMail(input: {
  to: string;
  url: string;
  prefix: "reset" | "verify" | "change";
  logTag: string;
  locale?: Locale;
}): Promise<MailResult> {
  const t = await mailTranslations(input.locale);
  const key = (name: string) => t(`${input.prefix}.${name}`);
  const text = [key("intro"), "", key("openLink"), input.url, "", key("ignore")].join("\n");
  const html = `<p>${escapeHtml(key("intro"))}</p>
<p><a href="${input.url}">${escapeHtml(key("cta"))}</a></p>
<p>${escapeHtml(key("openLink"))}<br/><a href="${input.url}">${escapeHtml(input.url)}</a></p>
<p>${escapeHtml(key("ignore"))}</p>`;
  return sendMail({ to: input.to, subject: key("subject"), text, html, logTag: input.logTag });
}

export async function sendPasswordResetMail(input: {
  to: string;
  resetUrl: string;
  locale?: Locale;
}): Promise<MailResult> {
  return sendLinkMail({ to: input.to, url: input.resetUrl, prefix: "reset", logTag: "password-reset", locale: input.locale });
}

export async function sendAlreadyRegisteredMail(input: {
  to: string;
  loginUrl: string;
  locale?: Locale;
}): Promise<MailResult> {
  const t = await mailTranslations(input.locale);
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
  locale?: Locale;
}): Promise<MailResult> {
  const t = await mailTranslations(input.locale);
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

export async function sendEmailVerificationMail(input: {
  to: string;
  confirmUrl: string;
  locale?: Locale;
}): Promise<MailResult> {
  return sendLinkMail({ to: input.to, url: input.confirmUrl, prefix: "verify", logTag: "email-verification", locale: input.locale });
}

/** Link to the new address: it replaces the current one only when opened (010, US3). */
export async function sendEmailChangeMail(input: {
  to: string;
  confirmUrl: string;
  locale?: Locale;
}): Promise<MailResult> {
  return sendLinkMail({ to: input.to, url: input.confirmUrl, prefix: "change", logTag: "email-change", locale: input.locale });
}

/**
 * Notice to the old address after a change, without an action link (the new address is masked).
 * The only recourse is the contact: the reset would go to the new address, which the person
 * may not control.
 */
export async function sendEmailChangedNoticeMail(input: {
  to: string;
  maskedNewEmail: string;
  locale?: Locale;
}): Promise<MailResult> {
  const t = await mailTranslations(input.locale);
  const vars = { newEmail: input.maskedNewEmail, contact: CONTACT_EMAIL };
  const subject = t("changed.subject");
  const text = [t("changed.intro", vars), "", t("changed.notYou", vars)].join("\n");
  const html = `<p>${escapeHtml(t("changed.intro", vars))}</p>
<p>${escapeHtml(t("changed.notYou", vars))}</p>`;
  return sendMail({ to: input.to, subject, text, html, logTag: "email-changed" });
}

/** Language given by the caller (API), otherwise the site request's. */
function mailTranslations(locale: Locale | undefined) {
  return locale ? getTranslationsFor(locale, "mail") : getTranslations("mail");
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

const REDACTED_TAGS = new Set(["password-reset", "invite", "email-verification", "email-change"]);

function redactMailLogBody(tag: string, text: string): string {
  // Avoids storing tokens (reset, invitation, address confirmation) in plain text in data/mail.log (especially in prod).
  if (!REDACTED_TAGS.has(tag)) return text;
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
    console.error("Cannot write mail.log", error);
  }
}
