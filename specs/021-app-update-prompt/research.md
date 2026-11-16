# Research : prévenir qu'une mise à jour de l'app est disponible (021)

## R1. Bibliothèque

**Decision** : `expo-in-app-updates` **0.13.x** (module Expo, SDK 58+, React Native 0.88+, nouvelle architecture, iOS 16.4+, Play Core app-update 2.1.0). Installation par `npx expo install expo-in-app-updates`.

- Android : bibliothèque officielle Google Play In-App Updates. `checkForUpdate()` rend `updateAvailable`, `flexibleAllowed`, `storeVersion` (le `versionCode`) ; `startUpdate(false)` ouvre la proposition flexible de Google.
- iOS : recherche iTunes (`itunes.apple.com/lookup`, par `AppStoreID` ou par identifiant d'app), comparaison numérique « plus récente que » avec la version installée (une version de test plus récente ne déclenche rien, FR-008) ; `startUpdate()` présente la fiche App Store en surimpression dans l'app (repli : ouvre l'app App Store).
- Événements : `updateStart`, `updateCancelled` (Android et iOS), `updateDownloaded`, `updateCompleted` (Android).

**Alternatives considered** : `sp-react-native-in-app-updates` (dépend de `react-native-siren`, pas un module Expo, compatibilité RN 0.88 non annoncée) ; module natif maison (plus de code natif à maintenir) ; patch de la lib (écarté par la clarification du plan).

## R2. Installation automatique sur Android (clarification du plan)

Quand le téléchargement flexible est fini, la lib appelle elle-même `completeUpdate()` : Google affiche son écran d'installation et l'app redémarre. Si l'installation échoue, la lib ouvre la fiche Google Play. La spec suit ce comportement (FR-004). L'app n'affiche donc aucune fenêtre à elle sur Android : la proposition et l'installation sont celles de Google.

Session et changements en attente (FR-011) : la session est dans le trousseau (`expo-secure-store`), la file hors ligne dans la base SQLite locale ; un redémarrage ne perd ni l'un ni l'autre, et la file est envoyée au démarrage suivant (`startOfflineEngine` puis `syncNow`).

## R3. Fenêtre iOS

**Decision** : `ConfirmDialog` de `mobile/src/ui/` (pas `Alert` du système), pour garder l'apparence du site (règle « un écran n'écrit aucun style en dur ») et pouvoir le tester. Monté une fois, dans `mobile/app/_layout.tsx`, par-dessus la pile d'écrans (FR-010 : par-dessus l'écran ouvert, y compris après un lien). « Mettre à jour » appelle `startUpdate()` ; « Plus tard » enregistre le report.

## R4. Quand vérifier (FR-001)

**Decision** : au démarrage de l'app, et quand elle revient au premier plan (`AppState` → `active`) si la dernière vérification date de plus de 24 h. Pas en build de développement (`__DEV__`), pas sur le web. Une seule vérification à la fois. Tout échec (hors ligne, store injoignable, app absente du store, `ERR_*` de la lib) est ignoré en silence (FR-007, SC-004) : aucun message, aucun journal visible.

## R5. Report de 7 jours (FR-005)

**Decision** : une règle pure dans `mobile/src/update/policy.ts` :

- `shouldCheck(now, lastCheckAt, coldStart)` : vrai au démarrage, sinon si `now - lastCheckAt ≥ 24 h`.
- `shouldPrompt(storeVersion, snooze, now)` : faux si un report existe pour une version **égale** à `storeVersion` et date de moins de 7 jours ; vrai sinon (y compris si `storeVersion` est plus récente que la version reportée).

Le report s'enregistre après « Plus tard » (iOS) ou `updateCancelled` (Android : refus de la proposition de Google). Il n'y a pas de comparaison de versions dans l'app : `storeVersion` change à chaque nouvelle version publiée (chaîne de version sur iOS, `versionCode` sur Android), une valeur différente de celle reportée suffit.

## R6. Où garder l'état

**Decision** : la table `meta` de la base locale (`mobile/src/offline/db.ts`), clés `device.update.lastCheckAt` et `device.update.snooze` (JSON `{ storeVersion, at }`). `clearAll()` (déconnexion, changement de compte) ne doit pas les effacer : elles concernent le téléphone, pas le compte. `clearAll` passe de `DELETE FROM meta` à `DELETE FROM meta WHERE key NOT LIKE 'device.%'`.

## R7. Configuration iOS

`AppStoreID` (identifiant numérique de la fiche App Store) dans `ios.infoPlist` de `mobile/app.config.ts` : recommandé par la lib (évite une recherche et une ambiguïté). Sans lui, la recherche se fait par identifiant d'app. L'app est publiée en France : sans `AppStoreCountry`, la recherche se fait sur le store américain, où l'app n'est peut-être pas disponible. **Décision** : renseigner `AppStoreID` (à relever dans App Store Connect au moment de l'implémentation) et `AppStoreCountry: "fr"`.

## R8. Publication et versions

La lib contient du code natif : il faut de nouveaux builds (EAS) pour les deux stores, avec un numéro de version au-dessus de 1.1.0 (1.2.0). Les versions 1.0 et 1.1 ne préviendront de rien. Pas de changement du serveur ni du contrat d'API.

L'écran existant `UpgradeRequired` (API trop ancienne, 410) reste tel quel ; lui ajouter un bouton vers le store serait le début de la mise à jour obligatoire, hors périmètre.

## R9. Constitution

Services externes optionnels : sans réseau, ou si le store ne répond pas, l'app marche comme avant (FR-007). Aucune donnée personnelle n'est envoyée : la recherche iOS ne transmet que l'identifiant de l'app ; sur Android, la vérification passe par Google Play sur le téléphone. **Révisé à la revue** : la page « Données personnelles » (site et app) nomme maintenant l'App Store et Google Play parmi les prestataires (`privacy.storesBody`), et dit que deux réglages du téléphone survivent à la déconnexion (`privacy.appBody`).

## R10. Vérification

- Tests jest (`mobile/__tests__/`) : `policy.ts` (24 h, 7 jours, nouvelle version), le composant de mise à jour avec la lib simulée (iOS : fenêtre, « Mettre à jour », « Plus tard » ; Android : appel de `startUpdate(false)`, report après `updateCancelled` ; rien hors ligne ou en cas d'erreur), `clearAll` qui garde les clés `device.*`.
- Maestro ne peut pas jouer ces parcours (il faut une vraie version publiée) : `021-us1` et `021-us2` vont dans `mobile/.maestro/exclusions.md` comme « story entière » ; feature `021` ajoutée à `mobile/__tests__/e2e/coverage.test.ts`.
- À la main : Android par le partage interne d'app de la Play Console (deux versions), iOS avec une version plus ancienne que celle de l'App Store (quickstart.md).
