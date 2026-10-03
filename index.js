/**
 * CheDo Image AI — Backend sécurisé (Node.js + Express)
 * Les clés API restent ici, côté serveur. Le frontend ne reçoit jamais de secret.
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const express = require('express');
const path = require('path');

const { generate, listProviders } = require('./services/imageService');
const { enhancePrompt } = require('./services/promptService');
const { validateGenerateBody, validateEnhanceBody } = require('./utils/validate');
const { generateLimiter, enhanceLimiter, remainingFor, getIp, LIMIT } = require('./utils/rateLimiter');

const app = express();
const PORT = Number(process.env.PORT) || 3001;

app.disable('x-powered-by');
app.use(express.json({ limit: '32kb' }));

/* ---------- Sécurité : en-têtes + CORS ---------- */
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Referrer-Policy', 'no-referrer');

  // CORS : même origine par défaut ; origines supplémentaires via .env
  const allowed = (process.env.ALLOWED_ORIGINS || '').split(',').map((s) => s.trim()).filter(Boolean);
  const origin = req.headers.origin;
  if (origin && allowed.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  }
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

/* ---------- API ---------- */

// Liste des fournisseurs (sans aucun secret) + quota restant pour cette IP
app.get('/api/status', (req, res) => {
  res.json({
    providers: listProviders(),
    quota: { limitPerHour: LIMIT, remaining: remainingFor(getIp(req)) },
  });
});

// Génération d'image
app.post('/api/generate', generateLimiter, async (req, res) => {
  const v = validateGenerateBody(req.body);
  if (!v.ok) {
    const emptyPrompt = v.errors.includes('EMPTY_PROMPT');
    return res.status(400).json({
      error: emptyPrompt ? 'EMPTY_PROMPT' : 'INVALID_PARAMS',
      message: emptyPrompt ? 'Décris ce que tu veux créer.' : v.errors.join(' '),
    });
  }

  try {
    const result = await generate(v.value);
    res.json({
      image: `data:${result.mime};base64,${result.buffer.toString('base64')}`,
      provider: result.providerId,
      providerName: result.providerName,
      model: result.model,
      seed: result.seed,
      fallbackUsed: result.fallbackUsed,
      quotaRemaining: req.quotaRemaining,
    });
  } catch (err) {
    console.error('[api/generate]', err.message);
    if (err.code === 'ALL_QUOTA') {
      return res.status(429).json({
        error: 'QUOTA',
        message: 'La limite gratuite de ce moteur a été atteinte.',
      });
    }
    if (err.code === 'NO_PROVIDER' || err.code === 'ALL_FAILED') {
      return res.status(503).json({
        error: 'UNAVAILABLE',
        message: 'Le service de génération est temporairement indisponible. Réessaie plus tard.',
      });
    }
    res.status(500).json({
      error: 'SERVER_ERROR',
      message: 'Une erreur est survenue. Réessaie dans quelques instants.',
    });
  }
});

// Amélioration du prompt
app.post('/api/enhance', enhanceLimiter, async (req, res) => {
  const v = validateEnhanceBody(req.body);
  if (!v.ok) {
    return res.status(400).json({ error: 'EMPTY_PROMPT', message: 'Décris ce que tu veux créer.' });
  }
  try {
    const result = await enhancePrompt(v.value.prompt);
    res.json(result);
  } catch {
    res.status(500).json({
      error: 'SERVER_ERROR',
      message: 'Une erreur est survenue. Réessaie dans quelques instants.',
    });
  }
});

/* ---------- Frontend buildé (production) ---------- */
const clientDist = path.join(__dirname, '..', 'client', 'dist');
app.use(express.static(clientDist));
app.get(/^(?!\/api\/).*/, (req, res, next) => {
  res.sendFile(path.join(clientDist, 'index.html'), (err) => err && next());
});

/* ---------- Gestion d'erreurs globale ---------- */
app.use((err, req, res, next) => { // eslint-disable-line no-unused-vars
  console.error('[server]', err.message);
  res.status(500).json({
    error: 'SERVER_ERROR',
    message: 'Une erreur est survenue. Réessaie dans quelques instants.',
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`CheDo Image AI — backend prêt sur http://0.0.0.0:${PORT}`);
});
