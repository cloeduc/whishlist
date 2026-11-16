# Data model : prévenir qu'une mise à jour de l'app est disponible (021)

Rien côté serveur. Sur le téléphone, deux clés dans la table `meta` de la base locale (`mobile/src/offline/db.ts`), gardées à la déconnexion (research R6).

| Clé | Valeur | Écrite quand | Lue pour |
|-----|--------|--------------|----------|
| `device.update.lastCheckAt` | date ISO | après chaque vérification réussie ou non | `shouldCheck` : au plus une vérification par 24 h au retour au premier plan |
| `device.update.snooze` | JSON `{ "storeVersion": string, "at": date ISO }` | « Plus tard » (iOS), refus de la proposition Google (Android) | `shouldPrompt` : rien pendant 7 jours pour la même `storeVersion` |

## Règles (`mobile/src/update/policy.ts`, fonctions pures)

| Règle | Entrée | Résultat |
|-------|--------|----------|
| Vérifier ? | démarrage de l'app | oui |
| | retour au premier plan, dernière vérification il y a moins de 24 h | non |
| | retour au premier plan, 24 h ou plus, ou jamais vérifié | oui |
| Proposer ? | pas de report | oui |
| | report pour la même `storeVersion`, il y a moins de 7 jours | non |
| | report pour la même `storeVersion`, il y a 7 jours ou plus | oui |
| | report pour une autre `storeVersion` (version plus récente publiée depuis) | oui |
| | `storeVersion` absente (la lib ne la donne pas) | oui, sans report possible par version : le report vaut alors 7 jours quelle que soit la version |

Constantes : `CHECK_INTERVAL = 24 h`, `SNOOZE = 7 jours`.

## États du parcours

```text
démarrage / premier plan ──shouldCheck──▶ vérification
   ├─ échec, pas de mise à jour, __DEV__ ─▶ rien
   └─ mise à jour disponible ──shouldPrompt──▶
        iOS     : fenêtre « nouvelle version » ── « Mettre à jour » ─▶ fiche App Store
                                               └─ « Plus tard » ─────▶ report (7 j)
        Android : proposition Google ── accepter ─▶ téléchargement ─▶ installation, redémarrage
                                      └─ refuser ──▶ report (7 j)
```
