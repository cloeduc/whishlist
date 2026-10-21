# Feature Specification: i18n, admin UX, enrichissement & ops

**Feature Branch**: `003-i18n-admin-enrich`

**Created**: 2026-10-20

**Status**: Implemented — complété par les pages publiques de présentation et le scénario de démonstration.

**Input**: Évolutions post-socle — internationalisation, réglages (catégories / qui), conservation du formulaire, enrichissement produit IA, auth mail, déploiement documenté.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Changer de langue (Priority: P1)

Un visiteur ou un membre bascule FR ↔ EN. L’UI (chrome, formulaires, erreurs exposées, mails génériques) suit la locale. Les contenus utilisateur (titres d’idées, libellés de catégories / qui) restent tels quels.

**Acceptance Scenarios**:

1. **Given** l’app en français, **When** on active le switcher de langue, **Then** la locale passe en anglais (cookie) et les libellés système sont en anglais après refresh.
2. **Given** une erreur métier (ex. prix invalide), **When** la locale est `en`, **Then** le message affiché est la traduction anglaise du code d’erreur.
3. **Given** `Accept-Language: en` et aucun cookie, **When** on ouvre l’app, **Then** la locale par défaut est l’anglais.

---

### User Story 2 - Réglages : catégories et « qui » en chips (Priority: P1)

L’onglet **Réglages** regroupe la gestion des catégories, des personnes (« qui ») et la suppression de la liste (créateur). **Quitter la liste** est dans **Partage**. Plus d’onglet « Catégories » dédié (`?onglet=categories` redirige vers Réglages).

**Acceptance Scenarios**:

1. **Given** un membre, **When** il ouvre Réglages, **Then** il voit deux zones chips (catégories, qui) + zone danger (supprimer) si owner.
2. **Given** un chip, **When** il clique le libellé, **Then** il peut renommer (Entrée / blur).
3. **Given** un chip sans idées liées, **When** il clique ×, **Then** l’entité est retirée.
4. **Given** un chip encore utilisé par des idées, **When** il clique ×, **Then** l’action est refusée avec un message traduit.
5. **Given** le champ d’ajout, **When** il saisit un nom et Entrée, **Then** un chip apparaît et devient utilisable dans le formulaire d’idée.
6. **Given** Partage, **When** un membre non seul quitte, **Then** l’action « Quitter la liste » est disponible dans Partage (plus dans Réglages).

---

### User Story 3 - Formulaire d’idée : pas de wipe sur erreur (Priority: P1)

**Given** un ajout/édition avec une erreur de validation, **When** la réponse revient, **Then** les champs saisis restent remplis et l’erreur est visible inline (pas de redirect qui vide le form).

---

### User Story 4 - Enrichir depuis une URL (Priority: P2)

**Given** un lien produit collé, **When** le membre clique « Récupérer les infos », **Then** nom, prix, image et type (parmi les catégories de la liste) sont préremplis autant que possible (OG/JSON-LD, puis Gemini si `GEMINI_API_KEY`, sinon OpenAI).

---

### User Story 5 - Auth mail & comptes (Priority: P2)

- Reset MDP via Resend (ou log fichier / lien UI en non-prod).
- Invitation membre par e-mail (lien d’invitation).
- Compte peut forcer un changement de MDP à la 1ʳᵉ connexion ; changement volontaire ensuite.

---

### User Story 6 - Déploiement documenté (Priority: P3)

Un opérateur déploie via Docker + `deploy/compose.prod.yml` en suivant le README (env, volume data, smoke HTTP 200). Licence MIT.

### User Story 7 - Comprendre et prendre en main le projet (Priority: P2)

Un visiteur peut lire l'origine du projet, consulter la FAQ, suivre un guide utilisateur et accéder aux mentions légales, en français ou en anglais.

**Acceptance Scenarios**:

1. **Given** la locale FR ou EN, **When** on ouvre `/projet`, `/faq`, `/guide` ou `/mentions-legales`, **Then** la page et ses métadonnées utilisent cette locale.
2. **Given** n'importe quelle page, **When** on atteint le pied de page, **Then** ces quatre pages sont accessibles.
3. **Given** le guide, **When** une capture d'écran est ajoutée, **Then** elle provient d'une base fictive générée hors `data/wishlist.json`.
4. **Given** la page projet, **When** elle présente le service, **Then** elle explique la pratique familiale de la liste sur-alimentée sans promettre une surprise ou une confidentialité absolue.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Locales supportées MUST être `fr` (défaut) et `en`, persistées (cookie `NEXT_LOCALE`).
- **FR-002**: Les chaînes UI et erreurs exposées MUST passer par i18next (namespaces `common`, `auth`, `home`, `list`, `public`, `errors`, `mail`, `content`).
- **FR-003**: Le domaine MUST renvoyer des codes d’erreur stables ; la couche présentation les traduit.
- **FR-004**: Réglages MUST permettre d’ajouter / renommer / retirer catégories et « qui » (retrait bloqué si utilisés).
- **FR-005**: Partage MUST exposer « Quitter la liste » ; Réglages MUST exposer « Supprimer la liste » (owner).
- **FR-006**: `saveItemAction` MUST conserver le draft côté client en cas d’échec.
- **FR-007**: L’enrichissement URL MUST être optionnel (clés API) et choisir un `typeId` de la liste quand l’IA est disponible.
- **FR-008**: Une lecture JSON / requête RSC MUST être dédupliquée (`getDocument` / `cache`) ; i18n MUST être réutilisé par locale (pas de re-init à chaque `t()`).
- **FR-009**: Les pages `/projet`, `/faq`, `/guide` et `/mentions-legales` MUST être publiques, bilingues et reliées depuis le pied de page.
- **FR-010**: Une fixture de démonstration MUST utiliser uniquement des personnes, comptes, liens et cadeaux fictifs ; sa génération MUST exiger un chemin de sortie explicite.
- **FR-011**: Les captures du guide MUST utiliser cette fixture et MUST NOT lire ou modifier la base de production.

### Key Entities

Inchangées vs `001` / `002` : User, Wishlist, Membership, Type (catégorie), Person (qui), Item, Reservation. Ajout opérationnel : locale cookie, codes d’erreur, clés LLM optionnelles.

## Success Criteria *(mandatory)*

- Soft navigation admin utilisable (plus de multi-secondes dues à des lectures JSON / i18n redondantes en conditions normales).
- Un contributeur externe peut cloner, lire le README, lancer Docker et obtenir HTTP 200 sans secret de prod dans le dépôt.
- Aucun e-mail personnel, clé API ou mot de passe temporaire n’est versionné.

## Assumptions

- `data/seed.json` est un fixture de test générique uniquement (pas d’import produit).
- Les docs `deploy/` peuvent citer l’hôte de prod ; le README reste générique. Pas de catalogue cadeaux personnel dans le dépôt.
