# Bug Assessment: Confirmation d'adresse e2e bloquée dans Safari

- **Slug**: e2e-confirm-email-safari
- **Created**: 2026-11-06
- **Source**: texte collé (tâche WHIS-2, note du backlog du 2026-11-03)
- **Verdict**: valid
- **Severity**: high (suite e2e mobile : tous les parcours qui créent un compte confirmé échouent ; aucun impact sur les utilisateurs réels)

## Report (verbatim or summarized)

> Dans `subflows/confirm-email.yaml`, Maestro tape « Confirmer » sur `/confirmer-email/<jeton>` ouvert dans Safari (lien `http://localhost:3010`, simulateur effacé, `next dev`), mais le serveur ne reçoit aucun `POST` : seul le `GET` de la page arrive, puis « Votre adresse e-mail est confirmée » n'apparaît pas. Tous les parcours qui créent un compte confirmé échouent. Pistes non vérifiées : tap avant que la page soit prête (premier chargement 4,2 s en dev), CSP de `proxy.ts`. Avec des onglets Safari accumulés, `next dev` rechargeait aussi la page en boucle (« Compiled in 0ms »).

## Symptom

Sur un Safari neuf (simulateur effacé), le parcours voit le bouton « Confirmer », puis le tap échoue : aucun `POST` n'arrive au serveur et le texte de succès n'apparaît pas. Attendu : le tap envoie le formulaire, la page affiche « Votre adresse e-mail est confirmée ».

## Reproduction

Reproduit le 2026-11-06 sur `main` (9811b76), iPhone 17 Pro Max iOS 26.5, app Release pointée sur `http://localhost:3010`, `next dev` à froid :

1. Remettre Safari à neuf sur le simulateur (données de Safari déplacées : équivalent d'un simulateur effacé pour Safari).
2. `npm --prefix mobile run e2e -- .maestro/flows/010-us1-verify-email.yaml`
3. Échec : `Element not found: Text matching regex: Confirmer`. Journal du serveur : un seul `GET /confirmer-email/<jeton>`, aucun `POST`.

Capture au moment de l'échec : la page est affichée, mais une bulle de Safari, « Afficher les signets, le menu Partager et les onglets ouverts » (TipKit, première ouverture de Safari sous iOS 26), est ouverte au-dessus. La hiérarchie vue par Maestro ne contient alors que la bulle (`resource-id=TipView`, bouton `xmark.circle.fill` « Fermer ») et une zone `PopoverDismissRegion` plein écran : le contenu web n'est plus accessible, donc « Confirmer » est introuvable, et un tap sur la page ne ferait que fermer la bulle.

Contre-épreuves (même machine, même jour) :

- Safari déjà utilisé (bulle déjà vue) : `010-us1` passe sur `main`, à chaud comme à froid ; il passe aussi sur 7b85ce7 (avant l'audit 015). Les 7 parcours de la suite qui confirment une adresse dans Safari passent à la suite (005-us1, 005-us2, 006-us1, 006-us3, 010-us1, 010-us2, 010-us3), `POST` reçu à chaque fois.
- Page ouverte seule dans Safari par Maestro (`appId: com.apple.mobilesafari`) : le tap envoie le `POST` et le succès s'affiche.

## Suspected Code Paths

- `mobile/.maestro/subflows/confirm-email.yaml` — attend « Confirmer », puis tape une seule fois : il ne gère pas la bulle de Safari qui arrive après le chargement.
- `mobile/.maestro/subflows/share-from-safari.yaml` — ouvre aussi Safari (parcours 015-us1) et tape `MoreMenuButton`, le bouton même que la bulle désigne : même risque sur un simulateur effacé.
- Site (`app/confirmer-email/[token]/page.tsx`, `proxy.ts`, `src/server/content-security.ts`) : hors de cause. Le formulaire marche dans Safari dès que la bulle est fermée, et le `POST` part même avant l'hydratation (action serveur avec repli HTML).

## Root Cause Hypothesis

Confiance : haute (reproduit, puis capture et hiérarchie au moment de l'échec). Au premier lancement de Safari, iOS 26 affiche une bulle d'astuce qui rend la page inaccessible tant qu'elle n'est pas fermée. Elle arrive peu après le chargement : `extendedWaitUntil` voit « Confirmer », puis le tap ne le trouve plus, ou tombe sur la zone qui ferme la bulle. Le 2026-11-03, le simulateur venait d'être effacé, d'où l'échec de tous les parcours qui confirment une adresse. Les deux pistes du rapport sont écartées : le tap avant hydratation marche (repli HTML), et la CSP n'a rien bloqué (la même page passe avec un Safari déjà utilisé). La boucle « Compiled in 0ms » vient des onglets accumulés : à chaque redémarrage de `next dev`, Safari recharge tous ses onglets `confirmer-email` (vu dans le journal : 9 `GET …?ok=verify` au démarrage). Ce bruit ne casse pas les parcours.

Constat voisin, hors de ce bug : avec l'app installée en Release, `openLink ohyoushouldnt://…` (011-us1, 011-us2) fait demander par iOS « Ouvrir dans « Oh, mais fallait pas ! » ? ». Personne ne répond à la boîte de dialogue, qui reste ouverte et fait échouer les parcours suivants (`login.screen` introuvable). Voir Open Questions.

## Proposed Remediation

**Preferred**: corriger la suite, pas le site. Ajouter un sous-parcours `subflows/dismiss-safari-tip.yaml` qui ferme la bulle si elle est là (`id: TipView`, puis tap sur `id: xmark.circle.fill`, des identifiants qui ne dépendent pas de la langue). Dans `confirm-email.yaml`, mettre la fermeture, le tap sur « Confirmer » (seulement s'il est visible) et l'attente du texte de succès dans un `retry` : si la bulle arrive avant ou après le tap, l'essai suivant la ferme et retape. L'assertion reste la même : le texte de succès doit apparaître, et un `POST` réussi supprime le bouton, donc on ne confirme jamais deux fois. Dans `share-from-safari.yaml`, fermer la bulle avant de taper le menu, dans un `retry` aussi.

**Alternatives**:
- Attente fixe (`waitForAnimationToEnd`, délai) avant le tap : fragile, la bulle peut arriver plus tard.
- Désactiver les astuces de Safari par `simctl spawn defaults write` dans `e2e.mjs` : clé non documentée, qui peut changer d'une version d'iOS à l'autre.

**Files likely to change**:
- `mobile/.maestro/subflows/dismiss-safari-tip.yaml` (nouveau)
- `mobile/.maestro/subflows/confirm-email.yaml`
- `mobile/.maestro/subflows/share-from-safari.yaml`
- `mobile/.maestro/README.md` (une ligne sur la bulle de Safari)

**Tests to add or update**:
- Pas de test de domaine : la cause n'est pas dans le site.
- `npm --prefix mobile test` vérifie déjà que chaque `id:` d'un parcours existe dans l'app. Les ids de Safari (`TipView`, `xmark.circle.fill`) n'existent pas dans l'app : vérifier comment le test traite les ids des autres apps (`MoreMenuButton`, `ShareButton` sont déjà dans ce cas).
- Preuve : `010-us1` qui passe sur un Safari remis à neuf, là où il échouait avant la correction.

## Risks & Considerations

- La bulle est propre à iOS 26 ; une autre version peut en afficher une autre. Le sous-parcours ne fait rien si `TipView` est absent.
- Le `retry` rallonge un échec réel (3 × 20 s) avant de le signaler.

## Open Questions

- La boîte « Ouvrir dans … ? » des parcours 011 (lien `ohyoushouldnt://`) est un autre problème, qui empêche aussi la suite d'être verte. À corriger dans cette tâche (tap facultatif sur « Ouvrir|Open » après `openLink`, comme dans `dev-client-reconnect.yaml`) ou dans un bug séparé ?
