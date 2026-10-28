# Research: API pour une app mobile

Chaque décision résout une question du Technical Context de [plan.md](plan.md).

## R1. Où vit l'API

- **Decision** : des route handlers App Router sous `app/api/v1/**/route.ts`, dans l'app Next existante. `runtime = "nodejs"`, `dynamic = "force-dynamic"`, comme `app/u/[...path]/route.ts`.
- **Rationale** : un seul process écrit `wishlist.json`. Le verrou de `updateDocument` (proper-lockfile) et le rate-limit en mémoire (`src/server/rate-limit.ts`, « suffisant pour l'instance Docker unique ») restent valables. Pas de second conteneur (section Hébergement de la constitution).
- **Alternatives considered** :
  - Service séparé (Fastify, Hono) qui lit le même fichier : deux process sur un fichier JSON, rate-limit non partagé, second déploiement. Rejeté.
  - Exposer les server actions telles quelles : leurs identifiants changent à chaque build et elles répondent par des redirections. Rejeté.

## R2. Le proxy de langue et CSP

- **Decision** : exclure `/api/` du `matcher` de `proxy.ts`. La langue de l'API vient de l'en-tête `Accept-Language` (`fr` par défaut, `en`), pas du chemin.
- **Rationale** : `decideLocaleRoute` réécrit ou redirige les chemins (`/en/...`) et pose le cookie `NEXT_LOCALE`. Une API ne doit ni rediriger ni poser de cookie. La CSP ne sert à rien sur du JSON.
- **Alternatives considered** : garder le proxy et lui faire ignorer `/api` dans `decideLocaleRoute` : plus de code pour le même effet.

## R3. Authentification : jeton opaque révocable

- **Decision** : à la connexion, l'API émet un jeton aléatoire de 32 octets (base64url), envoyé ensuite dans `Authorization: Bearer <token>`. Le serveur garde seulement son empreinte SHA-256 dans une nouvelle collection `apiSessions` de `Database`, avec `userId`, `sessionVersion`, `createdAt`, `expiresAt` (30 jours, `SESSION_TTL_SEC`). Un jeton est valable s'il existe, n'a pas expiré, et si sa `sessionVersion` égale celle du compte.
  - Déconnexion : supprime l'entrée (FR-021).
  - Changement ou réinitialisation de mot de passe : `changePassword` / `resetPasswordWithToken` incrémentent déjà `sessionVersion`, ce qui invalide toutes les connexions, site et API (FR-021, SC-006). L'API émet un nouveau jeton au client qui a changé le mot de passe, comme `openSession` le fait côté site.
  - Les entrées expirées ou périmées sont purgées à chaque connexion, dans le même `updateDocument`.
- **Rationale** : le jeton signé du site (`signSession`) est sans état. On ne peut pas le révoquer seul : la déconnexion du site supprime juste le cookie. Pour une app mobile, la déconnexion doit vraiment tuer le jeton (spec, FR-021). SHA-256 suffit : le jeton a 256 bits d'entropie, pas besoin d'un hachage lent.
- **Alternatives considered** :
  - Réutiliser `signSession` en bearer : pas de révocation individuelle. Incrémenter `sessionVersion` à la déconnexion déconnecterait aussi le site et les autres appareils. Rejeté.
  - JWT avec refresh token : deux jetons, une bibliothèque, et toujours un état serveur pour révoquer. Rejeté (principe V).
  - Lire aussi le cookie de session dans l'API : ouvrirait l'API au CSRF depuis un navigateur. Rejeté : l'API ignore les cookies.

## R4. Preuves invité : réservation et déverrouillage

- **Decision** : l'API rend au client les mêmes preuves que le site met en cookie, et le client les renvoie dans des en-têtes.
  - **Réservation** : la réponse de réservation contient un `claim` : `iat.reservationId.mac`, HMAC du `readToken`, de `iat` et de l'id avec `SESSION_SECRET`, valable 90 jours comme le cookie `wl_rc_*`. Le client renvoie ses claims d'une liste dans `X-Reservation-Claims` (liste séparée par des virgules). Le serveur garde les ids dont le MAC est bon et les passe à `mineReservationIdsFor` et `cancelOwnReservation`, sans changement de ces règles.
  - **Déverrouillage** : `POST .../unlock` rend `unlockToken` = `iat.mac`, le même format que le cookie `wl_ru_*`, lié au hash courant du mot de passe de lecture (invalide si le mot de passe change), valable 14 jours. Le client le renvoie dans `X-Read-Unlock`.
- **Rationale** : rien à stocker côté serveur, mêmes durées et mêmes règles que le site (FR-011, FR-014). Il faut sortir les fonctions de signature et de vérification de `src/auth/reservation-claim.ts` et `src/auth/read-unlock.ts` en fonctions pures, que les cookies du site et les en-têtes de l'API utilisent toutes les deux (FR-004).
- **Alternatives considered** : stocker les claims invité en base : écriture à chaque lecture, données en plus pour des personnes sans compte. Rejeté.

## R5. Une règle écrite une fois

- **Decision** : extraire l'orchestration des server actions dans `src/server/commands/*.ts`. Ce sont des fonctions sans dépendance à Next (ni `cookies()`, ni `redirect`), de la forme `(actor, input) → Promise<{ ok: true, ... } | { ok: false, error }>`. Elles contiennent ce qui n'est pas déjà dans `src/domain/` : la vérification de membre, la limite de débit, la composition (création de liste + première catégorie + premier « qui »), la résolution d'image, l'enrichissement, l'envoi d'e-mail. Les server actions deviennent des adaptateurs (FormData → commande → redirection et cookies), et les route handlers aussi (JSON → commande → réponse).
  - Le rate-limit garde les mêmes clés (`login`, `reserve:<readToken>`, `enrich:<userId>`…), donc la limite est partagée entre le site et l'API.
  - La migration se fait par tranche : chaque User Story ne migre que les actions qu'elle expose.
- **Rationale** : sans cette extraction, chaque route recopierait les vérifications de l'action (FR-004, contrôle « duplication » de la revue).
- **Alternatives considered** : faire appeler les server actions par les routes : elles redirigent (`redirect()` lève une exception) et lisent les cookies. Rejeté.

## R6. Contrat et versions

- **Decision** : OpenAPI 3.1 en YAML dans [contracts/openapi.yaml](contracts/openapi.yaml). C'est la source de vérité, liée depuis le README. Les chemins commencent par `/api/v1`. Une évolution incompatible crée `/api/v2`. Une version retirée répond `410` avec le code `apiVersionUnsupported` (route `app/api/[version]/[...path]/route.ts` qui attrape les versions inconnues).
- **Rationale** : un fichier lisible par un humain et par des générateurs de client (pour l'app mobile plus tard), sans dépendance au runtime.
- **Alternatives considered** : générer le contrat depuis le code (zod-to-openapi, ts-rest) : nouvelles dépendances, et le projet n'a pas de bibliothèque de validation. Rejeté pour l'instant.

## R7. Format des réponses et des erreurs

- **Decision** :
  - Succès : un objet JSON, `200` ou `201` à la création, `204` sans corps.
  - Erreur : `{ "error": { "code": "<code stable>", "message": "<texte traduit>" } }`. Les codes sont ceux du domaine et de `locales/*/errors.json`. Les nouveaux codes (`unauthorized`, `invalidJson`, `payloadTooLarge`, `unsupportedMediaType`, `originNotAllowed`, `apiVersionUnsupported`, `readPasswordRequired`, `mustChangePassword`, `serviceUnavailable`) sont ajoutés aux deux langues.
  - Correspondance code → statut HTTP dans une table unique `src/server/api/errors.ts` : `400` validation, `401` non connecté ou jeton invalide, `403` `mustChangePassword` ou `originNotAllowed`, `404` introuvable, `409` `itemAlreadyReserved`, `410`, `413`, `415`, `422` page produit illisible ou vide, `423` `readPasswordRequired`, `429` `rateLimited`, `503` service absent.
  - `notMember` est rendu comme `404 listMissing` (FR-030 : un non-membre ne distingue pas une liste qui existe).
  - La traduction utilise une fonction `translateErrorFor(locale, code)` ajoutée à `src/i18n/server.ts`, que `translateError` réutilise.
- **Rationale** : un seul format d'erreur est facile à gérer pour un client mobile ; les codes existants évitent une seconde liste à maintenir.

## R8. Navigateurs, origines et cache

- **Decision** :
  - L'API n'utilise pas de cookie : pas de CSRF possible.
  - Une demande avec un en-tête `Origin` n'est acceptée que si cette origine est celle du site (`APP_ORIGIN`) ou figure dans `API_ALLOWED_ORIGINS` (nouvelle variable, liste séparée par des virgules, `WHISHLIST_API_ALLOWED_ORIGINS` dans compose). Sinon `403 originNotAllowed`. Une demande sans `Origin` (app native, curl) passe. Sans la variable, seuls le site et les clients hors navigateur passent (FR-040).
  - `OPTIONS` répond au préflight CORS pour ces origines seulement, avec `Access-Control-Allow-Headers: Authorization, Content-Type, Accept-Language, X-Read-Unlock, X-Reservation-Claims`, sans `Allow-Credentials`.
  - Toutes les réponses portent `Cache-Control: private, no-store` (FR-041).
  - Corps JSON obligatoire (`415` sinon), limité à 64 Ko (`413`).
- **Rationale** : une app Capacitor sert ses pages depuis `capacitor://localhost` (iOS) et `https://localhost` (Android) : ce sont les valeurs à mettre dans la variable le jour où l'app existe. Le plugin HTTP natif n'envoie pas d'`Origin`.

## R9. Tests

- **Decision** :
  - Tests de domaine `node:test` dans `tests/domain/` pour : les sessions d'API (émission, vérification, expiration, révocation, `sessionVersion`), les claims et le déverrouillage (signature, MAC faux, expiration, changement de mot de passe), la décision d'origine, la table code → statut, et chaque commande sur un fichier temporaire (`mkdtemp` + `WISHLIST_DATA_PATH`).
  - SC-003 : un test lance 20 `reserve` en parallèle sur le même fichier temporaire et vérifie qu'un seul réussit.
  - Les route handlers restent minces (lecture JSON, appel de la commande, réponse). Ils sont vérifiés par le parcours `curl` de [quickstart.md](quickstart.md), qui ne suit que le contrat (SC-001).
- **Rationale** : le projet n'a pas de test e2e (AGENTS.md) ; les règles vivent dans les commandes, qui se testent sans Next.
- **Alternatives considered** : tester les route handlers avec `next/experimental/testing` ou en démarrant le serveur : lourd et nouveau pour le projet. Rejeté.

## R10. Performance

- **Decision** : rien de spécial. La lecture d'une liste fait une lecture du fichier JSON et un filtrage en mémoire, comme la page publique. SC-005 (100 idées en moins d'une seconde) est largement tenu par la page actuelle.
- **Rationale** : le volume est celui d'un usage familial (quelques dizaines de listes).

## R11. Inscription et e-mail déjà pris

- **Decision** : même comportement que `registerAction`. Un e-mail déjà inscrit ne donne pas d'erreur `emailTaken` : le serveur envoie l'e-mail « compte déjà existant » et répond `202` avec `{ "status": "checkEmail" }`. Une inscription réussie répond `201` avec un jeton, comme une connexion.
- **Rationale** : FR-022 (pas de révélation directe). La différence `201` / `202` existe aussi sur le site (session ouverte ou non) ; la réduire davantage demanderait une confirmation par e-mail, hors périmètre.
- **Alternatives considered** : `409 emailTaken` : révèle les comptes existants. Rejeté.
