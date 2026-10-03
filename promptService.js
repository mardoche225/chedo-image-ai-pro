/**
 * Amélioration de prompt via l'API texte gratuite de Pollinations.ai
 * (compatible format OpenAI, sans clé). En cas d'échec, on applique un
 * enrichissement local de secours (règles simples) — jamais de fausse IA :
 * la réponse indique la source ("ai" ou "fallback").
 */

const SYSTEM_PROMPT = `Tu es un expert en prompts pour la génération d'images par IA.
Transforme la description de l'utilisateur en un prompt détaillé en français qui précise :
le personnage/sujet, l'environnement, la composition, la lumière, l'angle de caméra, le style artistique, la qualité et les détails.
Garde TOUTES les idées importantes de l'utilisateur. Réponds UNIQUEMENT avec le prompt final, sans guillemets ni explication, en 60 mots maximum.`;

async function enhancePrompt(prompt) {
  try {
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), 45_000);
    const res = await fetch('https://text.pollinations.ai/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'openai',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: prompt },
        ],
      }),
      signal: controller.signal,
    }).finally(() => clearTimeout(t));

    if (res.ok) {
      const text = (await res.text()).trim().replace(/^["«\s]+|["»\s]+$/g, '');
      if (text && text.length > 10 && text.length < 1500) {
        return { enhanced: text, source: 'ai' };
      }
    }
  } catch (err) {
    console.error('[promptService] API texte indisponible:', err.message);
  }

  // Secours local (transparent pour l'utilisateur : source = "fallback")
  const enhanced =
    `${prompt}, composition équilibrée, éclairage cinématographique doux, ` +
    `profondeur de champ, très détaillé, haute résolution, rendu professionnel`;
  return { enhanced, source: 'fallback' };
}

module.exports = { enhancePrompt };
