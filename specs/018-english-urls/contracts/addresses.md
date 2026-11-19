# Contrat : adresses publiques du site

Ce contrat décrit ce qu'un navigateur, un client de messagerie, un moteur de recherche ou l'app voit. Il remplace, pour les chemins, `specs/011-app-deep-links/contracts/links.md` (les écrans de l'app et leur comportement n'y changent pas).

## 1. Pages

Français sans préfixe, anglais sous `/en`. Toute page se sert sous sa nouvelle adresse ; la table complète est dans `spec.md` § « Nouvelles adresses » et `data-model.md`.

Paramètres de la page d'une liste : `tab` ∈ `ideas` (défaut, omis), `archive`, `reservations`, `sharing`, `settings`.
Paramètre de renvoi : `next` partout (connexion, inscription, confirmation d'adresse).
Retours d'action : `link`, `mail=failed`, `nomail=1`, `own=1`. Ancres : `#content`, `#following`, `#keys`, `#data`, `#delete`.

## 2. Anciennes adresses

| Requête | Réponse |
|---------|---------|
| `GET`/`HEAD` d'une ancienne adresse, avec ou sans `/en` | `301`, `Location` = nouvelle adresse, même préfixe de langue, paramètres traduits |
| idem avec `/fr/…` | `301` directement vers la nouvelle adresse française (pas de seconde redirection) |
| idem avec `?lang=en` | `301` directement vers `/en/<nouvelle adresse>`, `lang` retiré |
| autre méthode (`POST` d'un formulaire ou d'une server action) | traitée par la nouvelle page (réécriture), sans redirection |
| nouvelle adresse avec `?onglet=` ou `?suite=` | `301` vers la même adresse, paramètres traduits |
| nouvelle adresse avec `next=<ancienne adresse>` | `301`, `next` traduit |
| adresse inchangée (`/`, `/faq`, `/guide`, `/l/<jeton>`, `/l/<jeton>/types`, `/api/…`, `/.well-known/…`) | servie sans redirection |

Exemples :

| Ancienne | Nouvelle |
|----------|----------|
| `/compte` | `/account` |
| `/en/compte/export` | `/en/account/export` |
| `/fr/listes/abc?onglet=partage` | `/lists/abc?tab=sharing` |
| `/listes/abc?onglet=idees&e=forbidden` | `/lists/abc?tab=ideas&e=forbidden` (la page omet ensuite `tab=ideas` dans ses propres liens) |
| `/confirmer-email/T?suite=%2Finviter%2FI` | `/confirm-email/T?next=%2Finvite%2FI` |
| `/connexion?next=%2Flistes%2Fabc&lang=en` | `/en/login?next=%2Flists%2Fabc` |
| `/l/R/reserver?itemId=X` | `/l/R/reserve?itemId=X` |

Les redirections n'ont pas de date de fin.

## 3. Liens émis

| Origine | Adresse |
|---------|---------|
| E-mail de confirmation d'adresse | `<origine>[/en]/confirm-email/<jeton>[?next=…]` |
| E-mail de réinitialisation | `<origine>[/en]/reset-password/<jeton>` |
| Lien et e-mail d'invitation, `inviteUrl` de l'API | `<origine>[/en]/invite/<jeton>` |
| E-mail « compte déjà existant » | `<origine>[/en]/login` |
| Lien de partage public, QR code | `<origine>[/en]/l/<jeton>` (inchangé) |
| Plan du site | `/`, `/about`, `/faq`, `/guide`, `/legal-notice`, `/privacy`, et leurs versions `/en` |

## 4. Fichiers d'association et app

- `/.well-known/apple-app-site-association` : un composant par chemin de la table des liens de l'app (nouvelle forme) **et** par ancienne forme qui y mène (`/confirmer-email/*`, `/reinitialiser/*`, `/inviter/*`, `/connexion`, `/inscription`, `/l/*/reserver`), chacun avec et sans `/en`.
- `/.well-known/assetlinks.json` : inchangé (ne liste pas de chemins).
- Filtres Android de l'app : mêmes préfixes que le fichier Apple, fixés au build.
- L'app ouvre l'écran de la nouvelle forme pour l'ancienne. Les liens qu'elle ouvre vers le site utilisent la nouvelle forme (`/lists/<id>?tab=sharing`, `/legal-notice`, `/privacy`).
- Règle de livraison (research R6) : aucune version de l'app avec liens universels antérieure à cette feature n'est publiée.
