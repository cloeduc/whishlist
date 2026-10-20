<!--
Sync Impact Report
- Version change: 1.0.0 → 2.0.0
- Modified principles:
  - I. Fidélité au document source → I. Fidélité du modèle importé
  - II. Lecture publique, écriture du foyer → II. Lecture sans compte, écriture par les membres
  - III. Réservation sans collision (annulation : le foyer → un membre)
  - V. Simplicité (le compte n'est plus interdit ; il est exigé pour créer ou éditer)
- Added sections: none
- Removed sections: none
- Follow-up TODOs: none
- Rationale du MAJOR : le principe II interdisait les comptes et réservait l'édition
  à un secret de foyer. Le produit devient multi-listes, avec inscription.
-->

# Wishlist Constitution

## Core Principles

### I. Données personnelles hors dépôt

Le dépôt ne contient pas de catalogue cadeaux personnel ni d'identifiants
privés. `data/seed.json` est un fixture de test générique uniquement. Les
listes réelles vivent dans le volume de données en prod, pas dans Git.

### II. Lecture sans compte, écriture par les membres

Consulter une wishlist dont on a le lien ne demande pas de compte, ni pour
réserver. Il n'y a pas d'annuaire de toutes les listes. Créer une wishlist,
la modifier, ou rejoindre une wishlist commune exige un compte. Une wishlist
commune a plusieurs membres. Chaque membre peut éditer la liste. Une personne
sans compte, ou avec un compte qui n'est pas membre, ne modifie rien.

### III. Réservation sans collision

Une idée acceptée n'est plus proposable. Deux personnes ne doivent pas pouvoir
confirmer la même idée. Annuler une réservation est une action d'un membre de
cette liste, pas de l'invité. Le statut « réservé » reste visible sur la liste
pour éviter un doublon. Le nom de l'offreur et le petit mot vivent sur la page
« Je veux offrir » de cette liste, lisible par quiconque a le lien.

### IV. Tranches testables

Chaque scénario de la spec est livrable et vérifiable seul : lire une liste
sans compte a de la valeur sans l'inscription, créer sa liste a de la valeur
sans invitation. On ne déclare une tranche faite que si un parcours réel la
confirme.

### V. Simplicité

Pas de paiement, pas de compte exigé pour consulter ou réserver, pas de synchro
continue avec le doc source, pas de prix scrapés, pas d'annuaire public.
La priorité est un texte optionnel affiché tel quel. On n'ajoute un mécanisme
que s'il sert à créer, partager ou lire une liste, ou à tenir sur l'hébergement
mutualisé.

## Hébergement PlanetHoster

L'application doit tourner sur PlanetHoster N0C avec Phusion Passenger,
sans service annexe (pas de base managée, pas de plateforme qui impose son
propre process manager).

- Node.js 20 ou plus.
- Fichier de démarrage : `app.js` à la racine, qui écoute `process.env.PORT`.
  Ne jamais fixer `PORT` à la main : Passenger l'injecte.
- `package.json` : `"start": "node app.js"` et `"engines": { "node": ">=20" }`.
- Secrets dans `.env` sur le serveur (`chmod 600`), jamais dans git.
  Le formulaire de création N0C n'a pas de champ de variables d'environnement.
- Les comptes, les listes et les réservations survivent à un redémarrage du
  process. Les dossiers écrits par l'app (`data/` au minimum) sont créés sur
  l'hôte et ne sont pas versionnés.
- Pas de workflow pensé uniquement pour un hébergeur qui build à la place
  du serveur. Build et `npm install` se font en SSH dans l'app Node N0C.
- Pas d'envoi d'e-mail dans cette version : l'hébergement ne fournit pas une
  boîte d'envoi fiable sans service annexe. L'invitation à une liste commune
  est un lien à copier, pas un courrier.

## Workflow

Le comportement se décide dans Spec Kit avant le code : constitution, spec,
plan, tâches, implémentation. Une spec ne nomme pas le framework. Les
contraintes d'hébergement de cette constitution s'imposent au plan, pas à la
spec fonctionnelle.

## Governance

Cette constitution prime sur les habitudes de code et sur les templates
Spec Kit quand ils divergent. Une amendment est un changement daté de ce
fichier, versionné en semver :

- MAJOR : principe retiré ou redéfini de façon incompatible.
- MINOR : principe ou section ajouté.
- PATCH : clarification sans changement de règle.

Toute spec, plan ou implémentation doit pouvoir être relu contre les cinq
principes et contre la section hébergement. Une complexité en plus (paiement,
synchro Coda, annuaire public, envoi d'e-mail) doit être justifiée par une
amendment ou une spec explicite. Décision d'amendment : Cloé.

**Version**: 2.0.0 | **Ratified**: 2026-10-18 | **Last Amended**: 2026-10-18
