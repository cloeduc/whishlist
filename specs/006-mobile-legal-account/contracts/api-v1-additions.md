# Ajouts au contrat v1 (1.1.0 → 1.2.0)

Ajouts compatibles à `specs/004-mobile-api/contracts/openapi.yaml`. Une app déjà installée ne voit aucun changement. Après la modification, lancer `npm --prefix mobile run api:types`. `tests/domain/api-contract.test.ts` vérifie que chaque opération a sa route.

## `GET /capabilities`

`analytics: boolean` est ajouté à `required` et à `properties` : la mesure d'audience est configurée sur le site. Il sert à afficher, ou pas, le paragraphe Umami de « Données personnelles ». `apiVersion` passe à `"1.2.0"`.

## `GET /me/deletion`

Aperçu de ce que ferait la suppression du compte connecté. Ne modifie rien.

```yaml
  /me/deletion:
    get:
      tags: [auth]
      summary: Ce que supprimerait la suppression du compte
      responses:
        "200":
          description: OK
          content:
            application/json:
              schema: { $ref: "#/components/schemas/AccountDeletionPreview" }
        "401": { $ref: "#/components/responses/Error" }
        "403": { $ref: "#/components/responses/Error" }   # mustChangePassword
```

## `POST /me/deletion`

Supprime le compte connecté, définitivement.

```yaml
    post:
      tags: [auth]
      summary: Supprimer son compte
      description: |
        Exige le mot de passe actuel. Supprime le compte, ses connexions (site et appareils),
        les listes dont il est le seul membre ; transmet les autres ; garde ses réservations
        sans lien au compte. Le jeton utilisé ne vaut plus rien ensuite.
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [password]
              properties:
                password: { type: string }
      responses:
        "204": { description: Supprimé }
        "400": { $ref: "#/components/responses/Error" }   # wrongCurrentPassword
        "401": { $ref: "#/components/responses/Error" }
        "403": { $ref: "#/components/responses/Error" }   # mustChangePassword
        "429": { $ref: "#/components/responses/Error" }   # rateLimited
```

`wrongCurrentPassword` existe déjà dans `src/server/api/errors.ts` et `locales/*/errors.json` ; vérifier son statut (400).

## `GET /me/export`

```yaml
  /me/export:
    get:
      tags: [auth]
      summary: Télécharger ses données
      description: Document JSON (data-model.md, AccountExport v1), sans aucun secret.
      responses:
        "200":
          description: OK
          headers:
            Content-Disposition:
              schema: { type: string, example: 'attachment; filename="ohyoushouldnt-donnees-2026-10-28.json"' }
          content:
            application/json:
              schema: { $ref: "#/components/schemas/AccountExport" }
        "401": { $ref: "#/components/responses/Error" }
        "403": { $ref: "#/components/responses/Error" }
        "429": { $ref: "#/components/responses/Error" }
```

Limite : `rateLimitForIp("export:<userId>", ip, 5, 60 min)`.

## Schémas

```yaml
    AccountDeletionPreview:
      type: object
      required: [deletedLists, transferredLists, reservationsKept]
      properties:
        deletedLists:
          type: array
          items:
            type: object
            required: [id, title]
            properties: { id: { type: string }, title: { type: string } }
        transferredLists:
          type: array
          items:
            type: object
            required: [id, title, newOwnerName]
            properties:
              id: { type: string }
              title: { type: string }
              newOwnerName: { type: string, nullable: true }
        reservationsKept: { type: integer, minimum: 0 }

    AccountExport:
      type: object
      required: [format, version, exportedAt, account, lists, myReservations]
      description: Voir data-model.md ; les sous-objets sont décrits champ par champ dans le contrat.
```

Le schéma `AccountExport` est écrit en entier dans `openapi.yaml` (tous ses champs, `additionalProperties: false`), pour que les types générés de l'app et le test de l'export partent de la même définition.

## Site (hors API)

| Adresse | Rôle |
|---------|------|
| `GET /compte/export` (`/en/compte/export`) | Même document que `GET /me/export`, avec le cookie de session ; `401` → redirection vers `/connexion` ; autre erreur → `/compte?x=<code>#donnees`. |
| `deleteAccountAction` (server action, `/compte`) | Corps : `password`. Succès : efface `wishlist_session`, redirige vers `/connexion?deleted=1`. Erreur : `/compte?d=<code>#supprimer` (`d`, pas `e`, déjà pris par le profil et le mot de passe). |
| `/donnees-personnelles` (`/en/donnees-personnelles`) | Page publique, indexée, dans le sitemap. Lien de politique de confidentialité pour les stores. |
