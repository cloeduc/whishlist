# Quickstart : vérifier les adresses en anglais

Principe IV : une tranche n'est faite que si ce parcours réel la confirme.

## Prérequis

```bash
npm ci
DEMO_PASSWORD=… npm run demo:data -- tmp/demo-wishlist.json
WISHLIST_DATA_PATH=tmp/demo-wishlist.json DEMO_PASSWORD=… PORT=3010 npm run dev
```

E-mails en mode développement (lien affiché dans la page ou MailDev, ports 1026/1081 sur ce Mac). Vérifications automatiques : `npm run lint && npm run typecheck && npm test`, puis `npm --prefix mobile run lint && npm --prefix mobile run typecheck && npm --prefix mobile test`.

## US1 — Site

### 1. Nouvelles adresses, en français et en anglais

Dans le navigateur, parcourir en français puis en anglais (sélecteur de langue) : accueil → page du projet → FAQ → guide → mentions légales → données personnelles → inscription → connexion → mot de passe oublié → connexion d'un compte de démo → une liste (onglets Idées, Archives, Réservations, Partage, Réglages ; faire une action dans chaque onglet) → nouvelle liste → compte → export des données → changement de mot de passe → déconnexion → lien public d'une liste → réserver une idée.

**Attendu** : chaque adresse affichée est dans la table « Nouvelles adresses » de la spec (sous `/en` en anglais) ; aucun mot français dans la barre d'adresse ; après chaque action, l'onglet revient avec `?tab=…` (sauf Idées).

### 2. E-mails

Créer un compte, demander une réinitialisation, demander un changement d'adresse, inviter par e-mail, se réinscrire avec une adresse existante ; en anglais aussi.

**Attendu** : les liens sont `/confirm-email/…`, `/reset-password/…`, `/invite/…`, `/login` (avec `/en` pour les e-mails en anglais) et font l'action.

### 3. Anciennes adresses

```bash
B=http://localhost:3010
for p in /compte /en/compte/export /fr/listes/new "/connexion?lang=en" /projet /mentions-legales /donnees-personnelles \
         /inscription /mot-de-passe-oublie /changer-mot-de-passe "/listes/<id>?onglet=partage" \
         "/confirmer-email/x?suite=%2Finviter%2Fy" "/l/<readToken>/reserver?itemId=z" "/login?next=%2Flistes%2F<id>"; do
  printf '%-50s ' "$p"; curl -s -o /dev/null -w '%{http_code} %{redirect_url}\n' "$B$p"
done
for p in / /faq /guide /l/<readToken> /l/<readToken>/types /lists/new /en/account; do
  printf '%-50s ' "$p"; curl -s -o /dev/null -w '%{http_code}\n' "$B$p"
done
```

**Attendu** : la première boucle répond `301` avec la nouvelle adresse du contrat (`contracts/addresses.md` § 2), en un seul saut ; la seconde répond sans `301` (`200`, ou `307` vers la connexion pour une page qui l'exige).

Puis, dans le navigateur :
- un lien de confirmation, de réinitialisation et d'invitation **générés avant le changement** (sur `main`, ou recopiés en remplaçant le chemin par l'ancien) : l'action a lieu, comme avec le nouveau lien (SC-003) ;
- un jeton inconnu sous l'ancienne adresse : même message qu'avant ;
- ouvrir une liste sur `main`, garder l'onglet, redémarrer le serveur sur la branche, envoyer un formulaire de l'onglet Partage : l'envoi aboutit ou affiche l'erreur habituelle, et l'onglet Partage revient.

### 4. Plan du site

`curl -s $B/sitemap.xml` et `curl -s $B/robots.txt` : seules les nouvelles adresses dans le plan du site ; `robots.txt` interdit les nouveaux préfixes privés et les anciens.

## US2 — App

Simulateur de référence (iPhone 17 Pro Max, iOS 26.5), app pointée sur le serveur de la feature :

```bash
EXPO_PUBLIC_API_URL=http://localhost:3010 npm --prefix mobile run ios
```

1. Ouvrir chaque lien géré par l'app sous sa nouvelle et son ancienne forme, avec et sans `/en` :
   `xcrun simctl openurl booted "ohyoushouldnt:///confirm-email/<jeton>"` puis `…/confirmer-email/<jeton>`, et de même pour `reset-password`/`reinitialiser`, `invite`/`inviter`, `login?next=/invite/<jeton>` / `connexion?next=/inviter/<jeton>`, `register`/`inscription`, `l/<readToken>/reserve`/`l/<readToken>/reserver`.
   **Attendu** : même écran et même action pour les deux formes ; l'invitation reprend après la connexion.
2. Écran Partage d'une liste → « Gérer le partage sur le site » ; Compte → mentions légales et données personnelles → lien vers le site.
   **Attendu** : le navigateur s'ouvre sur `/lists/<id>?tab=sharing`, `/legal-notice`, `/privacy` (avec `/en` si l'app est en anglais), sans redirection.
3. Suite Maestro : `DEMO_PASSWORD=… npm --prefix mobile run e2e -- .maestro/flows/011-us1-email-links.yaml`, `011-us2-invite-link.yaml`, `011-us4-guest-list.yaml`, `018-us2-legacy-links.yaml`.

Liens universels réels (domaine de prod, build de store) : vérifiés après publication, en touchant un lien d'e-mail de chaque forme sur un iPhone avec l'app.

## Mise en production

1. Construire et publier la nouvelle version de l'app (elle comprend les deux formes). Ne publier aucune version 1.1.x construite avant cette feature (research R6).
2. Déployer le site (redéploiement lancé par l'utilisatrice), avec ou après la publication de l'app. Vérifier `curl -sI https://<domaine>/compte` → `301` vers `/account`, et que `https://<domaine>/.well-known/apple-app-site-association` contient les deux formes.
3. Mettre à jour les adresses déclarées aux stores (politique de confidentialité → `/privacy`, mentions légales si présentes) dans App Store Connect et Play Console.

Le site de l'US1 seule peut partir plus tôt : il garde les anciennes formes dans le fichier Apple, et les nouveaux liens ouvrent le site.
