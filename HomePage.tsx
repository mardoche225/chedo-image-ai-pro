import { useRef, useState } from 'react';
import type { GeneratedImage, GalleryItem, ProviderInfo } from '../types';
import { FORMATS, applyStyle } from '../config/presets';
import { generateImage, enhancePrompt, ApiRequestError } from '../services/api';
import { addToGallery } from '../utils/storage';
import PromptForm from '../components/PromptForm';
import OptionsPanel from '../components/OptionsPanel';
import ResultView from '../components/ResultView';
import Loader from '../components/Loader';
import ErrorBanner from '../components/ErrorBanner';
import GalleryGrid from '../components/GalleryGrid';

interface Props {
  providers: ProviderInfo[];
  model: string;
  setModel: (v: string) => void;
  style: string;
  setStyle: (v: string) => void;
  format: string;
  setFormat: (v: string) => void;
  count: number;
  setCount: (v: number) => void;
  gallery: GalleryItem[];
  setGallery: (items: GalleryItem[]) => void;
  setQuotaRemaining: (n: number) => void;
  refreshStatus: () => void;
  onDeleteGalleryItem: (id: string) => void;
  onSeeAll: () => void;
  prompt: string;
  setPrompt: (v: string) => void;
}

export default function HomePage(p: Props) {
  const [results, setResults] = useState<GeneratedImage[]>([]);
  const [generating, setGenerating] = useState(false);
  const [enhancing, setEnhancing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [enhanceNote, setEnhanceNote] = useState<string | null>(null);
  const [seedInput, setSeedInput] = useState('');
  const [progress, setProgress] = useState({ current: 0, total: 1 });
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const doGenerate = async (opts?: { forceSeed?: number; promptOverride?: string }) => {
    const base = (opts?.promptOverride ?? p.prompt).trim();
    if (!base) {
      setError('Décris ce que tu veux créer.');
      textareaRef.current?.focus();
      return;
    }
    setError(null);
    setNotice(null);
    setEnhanceNote(null);
    setGenerating(true);
    setResults([]);

    // Un prompt venant de la galerie contient déjà son style : on ne le réapplique pas.
    const finalPrompt = opts?.promptOverride ? base : applyStyle(base, p.style);
    const fmt = FORMATS.find((f) => f.id === p.format) || FORMATS[0];
    const out: GeneratedImage[] = [];
    let fallbackNoticed = false;

    try {
      for (let i = 0; i < p.count; i++) {
        setProgress({ current: i + 1, total: p.count });
        const manualSeed =
          opts?.forceSeed !== undefined
            ? opts.forceSeed + i
            : seedInput !== ''
              ? Number(seedInput) + i
              : undefined;

        const res = await generateImage({
          prompt: finalPrompt,
          model: p.model,
          width: fmt.width,
          height: fmt.height,
          ...(manualSeed !== undefined ? { seed: manualSeed } : {}),
        });

        const gen: GeneratedImage = {
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          image: res.image,
          prompt: finalPrompt,
          providerName: res.providerName,
          model: res.model,
          seed: res.seed,
          width: fmt.width,
          height: fmt.height,
          date: Date.now(),
        };
        out.push(gen);
        setResults([...out]);
        p.setQuotaRemaining(res.quotaRemaining);
        if (res.fallbackUsed && !fallbackNoticed) {
          fallbackNoticed = true;
          setNotice(
            `Le moteur choisi était indisponible : l'image a été générée avec « ${res.providerName} ».`
          );
        }
        const items = await addToGallery(gen);
        p.setGallery(items);
      }
    } catch (e) {
      const msg =
        e instanceof ApiRequestError
          ? e.message
          : 'Le moteur d’image ne répond pas actuellement.';
      setError(out.length ? `${out.length}/${p.count} images générées. ${msg}` : msg);
    } finally {
      setGenerating(false);
      p.refreshStatus();
    }
  };

  const doEnhance = async () => {
    const base = p.prompt.trim();
    if (!base) {
      setError('Décris ce que tu veux créer.');
      return;
    }
    setError(null);
    setEnhancing(true);
    setEnhanceNote(null);
    try {
      const res = await enhancePrompt(base);
      p.setPrompt(res.enhanced);
      setEnhanceNote(
        res.source === 'ai'
          ? '✨ Prompt amélioré par l’IA.'
          : 'ℹ️ IA indisponible : enrichissement automatique simple appliqué.'
      );
      textareaRef.current?.focus();
    } catch (e) {
      setError(
        e instanceof ApiRequestError ? e.message : 'Une erreur est survenue. Réessaie dans quelques instants.'
      );
    } finally {
      setEnhancing(false);
    }
  };

  const focusPrompt = () => {
    textareaRef.current?.focus();
    textareaRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 pb-16 pt-8 sm:pt-12">
      {/* HERO */}
      <section className="text-center">
        <h1 className="mx-auto max-w-3xl text-3xl font-black leading-tight tracking-tight text-white sm:text-5xl">
          Transforme tes idées en <span className="text-gradient">images</span>
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-sm text-zinc-400 sm:text-base">
          Décris simplement ce que tu imagines. L'IA s'occupe du reste. Gratuit, sans compte.
        </p>
      </section>

      {/* PROMPT */}
      <PromptForm
        ref={textareaRef}
        prompt={p.prompt}
        onPrompt={p.setPrompt}
        onGenerate={() => doGenerate()}
        onEnhance={doEnhance}
        generating={generating}
        enhancing={enhancing}
        enhanceNote={enhanceNote}
      />

      {/* OPTIONS */}
      <section className="glass rounded-3xl p-4 sm:p-6" aria-label="Options">
        <OptionsPanel
          providers={p.providers}
          model={p.model}
          onModel={p.setModel}
          style={p.style}
          onStyle={p.setStyle}
          format={p.format}
          onFormat={p.setFormat}
          count={p.count}
          onCount={p.setCount}
          seed={seedInput}
          onSeed={setSeedInput}
          disabled={generating}
        />
      </section>

      {error && <ErrorBanner message={error} onClose={() => setError(null)} />}
      {notice && (
        <div className="fade-up rounded-2xl border border-cyan-400/25 bg-cyan-400/10 px-4 py-3 text-sm text-cyan-200">
          ℹ️ {notice}
        </div>
      )}

      {/* RÉSULTAT */}
      {generating && (
        <Loader
          message="Création de ton image..."
          sub={
            p.count > 1
              ? `Image ${progress.current} sur ${progress.total} — le niveau gratuit espace les générations`
              : 'Quelques secondes… (jusqu’à une minute en cas d’affluence)'
          }
        />
      )}
      <ResultView
        results={results}
        busy={generating || enhancing}
        onRegenerate={() => doGenerate()}
        onVariant={() => doGenerate({ forceSeed: Math.floor(Math.random() * 2147483647) })}
        onEditPrompt={focusPrompt}
        onEnhancePrompt={doEnhance}
      />

      {/* GALERIE RÉCENTE */}
      <section aria-label="Tes dernières créations">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">Tes dernières créations</h2>
          {p.gallery.length > 0 && (
            <button
              onClick={p.onSeeAll}
              className="text-sm font-semibold text-violet-300 transition hover:text-violet-200"
            >
              Tout voir →
            </button>
          )}
        </div>
        <GalleryGrid
          items={p.gallery.slice(0, 4)}
          onRegenerate={(item) => {
            p.setPrompt(item.prompt);
            window.scrollTo({ top: 0, behavior: 'smooth' });
            doGenerate({ promptOverride: item.prompt });
          }}
          onDelete={p.onDeleteGalleryItem}
        />
      </section>
    </div>
  );
}
