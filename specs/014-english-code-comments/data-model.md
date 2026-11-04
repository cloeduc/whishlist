# Data Model: Code et commentaires du code en anglais

Pas de donnée applicative : la base, l'API et les écrans ne changent pas. Ce document décrit les catégories de texte du dépôt avec leur langue, puis le glossaire de traduction.

## Catégories de texte

| Catégorie | Exemples | Langue | Vérifiée par |
|-----------|----------|--------|--------------|
| Identifiant | variable, fonction, type, composant, `testID`, colonne SQL | anglais | revue (contrôle 1) |
| Commentaire de code | `//`, `/* */`, JSDoc, `{/* */}`, `#` en YAML, shell et config | anglais | test `code-language`, revue |
| Description de test | `test("…")`, `it`, `describe`, `name:` d'un parcours Maestro | anglais | test `code-language`, revue |
| Message technique | journal, erreur interne, sortie de script, notification d'exploitation | anglais | revue |
| Texte du produit | `locales/**`, contenus et textes juridiques, données de démo, fiche Runtipi, valeur attendue d'un test sur un texte affiché | français et anglais (par les traductions) | contrôle i18n de la revue |
| Adresse publique | segments d'URL et dossiers de pages (`app/listes`…) | français, exception temporaire | — (backlog n° 12) |
| Documentation | README, AGENTS.md, constitution, `specs/**` (contrat OpenAPI compris), `docs/**`, `deploy/*.md`, `mobile/.maestro/*.md` | français | — |
| Fichier généré ou installé | liste d'AGENTS.md, migrations `drizzle/*.sql` versionnées | non modifié | — |

Règle de citation : dans un commentaire ou une description de test, un texte du produit cité garde sa langue d'origine, entre « » ou guillemets ; le reste de la phrase est en anglais.

## Glossaire (vocabulaire du produit)

Source : `locales/en/*.json` et noms déjà utilisés dans le code. On emploie le terme de droite dans les commentaires anglais.

| Français | Anglais | Note |
|----------|---------|------|
| liste, wishlist | list, wishlist | `Wishlist` dans le modèle |
| liste commune | shared list | plusieurs membres |
| idée, idée cadeau | idea | `Item` dans le modèle |
| catégorie | category | `type` / `typeIds` dans le modèle |
| qui, pour qui, destinataire | person, recipient | `person` / `personId` dans le modèle |
| réserver, réservation | reserve, reservation | « J'offre » cité tel quel |
| offreur | giver | |
| petit mot | note | |
| membre, propriétaire | member, owner | |
| lien de lecture, lien public | read link, public link | `readToken` |
| lien d'invitation | invite link | `inviteToken` |
| mot de passe de lecture | read password | |
| liste suivie, suivre | followed list, follow | abonnement : `subscription` |
| modèle importé | imported template | `fromTemplate` |
| archiver, archives | archive, archived ideas | |
| compte | account | |
| foyer | household | historique (constitution) |
| préremplissage | prefill, enrichment | |
| hors ligne, file d'écritures | offline, write queue | `mobile/src/offline/` |
| parcours (e2e) | flow | Maestro |
| base de démo | demo database | |

## Renommages d'identifiants (US3)

| Fichier | Avant | Après |
|---------|-------|-------|
| `app/connexion/page.tsx` | `ConnexionPage` | `LoginPage` |
| `app/inscription/page.tsx` | `InscriptionPage` | `RegisterPage` |
| `app/changer-mot-de-passe/page.tsx` | `ChangerMotDePassePage` | `ChangePasswordPage` |
| `app/mot-de-passe-oublie/page.tsx` | `MotDePasseOubliePage` | `ForgotPasswordPage` |
| `app/compte/page.tsx` | `ComptePage` | `AccountPage` |
| `app/reinitialiser/[token]/page.tsx` | `ReinitialiserPage` | `ResetPasswordPage` |
| `app/l/[readToken]/reserver/page.tsx` | `ReserverPage` | `ReservePage` |

Ce sont des exports par défaut d'App Router : leur nom n'est importé nulle part, donc le renommage ne change aucun comportement.
