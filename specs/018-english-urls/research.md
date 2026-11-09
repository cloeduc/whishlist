# Research: Adresses du site en anglais

## R1. Où faire les redirections

**Decision** : dans `proxy.ts`, par la fonction pure `decideLocaleRoute` (`src/i18n/locale-path.ts`), qui reçoit en plus la méthode HTTP. Avant de décider la langue, elle traduit une ancienne adresse avec `canonicalSitePath()` (nouveau module pur `src/site/legacy-paths.ts`, R2). Si la traduction change le chemin ou la requête : redirection 301 vers la nouvelle adresse, dans la langue de l'ancienne (`/en` gardé, `/fr` et `?lang=` appliqués dans la même réponse).

**Rationale** : une seule redirection, même avec `/fr` ou `?lang=` (FR-004), parce que la langue et le renommage se décident dans la même fonction. La fonction est pure et déjà testée (`tests/domain/locale-path.test.ts`) : la table se teste ligne par ligne sans serveur. 301 comme les redirections de langue déjà en place.

**Alternatives considered** :
- `redirects()` de `next.config.ts` : ne traduit pas les valeurs des paramètres (`onglet=partage` → `tab=sharing`, `next=/listes/…`), enchaîne deux redirections avec la langue (`/fr/compte` → `/compte` → `/account`), et ne se teste qu'avec un serveur.
- Garder les anciens dossiers de `app/` en pages qui appellent `permanentRedirect()` : double les pages, et rien n'empêche qu'une page soit oubliée.

## R2. Une table des anciennes adresses, partagée par le site et l'app

**Decision** : `src/site/legacy-paths.json`, lu par `src/site/legacy-paths.ts` (site et app) et par `mobile/app.config.ts` (filtres Android). Deux listes :
- `paths` : `{ "from": "/listes", "to": "/lists" }`, comparés segment par segment comme préfixe (`/listes`, `/listes/new`, `/listes/<id>`) ; `:param` remplace un segment (`/l/:readToken/reserver` → `/l/:readToken/reserve`).
- `params` : `onglet` → `tab` avec ses valeurs (`idees` → `ideas`, `archives` → `archive`, `reservations` → `reservations`, `partage` → `sharing`, `reglages` → `settings`) ; `suite` → `next`. La valeur de `next` (et de l'ancien `suite`) est elle-même traduite si c'est une ancienne adresse.

`canonicalSitePath(path, search)` rend `{ path, search, changed }`. Elle ne touche ni au préfixe `/en` (retiré et remis par l'appelant) ni aux autres paramètres.

**Rationale** : JSON parce que `mobile/app.config.ts` ne lit pas un module TypeScript hors de `mobile/` (même raison que `app-link-routes.json`, feature 011). Une seule source pour les redirections, la traduction des valeurs de renvoi (FR-005) et les liens reconnus par l'app (FR-008), conformément à l'entité « Table des adresses » de la spec.

**Alternatives considered** : une entrée `legacy` dans chaque ligne de `app-link-routes.json` : ne couvre que les liens de l'app, pas `/compte`, `/projet` ni les paramètres.

## R3. Requêtes autres que GET sur une ancienne adresse

**Decision** : pour `POST` (et toute méthode autre que `GET`/`HEAD`), le proxy **réécrit** l'ancienne adresse vers la nouvelle au lieu de rediriger.

**Rationale** : un formulaire ou une server action envoyés depuis une page restée ouverte avant la mise en production postent vers l'adresse de la page. Une 301 transforme un `POST` en `GET` et perdrait l'envoi (cas limite « Formulaire envoyé depuis une page restée ouverte »). La réécriture laisse l'action s'exécuter ; sa redirection de fin vise déjà la nouvelle adresse. Si l'identifiant de l'action a changé entre deux builds, Next renvoie son erreur habituelle, comme pour tout déploiement.

**Alternatives considered** : 308 (garde la méthode) : dépend de la façon dont le client de Next suit les redirections d'une action ; la réécriture ne dépend de rien.

## R4. Paramètres renommés envoyés par les formulaires

**Decision** : les formulaires envoient `tab` (valeurs anglaises). `src/server/actions.ts` lit `tab`, puis `onglet` à défaut, et passe la valeur par la même table (`legacyParamValue`). La page de liste lit `tab` ; un ancien `?onglet=` n'y arrive plus (redirigé par le proxy). `confirmEmailAction` lit `next`, puis `suite`.

**Rationale** : une page ouverte avant le changement envoie encore `onglet=partage` ; la réponse doit ramener sur le bon onglet.

## R5. Liens de l'app (feature 011) : anciennes et nouvelles formes

**Decision** :
- `app-link-routes.json` passe aux nouvelles adresses (`/confirm-email/:token`, `/reset-password/:token`, `/invite/:token`, `/login`, `/register`, `/l/:readToken/reserve`…).
- `appPathForSiteUrl` traduit d'abord le chemin et la requête par `canonicalSitePath()`, puis cherche dans la table : une ancienne adresse ouvre le même écran que la nouvelle, sans dupliquer les lignes.
- Le fichier Apple (`appleAssociation`) et les préfixes Android (`androidPathPrefixes`, `APP_LINK_PREFIXES` de `mobile/app.config.ts`) déclarent les deux formes : préfixes des routes de l'app + anciens préfixes des lignes de `legacy-paths.json` qui y mènent. Le test qui compare les deux calculs reste.
- `mobile/src/links/pending.ts` reconnaît l'invitation dans `next` sous les deux formes (`/invite/`, `/inviter/`) après traduction.

**Rationale** : FR-008 et FR-009 ; la table de 011 garde une ligne par écran.

## R6. Versions de l'app installées avant cette feature (FR-010)

**Constat** : sur iOS, les chemins ouverts par l'app viennent du fichier `apple-app-site-association` servi par le site, sans distinction de version. Dès que le site y déclare `/confirm-email/*`, toute version de l'app qui a les liens universels (≥ 1.1.0, feature 011) s'ouvre sur ces liens ; une version qui ne connaît pas la nouvelle adresse tombe sur l'accueil (`+native-intent.tsx` rend `/`). Sur Android, les chemins sont fixés dans l'app installée : une ancienne version ne réclame que les anciens préfixes et laisse les nouveaux au navigateur, ce qui respecte FR-010.

État des versions (mémoire du projet, 2026-11-01 → 2026-11-06) : la seule version envoyée aux stores est la 1.0.0 (iOS build 3, Android versionCode 4), antérieure à la feature 011 : elle n'a aucun lien universel, donc aucun risque. La 1.1.0 (feature 011) n'est pas publiée.

**Decision** : la version de l'app qui porte cette feature est la **première version publique avec les liens universels**. Le fichier Apple déclare les deux formes dès la mise en production du site. Règle de livraison, écrite dans `quickstart.md` et dans la tâche de commit de l'US2 : ne publier aucune version 1.1.x construite avant cette feature. Si une telle version était déjà installée par des testeurs TestFlight ou Play, la mise à jour de test suffit (pas d'utilisateurs publics).

**Rationale** : le seul moyen technique de servir deux versions iOS différemment serait un identifiant d'app distinct ; la population concernée est nulle hors testeurs.

**Alternatives considered** :
- Ne pas déclarer les nouvelles adresses à iOS tant que des 1.1.x circulent (variable d'environnement) : complexité pour une population vide, et les nouveaux e-mails ouvriraient le site sur iPhone.
- Garder les anciennes adresses dans les e-mails pour les liens de l'app : contraire à FR-002.

## R7. Robots, plan du site, mesure d'audience, adresses canoniques

**Decision** : `app/sitemap.ts` liste `/about`, `/legal-notice`, `/privacy` à la place des anciennes. `app/robots.ts` interdit les nouveaux préfixes et garde les anciens (une ancienne adresse avec jeton ne doit pas être explorée avant sa redirection). `src/site/analytics-public.ts` (préfixes masqués dans la mesure d'audience) passe aux nouveaux préfixes ; les anciens n'arrivent plus jusqu'au rendu. Les `alternates` et canoniques suivent `withLocale` sans changement de code.

## R8. Ce qui ne change pas

- Le contrat de l'API (`specs/004-mobile-api/contracts/openapi.yaml`) : routes identiques ; seuls les exemples et descriptions des adresses de site renvoyées (`inviteUrl`, liens d'e-mail) sont mis à jour. Les types de l'app (`api:types`) sont régénérés si une description change.
- Aucune variable d'environnement, aucun changement de base.
- `public/guide/**` : les captures ne montrent pas la barre d'adresse ; le texte du guide et de la FAQ (`locales/*/content.json`) qui cite une adresse est mis à jour.
