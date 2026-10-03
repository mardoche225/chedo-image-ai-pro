/** Formats et styles — les dimensions sont adaptées aux valeurs acceptées par le serveur. */

export interface FormatPreset {
  id: string;
  label: string;
  ratio: string;
  width: number;
  height: number;
}

export const FORMATS: FormatPreset[] = [
  { id: '1:1', label: 'Carré', ratio: '1:1', width: 1024, height: 1024 },
  { id: '16:9', label: 'Paysage', ratio: '16:9', width: 1344, height: 768 },
  { id: '9:16', label: 'Portrait', ratio: '9:16', width: 768, height: 1344 },
  { id: '4:3', label: 'Classique', ratio: '4:3', width: 1024, height: 768 },
  { id: '3:4', label: 'Vertical', ratio: '3:4', width: 768, height: 1024 },
];

export interface StylePreset {
  id: string;
  label: string;
  emoji: string;
  /** Suffixe ajouté au prompt — n'écrase jamais le texte de l'utilisateur. */
  suffix: string;
}

export const STYLES: StylePreset[] = [
  { id: 'none', label: 'Aucun', emoji: '∅', suffix: '' },
  { id: 'realistic', label: 'Réaliste', emoji: '📷', suffix: 'photo ultra réaliste, détails fins, textures naturelles, 8k' },
  { id: 'cinematic', label: 'Cinématique', emoji: '🎬', suffix: 'éclairage cinématographique, couleurs étalonnées, grain de film, plan large dramatique' },
  { id: 'anime', label: 'Anime', emoji: '🌸', suffix: 'style anime japonais, cel-shading, couleurs vives, traits nets' },
  { id: 'manga', label: 'Manga', emoji: '✒️', suffix: 'style manga noir et blanc, encrage précis, trames, dynamisme' },
  { id: 'cartoon', label: 'Cartoon', emoji: '🎨', suffix: 'style cartoon, formes arrondies, couleurs saturées, contours épais' },
  { id: '3d', label: '3D', emoji: '🧊', suffix: 'rendu 3D, octane render, matériaux PBR, éclairage global' },
  { id: 'fantasy', label: 'Fantasy', emoji: '🐉', suffix: 'univers fantasy épique, ambiance magique, détails ornementaux' },
  { id: 'cyberpunk', label: 'Cyberpunk', emoji: '🌃', suffix: 'ambiance cyberpunk, néons, pluie, ville futuriste, haute technologie' },
  { id: 'photo', label: 'Photographie', emoji: '📸', suffix: 'photographie professionnelle, objectif 50mm, profondeur de champ, lumière naturelle' },
  { id: 'illustration', label: 'Illustration', emoji: '🖌️', suffix: 'illustration digitale, composition soignée, palette harmonieuse' },
  { id: 'concept', label: 'Concept Art', emoji: '🗺️', suffix: 'concept art, matte painting, ambiance travaillée, qualité studio' },
];

/** Applique un style sans supprimer les informations de l'utilisateur. */
export function applyStyle(prompt: string, styleId: string): string {
  const style = STYLES.find((s) => s.id === styleId);
  if (!style || !style.suffix) return prompt;
  return `${prompt}, ${style.suffix}`;
}

export const EXAMPLE_PROMPT =
  'Un guerrier samouraï debout sous la pluie dans une ville japonaise futuriste, éclairage cinématographique, ultra réaliste';
