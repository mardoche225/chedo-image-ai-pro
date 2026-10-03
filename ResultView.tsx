import type { GeneratedImage } from '../types';
import { downloadImage } from '../utils/storage';

interface Props {
  results: GeneratedImage[];
  onRegenerate: () => void;
  onVariant: () => void;
  onEditPrompt: () => void;
  onEnhancePrompt: () => void;
  busy: boolean;
}

const btn =
  'flex items-center justify-center gap-1.5 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-semibold transition disabled:opacity-50';

export default function ResultView({
  results,
  onRegenerate,
  onVariant,
  onEditPrompt,
  onEnhancePrompt,
  busy,
}: Props) {
  if (!results.length) return null;

  return (
    <section className="fade-up space-y-4" aria-label="Résultat">
      <div
        className={`grid gap-4 ${results.length > 1 ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1'}`}
      >
        {results.map((r) => (
          <figure key={r.id} className="glass overflow-hidden rounded-3xl">
            <img
              src={r.image}
              alt={r.prompt}
              className="w-full object-contain"
              style={{ aspectRatio: `${r.width} / ${r.height}` }}
            />
            <figcaption className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-[11px] text-zinc-400">
              <span className="truncate" title={r.prompt}>
                {r.providerName} · seed {r.seed}
              </span>
              <button
                onClick={() => downloadImage(r.image, `chedo-${r.seed}`)}
                className="rounded-lg bg-cyan-400/15 px-3 py-1.5 font-semibold text-cyan-200 transition hover:bg-cyan-400/25"
              >
                ⬇ Télécharger
              </button>
            </figcaption>
          </figure>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        <button onClick={() => downloadImage(results[0].image, `chedo-${results[0].seed}`)} className={`${btn} glow-btn text-white`}>
          ⬇ Télécharger
        </button>
        <button onClick={onRegenerate} disabled={busy} className={`${btn} bg-white/8 text-zinc-100 ring-1 ring-white/10 hover:bg-white/15`}>
          🔄 Régénérer
        </button>
        <button onClick={onVariant} disabled={busy} className={`${btn} bg-white/8 text-zinc-100 ring-1 ring-white/10 hover:bg-white/15`}>
          🎲 Générer une variante
        </button>
        <button onClick={onEditPrompt} disabled={busy} className={`${btn} bg-white/8 text-zinc-100 ring-1 ring-white/10 hover:bg-white/15`}>
          ✏️ Modifier le prompt
        </button>
        <button onClick={onEnhancePrompt} disabled={busy} className={`${btn} bg-violet-500/15 text-violet-200 ring-1 ring-violet-400/30 hover:bg-violet-500/25`}>
          ✨ Améliorer le prompt
        </button>
      </div>
    </section>
  );
}
