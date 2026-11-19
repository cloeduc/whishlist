# Revue de code

Revue complète de la feature 021, depuis `287a256` (fin de la 020).

## Fichiers relus

```text
951e628aa8fba3a34ad3822e25eac5d8887ca5bd  app/privacy/page.tsx
01560198b97632c4f761802ba9792b730c1da6a6  locales/en/content.json
d3aca4992a49a8023941a04eff312498fac0846a  locales/en/mobile.json
d03d3efd87b9a569f9a33a81ad9a5583a9aab1d6  locales/fr/content.json
d880cd8eface0139d00f4c525a824f11bfdd9994  locales/fr/mobile.json
2c47dddb0d96d72280abd632fb0ebf1f9f1bae16  mobile/__tests__/e2e/coverage.test.ts
b8b44b55ee7e1a3e6d7a51d8151e27d3ec01a021  mobile/__tests__/features/update-prompt.test.tsx
d0c5af47226d6ab12f25735374d584ee8bb5a29b  mobile/__tests__/offline/snapshot.test.ts
2f05d6bb013c89be76f9a65b2b8538d88bdd360f  mobile/__tests__/setup.ts
5c2a272ca0839c891e2b5749f86b359929d02baa  mobile/__tests__/update/policy.test.ts
daefaa00c28cfa4c26e9780a66b397031d44b2a0  mobile/__tests__/update/state.test.ts
6592877a15ef40e3f04f85404b838d0d42c828e6  mobile/app.config.ts
de31446b86bece254424a1eb2453674188654b2b  mobile/app/_layout.tsx
3e9a464ac42b9a73000405da9da99769433ae919  mobile/app/legal/privacy.tsx
641a5f1f93f91358c1e8c035efd6b6e5b8c655fd  mobile/package.json
b0c2c0c2b12d85f6b9ef1d19eb257e4771b015d3  mobile/src/features/update/UpdatePrompt.tsx
c1d67e35e2c6699654ad25153f0532f4b63c840e  mobile/src/offline/snapshot.ts
7a9b5efc793a2c63fdac6fe874147f4930f7390f  mobile/src/update/policy.ts
42869f9d903f75478aff6c70048c1e5a7e106e0f  mobile/src/update/state.ts
```

## Règles métier et tests

- [x] mobile/src/features/update/UpdatePrompt.tsx:40 — Sur Android, quand `checkForUpdate()` rend `{ updateAvailable: true, updateInProgress: true }` (mise à jour déjà lancée, sans `flexibleAllowed` ni `storeVersion`), le composant ne fait rien, alors que seul `startUpdate()` la reprend ou installe une mise à jour téléchargée app fermée (FR-004, US2 scénario 5, T017). Correction : sur Android, si `info.updateInProgress`, appeler `startUpdate()` sans passer par `shouldPrompt`, et ajouter le cas à `mobile/__tests__/features/update-prompt.test.tsx`.
- [x] mobile/__tests__/features/update-prompt.test.tsx:93 — Aucun test ne vérifie « une seule vérification à la fois » (T012) : un retour au premier plan pendant la vérification du démarrage ne doit pas rappeler `checkForUpdate`. Correction : test avec un `checkForUpdate` en attente, émettre `active`, vérifier un seul appel.
- [x] locales/fr/mobile.json:14 — FR-002, US1 scénario 1 et `contracts/screens.md` disent « …de l'app… » ; le texte livré dit « …de l'application… » (le mot du bloc `upgrade` voisin). Correction : aligner la spec et le contrat sur « l'application », ou le texte sur la spec.
- [x] specs/021-app-update-prompt/quickstart.md:34 — Pas d'étape manuelle pour une mise à jour téléchargée app fermée (US2 scénario 5, FR-004). Correction : « accepter, fermer l'app pendant le téléchargement, attendre la fin, rouvrir : l'écran d'installation de Google s'affiche ».
- [x] specs/021-app-update-prompt/quickstart.md:20 — Pas d'étape pour « Personne non connectée » ni « Langue » (FR-009). Correction : ajouter en US1 « déconnecté, sur l'écran de connexion, la fenêtre s'affiche » et « app en anglais, textes en anglais ».

## Constitution et sécurité

- [x] locales/fr/content.json:175 (et en) — La page de confidentialité dit « Tout est effacé à la déconnexion » ; l'app garde maintenant `update.lastCheckAt` et `update.snooze` (pas des données de compte). Correction : dire, en FR et en EN, que l'app garde aussi la date de la dernière vérification de mise à jour et le report « Plus tard ».
- [x] locales/fr/content.json:177 (et en) — Sur iOS, l'app interroge elle-même l'App Store (`itunes.apple.com/lookup`, identifiant de l'app et adresse IP) ; ce tiers manque dans « Prestataires » (research R9 concluait à tort qu'il n'y avait rien à ajouter). Correction : ajouter, en FR et en EN, que l'app interroge l'App Store (Apple) ou Google Play pour savoir si une nouvelle version existe, et que seuls l'identifiant de l'app et l'adresse IP partent.

## Duplication

- [x] mobile/src/update/state.ts:10 — `read` / `write` refont le SELECT et l'upsert de la table `meta`, déjà écrits dans `ensureUser` (`mobile/src/offline/snapshot.ts:47-55`). Correction : une paire `getMeta(key)` / `setMeta(key, value)` dans `mobile/src/offline/snapshot.ts`, utilisée par `ensureUser` et par `state.ts`.
- [x] mobile/src/offline/snapshot.ts:40 — Le préfixe `'update.%'` est écrit en dur dans `clearAll`, alors que les clés sont définies dans `mobile/src/update/state.ts:6-7`. Correction : une constante de préfixe exportée, utilisée pour construire les clés et le filtre de `clearAll`.

## Conventions

Aucun point.

## i18n

Aucun point.
