# Data model : suites de l'audit Next.js (015)

Aucun changement de la base : ni table, ni colonne, ni migration. Le seul nouvel objet vit le temps d'une requête.

## FormState (état d'un formulaire refusé)

Il est rendu par une action du site à `useActionState` et n'est jamais stocké.

| Champ | Type | Règle |
|-------|------|-------|
| `error` | `string` | Code d'erreur traduit par le composant (`errors:<code>` ou clé de la page). |
| `values` | `Record<string, string>` | Seulement les champs gardés du formulaire ([contracts/form-states.md](contracts/form-states.md)). Jamais un mot de passe, ni `website`. |
| `attempt` | `number` | Nombre de refus depuis l'ouverture de la page (1, 2, …). Le formulaire s'en sert comme `key` pour se reconstruire. |

- `null` : état de départ (rien d'envoyé, ou rien à afficher).
- Un succès n'a pas d'état : l'action redirige.
- Le formulaire des idées garde son propre état (`SaveItemState`, avec `draft`) ; il n'est pas réécrit.

## Construction

Une fonction pure, `keptValues(formData, fields)`, lit dans `formData` les champs listés, sous forme de chaînes. `refusal(prev, error, formData, fields)` construit l'état complet et incrémente `attempt`. Elle se trouve dans `src/server/form-state.ts`, sans dépendance à Next, et se teste dans `tests/domain/form-state.test.ts`. Chaque action déclare sa liste de champs dans une constante exportée (p. ex. `REGISTER_KEPT_FIELDS`).
