import { randomBytes } from "node:crypto";

/** Politique par requête. Le nonce autorise les scripts Next, pas un script injecté. */
export function contentSecurityPolicy(options: { dev: boolean; nonce?: string }): {
  nonce: string;
  value: string;
} {
  const nonce = options.nonce ?? randomBytes(16).toString("base64");
  const scriptSrc = [
    "'self'",
    `'nonce-${nonce}'`,
    "'strict-dynamic'",
    options.dev ? "'unsafe-eval'" : null,
  ]
    .filter((part) => part !== null)
    .join(" ");

  const directives = [
    "default-src 'self'",
    `script-src ${scriptSrc}`,
    `style-src 'self' 'nonce-${nonce}'`,
    "style-src-attr 'unsafe-inline'",
    "img-src 'self' http: https: data: blob:",
    "font-src 'self'",
    "connect-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    options.dev ? null : "upgrade-insecure-requests",
  ].filter((part) => part !== null);

  return { nonce, value: directives.join("; ") };
}
