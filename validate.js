/**
 * Validation côté serveur des paramètres de génération.
 * Toute requête invalide est rejetée avant d'atteindre un fournisseur.
 */

const ALLOWED_DIMENSIONS = new Set([256, 512, 576, 640, 768, 832, 896, 1024, 1280, 1344, 1536]);
const MAX_PROMPT_LENGTH = 2000;
const MIN_PROMPT_LENGTH = 2;

function validateGenerateBody(body) {
  const errors = [];
  if (typeof body !== 'object' || body === null) {
    return { ok: false, errors: ['Corps de requête invalide.'] };
  }

  const prompt = typeof body.prompt === 'string' ? body.prompt.trim() : '';
  if (!prompt) errors.push('EMPTY_PROMPT');
  else if (prompt.length < MIN_PROMPT_LENGTH) errors.push('EMPTY_PROMPT');
  else if (prompt.length > MAX_PROMPT_LENGTH)
    errors.push(`Le prompt est trop long (max ${MAX_PROMPT_LENGTH} caractères).`);

  const width = Number(body.width) || 1024;
  const height = Number(body.height) || 1024;
  if (!ALLOWED_DIMENSIONS.has(width) || !ALLOWED_DIMENSIONS.has(height)) {
    errors.push('Dimensions non autorisées.');
  }

  const model = typeof body.model === 'string' ? body.model.slice(0, 64) : '';

  let seed = Number(body.seed);
  if (!Number.isInteger(seed) || seed < 0 || seed > 2147483647) {
    seed = Math.floor(Math.random() * 2147483647);
  }

  if (errors.length) return { ok: false, errors };
  return { ok: true, value: { prompt, width, height, model, seed } };
}

function validateEnhanceBody(body) {
  const prompt = typeof body?.prompt === 'string' ? body.prompt.trim() : '';
  if (!prompt) return { ok: false, errors: ['EMPTY_PROMPT'] };
  if (prompt.length > 2000) return { ok: false, errors: ['Le prompt est trop long.'] };
  return { ok: true, value: { prompt } };
}

module.exports = { validateGenerateBody, validateEnhanceBody, ALLOWED_DIMENSIONS };
