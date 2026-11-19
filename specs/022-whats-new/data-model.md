# Data model : fenêtre « Quoi de neuf » (022)

Rien côté serveur.

## Nouveautés d'une version (dans l'app)

| Où | Quoi |
|----|------|
| `mobile/src/whats-new/releases.ts` | `RELEASES: string[]`, versions annoncées, de la plus ancienne à la plus récente (`["1.1.1"]`) |
| `locales/{fr,en}/mobile.json` → `whatsNew.releases.<v>` | tableau de 1 à 5 phrases ; `<v>` = version avec `_` (`1_1_1`) ; mêmes clés et même nombre de phrases en FR et en EN |

## Dernière version vue (sur le téléphone)

| Clé (`meta`) | Valeur | Écrite quand |
|--------------|--------|--------------|
| `device.whatsNew.lastSeenVersion` | `"x.y.z"` | fermeture de la fenêtre ; ou tout de suite si rien à montrer (installation neuve, version sans nouveautés) ; jamais vers une version plus ancienne |

Gardée à la déconnexion (préfixe `device.`, FR-010).

## Règle (`mobile/src/whats-new/policy.ts`, pure)

`whatsNewFor({ installed, lastSeen, hasPastUsage, releases })` → `{ show: string[]; markSeen: boolean }` selon le tableau de research R4 :

| Cas | `show` | `markSeen` |
|-----|--------|-----------|
| installation neuve | `[]` | oui |
| version inconnue avant (traces d'usage) | `[installed]` si `installed ∈ releases`, sinon `[]` | oui si `show` vide |
| `lastSeen = installed` | `[]` | non |
| `lastSeen > installed` | `[]` | non |
| `lastSeen < installed` | versions de `releases` dans `]lastSeen, installed]`, plus récente en premier | oui si `show` vide |

Quand `show` n'est pas vide, `lastSeen` passe à `installed` à la fermeture de la fenêtre.
