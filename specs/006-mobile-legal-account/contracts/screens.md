# Écrans ajoutés ou modifiés

Complète [le contrat des écrans de la 005](../../005-mobile-list-app/contracts/screens.md).

## Navigation

```text
legal/                     sans garde : connecté ou non, même mustChangePassword
├── mentions               Mentions légales
├── privacy                Données personnelles
└── licenses               Licences
(app)
├── account                Mon compte — section du bas ajoutée
└── delete-account         Supprimer mon compte
(auth)/login, register     lien discret « Mentions légales · Données personnelles » sous le formulaire
```

`legal/` est à la racine de `mobile/app/` : il n'est ni dans `(auth)` ni dans `(app)`, et leurs redirections ne s'y appliquent pas.

## Mon compte — section du bas (`(app)/account`)

- **Modèle** : `11-compte.png`, avec une carte en plus après « Mot de passe », puis le bouton de déconnexion, puis le bouton destructif.
- **Ordre** (FR-001) : carte « Vos données et informations » (liens `link` : Mentions légales, Données personnelles, Télécharger mes données, Licences, Nous écrire ; puis le texte « Version 1.0.0 »), bouton « Se déconnecter » (existant), séparateur, bouton `destructive` « Supprimer mon compte ».
- **Appels** : « Télécharger mes données » → `GET /me/export`, puis fichier dans le cache et feuille de partage.
- **Hors ligne** : Télécharger et Supprimer sont désactivés, avec `NetworkNote` ; les autres entrées restent actives.

## Supprimer mon compte (`(app)/delete-account`)

- **Modèle** : `11-compte.png` (cartes, champ mot de passe, bouton destructif en pleine largeur), même structure que la carte de suppression du site.
- **Contenu** :
  1. `Alert` destructive « Cette action est définitive. » ;
  2. carte « Ce qui sera supprimé » : votre compte ; N listes dont vous êtes la seule membre (titres, 5 au plus) ;
  3. carte « Ce qui reste » : N listes partagées (titre → nouveau propriétaire) ; N cadeaux que vous avez réservés restent réservés ;
  4. si `usePendingCount() > 0` : `Alert` « N changements jamais envoyés seront perdus » (FR-016) ;
  5. champ « Mot de passe », bouton « Supprimer définitivement mon compte », lien « Annuler ».
- **Appels** : `GET /me/deletion` à l'ouverture, `POST /me/deletion` à la confirmation. `204` → effacement local (R9) → écran de connexion avec « Votre compte a été supprimé. »
- **Erreurs** : `wrongCurrentPassword` et `rateLimited` à côté du champ, mot de passe vidé, rien d'autre ne change ; réseau → message et Réessayer.
- **Hors ligne** : l'écran affiche le message hors ligne et pas de formulaire.

## Mentions légales (`legal/mentions`) et Données personnelles (`legal/privacy`)

- **Modèle** : les pages `/mentions-legales` et `/donnees-personnelles` du site ouvertes sur téléphone (pas de capture de référence).
- **Composants** : `ContentPage` (sur-titre, titre, intro) et `ContentSection` (carte), nouveaux dans `mobile/src/ui/`, un par composant de `components/site/content-page.tsx`.
- **Textes** : namespace `content`, mot pour mot ceux du site.
- **Prestataires optionnels** : affichés selon `capabilities` (dernière réponse connue). Cloudflare toujours.
- **Lien** : « Voir sur le site » ouvre la page du site dans la langue de l'app (`Linking.openURL`).
- **Hors ligne** : identique.

## Licences (`legal/licenses`)

- **Modèle** : même `ContentPage`. Une `ContentSection` repliable par paquet : nom, version, licence, puis le texte au toucher.
- **Données** : `mobile/src/legal/licenses.json` (généré, R11). Hors ligne : identique.

## Connexion et création de compte

- Sous le formulaire, une ligne de deux liens `link` (petite taille) : « Mentions légales » · « Données personnelles » (FR-002).
- Après une suppression, la connexion affiche `Alert` « Votre compte a été supprimé. » (comme `session.expired`).
