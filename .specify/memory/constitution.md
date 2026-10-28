<!--
Sync Impact Report
- Version change: 2.0.0 → 2.1.0
- Modified sections: Hébergement PlanetHoster → Hébergement Docker
  (Mac mini + Cloudflare ; e-mail et services externes optionnels)
- Follow-up TODOs: principe V (« pas de prix scrapés ») et Governance
  (« envoi d'e-mail ») ne décrivent plus l'app actuelle, à trancher par Cloé.

Previous report
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

## Hébergement Docker

L'application tourne dans un conteneur Docker (image Next.js `standalone`)
sur le Mac mini de prod, derrière un tunnel Cloudflare, sans service annexe
obligatoire (pas de base managée).

- Node.js 20 ou plus en dev ; l'image part de `node:22`.
- L'image se construit avec `docker build` à partir du dépôt ; le conteneur
  écoute `PORT` (3000 dans l'image) et `deploy/compose.prod.yml` publie le
  port hôte.
- Secrets passés en variables d'environnement (fichier env hôte préfixé
  `WHISHLIST_*`), jamais dans git. Une nouvelle variable est documentée dans
  le README, `.env.example` et `deploy/compose.prod.yml`.
- Les comptes, les listes et les réservations survivent à un redémarrage du
  conteneur : ils vivent dans le volume `/data`, pas dans l'image ni dans git.
- Les services externes (Resend, Gemini / OpenAI, Umami) sont optionnels :
  sans leur configuration, l'application fonctionne et le mécanisme est absent.

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

**Version**: 2.1.0 | **Ratified**: 2026-10-18 | **Last Amended**: 2026-10-28
