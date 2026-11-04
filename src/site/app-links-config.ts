import { androidAssociation, appleAssociation } from "@/src/site/app-links";

/**
 * Settings of the domain association files (feature 011, R2). Optional: without them, the routes
 * answer 404 and links open the site, as before. Read on the server only.
 */

/** Apple team identifier (10 characters), or `null`. */
export function appleTeamId(): string | null {
  const raw = process.env.APPLE_TEAM_ID?.trim().toUpperCase();
  return raw && /^[A-Z0-9]{10}$/.test(raw) ? raw : null;
}

/** SHA-256 fingerprints of the Android signing certificates, comma-separated. */
export function androidCertFingerprints(): string[] {
  return (process.env.ANDROID_CERT_SHA256 ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
}

function associationResponse(body: unknown | null): Response {
  if (body === null) return new Response(null, { status: 404 });
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "content-type": "application/json", "cache-control": "public, max-age=3600" },
  });
}

/** `GET /.well-known/apple-app-site-association`. */
export function appleAssociationResponse(): Response {
  const teamId = appleTeamId();
  return associationResponse(teamId ? appleAssociation(teamId) : null);
}

/** `GET /.well-known/assetlinks.json`; 404 without any valid fingerprint. */
export function androidAssociationResponse(): Response {
  const body = androidAssociation(androidCertFingerprints());
  return associationResponse(body[0].target.sha256_cert_fingerprints.length ? body : null);
}
