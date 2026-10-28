# Quickstart: vérifier l'API pour une app mobile

Parcours manuels sur la base de démo, qui n'utilisent que le [contrat](contracts/openapi.yaml) (SC-001). Ils confirment chaque tranche (principe IV) en plus des tests de domaine.

## Prérequis

```bash
npm ci
export DEMO_PASSWORD='demo-password-1'   # 10 caractères minimum
npm run demo:data -- tmp/demo-wishlist.json
WISHLIST_DATA_PATH=tmp/demo-wishlist.json SESSION_SECRET=dev-secret-dev-secret-dev-secret-00 npm run dev
```

Dans un autre terminal :

```bash
API=http://localhost:3000/api/v1
LIST=demo-list-lecture          # readToken de la liste de démo
```

`jq` aide à lire les réponses. Chaque réponse doit porter `Cache-Control: private, no-store` (vérifier avec `curl -i` au moins une fois).

## US1 : lire et réserver sans compte

1. `curl -s $API/public/lists/$LIST | jq '.title, (.items | length)'` → le titre de la liste de démo et le même nombre d'idées que la page `/l/demo-list-lecture`.
2. Prendre un id d'idée : `ITEM=$(curl -s $API/public/lists/$LIST | jq -r '.items[0].id')`.
3. Réserver :
   `curl -s -X POST $API/public/lists/$LIST/reservations -H 'Content-Type: application/json' -d "{\"itemId\":\"$ITEM\",\"fromName\":\"Sam\",\"note\":\"Bon anniversaire\"}"` → `201`, `reservationId` et `claim`. Garder `CLAIM` et `RES`.
4. Recharger la page publique du site : l'idée n'est plus proposée.
5. Lire avec le claim : `curl -s $API/public/lists/$LIST -H "X-Reservation-Claims: $CLAIM" | jq ".items[] | select(.id==\"$ITEM\") | .mine"` → `true`.
6. Réserver la même idée une seconde fois → `409`, `error.code` = `itemAlreadyReserved`.
7. Annuler sans claim : `curl -s -o /dev/null -w '%{http_code}' -X DELETE $API/public/lists/$LIST/reservations/$RES` → `403`. Avec `-H "X-Reservation-Claims: $CLAIM"` → `204`, et l'idée est de nouveau proposée sur le site.
8. `curl -s -w '%{http_code}' $API/public/lists/inconnu` → `404`, sans autre information.
9. Langue : refaire l'étape 6 avec `-H 'Accept-Language: en'` → `message` en anglais.

Liste protégée : faire d'abord l'étape US5-3 (poser un mot de passe de lecture), puis :

10. `curl -s -w '%{http_code}' $API/public/lists/$LIST` → `423`, `readPasswordRequired`, avec `title` et sans idées.
11. `POST $API/public/lists/$LIST/unlock` avec le bon mot de passe → `unlockToken`. Avec `-H "X-Read-Unlock: $UNLOCK"`, la lecture répond `200`. Un mauvais mot de passe → `400 badPassword` ; 21 essais faux de suite → `429`.

## US2 : se connecter et retrouver ses listes

1. `TOKEN=$(curl -s -X POST $API/auth/login -H 'Content-Type: application/json' -d "{\"email\":\"alex@example.test\",\"password\":\"$DEMO_PASSWORD\"}" | jq -r .token)`.
2. Mauvais mot de passe → `401 invalidCredentials` ; même réponse pour un e-mail inconnu.
3. `curl -s $API/lists -H "Authorization: Bearer $TOKEN" | jq '.lists[].title'` → les listes d'Alex seulement.
4. `LISTID=$(curl -s $API/lists -H "Authorization: Bearer $TOKEN" | jq -r '.lists[0].id')`, puis `GET $API/lists/$LISTID` → vue membre avec `reservations`, `members` (sans e-mail), `readUrl`, `inviteUrl`.
5. Avec le compte de Camille, sur une liste dont elle n'est pas membre (en créer une avec Alex, US4-1) → `404 listMissing`.
6. `POST $API/auth/logout` → `204`, puis `GET $API/lists` avec le même jeton → `401`.
7. Se reconnecter dans le navigateur et dans l'API, changer le mot de passe depuis l'API (US6-2) : la session du navigateur est déconnectée, le nouveau jeton rendu par l'API marche, l'ancien rend `401`.

## US3 : gérer les idées

Avec `TOKEN` et `LISTID` d'Alex, `TYPE` et `PERSON` pris dans la vue membre :

1. `POST $API/lists/$LISTID/items` avec `{"name":"Puzzle 1000 pièces","typeId":"$TYPE","personId":"$PERSON","price":"24,90"}` → `201`, l'idée apparaît dans l'admin du site.
2. Même appel avec `"price":"abc"` → `400 priceInvalid` ; avec `"name":""` → `400`.
3. `PATCH .../items/$ITEM` avec `{"archived":true}` → l'idée passe dans les archives du site. `{"archived":false}` la ramène.
4. `DELETE .../items/$ITEM` → `204`.
5. Avec le jeton de Camille sur une liste dont elle n'est pas membre : `POST .../items` → `404`, et rien ne change.
6. `POST $API/lists/$LISTID/enrich` avec un lien produit public → `200` et des champs proposés, sans idée créée. Sans `GEMINI_API_KEY` ni `OPENAI_API_KEY`, `GET $API/capabilities` rend `enrich: false` et le préremplissage n'utilise que les métadonnées de la page (`usedLlm: false`).
7. `DELETE $API/lists/$LISTID/reservations/<id>` sur une réservation de la liste → `204`, l'idée est libre.

## US4 : créer et organiser une liste

1. `POST $API/lists` avec `{"title":"Noël","category":"Livres","person":"Alex"}` → `201`, `role: owner`, une catégorie, un « qui ».
2. `POST .../types` puis `PATCH .../types/<id>` → visibles et renommées dans Réglages sur le site.
3. `DELETE .../types/<id>` d'une catégorie utilisée par une idée → `400`, code identique au message du site.
4. `PUT .../types/order` → même ordre dans l'accordéon du site.

## US5 : partager et gérer les membres

1. `POST .../invite-link` → nouveau lien ; l'ancien lien d'invitation affiche une erreur sur le site.
2. Avec le jeton de Camille : `POST $API/invitations/<inviteToken>/accept` → `200`, la liste apparaît dans `GET $API/lists` de Camille.
3. `PUT .../read-password` avec `{"password":"lecture-demo"}` → `204` ; la page publique du site demande le mot de passe. (Sert aux étapes US1-10 et US1-11.) `DELETE .../read-password` le retire.
4. Camille : `DELETE $API/lists/$LISTID` → `403`. Alex : `DELETE .../members/<id de Camille>` → `204`.
5. `POST .../invitations` sans e-mail configuré → `503 mailNotConfigured`.

## US6 : gérer son compte

1. `POST $API/auth/register` avec un e-mail `@example.test` nouveau → `201` et un jeton. Avec `alex@example.test` → `202 checkEmail`, pas de jeton.
2. `POST $API/me/password` avec `currentPassword` et `password` → `200`, nouveau jeton (voir US2-7).
3. `PATCH $API/me` avec `{"displayName":"Alexandra"}` → le nom change dans les membres de la liste sur le site.
4. `POST $API/auth/password-reset` avec un e-mail connu puis inconnu → même réponse. Sans e-mail configuré, le lien est écrit dans `data/mail.log` (comme pour le site ; masqué en production) et ouvre le site.

## Sécurité transverse

1. `curl -s -w '%{http_code}' $API/lists -H 'Origin: https://evil.example'` → `403 originNotAllowed`.
2. Avec `API_ALLOWED_ORIGINS=capacitor://localhost` : `curl -i -X OPTIONS $API/lists -H 'Origin: capacitor://localhost' -H 'Access-Control-Request-Method: GET'` → `204` et `Access-Control-Allow-Origin: capacitor://localhost`.
3. `POST $API/auth/login` avec `Content-Type: text/plain` → `415` ; avec un corps de 100 Ko → `413`.
4. `curl -s -w '%{http_code}' http://localhost:3000/api/v0/lists` → `410 apiVersionUnsupported`.
5. Le site : `npm test`, `npm run lint`, `npm run typecheck` passent ; refaire à la main le parcours du guide (lire, réserver, ajouter une idée) sur le site (SC-007).
