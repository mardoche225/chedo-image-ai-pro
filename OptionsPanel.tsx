import { useState } from 'react';
import type { ProviderInfo } from '../types';
import { FORMATS, STYLES } from '../config/presets';

interface Props {
  providers: ProviderInfo[];
  model: string;
  onModel: (id: string) => void;
  style: string;
  onStyle: (id: string) => void;
  format: string;
  onFormat: (id: string) => void;
  count: number;
  onCount: (n: number) => void;
  seed: string;
  onSeed: (s: string) => void;
  disabled: boolean;
}

export default function OptionsPanel(p: Props) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const enabledProviders = p.providers.filter((pr) => pr.enabled);
  const current = p.providers.find((pr) => pr.id === p.model);

  return (
    <div className="space-y-5">
      {/* Modèle */}
      <div>
        <label htmlFor="model" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-zinc-400">
          Modèle
        </label>
        <select
          id="model"
          value={p.model}
          onChange={(e) => p.onModel(e.target.value)}
          disabled={p.disabled}
          className="w-full rounded-xl border border-violet-500/20 bg-[#101020] px-3.5 py-3 text-sm text-white outline-none transition focus:border-violet-400/60 focus:ring-2 focus:ring-violet-500/20"
        >
          {enabledProviders.map((pr) => (
            <option key={pr.id} value={pr.id}>
              {pr.name}
              {!pr.available ? ' — indisponible' : ''}
              {pr.remainingToday !== null ? ` (${pr.remainingToday} restantes aujourd'hui)` : ''}
            </option>
          ))}
        </select>
        {current && (
          <p className="mt-1.5 text-[11px] leading-relaxed text-zinc-500">{current.limits}</p>
        )}
      </div>

      {/* Style */}
      <div>
        <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-zinc-400">
          Style
        </span>
        <div className="flex flex-wrap gap-2">
          {STYLES.map((s) => (
            <button
              key={s.id}
              type="button"
              disabled={p.disabled}
              onClick={() => p.onStyle(s.id)}
              className={`rounded-xl px-3 py-2 text-xs font-medium transition ${
                p.style === s.id
                  ? 'bg-violet-500/25 text-violet-100 ring-1 ring-violet-400/60'
                  : 'bg-white/5 text-zinc-300 hover:bg-white/10'
              }`}
            >
              <span aria-hidden className="mr-1">{s.emoji}</span>
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        {/* Format */}
        <div>
          <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-zinc-400">
            Format
          </span>
          <div className="flex flex-wrap gap-2">
            {FORMATS.map((f) => (
              <button
                key={f.id}
                type="button"
                disabled={p.disabled}
                onClick={() => p.onFormat(f.id)}
                title={`${f.width}×${f.height}`}
                className={`rounded-xl px-3 py-2 text-xs font-medium transition ${
                  p.format === f.id
                    ? 'bg-cyan-400/20 text-cyan-100 ring-1 ring-cyan-400/50'
                    : 'bg-white/5 text-zinc-300 hover:bg-white/10'
                }`}
              >
                {f.ratio} <span className="text-zinc-500">· {f.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Nombre d'images */}
        <div>
          <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-zinc-400">
            Nombre d'images
          </span>
          <div className="flex gap-2">
            {[1, 2, 3, 4].map((n) => (
              <button
                key={n}
                type="button"
                disabled={p.disabled}
                onClick={() => p.onCount(n)}
                className={`h-11 w-11 rounded-xl text-sm font-bold transition ${
                  p.count === n
                    ? 'bg-violet-500/25 text-violet-100 ring-1 ring-violet-400/60'
                    : 'bg-white/5 text-zinc-300 hover:bg-white/10'
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Options avancées */}
      <div>
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="text-xs font-semibold text-zinc-400 transition hover:text-violet-300"
        >
          {showAdvanced ? '▾' : '▸'} Options avancées
        </button>
        {showAdvanced && (
          <div className="fade-up mt-3 rounded-xl border border-white/5 bg-white/[0.03] p-4">
            <label htmlFor="seed" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Seed (optionnel — même seed + même prompt ≈ même image)
            </label>
            <input
              id="seed"
              type="number"
              inputMode="numeric"
              min={0}
              max={2147483647}
              placeholder="Aléatoire"
              value={p.seed}
              onChange={(e) => p.onSeed(e.target.value)}
              disabled={p.disabled}
              className="w-full rounded-xl border border-violet-500/20 bg-[#101020] px-3.5 py-2.5 text-sm text-white outline-none focus:border-violet-400/60"
            />
          </div>
        )}
      </div>
    </div>
  );
}
