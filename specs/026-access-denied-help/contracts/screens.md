# Contrat : écrans, liens, textes

Pas de changement de l'API JSON (`specs/004-mobile-api/contracts/openapi.yaml` inchangé).

## Table des liens de l'app (`src/site/app-link-routes.json`)

Ligne ajoutée :

```json
{ "site": "/lists/:listId", "app": "/links/list/:listId", "keepQuery": ["tab"] }
```

Conséquences (vérifiées par `tests/domain/app-links.test.ts` et `mobile/__tests__/links/app-config.test.ts`) :

| Adresse reçue | Écran de l'app |
|---|---|
| `https://<site>/lists/abc` | `/links/list/abc` |
| `https://<site>/en/lists/abc?tab=sharing` | `/links/list/abc?tab=sharing` |
| `https://<site>/listes/abc?onglet=partage` | `/links/list/abc?tab=sharing` |
| `https://<site>/connexion?next=/listes/abc` | `/login?next=/lists/abc` → adresse gardée → `/links/list/abc` après connexion |
| `https://<site>/lists/new` | `/links/list/new` → `/lists/new` |
| `ohyoushouldnt://lists/abc` | `/links/list/abc` |

Fichier Apple : composants `/lists/*`, `/en/lists/*`, `/listes/*`, `/en/listes/*` en plus. Android : préfixes `/lists/`, `/en/lists/`, `/listes/`, `/en/listes/` en plus.

## Page d'aide du site (`app/lists/[id]/page.tsx`, non-membre)

| Élément | Clé (`list`) | Condition |
|---|---|---|
| Titre | `accessHelp.title` | toujours |
| Explication | `accessHelp.body` | toujours |
| Comment voir la liste | `accessHelp.howTo` | non abonné |
| Liste déjà suivie | `accessHelp.followedBody` | abonné |
| Bouton « Voir la liste » → `/l/<readToken>` | `accessHelp.viewFollowed` | abonné |
| Bouton « Mes listes » → `/lists` | `accessHelp.backToLists` | toujours |

Aucun titre de liste, nom de propriétaire, lien de partage ni identifiant n'est affiché.

## Page de gestion (membre)

| Élément | Clé (`list`) |
|---|---|
| Bouton « Partager » dans l'en-tête → `?tab=sharing` (masqué sur l'onglet Partage) | `share.action` |
| Note sous la description de l'onglet Partage | `share.addressNote` |

## Écran de l'app (`mobile/app/links/list/[listId].tsx`)

| État | Contenu | testID |
|---|---|---|
| Chargement | indicateur | `link-list.loading` |
| Sans session | invitation à se connecter (comme l'invitation) | `link-list.screen` |
| Membre | redirection, pas d'écran | — |
| Abonné | `accessHelp.title`, `accessHelp.body`, `accessHelp.followedBody`, bouton `accessHelp.viewFollowed` → `/guest/<readToken>`, bouton `accessHelp.backToLists` | `link-list.help`, `link-list.view-followed`, `link-list.back` |
| Ni l'un ni l'autre (ou inexistante) | `accessHelp.title`, `accessHelp.body`, `accessHelp.howTo`, bouton `accessHelp.backToLists` → `/` | `link-list.help`, `link-list.back` |

## Textes (FR, à reprendre en EN avec les mêmes clés)

| Clé | FR |
|---|---|
| `accessHelp.title` | Cette adresse sert à gérer la liste |
| `accessHelp.body` | Elle n'ouvre la liste qu'aux personnes qui la gèrent. Vous n'en faites pas partie avec ce compte. |
| `accessHelp.howTo` | Pour voir la liste et réserver une idée, demandez le lien de la liste à la personne qui vous a envoyé cette adresse. Elle le trouve dans l'onglet « Partage » de sa liste. |
| `accessHelp.followedBody` | Vous suivez déjà cette liste : vous pouvez l'ouvrir pour la consulter. |
| `accessHelp.viewFollowed` | Voir la liste |
| `accessHelp.backToLists` | Mes listes |
| `share.action` | Partager |
| `share.addressNote` | L'adresse de cette page est réservée aux personnes qui gèrent la liste. Pour partager, envoyez le lien de la liste. |
