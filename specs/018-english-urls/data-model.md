# Data Model: Adresses du site en anglais

Pas de changement de base. Le seul « modèle » est la table des adresses, un fichier versionné.

## Table des anciennes adresses — `src/site/legacy-paths.json`

```json
{
  "paths": [
    { "from": "/listes", "to": "/lists" },
    { "from": "/compte", "to": "/account" },
    { "from": "/inscription", "to": "/register" },
    { "from": "/connexion", "to": "/login" },
    { "from": "/mot-de-passe-oublie", "to": "/forgot-password" },
    { "from": "/changer-mot-de-passe", "to": "/change-password" },
    { "from": "/reinitialiser", "to": "/reset-password" },
    { "from": "/confirmer-email", "to": "/confirm-email" },
    { "from": "/inviter", "to": "/invite" },
    { "from": "/l/:readToken/reserver", "to": "/l/:readToken/reserve" },
    { "from": "/mentions-legales", "to": "/legal-notice" },
    { "from": "/donnees-personnelles", "to": "/privacy" },
    { "from": "/projet", "to": "/about" }
  ],
  "params": [
    {
      "from": "onglet",
      "to": "tab",
      "values": { "idees": "ideas", "archives": "archive", "reservations": "reservations", "partage": "sharing", "reglages": "settings" }
    },
    { "from": "suite", "to": "next", "path": true },
    { "from": "lien", "to": "link" },
    { "from": "envoi", "to": "mail", "values": { "echec": "failed" } },
    { "from": "sansmail", "to": "nomail" },
    { "from": "compte", "to": "own" },
    { "from": "next", "to": "next", "path": true }
  ]
}
```

### Règles

- **`paths`** : `from` se compare au chemin sans préfixe de langue, segment par segment, comme un préfixe : `/listes` couvre `/listes`, `/listes/new`, `/listes/<id>` ; `/compte` couvre `/compte/export`. Un segment `:nom` accepte n'importe quel segment non vide et se recopie dans `to`. Le reste du chemin après le préfixe est gardé tel quel. Au plus une ligne s'applique (la première qui correspond). `/listesX` ne correspond pas à `/listes`.
- **`params`** : un paramètre `from` présent est renommé en `to` (s'il n'y a pas déjà un `to`, sinon l'ancien est retiré). Avec `values`, une valeur connue est traduite, une valeur inconnue est gardée (la page applique son défaut). Avec `path: true`, la valeur, si c'est une adresse interne (`internalPath`), passe elle-même par `paths` (`next=/listes/abc` → `next=/lists/abc`) ; une valeur externe est laissée telle quelle et sera refusée plus loin, comme aujourd'hui.
- Les autres paramètres et leur ordre sont gardés.
- **Invariants vérifiés par test** : aucun `to` n'est le `from` d'une autre ligne (pas de chaîne) ; aucun `from` n'est un chemin servi par une page de `app/` ; chaque `to` correspond à un dossier de `app/` ; aucun mot de `from` n'apparaît dans un `to`.

### Fonction

`canonicalSitePath(path: string, search: string): { path: string; search: string; changed: boolean }` — pure, dans `src/site/legacy-paths.ts`. `path` est sans préfixe de langue. Utilisée par :

| Appelant | Usage |
|----------|-------|
| `decideLocaleRoute` (`src/i18n/locale-path.ts`) | redirection 301 (GET/HEAD) ou réécriture (autres méthodes) |
| `nextPath` / lecture de `next` côté serveur | une valeur de renvoi ancienne mène à la nouvelle page |
| `appPathForSiteUrl` (`src/site/app-links.ts`, repris par l'app) | ancienne adresse → même écran que la nouvelle |
| `mobile/src/links/pending.ts` | invitation reconnue dans `next` sous les deux formes |
| `legacySitePatterns(patterns)` (via `claimedSitePatterns()` de `app-links.ts`) | anciennes formes des motifs de l'app, déclarées dans le fichier Apple et les filtres Android |
| `formerPathsUnder(prefixes)` | anciens chemins privés, pour `robots.txt` et la mesure d'audience |

Les paramètres `lien`, `envoi`, `sansmail` et `compte` ne servent qu'au retour d'une action (page affichée juste après un envoi) ; ils sont dans la table pour qu'aucune adresse ne garde un mot français, même rechargée.

## Table des liens de l'app — `src/site/app-link-routes.json` (feature 011, modifiée)

| `site` (nouveau) | `app` | `keepQuery` |
|------------------|-------|-------------|
| `/confirm-email/:token` | `/links/confirm-email/:token` | `next` |
| `/reset-password/:token` | `/links/reset-password/:token` | — |
| `/invite/:token` | `/links/invite/:token` | — |
| `/login` | `/login` | `next` |
| `/register` | `/register` | `next` |
| `/l/:readToken` | `/guest/:readToken` | `typeId` |
| `/l/:readToken/reserve` | `/guest/:readToken/reserve` | `itemId`, `typeId` |
| `/l/:readToken/types` | `/guest/:readToken` | `typeId` |

`keepQuery` de la confirmation passe de `suite` à `next` : la traduction des paramètres a lieu avant, donc un ancien lien `?suite=` arrive avec `next`. L'écran `links/confirm-email/[token]` lit `next`.
