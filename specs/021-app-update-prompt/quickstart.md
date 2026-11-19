# Quickstart : vérifier la proposition de mise à jour (021)

Principe IV : une tranche n'est faite que si un parcours réel la confirme. Ces parcours demandent une vraie version publiée sur un store : ils ne passent pas par la suite Maestro (`mobile/.maestro/exclusions.md`).

## Contrôles automatiques

```sh
npm --prefix mobile run lint && npm --prefix mobile run typecheck && npm --prefix mobile test
npm run lint && npm run typecheck && npm test
```

Les tests jest couvrent les règles (24 h, 7 jours, nouvelle version), la fenêtre iOS, l'appel Android et le silence en cas d'erreur (research R10).

## Préparer deux versions

1. Version N (par exemple 1.1.1) : la première qui embarque la feature. Construire et publier (EAS) sur les deux stores, ou au moins sur une piste de test.
2. Version N+1 (1.1.2, même code, numéro plus haut) : la publier sur le store.

## US1 : iPhone

1. Installer la version N sur un iPhone (TestFlight ou build de développement de numéro plus bas que celui de l'App Store).
2. Ouvrir l'app : la fenêtre « Nouvelle version disponible » s'affiche par-dessus l'écran ouvert, en moins de 5 s.
3. « Plus tard » : la fenêtre se ferme ; fermer et rouvrir l'app : rien (report de 7 jours).
4. Pour revoir la fenêtre sans attendre : supprimer l'app et la réinstaller (ou avancer l'horloge du téléphone de 8 jours) ; « Mettre à jour » ouvre la fiche App Store dans l'app.
5. Mode avion, ouvrir l'app : aucune fenêtre, l'app s'ouvre normalement.
6. Ouvrir l'app par un lien de liste : la fenêtre s'affiche par-dessus la liste ; « Plus tard » laisse sur la liste.
7. Avec la version la plus récente installée : aucune fenêtre.
8. Déconnecté, sur l'écran de connexion (après avoir revu la fenêtre comme à l'étape 4) : la fenêtre s'affiche aussi.
9. Téléphone en anglais (ou langue de l'app en anglais) : titre, texte et boutons en anglais.

## US2 : Android

1. Dans la Play Console, partage interne d'app : installer la version N par son lien, puis téléverser la version N+1 (guide Google « Test in-app updates »). Si la proposition n'apparaît pas, ouvrir Google Play, « Mes applis et jeux », puis rouvrir l'app.
2. Ouvrir l'app : la proposition de mise à jour de Google s'affiche.
3. « Non merci » : fermer et rouvrir l'app : rien (report de 7 jours).
4. Pour revoir la proposition : effacer les données de l'app ; accepter : continuer à naviguer pendant le téléchargement ; à la fin, l'écran d'installation de Google s'affiche, l'app redémarre en version N+1, toujours connectée.
5. Avec un changement en attente (mode avion, ajouter une idée, revenir en ligne juste avant la fin du téléchargement) : après le redémarrage, l'idée est envoyée.
6. Mode avion, ouvrir l'app : aucune proposition.
7. Téléchargement fini app fermée : accepter la proposition, fermer l'app (la retirer des apps récentes) pendant le téléchargement, attendre une minute, rouvrir : l'écran d'installation de Google s'affiche et l'app redémarre en version N+1.
