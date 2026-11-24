# Bug Assessment: Images d'idées cassées (adresse de page en image, texte alternatif affiché)

- **Slug**: broken-idea-images
- **Created**: 2026-11-24
- **Source**: ticket Plane WISH-16 (texte collé)
- **Verdict**: valid
- **Severity**: low

## Report (verbatim or summarized)

> Constaté le 2026-11-12 sur une liste partagée en prod : 5 livres Cultura affichent leur texte alternatif en vrac à la place de l'image.
> - 4 idées ont dans `image_url` l'adresse de la page produit (`https://www.cultura.com/p-….html`), pas une image. Cultura renvoie 403 aux robots ; le repli sur le modèle d'IA (`src/domain/product-llm.ts`) a probablement renvoyé l'adresse de la page comme `imageUrl`. Cause non prouvée : l'adresse a aussi pu être collée à la main.
> - 1 idée pointe vers une vraie image retirée depuis par Cultura (404).
>
> À faire : 1. Enrichissement : rejeter une `imageUrl` égale à l'adresse de la page, et vérifier (via `safeHttpGet`) qu'elle renvoie bien une image ; idem pour la saisie manuelle si possible. 2. Affichage : quand une image ne charge pas, afficher un emplacement neutre au lieu du texte alternatif, sur le site et dans l'app mobile.
>
> La correction des 5 idées en prod est hors ticket.

## Symptom

Une idée dont l'image ne charge pas (adresse qui n'est pas une image, ou image disparue) affiche dans sa carte le texte alternatif du navigateur (le nom de l'idée, en vrac dans un carré de 80 px) au lieu d'une image ou d'un emplacement neutre. Attendu : un emplacement neutre, et aucune adresse de page acceptée comme image à l'enregistrement.

## Reproduction

1. Sur une liste, créer une idée avec un lien `https://exemple/p-1.html` et coller la même adresse dans le champ « Image » (ou une adresse d'image qui renvoie 404).
2. Enregistrer : l'idée est acceptée telle quelle (`validUrl` ne vérifie que le schéma http(s)).
3. Ouvrir la liste publique (`/l/<token>`) ou la page de cagnotte (`/g/<token>`) : le texte alternatif s'affiche à la place de l'image.

## Suspected Code Paths

- `src/domain/product-llm.ts:41` (`hintsFromLlmJson`) — accepte n'importe quelle chaîne comme `imageUrl`, sans la comparer à l'adresse de la page.
- `src/server/commands/items.ts:enrichFromUrl()` — renvoie l'`imageUrl` des indices sans la vérifier.
- `src/server/commands/items.ts:resolveImageUrl()` — garde l'image saisie à la main sans contrôle ; l'image trouvée sur la page (`fetchOgImage`) n'est pas comparée à la page.
- `src/domain/items.ts:createItem()/updateItem()` — seule règle sur l'image : `validUrl` (schéma http/https).
- `components/site/public-item-card.tsx:58`, `app/g/[token]/page.tsx:108`, `components/site/item-form.tsx:377` — `<img alt=…>` sans repli quand le chargement échoue.
- App mobile : les idées n'y montrent leur image que dans l'aperçu du formulaire (`mobile/src/features/items/ItemForm.tsx:225`) ; une `Image` React Native en échec ne montre pas de texte alternatif, l'emplacement reste vide et neutre. Rien à corriger côté app.

## Root Cause Hypothesis

Deux défauts indépendants. (1) Aucune vérification que l'adresse enregistrée comme image est une image : ni dans l'enrichissement (`enrichFromUrl` + modèle d'IA), ni à la saisie manuelle. Remarque : quand Cultura renvoie 403, `enrichFromUrl` s'arrête sur `pageLoadFailed` avant l'appel au modèle ; l'adresse de page vient donc plutôt d'une saisie manuelle (copie du lien dans le champ image) ou d'un enrichissement fait un jour où la page répondait (le modèle a pu renvoyer l'URL de la page). Confiance moyenne sur l'origine, haute sur l'absence de contrôle. (2) L'affichage web ne gère pas l'échec de chargement : le navigateur montre l'`alt`. Confiance haute.

## Proposed Remediation

**Preferred**:

1. Nouveau module `src/domain/image-url.ts` :
   - `sameAddress(a, b)` (pur) : compare deux URL normalisées (sans fragment, sans `/` final).
   - `probeImage(url)` : `safeHttpGet` sur l'adresse ; renvoie `"image"` (réponse OK en `image/*`), `"notImage"` (réponse OK d'un autre type, ou 404/410) ou `"unknown"` (réseau, 401/403, 5xx… : on ne sait pas, on garde). Le corps de la réponse est abandonné.
2. Enrichissement (`enrichFromUrl`) : `imageUrl` mise à `null` si elle égale l'adresse saisie ou l'adresse finale de la page, ou si `probeImage` dit `"notImage"`.
3. Image trouvée automatiquement (`resolveImageUrl` → `fetchOgImage`) : ignorée si elle égale la page.
4. Saisie manuelle :
   - règle de domaine dans `createItem` / `updateItem` : image égale au lien de l'idée → erreur `imageIsPage` (en modification, seulement si l'image change, pour ne pas bloquer les idées déjà enregistrées) ;
   - commande `saveItem` : image saisie nouvelle (différente de l'image enregistrée) → `probeImage` ; `"notImage"` → erreur `imageNotImage`. Même limite de débit que la recherche d'image (`item-image`).
   - textes d'erreur FR/EN dans `locales/*/errors.json`, codes ajoutés au contrat OpenAPI.
5. Affichage : composant client `components/site/idea-image.tsx` qui rend l'`<img>` et, en cas d'échec (y compris avant l'hydratation : `complete && naturalWidth === 0`), un emplacement neutre de même taille avec une icône cadeau. Utilisé par `public-item-card.tsx` et `app/g/[token]/page.tsx` ; l'aperçu du formulaire cache simplement l'image en échec.

**Alternatives**:
- Exiger une confirmation positive (`"image"`) pour garder une image : rejetterait aussi les images de sites qui bloquent les robots mais s'affichent dans un navigateur. Écarté.
- Proxy serveur des images : hors de portée.

**Files likely to change**:
- `src/domain/image-url.ts` (nouveau), `src/domain/items.ts`, `src/server/commands/items.ts`
- `components/site/idea-image.tsx` (nouveau), `components/site/public-item-card.tsx`, `app/g/[token]/page.tsx`, `components/site/item-form.tsx`
- `locales/{fr,en}/errors.json`, `specs/004-mobile-api/contracts/openapi.yaml`
- `tests/domain/image-url.test.ts` (nouveau), `tests/domain/items.test.ts`

**Tests to add or update**:
- `sameAddress` : fragment, `/` final, adresses différentes, adresses invalides.
- `probeImage` avec un faux `fetch` : `image/jpeg` → image ; `text/html` → notImage ; 404 → notImage ; 403 → unknown ; erreur réseau → unknown.
- `createItem` / `updateItem` : image égale au lien → `imageIsPage` ; modification sans changer une image déjà égale au lien → acceptée.

## Risks & Considerations

- Une requête réseau de plus à l'enrichissement et à la saisie d'une nouvelle image (8 s max, limitée par le débit `item-image`).
- `safeHttpGet` reste le seul chemin réseau (règle SSRF).
- L'app mobile envoie ses écritures par la file hors ligne : une nouvelle erreur de validation y est traitée comme `imageMustBeHttp` aujourd'hui.
- Les 5 idées en prod ne sont pas corrigées ; elles s'afficheront avec l'emplacement neutre.

## Open Questions

- Aucune bloquante.
