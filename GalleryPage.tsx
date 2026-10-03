import type { GalleryItem } from '../types';
import GalleryGrid from '../components/GalleryGrid';

interface Props {
  items: GalleryItem[];
  onRegenerate: (item: GalleryItem) => void;
  onDelete: (id: string) => void;
}

export default function GalleryPage({ items, onRegenerate, onDelete }: Props) {
  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 pb-16 pt-8">
      <header>
        <h1 className="text-2xl font-black tracking-tight text-white sm:text-3xl">
          Mes <span className="text-gradient">créations</span>
        </h1>
        <p className="mt-1.5 text-sm text-zinc-400">
          {items.length} création{items.length > 1 ? 's' : ''} — conservées uniquement dans ton
          navigateur (localStorage), sans compte ni serveur.
        </p>
      </header>
      <GalleryGrid items={items} onRegenerate={onRegenerate} onDelete={onDelete} />
    </div>
  );
}
