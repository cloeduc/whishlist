# Plan de mise à niveau — Oh, mais fallait pas ! — 21 octobre 2026

Source : `docs/audits/wishlist-audit.md`. Aucun correctif n’est inclus dans ce document. Chaque lot se fait seul, puis se revérifie, avant le suivant.

Complexité : S une demi-journée, M un à deux jours, L au-delà, en restant dans l’architecture actuelle. Risque : ce qui peut casser un parcours déjà bon.

## Avant le premier lot

Branche actuelle : `main`, alignée sur `origin/main` (`8f3a69b`), arbre de travail déjà sale. Les pages FAQ, guide, projet et mentions légales, l’accordéon et une partie du domaine ne sont pas commités. L’audit porte sur cet arbre, pas sur le dernier commit seul.

Ne pas ouvrir les corrections sur `main`. Ne pas créer la branche tant que ce n’est pas explicitement demandé. Nom proposé, dans le style du dépôt : `feat/upgrade-quality`.

Au moment du oui, il faudra décider du sort du travail non commité : le committer d’abord, ou l’emporter tel quel sur la branche. Ce plan ne fait ni l’un ni l’autre.

Les lots S01, S02 et S05 touchent la session, les cookies ou le contrôle d’accès. Les expliquer et attendre un accord avant de les coder. Un durcissement de session peut déconnecter tout le monde.

## Lot 1 — Session et abus

Constats : S01, S02, S03, S04, S05, F22.

Pourquoi en premier : une session non révoquée et une invitation sans limite sont les seuls constats High / Medium qui exposent des comptes et des liens d’édition.

Contenu :

- Version de session incrémentée au changement de mot de passe, refus des jetons plus anciens.
- Limite de débit qui ne croit que l’IP fournie par le proxy de production.
- Plafond sur l’envoi d’invitations.
- Inscription qui ne dit plus si l’adresse existe.
- Mot de passe de liste réservé au propriétaire, plus long, effacement confirmé.

Complexité : L. Risque de régression : élevé. Connexion, déconnexion, reset, invitation, listes déjà protégées par un mot de passe court, membres qui aujourd’hui peuvent changer ce mot de passe.

Vérification : tests domaine session et read-password à étendre ; parcours connexion, reset, déverrouillage d’une liste, envoi d’invitation. Ne pas le mélanger avec le lot SEO.

## Lot 2 — Contrôles de la liste

Constats : F01, F02, F08, F20, F21.

Pourquoi ensuite : F01 bloque une action que le guide décrit. Le reste est le même écran (accordéon, puces, membres).

Contenu :

- Monter / descendre une catégorie et déplacer une idée sans glisser. Le glisser peut rester.
- Carte d’idée qui n’est plus elle-même un bouton.
- Cible de suppression des puces à 24 px au moins.
- Confirmation avant de retirer un membre.
- Erreurs de ces panneaux dans un `Alert`.

Complexité : M. Risque : moyen. L’accordéon et `reorderTypes` / `setItemType` sont déjà testés côté domaine ; la régression serait dans l’UI (édition, archivage, ordre perdu).

Vérification : clavier sur une liste de démo, pas sur des données réelles. Largeurs 320 et 1024. Les 57 tests domaine doivent rester verts.

## Lot 3 — Contraste, titres, liens

Constats : F03, F04, F05, F06, F07, F09, F10, F11, F23.

Contenu :

- Rouge destructif et étoiles au-dessus des seuils 4,5:1 et 3:1.
- `h1` sur inscription, connexion, mot de passe oublié, réinitialisation, nouvelle liste.
- Lien d’évitement.
- CTA de navigation laissés en liens.
- « Fermer », le nom du pied de page et les termes des mentions légales dans la langue active.
- Refus ou correction des thèmes de liste illisibles.

Complexité : M. Risque : moyen pour F23 (des listes déjà enregistrées peuvent avoir des couleurs refusées au prochain enregistrement ; ne pas les écraser en silence). Faible pour le reste.

Vérification : recalcul des deux ratios, arbre d’accessibilité de `/inscription` avec un `h1`, accueil FR et EN, une liste dont le thème est limite.

## Lot 4 — Indexation et pages publiques

Constats : F12, F13, F14, F15.

Contenu :

- `noindex` sur `/l/*`, `/inviter/*`, `/reinitialiser/*`, `/compte`, `/listes/*`.
- Titres et descriptions distincts pour l’accueil et les pages de compte publiques (connexion, inscription, reset).
- Canonique absolu sur les pages marketing. Sitemap et `robots.txt` limités à `/`, `/projet`, `/faq`, `/guide`, `/mentions-legales`.
- Open Graph titre et description, sans image inventée.
- Décision de langue à trancher avant de coder : soit deux URLs (`/fr`, `/en` ou le préfixe déjà souhaité), soit une seule langue indexable. Ne pas poser des `hreflang` vers la même URL.
- Retirer `force-dynamic` du layout racine. Le garder seulement sur les pages qui lisent le cookie de session ou le JSON.

Complexité : L si les URLs de langue bougent, M si on reste en cookie et qu’on n’indexe que le français par défaut. Risque : élevé si les URLs changent (liens déjà partagés, cookie, guide). Moyen si on se limite au `noindex`, aux titres et au cache.

Le `noindex` des listes ne doit pas s’appliquer à l’accueil. Vérifier le HTML de `/`, `/guide` et d’une liste de démo.

## Lot 5 — Textes et données personnelles

Constats : F17, F18, S07. Recommandation, pas un défaut de code : la page accessibilité n’est pas à rédiger dans ce lot.

Contenu :

- Page projet et conseil du guide alignés sur la FAQ : les gestionnaires voient les réservations.
- Retirer « vibe coding » et le délai de 48 heures du pied de page. Sur la page projet, les reformuler seulement si le récit reste vrai et utile.
- Compléter les mentions avec les cookies réellement posés, Resend, et l’enrichissement Gemini / OpenAI quand les clés existent. Durée de conservation : l’écrire seulement si elle est décidée. Ne pas inventer de finalité.

Complexité : S. Risque : faible. Les captures du guide qui montrent l’ancien écran restent valables tant que les boutons cités n’ont pas changé. Si un texte de capture devient faux, regénérer avec `npm run demo:capture`, pas à la main.

Vérification : lecture FR et EN de `/`, `/projet`, `/faq`, `/guide`, `/mentions-legales`.

## Lot 6 — Finitions de parcours

Constats : F16, F19, F24.

Contenu :

- Un seul bouton principal sur l’accueil. Le soutien reste le cœur de l’en-tête ou un lien du pied de page.
- Prix du formulaire d’édition dans la locale (`18,50` en français).
- Pages 404 et erreur dans le layout actuel.

Complexité : S. Risque : faible. F16 change la hiérarchie visuelle de l’accueil : vérifier 320 et 1440 pour ne pas laisser un trou.

## Lot 7 — Outillage

Recommandations, après les lots qui corrigent des constats.

- ESLint avec `jsx-a11y`, script `lint` et `typecheck`.
- Un test de fumée des pages publiques (Playwright est déjà là pour les captures ; ne pas ajouter un second runner).
- `scrypt` non bloquant (S08) et refus d’un `SESSION_SECRET` trop court en production (S09).
- Next 16 / PostCSS (S11) dans un lot isolé, avec `npm test` et `npm run build`. Risque élevé à cause du saut de majeur. Ne pas le faire « pour que l’audit soit vert ».
- Mot de passe de démo sans valeur par défaut (S10) si ces scripts quittent la machine de dev.

Complexité : M, plus L pour Next 16. Risque : faible pour le lint, élevé pour Next 16.

## Hors de ces lots

À ne pas faire pendant la mise à niveau, sauf demande séparée :

- Changer de base de données.
- Refonte visuelle, mode sombre, ou nouvelle bibliothèque UI.
- Réécrire les textes selon l’audit du 20 octobre 2026 : une partie vise encore la marque Wishlist et des chaînes déjà remplacées.
- Déclaration RGAA officielle. Le site n’est pas un service public, et cet audit n’est pas une conformité.
- Elargir la colonne de gestion juste pour remplir l’écran.

## Ordre et arrêts

1. Lot 1, après accord explicite.
2. Lot 2.
3. Lot 3.
4. Lot 4, après le choix sur les URLs de langue.
5. Lot 5.
6. Lot 6.
7. Lot 7, Next 16 en dernier et séparément.

Si un lot casse `npm test` ou un parcours déjà vérifié (inscription, lecture d’une liste, réservation, bascule FR/EN), on s’arrête et on ne passe pas au suivant.

Les éléments restés non vérifiés dans l’audit (clavier réel, zoom 200 %, lecteur d’écran, Lighthouse, pages connectées sur données réelles) se revérifient sur une liste de démo au moment du lot concerné. Ne pas les déclarer conformes tant que ce n’est pas refait.
