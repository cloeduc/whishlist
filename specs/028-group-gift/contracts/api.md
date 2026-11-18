# Contrat API : Cadeau commun (028)

Changements à reporter dans `specs/004-mobile-api/contracts/openapi.yaml` (version mineure suivante ; 1.10.0 au moment du plan), puis `npm --prefix mobile run api:types`. `tests/domain/api-contract.test.ts` vérifie que chaque opération a sa route. Montants en centimes (entiers), comme `priceCents`.

## Schémas

```yaml
GroupGiftSummary:
  required: [token, status, participantCount, totalCents, remainingCents, goalReached, mine]
  token: string                     # lien /g/<token>
  status: { enum: [open, complete] }
  participantCount: integer
  totalCents: integer
  remainingCents: [integer, "null"] # null si l'idée n'a pas de prix
  goalReached: boolean
  mine: boolean

PublicItem:                          # + champs, tous optionnels pour les anciens clients
  groupGift: GroupGiftSummary | null # présent seulement avec ?groupGifts=true

PublicList:
  claimKey: string                   # clé opaque de rangement des preuves (research R7)

GroupGift:                           # page du cadeau
  required: [token, listTitle, item, status, participantCount, participantNames, totalCents, remainingCents, goalReached, me, participations, thread, claimKey]
  listTitle: string
  item: { name, typeLabel, url, imageUrl, priceLabel, priceCents, description, secondHandOk }
  participantNames: [string | null]  # null = « Anonyme »
  me: GroupGiftParticipation | null
  participations: [GroupGiftParticipation] | null   # null si le visiteur ne participe pas
  thread: { messages: [GroupGiftMessage] } | null    # null sauf participant avec compte
  claimKey: string

GroupGiftParticipation:
  reservationId: string | null       # seulement pour la sienne
  name: string | null
  amountCents: integer | null
  note: string | null
  mine: boolean
  editable: boolean                  # sienne et liée au compte

GroupGiftMessage:
  id: string
  authorName: string | null          # null = « Ancien participant »
  body: string
  createdAt: string
  mine: boolean

MemberReservation:                   # + champ
  groupGiftId: [string, "null"]
MemberList / reservations : chaque participation reste une MemberReservation (anciens clients) ;
  + groupGifts: [{ id, itemId, status }]   # pour regrouper (nouveaux clients)

AccountExport.myReservations[]: + groupGift: { status, amountCents } | null
AccountExport: + groupGiftMessages: [{ item, body, createdAt }]
```

## Opérations

| Méthode et chemin | Auth | Corps | Réponses |
|-------------------|------|-------|----------|
| `GET /public/lists/{readToken}` | optionnelle ; `X-Read-Unlock`, `X-Reservation-Claims` | query `groupGifts=true` | 200 `PublicList` (+ `claimKey` ; `groupGift` des idées si demandé). Sans `groupGifts` : un cadeau commun est absent pour un non-participant, et `mine` avec `reservationId` pour un participant (research R9). |
| `POST /public/lists/{readToken}/reservations` | optionnelle | + `mode: single \| group` (défaut `single`), + `amountCents` (mode `group`) | 201 `{ reservationId, claim, claimKey, groupGiftToken \| null }` ; 409 `itemAlreadyReserved` ; 422 `invalidAmount` |
| `GET /public/group-gifts/{token}` | optionnelle ; `X-Read-Unlock`, `X-Reservation-Claims` | — | 200 `GroupGift` ; 403 `readPasswordRequired` (corps : `title` seulement, jamais `readToken`) ; 404 `groupGiftMissing` |
| `POST /public/group-gifts/{token}/unlock` | — | `{ password }` | 200 `{ unlockToken, expiresAt }` (même jeton que le déverrouillage de la liste) ; 401 `readPasswordInvalid` |
| `POST /public/group-gifts/{token}/participations` | optionnelle (le compte est lié) | `{ fromName?, note?, amountCents? }` | 201 `{ reservationId, claim, claimKey }` ; 409 `groupGiftComplete`, `groupGiftAlreadyJoined` ; 422 `invalidAmount`, `fieldTooLong` ; 429 |
| `PATCH /public/group-gifts/{token}/participations/{reservationId}` | **compte** | `{ amountCents: integer \| null }` | 200 `GroupGift` ; 403 `accessDenied` |
| `DELETE /public/group-gifts/{token}/participations/{reservationId}` | compte ou `X-Reservation-Claims` | — | 204 ; 403 `accessDenied` |
| `PUT /public/group-gifts/{token}/status` | compte ou `X-Reservation-Claims` (participant) | `{ status: open \| complete }` | 200 `GroupGift` ; 403 `accessDenied` |
| `POST /public/group-gifts/{token}/messages` | **compte** participant | `{ body }` | 201 `GroupGiftMessage` ; 403 `accessDenied` ; 422 `fieldTooLong`, `messageEmpty` ; 429 |
| `DELETE /public/group-gifts/{token}/messages/{messageId}` | **compte** auteur | — | 204 ; 403 `accessDenied` |
| `DELETE /lists/{listId}/group-gifts/{groupGiftId}` | membre | — | 204 ; 403 `notMember` ; 404 `groupGiftMissing` |

`DELETE /public/lists/{readToken}/reservations/{reservationId}` (existant) retire aussi une participation (même preuve) : c'est ce qu'utilise une ancienne app.

## Codes d'erreur nouveaux (`src/server/api/errors.ts`, `locales/*/errors.json`)

| Code | HTTP | Texte FR |
|------|------|----------|
| `groupGiftMissing` | 404 | Ce cadeau commun n'existe plus. |
| `groupGiftComplete` | 409 | Ce cadeau commun est complet : il n'est plus possible d'y participer. |
| `groupGiftAlreadyJoined` | 409 | Vous participez déjà à ce cadeau commun. |
| `invalidAmount` | 422 | Indiquez un montant valide (par exemple 20 ou 15,50). |
| `messageEmpty` | 422 | Écrivez un message avant de l'envoyer. |

## Assistant (MCP)

Aucun changement d'outil : `get_list` donne `reserved: true` pour une idée avec un cadeau commun (les participations sont des réservations). Test de non-régression.
