# Le Moon — Bar et Restaurant · Pontarlier

Site vitrine du **Moon**, 2 Rue de la Rotonde, 25300 Pontarlier.
HTML/CSS/JS pur, sans dépendance ni étape de build : adapté à l'ordinateur comme au téléphone.

## Fonctionnalités

- **Accueil** : logo, statut « Ouvert / Fermé » en direct (heure de Paris, gère les fermetures après minuit), note Google, appel en un clic.
- **La carte** : onglets par catégorie + recherche instantanée (insensible aux accents).
- **Événements** : récurrents (la prochaine date est calculée automatiquement) ou ponctuels (masqués une fois passés), badge « Ce soir / Demain », bouton « Réserver pour cette soirée ».
- **Réservation** : seuls les jours d'ouverture sont acceptés, créneaux de 30 min générés selon les horaires (dernier créneau 1 h avant la fermeture, créneaux passés masqués le jour même), validation, récapitulatif puis envoi.
- **Avis** : note Google, points forts, avis mis en avant, formulaire pour laisser un avis + lien vers Google.
- **Infos pratiques** : horaires, carte Google Maps, itinéraire.
- **Mobile** : menu burger, barre d'actions fixe (Appeler / Carte / Réserver / Y aller).
- SEO : balises meta, Open Graph, données structurées schema.org (`BarOrPub`).

## Mettre à jour le contenu

Tout se trouve dans **`js/config.js`** : coordonnées, horaires, carte, événements, avis.

> ⚠️ La carte et les événements fournis sont des **exemples** : remplacez-les par la vraie carte et le vrai agenda du Moon. Renseignez aussi l'adresse e-mail et les liens Facebook / Instagram.

## Recevoir les réservations et les avis

Par défaut (site 100 % statique) :
- une **réservation** ouvre un e-mail pré-rempli adressé à `email` (ou propose d'appeler) ;
- un **avis** est enregistré uniquement dans le navigateur du visiteur, qui est invité à le publier aussi sur Google.

Pour recevoir les demandes automatiquement, créez un formulaire gratuit sur un service comme [Formspree](https://formspree.io) et collez son URL dans `reservationEndpoint` / `reviewEndpoint`. Les données sont alors envoyées en POST (JSON). Les avis reçus peuvent ensuite être ajoutés, après modération, dans `featuredReviews`.

## Lancer en local

```bash
python3 -m http.server 8000
# puis ouvrir http://localhost:8000
```

## Mise en ligne

Il suffit d'héberger les fichiers tels quels : GitHub Pages, Netlify, OVH, etc.
