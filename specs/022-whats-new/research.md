# Research : fenêtre « Quoi de neuf » (022)

## R1. Version installée

**Decision** : `Constants.expoConfig?.version` (expo-constants, déjà utilisé par « Mon compte » pour afficher « Version x.y.z »). C'est la `version` de `mobile/app.config.ts`, embarquée dans le build. Pas de nouvelle dépendance (`expo-application` n'est pas installé et n'apporte rien ici).

## R2. Où vivent les textes

**Decision** :
- Textes dans `locales/{fr,en}/mobile.json`, bloc `whatsNew` : libellés de la fenêtre et de l'écran, et `whatsNew.releases.<v>` = tableau de phrases pour chaque version, la clé de version écrite avec des `_` (`"1_1_1"`) parce que i18next sépare les clés sur `.`.
- La liste des versions annoncées, dans l'ordre, dans `mobile/src/whats-new/releases.ts` : `RELEASES = ["1.1.1"]`. Les phrases se lisent par `t("whatsNew.releases.1_1_1", { returnObjects: true })`.
- Un test vérifie que chaque version de `RELEASES` a ses phrases en FR et en EN, en même nombre, 1 à 5 phrases (SC-003), et que `RELEASES` est trié.

**Alternatives considered** : un fichier JSON propre aux nouveautés (hors de i18next, contraire à la convention « toute chaîne visible passe par i18next ») ; les notes de version des stores (réseau, et différentes d'un store à l'autre).

## R3. Comparer des versions

**Decision** : une fonction pure `compareVersions(a, b)` (numérique, segment par segment, `1.1.10 > 1.1.9`) dans `mobile/src/whats-new/policy.ts`. La 021 n'en avait pas besoin (la lib compare côté natif).

## R4. Décider quoi montrer

**Decision** : `whatsNewFor({ installed, lastSeen, hasPastUsage, releases })` (pure) :

| `lastSeen` | Traces d'usage | Résultat |
|------------|----------------|----------|
| absent | non | installation neuve : rien, enregistrer `installed` (FR-004) |
| absent | oui | mise à jour depuis une version inconnue (1.1.0 et avant) : les nouveautés de `installed` seulement, si elle en a (FR-005) |
| = `installed` | — | rien |
| > `installed` | — | rien, ne pas toucher `lastSeen` (FR-009) |
| < `installed` | — | les versions de `releases` dans `]lastSeen, installed]`, la plus récente en premier (FR-002) ; vide → enregistrer `installed` sans fenêtre (FR-007) |

`lastSeen` passe à `installed` quand la fenêtre est fermée (FR-003), ou tout de suite quand il n'y a rien à montrer.

## R5. Traces d'usage passé (FR-005)

**Decision** : la base locale contient au moins une ligne dans `snapshot` ou `outbox`, ou la clé `meta.userId`. Ces données existent depuis la 1.0 (`mobile/src/offline/`). Une session dans le trousseau sans copie locale (cas rare) n'est pas comptée : au pire, pas de fenêtre pour cette version.

## R6. Stockage

**Decision** : clé `device.whatsNew.lastSeenVersion` dans la table `meta`, via `getMeta` / `setMeta` et `DEVICE_META_PREFIX` (`mobile/src/offline/snapshot.ts`, revue de la 021) : gardée à la déconnexion (FR-010).

## R7. Une fenêtre à la fois avec la 021 (FR-008)

**Decision** : `mobile/app/_layout.tsx` monte `<WhatsNew onShownChange={…} />` puis `<UpdatePrompt paused={whatsNewShown} />`. `UpdatePrompt` gagne une prop `paused` : il vérifie comme avant, mais garde sa fenêtre iOS en attente tant que `paused` est vrai (et ne lance pas la proposition Android). La fenêtre « Quoi de neuf » passe donc en premier.

## R8. Fenêtre et écran

- Fenêtre : `ModalCard` (exporté par `mobile/src/ui/ConfirmDialog.tsx`, fenêtre centrée à contenu libre, fermée par le geste du système via `onDismiss`), avec un seul `Button` « C'est noté ». Pas de nouveau composant d'interface.
- Écran « Nouveautés » : `mobile/app/(app)/whats-new.tsx`, sur le modèle de `mobile/app/legal/licenses.tsx` (`ScreenList`, `ContentPage`, `ContentSection`) ; une section par version.
- Entrée dans « Mon compte » : un bouton lien `account.whats-new`, à côté de « Licences ».

## R9. Contenu de la 1.1.1

Proposition à valider avec l'utilisatrice à l'implémentation :

- FR : « Gardez la surprise : dans l'onglet Partage d'une liste, cochez « Ne pas voir les cadeaux réservés ». » ; « L'app vous prévient quand une nouvelle version est disponible. »
- EN : “Keep the surprise: in a list's Sharing tab, tick “Don't show me reserved gifts”.” ; “The app tells you when a new version is available.”

Les versions plus anciennes (1.0.0, 1.1.0) peuvent être ajoutées à `RELEASES` pour l'écran « Nouveautés » ; non prévu ici faute de texte validé.

## R10. Vérification

- jest : `policy.ts` (tableau R4, `compareVersions`), `releases` (FR/EN complets), la fenêtre (affichage, « C'est noté », hors ligne), l'écran « Nouveautés », la pause de `UpdatePrompt`.
- Maestro : `022-us2` (ouvrir « Nouveautés » depuis « Mon compte ») ; `022-us1` vérifie qu'une installation neuve n'affiche rien (`launch-clean` efface l'app) ; la vraie mise à jour se vérifie à la main (ligne dans `exclusions.md`).
