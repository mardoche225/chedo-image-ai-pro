/**
 * Orchestration de la génération :
 * - suivi des quotas journaliers locaux par fournisseur ;
 * - mise en indisponibilité temporaire (cooldown) après échec ;
 * - fallback automatique vers le fournisseur suivant ;
 * - aucune simulation : si tout échoue, on renvoie une vraie erreur.
 */

const { providers } = require('../config/aiProviders');

const COOLDOWN_MS = 45 * 1000; // 45 s d'indisponibilité après échec

// État runtime par fournisseur
const state = new Map(
  providers.map((p) => [p.id, { usedToday: 0, day: today(), cooldownUntil: 0 }])
);

function today() {
  return new Date().toISOString().slice(0, 10);
}

function getState(p) {
  const s = state.get(p.id);
  if (s.day !== today()) {
    s.day = today();
    s.usedToday = 0;
  }
  return s;
}

function isAvailable(p) {
  if (!p.enabled()) return false;
  const s = getState(p);
  if (s.cooldownUntil > Date.now()) return false;
  if (p.dailyLimit !== null && s.usedToday >= p.dailyLimit) return false;
  return true;
}

function listProviders() {
  return providers.map((p) => {
    const s = getState(p);
    return {
      id: p.id,
      name: p.name,
      description: p.description,
      model: p.model,
      requiresKey: p.requiresKey,
      limits: p.limits,
      enabled: p.enabled(),
      available: isAvailable(p),
      remainingToday: p.dailyLimit === null ? null : Math.max(0, p.dailyLimit - s.usedToday),
    };
  });
}

/**
 * Génère une image avec le fournisseur demandé, puis fallback automatique.
 * @returns {Promise<{buffer, mime, providerId, providerName, model, seed, fallbackUsed}>}
 */
async function generate({ prompt, width, height, model, seed }) {
  const preferred = providers.find((p) => p.id === model);
  const ordered = [
    ...(preferred ? [preferred] : []),
    ...providers.filter((p) => p.id !== model),
  ].filter((p) => p.enabled());

  if (!ordered.length) {
    throw Object.assign(new Error('Aucun fournisseur configuré.'), { code: 'NO_PROVIDER' });
  }

  let lastError = null;
  let fallbackUsed = false;

  for (const p of ordered) {
    if (!isAvailable(p)) {
      fallbackUsed = fallbackUsed || p === preferred;
      continue;
    }
    const s = getState(p);
    try {
      const { buffer, mime } = await p.generateImage({ prompt, width, height, seed });
      s.usedToday += 1;
      return {
        buffer,
        mime,
        providerId: p.id,
        providerName: p.name,
        model: p.model,
        seed,
        fallbackUsed: preferred ? p.id !== preferred.id : false,
      };
    } catch (err) {
      lastError = err;
      s.cooldownUntil = Date.now() + COOLDOWN_MS;
      if (err.code === 'QUOTA' && p.dailyLimit !== null) s.usedToday = p.dailyLimit;
      console.error(`[imageService] ${p.id} a échoué:`, err.message);
      // on tente le fournisseur suivant
    }
  }

  const code = lastError?.code === 'QUOTA' ? 'ALL_QUOTA' : 'ALL_FAILED';
  throw Object.assign(
    new Error('Le service de génération est temporairement indisponible. Réessaie plus tard.'),
    { code }
  );
}

module.exports = { generate, listProviders };
