# CheDo Image AI 🎨

**Crée tes images avec l'IA** — gratuitement, sans compte, sur mobile comme sur ordinateur.

Application web complète de génération d'images par IA :

- ✍️ Saisie de prompt + **amélioration automatique du prompt par IA**
- 🧠 Choix du **modèle/fournisseur** (architecture multi-providers avec fallback automatique)
- 🎨 **11 styles** (Réaliste, Cinématique, Anime, Manga, Cartoon, 3D, Fantasy, Cyberpunk, Photographie, Illustration, Concept Art)
- 📐 **5 formats** (1:1, 16:9, 9:16, 4:3, 3:4) adaptés automatiquement
- 🖼️ 1 à 4 images par génération, seed réglable (options avancées)
- ⬇️ Téléchargement, 🔄 régénération, 🎲 variantes
- 🗂️ Galerie « Mes créations » conservée dans le navigateur (localStorage, mode invité)
- 📱 100 % responsive (Android, iPhone, tablette, PC)
- 🔒 Clés API **uniquement côté serveur**, rate-limiting anti-abus, validation serveur

---

## Stack

| Couche    | Technologies                                   |
| --------- | ---------------------------------------------- |
| Frontend  | React 18 · TypeScript · Tailwind CSS 4 · Vite |
| Backend   | Node.js ≥ 18 · Express                         |

```
chedo-image-ai/
├── server/                  # Backend sécurisé (les clés restent ici)
│   ├── index.js             # Express : /api/generate, /api/enhance, /api/status
│   ├── config/aiProviders.js# ⚙️ Fournisseurs (ajout/retrait facile)
│   ├── services/            # imageService (quotas+fallback), promptService
│   └── utils/               # validation, rate-limiter par IP
├── client/
│   └── src/
│       ├── components/      # Header, PromptForm, OptionsPanel, ResultView, GalleryGrid…
│       ├── pages/           # HomePage, GalleryPage
│       ├── services/api.ts  # Appels /api (URLs relatives, zéro secret)
│       ├── config/presets.ts# Styles & formats
│       ├── utils/storage.ts # Galerie + préférences localStorage
│       └── types/
├── .env.example
└── package.json
```

---

## 1. Installation

```bash
git clone <votre-repo> chedo-image-ai
cd chedo-image-ai
npm install          # installe aussi client/ (postinstall)
```

## 2. Configuration `.env`

```bash
cp .env.example .env
```

**Aucune clé n'est obligatoire** : le fournisseur principal (Pollinations.ai) fonctionne sans clé.

| Variable              | Obligatoire | Rôle                                                            |
| --------------------- | ----------- | --------------------------------------------------------------- |
| `PORT`                | non         | Port du backend (défaut `3001`)                                 |
| `POLLINATIONS_TOKEN`  | non         | Jeton gratuit → meilleure priorité ([auth.pollinations.ai](https://auth.pollinations.ai)) |
| `HF_API_KEY`          | non         | Active le fournisseur Hugging Face (clé gratuite « Read »)     |
| `LOCAL_SD_URL`        | non         | Active un Stable Diffusion local (AUTOMATIC1111 avec `--api`)   |
| `RATE_LIMIT_PER_HOUR` | non         | Générations max / IP / heure (défaut `30`)                      |
| `ALLOWED_ORIGINS`     | non         | Origines CORS supplémentaires (inutile en même-origine)         |

⚠️ Ne committez jamais `.env` (déjà dans `.gitignore`).

## 3. Lancement local

**Développement** (backend 3001 + frontend Vite 5173 avec proxy `/api`) :

```bash
npm run dev
# → http://localhost:5173
```

**Production** (un seul serveur : l'Express sert aussi le frontend buildé) :

```bash
npm run build
npm start
# → http://localhost:3001
```

## 4. Configuration des fournisseurs

Tout se passe dans **`server/config/aiProviders.js`**. Chaque fournisseur déclare :

```js
{
  id, name, description,
  apiUrl, model,
  requiresKey,          // clé .env nécessaire ?
  limits,               // description honnête des limites gratuites
  dailyLimit,           // plafond local appliqué par CE serveur (null = aucun)
  enabled(),            // utilisable actuellement ?
  async generateImage({ prompt, width, height, seed }) // → { buffer, mime }
}
```

Pour ajouter un fournisseur : ajoutez un objet au tableau `providers` (l'ordre = priorité de
fallback). Si le fournisseur choisi échoue ou atteint sa limite, le serveur **bascule
automatiquement** sur le suivant ; si tous échouent, une vraie erreur est renvoyée
(aucune génération n'est jamais simulée).

## 5. Déploiement (niveau gratuit)

Le projet est un simple serveur Node qui sert aussi le frontend → compatible avec tout
hébergeur Node disposant d'un niveau gratuit (Render, Railway, Fly.io, Koyeb, Glitch…).

**Exemple Render.com (gratuit)** :

1. Poussez le repo sur GitHub (sans `.env` !).
2. New → Web Service → connectez le repo.
3. Build command : `npm install && npm run build`
4. Start command : `npm start`
5. Ajoutez vos variables d'environnement dans l'onglet *Environment*.

Notes :
- Le serveur écoute sur `process.env.PORT` (fourni par l'hébergeur).
- Le rate-limiter est en mémoire : parfait pour une instance unique (niveau gratuit).
  Pour plusieurs instances, remplacez-le par Redis.
- Les instances gratuites « s'endorment » après inactivité : premier chargement lent, c'est normal.

## 6. APIs réellement utilisées et limites gratuites (honnêtes)

| Fournisseur | Gratuit ? | Clé ? | Limites réelles constatées |
| ----------- | --------- | ----- | --------------------------- |
| **Pollinations.ai (images)** — fournisseur principal | ✅ Oui | Aucune | **Débit limité : ~1 image / 20-30 s par IP** en anonyme (HTTP 402/429 au-delà — le backend attend et réessaie automatiquement jusqu'à 3 fois). Pas de quota journalier publié. Le niveau anonyme peut rediriger vers le modèle disponible du moment (ex. flux → modèle actif). Un jeton gratuit améliore priorité et modèles. |
| **Pollinations.ai (texte)** — amélioration de prompt | ✅ Oui | Aucune | Même politique de débit. En cas d'indisponibilité, un enrichissement local simple est appliqué et **signalé comme tel** à l'utilisateur. |
| **Hugging Face Inference** (FLUX.1-schnell) — optionnel | ⚠️ Crédit gratuit | Oui (gratuite) | Petit crédit d'inférence mensuel offert (~quelques dizaines d'images). Au-delà : HTTP 402 → le site bascule sur Pollinations. Plafond local : 40 img/jour. |
| **Stable Diffusion local** (AUTOMATIC1111) — optionnel | ✅ Open source | Non | Aucune limite externe : dépend de votre GPU. |

**Aucune de ces APIs n'est « gratuite illimitée »** : l'application affiche le quota local
restant (« Générations disponibles : X »), gère les erreurs de quota et n'invente jamais de résultat.

## 7. Sécurité

- 🔑 Clés lues uniquement depuis `.env` côté serveur — **jamais** dans le JS/HTML/localStorage ; vérifié : zéro occurrence dans le bundle buildé.
- ✅ Validation serveur : prompt (2–2000 caractères), dimensions sur liste blanche, seed borné.
- 🚦 Rate-limiting par IP : générations (30/h, configurable) et améliorations de prompt (10/10 min).
- 🌐 CORS strict même-origine par défaut ; en-têtes `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`.
- 🧯 Gestion d'erreurs globale avec messages clairs côté utilisateur.

## 8. Messages d'erreur côté utilisateur

| Situation          | Message                                                               |
| ------------------ | --------------------------------------------------------------------- |
| Prompt vide        | « Décris ce que tu veux créer. »                                      |
| Moteur en panne    | « Le moteur d'image ne répond pas actuellement. »                     |
| Quota fournisseur  | « La limite gratuite de ce moteur a été atteinte. »                   |
| Tous indisponibles | « Le service de génération est temporairement indisponible. Réessaie plus tard. » |
| Erreur serveur     | « Une erreur est survenue. Réessaie dans quelques instants. »         |
