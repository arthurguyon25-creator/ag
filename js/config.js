/*
 * ============================================================
 *  LE MOON — Fichier de configuration du site
 * ============================================================
 *  Toutes les informations modifiables du site sont ici :
 *  coordonnées, horaires, carte, événements, avis.
 *  Pas besoin de toucher au HTML pour mettre le site à jour.
 * ============================================================
 */
window.MOON_CONFIG = {
  name: "Le Moon",
  tagline: "Bar et Restaurant",
  address: "2 Rue de la Rotonde, 25300 Pontarlier",
  phone: "03 81 89 23 18",
  phoneIntl: "+33381892318",
  // Adresse qui reçoit les demandes de réservation (à renseigner).
  email: "contact@lemoon-pontarlier.fr",
  priceRange: "10 – 30 € par personne",

  // Optionnel : URL d'un service de formulaire (Formspree, Getform, backend maison…).
  // Si renseignée, les réservations et avis y sont envoyés en POST (JSON).
  // Sinon, la réservation ouvre un e-mail pré-rempli.
  reservationEndpoint: "",
  reviewEndpoint: "",

  googleMapsUrl:
    "https://www.google.com/maps/search/?api=1&query=Le+Moon+2+Rue+de+la+Rotonde+25300+Pontarlier",
  googleReviewsUrl:
    "https://www.google.com/maps/search/?api=1&query=Le+Moon+Bar+et+Restaurant+Pontarlier",
  social: {
    facebook: "https://www.facebook.com/",
    instagram: "https://www.instagram.com/",
  },

  // Horaires — jour 0 = dimanche … 6 = samedi. Format "HH:MM".
  // Une fermeture après minuit (ex. "01:00") est gérée automatiquement.
  hours: {
    1: null, // lundi : fermé
    2: ["16:00", "23:00"],
    3: ["16:00", "23:00"],
    4: ["16:00", "01:00"],
    5: ["10:00", "02:00"],
    6: ["10:00", "02:00"],
    0: ["16:00", "23:00"],
  },

  highlights: ["Terrasse", "Excellents cocktails", "Bien pour danser"],

  // Note Google (à mettre à jour de temps en temps).
  rating: { value: 3.8, count: 90 },

  // Avis mis en avant : copiez ici des avis réels (avec l'accord de leurs auteurs).
  // Format : { author: "Prénom N.", rating: 5, date: "2026-09-12", text: "…" }
  featuredReviews: [],

  // ---------------- LA CARTE ----------------
  // Contenu indicatif : remplacez par la vraie carte du Moon.
  menu: [
    {
      id: "cocktails",
      label: "Cocktails",
      icon: "🍸",
      items: [
        { name: "Moonlight Spritz", desc: "Apérol, prosecco, eau pétillante, orange", price: 8.5, tags: ["Signature"] },
        { name: "Mojito", desc: "Rhum blanc, menthe fraîche, citron vert, sucre de canne", price: 8 },
        { name: "Pornstar Martini", desc: "Vodka vanille, passion, prosecco à part", price: 10 },
        { name: "Espresso Martini", desc: "Vodka, liqueur de café, espresso", price: 10 },
        { name: "Gin Tonic Sapin", desc: "Gin, tonic, bourgeon de sapin du Haut-Doubs", price: 9.5, tags: ["Local"] },
        { name: "Virgin Moon", desc: "Sans alcool — fruits rouges, citron, ginger beer", price: 6.5, tags: ["Sans alcool"] },
      ],
    },
    {
      id: "boissons",
      label: "Bières & Vins",
      icon: "🍺",
      items: [
        { name: "Bière pression 25 cl", desc: "Blonde ou de saison", price: 3.5 },
        { name: "Bière pression 50 cl", desc: "Blonde ou de saison", price: 6.5 },
        { name: "Bière artisanale locale", desc: "Sélection du moment, 33 cl", price: 5.5, tags: ["Local"] },
        { name: "Verre de vin du Jura", desc: "Blanc, rouge ou rosé — 12 cl", price: 5 },
        { name: "Pontarlier-Anis", desc: "L'apéritif emblématique de la ville", price: 4, tags: ["Local"] },
        { name: "Softs & jus", desc: "Coca, limonade, jus de fruits…", price: 3.5 },
      ],
    },
    {
      id: "planches",
      label: "Planches & Tapas",
      icon: "🧀",
      items: [
        { name: "Planche Comtoise", desc: "Comté, morbier, saucisse de Morteau, pain de campagne", price: 18, tags: ["Local", "À partager"] },
        { name: "Planche mixte", desc: "Charcuterie et fromages, cornichons, beurre", price: 16, tags: ["À partager"] },
        { name: "Nachos Moon", desc: "Cheddar fondu, guacamole, crème, jalapeños", price: 9 },
        { name: "Frites maison", desc: "Sauce au choix", price: 5 },
        { name: "Tapas du moment", desc: "Demandez au bar !", price: 6 },
      ],
    },
    {
      id: "plats",
      label: "Plats",
      icon: "🍔",
      items: [
        { name: "Burger du Moon", desc: "Bœuf, comté, oignons confits, frites maison", price: 16.5, tags: ["Signature"] },
        { name: "Burger veggie", desc: "Galette végétale, cheddar, crudités, frites", price: 15, tags: ["Végé"] },
        { name: "Salade Franc-Comtoise", desc: "Comté, lardons, croûtons, œuf, vinaigrette maison", price: 14 },
        { name: "Croûte aux morilles", desc: "Selon arrivage", price: 19, tags: ["Local"] },
      ],
    },
    {
      id: "desserts",
      label: "Desserts",
      icon: "🍰",
      items: [
        { name: "Moelleux chocolat", desc: "Cœur coulant, boule vanille", price: 7 },
        { name: "Café gourmand", desc: "Espresso et trois mignardises", price: 7.5 },
        { name: "Coupe glacée", desc: "Trois boules au choix", price: 6 },
      ],
    },
  ],

  // ---------------- ÉVÉNEMENTS ----------------
  // Événements récurrents : "weekday" (0 = dim … 6 = sam). La prochaine date est calculée automatiquement.
  // Événements ponctuels : "date" au format AAAA-MM-JJ. Ils disparaissent une fois passés.
  events: [
    {
      title: "Afterwork du jeudi",
      weekday: 4,
      time: "18:00 – 20:00",
      category: "Afterwork",
      desc: "Happy hour sur les cocktails et les pressions pour bien commencer le week-end.",
    },
    {
      title: "Soirée DJ",
      weekday: 5,
      time: "22:00 – 02:00",
      category: "Dancefloor",
      desc: "Nos DJs aux platines : house, hits et classiques pour danser jusqu'à la fermeture.",
    },
    {
      title: "Moon Party",
      weekday: 6,
      time: "22:00 – 02:00",
      category: "Dancefloor",
      desc: "La soirée phare du samedi : ambiance club, cocktails signature et piste de danse.",
    },
    {
      title: "Quiz & Tapas",
      weekday: 0,
      time: "19:00 – 22:00",
      category: "Jeux",
      desc: "Quiz en équipe, tapas à partager et lots à gagner. Inscription sur place.",
    },
  ],
};
