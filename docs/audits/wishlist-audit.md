# Audit — Oh, mais fallait pas ! — 21 octobre 2026

Mode : audit. Aucun correctif appliqué.

Périmètre : arbre de travail local (y compris les fichiers non commités), pas seulement `HEAD`. Routes publiques parcourues sur `http://localhost:3000` : `/`, `/inscription`, `/guide`, puis `/` en anglais via `?lang=en`. Revue de code des parcours connectés, de l’API serveur et du domaine. Les listes réelles n’ont pas été ouvertes, pour ne pas exposer de données personnelles.

Surfaces :

| Route | Surface |
| --- | --- |
| `/`, `/projet`, `/faq`, `/guide`, `/mentions-legales` | Publique, indexable |
| `/l/[readToken]`, `/l/[readToken]/reserver`, `/l/[readToken]/types` | Publique par lien, contenu personnel |
| `/inscription`, `/connexion`, `/mot-de-passe-oublie`, `/reinitialiser/[token]`, `/inviter/[token]` | Publique, tâche de compte |
| `/`, `/listes/new`, `/listes/[id]`, `/compte`, `/changer-mot-de-passe` une fois connecté | Application |
| Pas de back-office séparé | — |

Design system : shadcn `base-nova` (`components.json`), primitives Base UI dans `components/ui/`, Tailwind CSS 4, tokens dans `app/globals.css`, icônes Lucide. Pas de seconde bibliothèque de composants.

Outils exécutés : revue de code, `npm test` (57 tests, 0 échec), `npm audit --omit=dev`, navigateur sur le serveur déjà lancé (arbre d’accessibilité, HTML rendu, contraste calculé, largeurs 320, 375, 768, 1024 et 1440). `git status`, `git log`, `git check-ignore`.

Outils absents : axe, Playwright de test (Playwright est installé seulement pour `scripts/capture-demo.mjs`), ESLint, Lighthouse, CI. Le parcours clavier réel n’a pas pu être joué : la frappe Tab de l’outil n’a pas déplacé le focus. Le zoom 200 % n’a pas été simulé tel quel ; le reflow a été vérifié à 320 px.

RGAA : le site est édité par un particulier (`locales/fr/content.json`, mentions légales). Le RGAA n’est pas une obligation légale ici. Ses critères ont servi de méthode, en plus de WCAG 2.2 AA. Aucun score de conformité n’est donné.

## Synthèse

Le métier est clair et déjà bien découpé : domaine testé, session signée, mots de passe en scrypt, garde-fous SSRF, réservations masquées aux autres visiteurs. L’interface publique récente (accueil, guide, FAQ, projet) est lisible et ne déborde pas aux largeurs contrôlées.

Les blocages sont ailleurs. Réordonner une catégorie ou déplacer une idée ne se fait qu’au glisser-déposer. Les pages de compte n’ont pas de titre de page propre ni de `h1`. Les listes partagées, qui contiennent des prénoms et des envies, sont rendues en HTML sans `noindex`. Une session volée reste valable après un changement de mot de passe. Le texte blanc sur le rouge destructif est à 3,71:1.

## Architecture

Next.js 15.5.28 (App Router), React 19, i18next, stockage JSON verrouillé (`src/store/db.ts`, `proper-lockfile`), sortie Docker `standalone`. Pas de base SQL, pas de route `app/api` : les mutations passent par les server actions de `src/server/actions.ts`.

Le domaine (`src/domain/`) porte les règles et les tests. L’UI est dans `app/` et `components/site/`. La langue est un cookie `NEXT_LOCALE`, pas un segment d’URL (`middleware.ts`, `src/i18n/config.ts`). `app/layout.tsx` est `force-dynamic` : chaque page, y compris le guide et la FAQ, est rendue à la demande.

## Design system

Tokens cadeau dans `app/globals.css` : `--gift-blue #1e60ff`, `--gift-red #ff2d2d`, `--gift-yellow #ffd700`, fond `#e8f0ff`, ombre dure `4px 4px 0`, rayon 8 px. Typo Geist via `next/font`. Composants partagés : Button, Input, Field, Card, Dialog, Alert, Accordion, Badge, Empty.

Écarts avérés, pas un deuxième système :

- Les poignées de glisser-déposer et les étoiles sont des contrôles maison, pas des primitives du dossier `ui`.
- `components/ui/card.tsx` et `alert.tsx` importent `cn` depuis le paquet `cn` ; le reste passe par `@/lib/utils`.
- Le layout plafonne à `max-w-3xl`. Le guide sort de cette colonne (`w-[min(100vw-1.5rem,68rem)]`). À 1440 px la colonne du guide commence à 171 px et mesure 1088 px, alors que l’en-tête reste dans les 48 rem centrés. Pas de scroll horizontal, mais l’en-tête ne s’aligne pas sur le contenu.
- Le thème sombre de `:root .dark` n’est pas branché sur l’interface.

Cohérence visuelle néobrutaliste tenue sur l’accueil, le guide et l’inscription.

## Git

Branche `main`, suit `origin/main`, commit `8f3a69b` (`feat: rebrand Oh, mais fallait pas ! et fix switch FR/EN`). Historique récent en Conventional Commits, sujets en français (`feat:`, `fix:`, `chore:`).

L’arbre de travail est sale : nombreuses modifications suivies (locales, pages liste, domaine, `README`, `package.json`) et fichiers non suivis (`app/faq`, `app/guide`, `app/projet`, `app/mentions-legales`, accordéon, contenus, scripts de démo, tests associés). Aucune branche créée, aucun commit, aucun push.

`.env`, `data/wishlist.json` et `data/instance-content.json` sont ignorés et ne sont pas versionnés. Aucune valeur secrète n’est recopiée ici.

## Constats avérés

| ID | Gravité | Surface | Critère | Constat | Preuve | Piste |
| --- | --- | --- | --- | --- | --- | --- |
| F01 | Bloquant | Application | WCAG 2.1.1, 2.5.7 | Réordonner une catégorie ou changer une idée de catégorie ne se fait qu’en glissant une poignée. Pas de bouton, pas de clavier. | `components/site/ideas-accordion.tsx` vers 201–214 et 247–261. Le guide le promet : `locales/fr/content.json`, `categoriesCaption`. | Ajouter un déplacement au clavier et au pointeur simple, puis garder le glisser comme raccourci. |
| F02 | Majeur | Application | WCAG 4.1.2 | Chaque idée est un `article` avec `role="button"` qui contient le bouton Archiver. Contrôle imbriqué dans un contrôle. | `ideas-accordion.tsx` vers 232–283 | Rendre la carte non interactive et n’exposer que des boutons (modifier, archiver, déplacer). |
| F03 | Majeur | Toutes | WCAG 1.4.3 | Texte blanc sur `#ff2d2d` : 3,71:1. Insuffisant pour le texte des alertes et des boutons destructifs (14 px). | Calcul navigateur. `--destructive` dans `app/globals.css`. `components/ui/button.tsx` variant `destructive`, `components/ui/alert.tsx`. | Assombrir le rouge ou passer le texte en noir, et revérifier le ratio. |
| F04 | Majeur | Publique et application | WCAG 1.4.11 | Étoiles `#ffd700` sur blanc : 1,40:1. Le niveau d’envie se voit mal. | Calcul navigateur. `components/site/priority-stars.tsx`, `--gift-yellow`. | Contour noir déjà dans l’identité, ou étoile plus sombre, en gardant le nom accessible. |
| F05 | Majeur | Compte | WCAG 1.3.1, 2.4.6 | Inscription, connexion, mot de passe oublié, réinitialisation et nouvelle liste n’ont aucun `h1`. Le titre visuel est un `div`. | HTML rendu : `h1` absent sur `/inscription`, `/connexion`, `/mot-de-passe-oublie`. Arbre d’accessibilité de `/inscription` : aucun heading, alors que `[data-slot=card-title]` vaut « Créer un compte ». `components/ui/card.tsx` ligne 35. | Utiliser un `h1` pour le titre de ces écrans. |
| F06 | Majeur | Toutes | WCAG 2.4.1 | Pas de lien d’évitement vers le contenu. La navigation se répète sur chaque page. | Aucun lien skip dans `app/layout.tsx` ni dans le DOM de `/`. | Ajouter un lien « Aller au contenu » visible au focus, cible `main`. |
| F07 | Majeur | Publique | WCAG 4.1.2 | « Créer ma liste », « Se connecter » et « Soutenir le projet » sont des liens `<a href>` annoncés `role="button"`. | DOM de `/` : balise `A`, `role="button"`. `components/ui/button.tsx` avec `nativeButton={false}`. | Laisser ces CTA en liens, sans rôle bouton. |
| F08 | Majeur | Application | WCAG 2.5.8 | La croix qui retire une catégorie ou une personne mesure 20 px (`size-5`), collée au libellé. | `components/site/label-chips.tsx` vers 113–116 | Agrandir la cible à 24 px au moins, ou espacer. |
| F09 | Mineur | Application | WCAG 3.1.2 | Le bouton de fermeture des dialogues dit « Fermer » même en anglais. | `components/ui/dialog.tsx` ligne 64 | Passer le nom par les traductions. |
| F10 | Mineur | Toutes | WCAG 3.1.2 | Le pied de page garde `aria-label="Informations"` quand la page est en anglais. | Snapshot de `/` après `?lang=en` : navigation nommée « Informations », `lang=en`. `components/site/site-footer.tsx` ligne 30. | Traduire ce nom. |
| F11 | Mineur | Publique | WCAG 3.1.2 | Sur les mentions légales, deux termes lus seulement par un lecteur d’écran sont en anglais : « Address », « Website ». | `app/mentions-legales/page.tsx` lignes 33 et 37 | Les écrire dans la langue de la page. |
| F12 | Majeur | Publique | SEO | Un seul titre et une seule meta description pour l’accueil, l’inscription, la connexion, le mot de passe oublié et le compte. Pas de canonique, pas d’Open Graph. `/robots.txt` et `/sitemap.xml` répondent 404. | Fetch du HTML rendu le 21 octobre 2026. `generateMetadata` seulement dans `app/layout.tsx`, `app/faq/page.tsx`, `app/guide/page.tsx`, `app/projet/page.tsx`, `app/mentions-legales/page.tsx`. | Titre et description par URL indexable, canonique absolu, sitemap des pages marketing, `robots.txt` qui n’interdit pas CSS ni JS. |
| F13 | Majeur | Publique | SEO | Français et anglais partagent la même URL. `?lang=` pose un cookie puis disparaît. Pas de `hreflang`. Google ne peut indexer qu’une langue. | `middleware.ts`. HTML de `/faq` : pas de `hreflang`. Bascule EN vérifiée : le titre devient « Oh, You Shouldn't! — Wish lists to share », l’URL reste `/`. | URLs de langue distinctes et réciproques, ou assumer une seule langue indexable et ne pas présenter l’autre comme une page séparée. |
| F14 | Majeur | Publique par lien | SEO | `/l/[readToken]` rend le titre de la liste, les prénoms et les idées sans `noindex`. Même absence sur les pages de compte. Un lien partagé peut être indexé. | `app/l/[readToken]/page.tsx` n’a pas de `generateMetadata`. Fetch : aucun `meta name="robots"`. | `noindex` sur les listes, les invitations, les resets et les pages connectées. Ne pas les mettre au sitemap. |
| F15 | Majeur | Publique | Perf | Tout le site est dynamique, y compris FAQ, guide et mentions légales. | `export const dynamic = "force-dynamic"` dans `app/layout.tsx` ligne 29. | Garder le dynamique pour les pages qui lisent la session ou le JSON. Laisser le contenu éditorial se mettre en cache. |
| F16 | Majeur | Publique | UX | L’accueil aligne trois actions de même gabarit : créer, se connecter, soutenir. Le soutien est en plus une icône dans l’en-tête. | `components/site/guest-hero.tsx` lignes 44–59 et `components/site/site-nav.tsx` lignes 73–88. Snapshot de `/`. | Garder « Créer ma liste » comme action principale. Le soutien reste l’icône ou un lien secondaire, pas les deux au même niveau. |
| F17 | Majeur | Publique | UX | La page projet promet que la surprise reste entière. Tout membre de la liste voit le nom et le message de chaque réservation. La FAQ le dit, le hero ne le contredit plus, le projet et le conseil du guide continuent de promettre la surprise sans cette réserve. | `locales/fr/content.json` `project.intro`, `project.practiceBody`, `guide.tipBody`. `app/listes/[id]/page.tsx` vers 258–280. FAQ, question « Qui peut voir les réservations ? ». | Aligner le projet et le conseil sur la règle déjà écrite dans la FAQ. |
| F18 | Mineur | Publique | UX | « vibe codé » / « vibe coding » et « moins de 48 heures » parlent au développeur, pas à la personne qui veut une liste. | Pied de page vérifié en FR et en EN. `locales/fr/content.json` `buildTitle` / `buildBody`, équivalent EN. | Réserve ce récit à la page projet, en langage courant, ou retire-le du pied de page. |
| F19 | Mineur | Application | UX | Le prix affiché dans le formulaire d’édition est toujours avec un point (`18.50`), alors que le placeholder français est `18,50`. L’affichage public, lui, est localisé. | `app/listes/[id]/page.tsx` `euros()` lignes 55–57. `locales/fr/list.json` `pricePlaceholder`. `src/domain/price.ts` `formatPrice`. | Préremplir le champ avec la virgule en français. `parsePrice` l’accepte déjà. |
| F20 | Majeur | Application | UX | Retirer un membre et effacer le mot de passe de lecture partent sans confirmation. Supprimer la liste, quitter et annuler une réservation passent par un dialogue. | `app/listes/[id]/page.tsx` vers 434–441 et 409–416, face aux `ConfirmForm` du même fichier. | Même dialogue de confirmation que pour les autres actions irréversibles. |
| F21 | Mineur | Application | WCAG 4.1.3 | L’erreur de l’accordéon et celle des puces sont un paragraphe. Rien ne l’annonce si le focus n’y est pas. | `ideas-accordion.tsx` vers 170. `label-chips.tsx` vers 155. | Réutiliser `Alert` (`role="alert"`), déjà le cas sur l’inscription. |
| F22 | Majeur | Application | UX | N’importe quel membre peut poser ou retirer le mot de passe d’une liste. Quatre caractères suffisent. | `src/domain/read-password.ts` lignes 4–15. Le formulaire n’est pas réservé au propriétaire : `app/listes/[id]/page.tsx` vers 388–416. `setReadPassword` ne teste que l’appartenance. | Réserver ça au propriétaire, allonger le minimum, confirmer l’effacement. |
| F23 | Majeur | Application | WCAG 1.4.3 | Les couleurs d’une liste acceptent n’importe quel hex. Un fond blanc et un bleu très clair passent. Aucun contrôle de contraste. | `src/domain/theme.ts` `HEX` et `parseThemeForm`. Injection dans `app/l/[readToken]/page.tsx` lignes 110–117, valeurs bornées au hex donc pas une injection CSS. | Refuser les combinaisons sous 4,5:1, ou borner la palette. |
| F24 | Mineur | Toutes | DS | Pas de `not-found` ni de page `error` dédiée. | Aucun `app/not-found.tsx` ni `app/error.tsx`. | Pages simples, dans le layout existant, avec un retour à l’accueil. |

Contrastes qui passent, mesurés dans le navigateur : texte atténué `oklch(0.4 0 0)` sur `#e8f0ff` à 7,99:1 et sur blanc à 9,15:1 ; blanc sur `#1e60ff` à 5,03:1. Le hero respecte `prefers-reduced-motion` (`app/globals.css` vers 276). `tw-animate-css` n’a pas cette media query : les animations courtes de dialogue ne sont pas un échec AA démontré.

Responsive vérifié sans scroll horizontal : accueil à 320, 768, 1024 et 1440 ; guide à 320 et 1440 ; inscription à 375. À 320 px l’en-tête passe sur plusieurs lignes, le hero reste dans la colonne, le bouton principal reste entier.

Formulaires d’inscription : chaque champ a un label lié, l’obligation est sur l’input, l’aide du mot de passe est visible. Ce n’est pas un constat d’échec.

## Wording et positionnement

Marque actuelle, cohérente dans l’interface : « Oh, mais fallait pas ! » / « Oh, You Shouldn't! ». Le lexique liste / idée cadeau / réserver / pour qui est en place en français et en anglais (accueil, inscription, liste publique). Le vouvoiement est tenu sur les écrans lus. « J’offre » a été remplacé par « Réserver ce cadeau » puis « Confirmer la réservation » (`locales/fr/public.json`).

Le positionnement qui marche : liste partagée sans compte, réservation sans paiement, liste volontairement trop pleine, projet libre auto-hébergeable. La FAQ explique qui voit les réservations, avec la bonne réserve.

Ce qui affaiblit la promesse : F17 et F18. L’anglais de l’accueil est naturel (« Make my list », « Well, I did make a list. »). Les libellés de langue restent « FR » / « EN » ; le groupe s’appelle « Langue » / « Language », donc le sens passe.

L’audit wording du 20 octobre 2026 (`Audit_wording_Wishlist_FR_EN_Cursor.md`) est en partie dépassé : il parle encore de la marque Wishlist et de textes déjà remplacés. Ne pas le réappliquer tel quel.

## Sécurité

Revue de code, pas un test d’intrusion. `npm audit --omit=dev` : 1 high, 1 moderate, 0 critical. Les deux viennent de PostCSS embarqué par Next 15.5.28 (XSS au stringify, lecture de source map). Le correctif npm proposé saute à Next 16. Dans cette appli, PostCSS n’est pas sur le chemin d’une requête, et les couleurs injectées sont validées en hex. Exploitabilité réelle faible. Classement retenu : Medium, pas une urgence de contournement.

Ce qui tient déjà : scrypt (`src/domain/passwords.ts`), comparaison en temps constant, cookie de session `httpOnly` / `sameSite=lax` / `secure` en production, HMAC avec expiration figée (`src/auth/session.ts`), reset qui ne révèle pas si l’e-mail existe, garde SSRF (`src/domain/safe-http.ts`, couvert par les tests), URLs d’idée limitées à http(s), `APP_ORIGIN` pour éviter un empoisonnement d’en-tête sur les liens d’e-mail, en-têtes `X-Frame-Options`, `nosniff`, `Referrer-Policy`, HSTS, Permissions-Policy (`next.config.ts`). `.env` n’est pas dans Git.

| ID | Gravité | Constat | Preuve | Piste |
| --- | --- | --- | --- | --- |
| S01 | High | Changer le mot de passe ou se déconnecter ne révoque pas les autres sessions. Le jeton ne contient que l’identifiant, l’heure et un MAC. Un cookie volé reste valable 30 jours. | `src/auth/session.ts` `signSession`. `changePassword` dans `src/domain/users.ts` ne change pas de version de session. `logoutAction` ne fait qu’effacer le cookie local. | Version de session stockée avec l’utilisateur, vérifiée à la lecture, incrémentée au changement de mot de passe. |
| S02 | Medium | La limite de débit prend la première IP de `X-Forwarded-For`, sans liste de proxies de confiance. Si l’origine est joignable en plus du tunnel, la limite se contourne. | `src/server/rate-limit.ts` `clientIp` lignes 19–23. | Ne faire confiance qu’à l’en-tête posé par le proxy réel, ou à `CF-Connecting-IP` si c’est le chemin de prod. |
| S03 | Medium | N’importe quel membre peut déclencher des e-mails d’invitation, sans limite. Ça consomme Resend et envoie le lien d’édition. | `sendInviteAction` dans `src/server/actions.ts` vers 697. Les actions login, inscription, reset, réservation et déverrouillage sont limitées. | Même plafond que le reset, par compte et par liste. |
| S04 | Medium | L’inscription répond « Cet e-mail est déjà utilisé. » Un tiers peut tester des adresses. | `registerAction` vers 136–143. `locales/fr/auth.json` `register.errorEmail`. Le reset, lui, répond toujours la même chose. | Réponse identique que le compte existe ou non, et envoi d’un autre e-mail si l’adresse est prise. |
| S05 | Medium | Mot de passe de liste : 4 caractères, posé ou retiré par tout membre, effacement sans confirmation. La limite de débit du déverrouillage est celle de S02. | Voir F22. `unlockPublicListAction` vers 676. | Propriétaire seul, secret plus long, confirmation, limite non falsifiable. |
| S06 | Medium | Pas de Content-Security-Policy. Les images d’idées sont chargées depuis l’URL saisie (`<img>` dans `public-item-card.tsx`). | `next.config.ts` `securityHeaders`. | CSP qui autorise les images distantes sans autoriser les scripts inline. À décider avant de la poser : elle peut casser le guide ou les images. |
| S07 | Medium | Les mentions légales disent que le site utilise les données des comptes, des listes et des réservations, et donnent un e-mail. Elles ne décrivent pas les cookies (session, langue, réservation, déverrouillage), ni Resend, ni Gemini / OpenAI, ni la durée de conservation. | `locales/fr/content.json` `legal.privacyBody`. Cookies posés dans `actions.ts`, `reservation-claim.ts`, `read-unlock.ts`, `middleware.ts`. | Texte à la mesure de ce que le code fait. Ne pas inventer une base légale. |
| S08 | Low | `scryptSync` bloque l’unique process Node à chaque connexion, inscription ou vérification. Les tests montrent des appels de l’ordre de 30 à 100 ms. | `src/domain/passwords.ts` `scryptSync`. | `scrypt` asynchrone, ou un coût OWASP plus haut seulement si le process n’est plus bloqué. |
| S09 | Low | `SESSION_SECRET` est accepté dès qu’il est non vide. Le README demande 32 caractères, le code ne le vérifie pas. | `src/auth/session.ts` `sessionSecret`. | Refuser le démarrage en production si le secret est trop court. |
| S10 | Low | Les scripts de démo ont un mot de passe par défaut en dur. | `scripts/create-demo-data.mjs`, `scripts/capture-demo.mjs`. La valeur n’est pas recopiée. | Laisser la variable d’environnement obligatoire, sans défaut, si ces scripts tournent hors d’une machine de dev. |
| S11 | Medium | PostCSS vulnérable via Next. Correctif npm : Next 16, changement majeur. | `npm audit --omit=dev` le 21 octobre 2026. | Monter Next quand le lot de dépendances est assumé. Pas un contournement à écrire dans l’appli. |

Réserve, pas un défaut démontré : `safeHttpGet` revérifie le DNS à chaque redirection, puis `fetch` résout à nouveau le nom. Une course DNS reste théoriquement possible. Les tests couvrent le rejet d’une IP privée et d’une redirection vers une IP privée.

## Code et tests

`npm test` le 21 octobre 2026 : 57 tests, 0 échec, environ 4 s. Couverture utile du domaine (comptes, session, reset, adhésion, idées, filtres, réservation, SSRF, thème, prix, claims). Aucun test de composant, de page ou de server action. Pas de script `lint` ni `typecheck`. Pas de workflow GitHub. Le script `test` énumère les fichiers : un nouveau fichier oublié dans la liste ne tourne pas.

`src/server/actions.ts` concentre toute la surface d’écriture (environ 880 lignes). Les contrôles d’appartenance sont dans le domaine, pas seulement dans l’UI. C’est le bon endroit, et c’est déjà testé pour une partie des règles.

## Recommandations

Ce ne sont pas des défauts constatés comme des échecs.

- Vérifier l’e-mail à l’inscription. Aujourd’hui un compte est ouvert dès que l’e-mail contient un `@` (`src/domain/users.ts`).
- Politique de mot de passe de compte au-delà de 10 caractères. Le collage reste possible : c’est le bon choix pour WCAG 3.3.8.
- Page « accessibilité » et contact dédié. Le RGAA les demande aux organismes publics. Ici c’est un choix, pas une obligation. Ne pas publier une déclaration de conformité sans audit complet.
- Images produit en `alt=""` (`public-item-card.tsx`). Le nom est à côté, donc ce n’est pas un échec 1.1.1 démontré. Un alt court aiderait quand la photo dit autre chose que le titre.
- Colonne `max-w-3xl` sur la gestion de liste : dense mais étroite sur grand écran. Élargir seulement si la gestion devient pénible, pas pour refaire l’identité.
- Remplacer le fichier JSON unique le jour où plusieurs instances ou un volume d’écritures l’exigent. L’écriture temporaire puis `rename` est déjà saine sur Linux.
- HSTS `preload` est posé pour toutes les réponses. Ne le soumettre au preload qu’avec un domaine entièrement en HTTPS.
- Monter la dépendance PostCSS / Next dans un lot à part (S11).
- Brancher ESLint avec `jsx-a11y`, et un test de fumée des pages publiques. Playwright est déjà une dépendance de développement.

## Non vérifié

- Parcours clavier réel, focus visible à l’usage, ordre de tabulation, retour de focus des dialogues.
- Zoom 200 % au sens du navigateur. Seulement le reflow à 320 px sur l’accueil, le guide et l’inscription.
- Lecteur d’écran, contraste des thèmes personnalisés en situation, pages de gestion connectées (volontairement non ouvertes).
- axe, Lighthouse, Core Web Vitals. Aucun chiffre de LCP ou d’INP n’est avancé.
- En-têtes réellement servis en production derrière le proxy.
- Soumission des formulaires avec données valides et invalides. Les comptes et les listes n’ont pas été modifiés.
- Le bug de bascule de langue signalé le 20 octobre 2026 n’a pas été reproduit : `?lang=en` a bien affiché l’anglais et marqué EN comme courant.
