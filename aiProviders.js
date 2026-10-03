/**
 * CheDo Image AI — Configuration des fournisseurs de génération d'images
 * ----------------------------------------------------------------------
 * Chaque fournisseur expose :
 *  - id, name, description
 *  - apiUrl           : URL de base de l'API
 *  - model            : modèle utilisé
 *  - requiresKey      : true si une clé API (dans .env) est nécessaire
 *  - enabled()        : le fournisseur est-il utilisable actuellement ?
 *  - limits           : description honnête des limites du niveau gratuit
 *  - dailyLimit       : plafond local appliqué par CE serveur (anti-abus),
 *                       null = pas de plafond local
 *  - generateImage()  : fonction asynchrone -> { buffer, mime }
 *
 * Les clés API sont lues UNIQUEMENT depuis process.env (fichier .env).
 * Elles ne sont JAMAIS envoyées au frontend.
 */

const FETCH_TIMEOUT_MS = 120_000;

async function fetchWithTimeout(url, options = {}, timeout = FETCH_TIMEOUT_MS) {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), timeout);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(t);
  }
}

/* ------------------------------------------------------------------ */
/* 1. Pollinations.ai — GRATUIT, sans clé (fournisseur principal)      */
/* ------------------------------------------------------------------ */
function makePollinationsProvider({ id, name, model, description }) {
  return {
    id,
    name,
    description,
    apiUrl: 'https://image.pollinations.ai',
    model,
    requiresKey: false,
    limits:
      'Gratuit sans clé. Débit limité : environ 1 image toutes les 20 à 30 s par adresse IP ' +
      '(le serveur patiente et réessaie automatiquement). Un jeton gratuit (POLLINATIONS_TOKEN) ' +
      'augmente la priorité. Le niveau anonyme peut rediriger vers le modèle disponible du moment.',
    dailyLimit: null,
    enabled: () => true,

    async generateImage({ prompt, width, height, seed }) {
      const params = new URLSearchParams({
        width: String(width),
        height: String(height),
        model,
        nologo: 'true',
        seed: String(seed),
      });
      // Un jeton gratuit Pollinations (optionnel) améliore la priorité / les modèles.
      const headers = {};
      if (process.env.POLLINATIONS_TOKEN) {
        headers.Authorization = `Bearer ${process.env.POLLINATIONS_TOKEN}`;
      }
      const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?${params}`;

      // Le niveau anonyme renvoie 402/429 si on dépasse ~1 image / 20-30 s par IP :
      // on patiente puis on réessaie (jusqu'à 3 tentatives) avant d'abandonner.
      const waits = [0, 15_000, 30_000];
      let lastStatus = 0;
      for (const wait of waits) {
        if (wait) await new Promise((r) => setTimeout(r, wait));
        const res = await fetchWithTimeout(url, { headers });
        if (res.ok) {
          const buffer = Buffer.from(await res.arrayBuffer());
          if (buffer.length < 1000)
            throw Object.assign(new Error('Réponse invalide'), { code: 'API_ERROR' });
          return { buffer, mime: res.headers.get('content-type') || 'image/jpeg' };
        }
        lastStatus = res.status;
        if (res.status !== 402 && res.status !== 429) {
          throw Object.assign(new Error(`HTTP ${res.status}`), { code: 'API_ERROR' });
        }
      }
      throw Object.assign(new Error(`quota (HTTP ${lastStatus})`), { code: 'QUOTA' });
    },
  };
}

/* ------------------------------------------------------------------ */
/* 2. Hugging Face Inference — OPTIONNEL, clé gratuite requise         */
/* ------------------------------------------------------------------ */
const huggingFaceProvider = {
  id: 'huggingface-flux',
  name: 'FLUX.1-schnell (Hugging Face)',
  description: 'Modèle open source FLUX.1-schnell via l’API d’inférence Hugging Face.',
  apiUrl: 'https://router.huggingface.co/hf-inference/models/black-forest-labs/FLUX.1-schnell',
  model: 'black-forest-labs/FLUX.1-schnell',
  requiresKey: true,
  limits:
    'Nécessite un compte Hugging Face gratuit (clé dans .env). Le niveau gratuit accorde un petit crédit ' +
    'mensuel d’inférence (quelques dizaines d’images). Au-delà : erreur 402, le site bascule sur un autre fournisseur.',
  dailyLimit: 40,
  enabled: () => Boolean(process.env.HF_API_KEY),

  async generateImage({ prompt, width, height }) {
    const res = await fetchWithTimeout(this.apiUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.HF_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: prompt,
        parameters: { width, height, num_inference_steps: 4 },
      }),
    });
    if (res.status === 429 || res.status === 402)
      throw Object.assign(new Error('quota'), { code: 'QUOTA' });
    if (!res.ok) throw Object.assign(new Error(`HTTP ${res.status}`), { code: 'API_ERROR' });
    const buffer = Buffer.from(await res.arrayBuffer());
    return { buffer, mime: res.headers.get('content-type') || 'image/jpeg' };
  },
};

/* ------------------------------------------------------------------ */
/* 3. Stable Diffusion local (AUTOMATIC1111 / SD WebUI) — OPTIONNEL    */
/*    100 % open source, auto-hébergé, aucune limite externe.          */
/* ------------------------------------------------------------------ */
const localSdProvider = {
  id: 'local-sd',
  name: 'Stable Diffusion (local)',
  description:
    'Instance AUTOMATIC1111 / SD WebUI auto-hébergée (API txt2img). Définissez LOCAL_SD_URL dans .env.',
  apiUrl: process.env.LOCAL_SD_URL || '',
  model: 'stable-diffusion (modèle chargé localement)',
  requiresKey: false,
  limits: 'Aucune limite externe : dépend uniquement de votre machine/GPU.',
  dailyLimit: null,
  enabled: () => Boolean(process.env.LOCAL_SD_URL),

  async generateImage({ prompt, width, height, seed }) {
    const base = process.env.LOCAL_SD_URL.replace(/\/$/, '');
    const res = await fetchWithTimeout(`${base}/sdapi/v1/txt2img`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, width, height, seed, steps: 25 }),
    });
    if (!res.ok) throw Object.assign(new Error(`HTTP ${res.status}`), { code: 'API_ERROR' });
    const data = await res.json();
    if (!data.images?.[0]) throw Object.assign(new Error('Réponse vide'), { code: 'API_ERROR' });
    return { buffer: Buffer.from(data.images[0], 'base64'), mime: 'image/png' };
  },
};

/* ------------------------------------------------------------------ */
/* Liste finale, par ordre de priorité pour le fallback automatique    */
/* ------------------------------------------------------------------ */
const providers = [
  makePollinationsProvider({
    id: 'pollinations-flux',
    name: 'Flux (Pollinations)',
    model: 'flux',
    description: 'Modèle Flux via Pollinations.ai — gratuit, sans clé, bonne qualité générale.',
  }),
  makePollinationsProvider({
    id: 'pollinations-turbo',
    name: 'Turbo (Pollinations)',
    model: 'turbo',
    description: 'Variante rapide via Pollinations.ai — gratuit, sans clé, génération plus rapide.',
  }),
  huggingFaceProvider,
  localSdProvider,
];

module.exports = { providers };
