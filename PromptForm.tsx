import { forwardRef } from 'react';
import { EXAMPLE_PROMPT } from '../config/presets';

interface Props {
  prompt: string;
  onPrompt: (v: string) => void;
  onGenerate: () => void;
  onEnhance: () => void;
  generating: boolean;
  enhancing: boolean;
  enhanceNote: string | null;
}

const PromptForm = forwardRef<HTMLTextAreaElement, Props>(function PromptForm(
  { prompt, onPrompt, onGenerate, onEnhance, generating, enhancing, enhanceNote },
  ref
) {
  return (
    <div className="glass rounded-3xl p-4 sm:p-6">
      <label htmlFor="prompt" className="sr-only">
        Décris l'image à créer
      </label>
      <textarea
        id="prompt"
        ref={ref}
        value={prompt}
        onChange={(e) => onPrompt(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) onGenerate();
        }}
        rows={4}
        maxLength={2000}
        placeholder={`Décris ce que tu imagines…\nEx : ${EXAMPLE_PROMPT}`}
        className="w-full resize-y rounded-2xl border border-violet-500/20 bg-[#0c0c1a] px-4 py-3.5 text-[15px] leading-relaxed text-white placeholder-zinc-500 outline-none transition focus:border-violet-400/60 focus:ring-2 focus:ring-violet-500/20"
      />
      {enhanceNote && (
        <p className="fade-up mt-2 rounded-xl bg-violet-500/10 px-3 py-2 text-xs text-violet-200">
          {enhanceNote} Tu peux encore modifier le texte avant de générer.
        </p>
      )}
      <div className="mt-3 flex flex-col gap-2.5 sm:flex-row">
        <button
          onClick={onGenerate}
          disabled={generating || enhancing}
          className="glow-btn flex h-13 flex-1 items-center justify-center gap-2 rounded-2xl px-6 py-3.5 text-base font-bold text-white"
        >
          {generating ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              Génération…
            </>
          ) : (
            <>✨ Générer l'image</>
          )}
        </button>
        <button
          onClick={onEnhance}
          disabled={generating || enhancing || !prompt.trim()}
          className="flex items-center justify-center gap-2 rounded-2xl bg-violet-500/15 px-5 py-3.5 text-sm font-semibold text-violet-200 ring-1 ring-violet-400/30 transition hover:bg-violet-500/25 disabled:opacity-50"
        >
          {enhancing ? (
            <>
              <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-violet-300 border-t-transparent" />
              Amélioration…
            </>
          ) : (
            <>✨ Améliorer mon prompt</>
          )}
        </button>
      </div>
      <p className="mt-2.5 text-center text-[11px] text-zinc-500">
        Gratuit · Sans compte · {prompt.length}/2000 caractères
      </p>
    </div>
  );
});

export default PromptForm;
