# Research : noms d'une liste suivie (024)

## R1. Où ranger les noms choisis

- **Decision** : deux colonnes facultatives sur `subscriptions` : `custom_title` et `custom_owner_name` (texte, `NULL` par défaut). Migration `drizzle/0007_*.sql` écrite par `npm run db:generate`.
- **Rationale** : les noms sont propres à un abonnement (un compte, une liste) et doivent partir avec lui (FR-008) : la suppression en cascade existante (désabonnement, adhésion, liste ou compte supprimés) les emporte sans code en plus.
- **Alternatives** : une table à part (une ligne par abonnement de toute façon, plus de code de suppression) ; stocker les noms sur le téléphone (pas partagés entre site et app, perdus à la réinstallation).

## R2. Nom de la personne par défaut

- **Decision** : `ownerName` = `displayName` du compte dont l'appartenance à la liste a le rôle `owner` ; s'il n'y en a pas (cas théorique), le premier membre par `joinedAt` ; `null` si aucun nom. Calculé à la lecture, jamais copié dans l'abonnement.
- **Rationale** : la clarification demande le nom du propriétaire actuel, qui suit un changement de nom ou une transmission (US2, scénario 4). Une copie se périmerait.
- **Alternatives** : le créateur d'origine (non stocké : `Wishlist` n'a pas de `createdBy`, et la transmission le rendrait faux).

## R3. Validation

- **Decision** : fonction pure `renameSubscription(doc, { wishlistId, userId, customTitle, customOwnerName })` dans `src/domain/subscription.ts`. Chaque nom : `trim()`, vide → `null`, plus de 80 caractères → `followedNameTooLong`. Abonnement absent → `listMissing` (comme `unsubscribeWishlist`).
- **Rationale** : même forme que les autres règles de l'abonnement ; un seul code d'erreur nouveau.
- **Alternatives** : deux opérations séparées (titre, personne) : deux routes et deux formulaires pour un même petit dialogue.

## R4. Exposition dans l'API et sur le site

- **Decision** :
  - `SubscribedListSummary` gagne `customTitle`, `customOwnerName` (choix de l'abonné, `null` sinon) et `ownerName` (R2). `title` reste le titre des membres : une app 1.1 continue d'afficher le titre d'origine.
  - `PublicList` gagne `follow` : `{ customTitle, customOwnerName, ownerName }` quand le compte connecté suit la liste, `null` sinon (visiteur, membre, non connecté). FR-011 : le nom du propriétaire ne sort jamais pour qui ne suit pas.
  - `PUT /subscriptions/{readToken}` : corps `{ customTitle, customOwnerName }` (chaînes ou `null`), rend le `SubscribedListSummary` à jour. Version du contrat 1.10.0.
  - Site : la page « Mes listes » et la page publique lisent les mêmes valeurs depuis le domaine ; une server action appelle la commande partagée.
- **Rationale** : les champs bruts laissent le client préremplir le formulaire et revenir au titre d'origine ; l'affichage (nom choisi sinon titre, nom choisi sinon propriétaire) est une petite fonction pure partagée (`followedDisplay`), reprise par l'app comme les autres modules purs.
- **Alternatives** : renvoyer seulement un `displayTitle` calculé : le formulaire ne saurait pas si un nom est choisi.

## R5. Où modifier les noms

- **Decision** : sur le site, bouton « Renommer » sur la carte de la liste suivie dans « Mes listes », à côté de « Ne plus suivre », qui ouvre un dialogue (deux champs, « Enregistrer », « Revenir au titre de la liste »). Dans l'app, même action sur l'écran de la liste suivie (`GuestFollow`, où se trouve déjà « Ne plus suivre ») : un écran `guest/[readToken]/names` avec les deux champs.
- **Rationale** : les cartes de l'app ne portent aucune action (toucher ouvre la liste) ; le désabonnement y est déjà sur l'écran de la liste. On garde chaque plateforme cohérente avec elle-même. La spec (FR-001) est alignée.
- **Alternatives** : un appui long sur la carte de l'app (peu découvrable, pas d'équivalent ailleurs dans l'app) ; une page dédiée sur le site (un dialogue suffit).

## R6. Hors ligne (app)

- **Decision** : l'action « Renommer » est désactivée hors ligne avec `mobile:offline.needsNetwork`, comme « Ne plus suivre ». Pas de file hors ligne. Après succès, `refreshLists()` et rechargement de la liste ; les noms viennent ensuite des copies hors ligne existantes (`subscriptions`, `PublicList`).
- **Rationale** : la file hors ligne ne porte que les écritures sur ses propres listes et idées ; les actions d'abonnement sont déjà en ligne seulement (FR-009).

## R7. Export et suppression du compte

- **Decision** : `ExportedSubscription` gagne `customTitle` et `customOwnerName`. Rien à faire pour la suppression (R1).
- **Rationale** : FR-008 ; l'export est une liste blanche, il faut nommer les champs.

## R8. Compatibilité

- **Decision** : champs ajoutés seulement, aucune valeur existante ne change de sens. Import JSON historique (`legacy-json.ts`) : champs facultatifs, `null` par défaut.
- **Rationale** : les apps 1.0/1.1 déjà installées ignorent les nouveaux champs.
