import type { GalleryItem } from '../types';
import { downloadImage } from '../utils/storage';

interface Props {
  items: GalleryItem[];
  onRegenerate: (item: GalleryItem) => void;
  onDelete: (id: string) => void;
  compact?: boolean;
}

export default function GalleryGrid({ items, onRegenerate, onDelete, compact }: Props) {
  if (!items.length) {
    return (
      <div className="glass rounded-3xl px-6 py-10 text-center text-sm text-zinc-400">
        <p className="mb-1 text-2xl" aria-hidden>🖼️</p>
        Aucune création pour l'instant. Génère ta première image !
        <p className="mt-2 text-[11px] text-zinc-500">
          Tes créations sont conservées uniquement dans ton navigateur (mode invité).
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
      {items.map((item) => (
        <article key={item.id} className="glass group fade-up flex flex-col overflow-hidden rounded-2xl">
          <img
            src={item.full || item.thumb}
            alt={item.prompt}
            loading="lazy"
            className="aspect-square w-full object-cover"
          />
          <div className="flex flex-1 flex-col gap-2 p-3">
            <p className="line-clamp-2 text-[11px] leading-snug text-zinc-300" title={item.prompt}>
              {item.prompt}
            </p>
            <p className="text-[10px] text-zinc-500">
              {item.providerName} ·{' '}
              {new Date(item.date).toLocaleDateString('fr-FR', {
                day: 'numeric',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
            {!compact && (
              <div className="mt-auto flex gap-1.5">
                <button
                  onClick={() => downloadImage(item.full || item.thumb, `chedo-${item.seed}`)}
                  title={item.full ? 'Télécharger' : 'Télécharger (miniature — régénère pour la pleine taille)'}
                  className="flex-1 rounded-lg bg-cyan-400/15 py-2 text-xs font-semibold text-cyan-200 transition hover:bg-cyan-400/25"
                >
                  ⬇
                </button>
                <button
                  onClick={() => onRegenerate(item)}
                  title="Régénérer"
                  className="flex-1 rounded-lg bg-violet-500/15 py-2 text-xs font-semibold text-violet-200 transition hover:bg-violet-500/25"
                >
                  🔄
                </button>
                <button
                  onClick={() => onDelete(item.id)}
                  title="Supprimer"
                  className="flex-1 rounded-lg bg-red-500/10 py-2 text-xs font-semibold text-red-300 transition hover:bg-red-500/20"
                >
                  🗑
                </button>
              </div>
            )}
          </div>
        </article>
      ))}
    </div>
  );
}
