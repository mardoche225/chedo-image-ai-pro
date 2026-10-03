/** Types partagés du frontend CheDo Image AI */

export interface ProviderInfo {
  id: string;
  name: string;
  description: string;
  model: string;
  requiresKey: boolean;
  limits: string;
  enabled: boolean;
  available: boolean;
  remainingToday: number | null;
}

export interface StatusResponse {
  providers: ProviderInfo[];
  quota: { limitPerHour: number; remaining: number };
}

export interface GenerateResponse {
  image: string; // data URL — jamais de clé API ici
  provider: string;
  providerName: string;
  model: string;
  seed: number;
  fallbackUsed: boolean;
  quotaRemaining: number;
}

export interface EnhanceResponse {
  enhanced: string;
  source: 'ai' | 'fallback';
}

export interface ApiError {
  error: string;
  message: string;
}

export interface GeneratedImage {
  id: string;
  image: string; // data URL pleine taille (session en cours)
  prompt: string;
  providerName: string;
  model: string;
  seed: number;
  width: number;
  height: number;
  date: number;
}

export interface GalleryItem {
  id: string;
  thumb: string; // miniature (toujours présente)
  full?: string; // image pleine taille si l'espace localStorage le permet
  prompt: string;
  providerName: string;
  model: string;
  seed: number;
  width: number;
  height: number;
  date: number;
}

export interface Preferences {
  model: string;
  format: string;
  style: string;
  count: number;
}
