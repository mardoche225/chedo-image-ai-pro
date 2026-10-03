/**
 * Limitation anti-abus par IP (en mémoire, fenêtre glissante).
 * - RATE_LIMIT_PER_HOUR générations max par IP et par heure (défaut : 30)
 * - 10 requêtes /api/enhance par 10 minutes
 */

const WINDOW_MS = 60 * 60 * 1000;
const LIMIT = Number(process.env.RATE_LIMIT_PER_HOUR) || 30;

const buckets = new Map(); // ip -> timestamps[]

function prune(arr, windowMs) {
  const cutoff = Date.now() - windowMs;
  while (arr.length && arr[0] < cutoff) arr.shift();
}

function getIp(req) {
  return (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || req.socket.remoteAddress || 'unknown';
}

function remainingFor(ip) {
  const arr = buckets.get(ip) || [];
  prune(arr, WINDOW_MS);
  return Math.max(0, LIMIT - arr.length);
}

/** Middleware pour /api/generate */
function generateLimiter(req, res, next) {
  const ip = getIp(req);
  const arr = buckets.get(ip) || [];
  prune(arr, WINDOW_MS);
  if (arr.length >= LIMIT) {
    return res.status(429).json({
      error: 'RATE_LIMITED',
      message: `Limite atteinte (${LIMIT} générations/heure). Réessaie plus tard.`,
      remaining: 0,
    });
  }
  arr.push(Date.now());
  buckets.set(ip, arr);
  req.quotaRemaining = LIMIT - arr.length;
  next();
}

const enhanceBuckets = new Map();
function enhanceLimiter(req, res, next) {
  const ip = getIp(req);
  const arr = enhanceBuckets.get(ip) || [];
  prune(arr, 10 * 60 * 1000);
  if (arr.length >= 10) {
    return res.status(429).json({
      error: 'RATE_LIMITED',
      message: 'Trop de demandes d’amélioration. Patiente quelques minutes.',
    });
  }
  arr.push(Date.now());
  enhanceBuckets.set(ip, arr);
  next();
}

// Nettoyage périodique pour éviter toute fuite mémoire
setInterval(() => {
  for (const [ip, arr] of buckets) {
    prune(arr, WINDOW_MS);
    if (!arr.length) buckets.delete(ip);
  }
  for (const [ip, arr] of enhanceBuckets) {
    prune(arr, 10 * 60 * 1000);
    if (!arr.length) enhanceBuckets.delete(ip);
  }
}, 10 * 60 * 1000).unref();

module.exports = { generateLimiter, enhanceLimiter, remainingFor, getIp, LIMIT };
