/**
 * Client API — uniquement des URLs relatives (/api/...).
 * Aucune clé, aucun secret : tout est géré par le backend.
 */

import type { StatusResponse, GenerateResponse, EnhanceResponse, ApiError } from '../types';

async function parseJson<T>(res: Response): Promise<T> {
  let data: unknown = null;
  try {
    data = await res.json();
  } catch {
    /* réponse non JSON */
  }
  if (!res.ok) {
    const err = (data || {}) as Partial<ApiError>;
    throw new ApiRequestError(
      err.error || 'SERVER_ERROR',
      err.message || 'Une erreur est survenue. Réessaie dans quelques instants.'
    );
  }
  return data as T;
}

export class ApiRequestError extends Error {
  code: string;
  constructor(code: string, message: string) {
    super(message);
    this.code = code;
  }
}

export async function fetchStatus(): Promise<StatusResponse> {
  const res = await fetch('/api/status');
  return parseJson<StatusResponse>(res);
}

export async function generateImage(params: {
  prompt: string;
  model: string;
  width: number;
  height: number;
  seed?: number;
}): Promise<GenerateResponse> {
  const res = await fetch('/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  return parseJson<GenerateResponse>(res);
}

export async function enhancePrompt(prompt: string): Promise<EnhanceResponse> {
  const res = await fetch('/api/enhance', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt }),
  });
  return parseJson<EnhanceResponse>(res);
}
