interface Props {
  page: 'create' | 'gallery';
  onNavigate: (page: 'create' | 'gallery') => void;
  quotaRemaining: number | null;
  galleryCount: number;
}

export default function Header({ page, onNavigate, quotaRemaining, galleryCount }: Props) {
  return (
    <header className="sticky top-0 z-40 border-b border-violet-500/10 bg-[#07070f]/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
        <button
          onClick={() => onNavigate('create')}
          className="flex items-center gap-2.5 text-left"
          aria-label="Accueil CheDo Image AI"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-cyan-400 text-lg font-black text-white shadow-lg shadow-violet-500/30">
            C
          </span>
          <span className="leading-tight">
            <span className="block text-base font-bold tracking-tight text-white">
              CheDo <span className="text-gradient">Image AI</span>
            </span>
            <span className="hidden text-[11px] text-zinc-400 sm:block">
              Crée tes images avec l'IA
            </span>
          </span>
        </button>

        <nav className="flex items-center gap-2">
          {quotaRemaining !== null && (
            <span
              className="mr-1 hidden rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1.5 text-xs font-medium text-cyan-300 md:block"
              title="Limite anti-abus par heure sur ce serveur"
            >
              Générations disponibles : {quotaRemaining}
            </span>
          )}
          <button
            onClick={() => onNavigate('create')}
            className={`rounded-xl px-3.5 py-2.5 text-sm font-semibold transition sm:px-4 ${
              page === 'create'
                ? 'bg-violet-500/20 text-violet-200 ring-1 ring-violet-400/40'
                : 'text-zinc-300 hover:bg-white/5'
            }`}
          >
            Créer une image
          </button>
          <button
            onClick={() => onNavigate('gallery')}
            className={`rounded-xl px-3.5 py-2.5 text-sm font-semibold transition sm:px-4 ${
              page === 'gallery'
                ? 'bg-violet-500/20 text-violet-200 ring-1 ring-violet-400/40'
                : 'text-zinc-300 hover:bg-white/5'
            }`}
          >
            Mes créations
            {galleryCount > 0 && (
              <span className="ml-1.5 rounded-full bg-violet-500/30 px-1.5 py-0.5 text-[10px] text-violet-200">
                {galleryCount}
              </span>
            )}
          </button>
        </nav>
      </div>
    </header>
  );
}
