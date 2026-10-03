/**
 * Persistance locale (mode invité) : galerie + préférences dans localStorage.
 * - Les miniatures sont compressées (canvas) pour tenir dans le quota (~5 Mo).
 * - L'image pleine taille est conservée quand l'espace le permet.
 * - Aucun secret n'est jamais stocké ici.
 */

import type { GalleryItem, Preferences, GeneratedImage } from '../types';

const GALLERY_KEY = 'chedo:gallery';
const PREFS_KEY = 'chedo:prefs';
const MAX_ITEMS = 30;
const MAX_FULL_LENGTH = 700_000; // ~0,5 Mo de base64

export function loadGallery(): GalleryItem[] {
  try {
    const raw = localStorage.getItem(GALLERY_KEY);
    if (!raw) return [];
    const items = JSON.parse(raw);
    return Array.isArray(items) ? items : [];
  } catch {
    return [];
  }
}

function persist(items: GalleryItem[]): GalleryItem[] {
  // En cas de dépassement de quota : on retire d'abord les images pleine
  // taille les plus anciennes, puis les éléments les plus anciens.
  const copy = items.slice(0, MAX_ITEMS);
  for (let attempt = 0; attempt < 40; attempt++) {
    try {
      localStorage.setItem(GALLERY_KEY, JSON.stringify(copy));
      return copy;
    } catch {
      const oldestFull = [...copy].reverse().find((i) => i.full);
      if (oldestFull) delete oldestFull.full;
      else if (copy.length > 1) copy.pop();
      else return copy;
    }
  }
  return copy;
}

export async function makeThumbnail(dataUrl: string, maxSize = 320): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      const ctx = canvas.getContext('2d');
      if (!ctx) return resolve(dataUrl);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL('image/jpeg', 0.72));
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

export async function addToGallery(gen: GeneratedImage): Promise<GalleryItem[]> {
  const thumb = await makeThumbnail(gen.image);
  const item: GalleryItem = {
    id: gen.id,
    thumb,
    full: gen.image.length <= MAX_FULL_LENGTH ? gen.image : undefined,
    prompt: gen.prompt,
    providerName: gen.providerName,
    model: gen.model,
    seed: gen.seed,
    width: gen.width,
    height: gen.height,
    date: gen.date,
  };
  const items = [item, ...loadGallery()];
  return persist(items);
}

export function removeFromGallery(id: string): GalleryItem[] {
  const items = loadGallery().filter((i) => i.id !== id);
  try {
    localStorage.setItem(GALLERY_KEY, JSON.stringify(items));
  } catch {
    /* ignore */
  }
  return items;
}

export function loadPrefs(): Partial<Preferences> {
  try {
    return JSON.parse(localStorage.getItem(PREFS_KEY) || '{}');
  } catch {
    return {};
  }
}

export function savePrefs(prefs: Preferences): void {
  try {
    localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
  } catch {
    /* ignore */
  }
}

/** Déclenche le téléchargement d'une image (data URL). */
export function downloadImage(dataUrl: string, name: string): void {
  const a = document.createElement('a');
  a.href = dataUrl;
  const ext = dataUrl.startsWith('data:image/png') ? 'png' : 'jpg';
  a.download = `${name}.${ext}`;
  document.body.appendChild(a);
  a.click();
  a.remove();
}
