import { useCallback, useEffect, useState } from 'react';
import type { GalleryItem, ProviderInfo } from './types';
import { fetchStatus } from './services/api';
import { loadGallery, removeFromGallery, loadPrefs, savePrefs } from './utils/storage';
import Header from './components/Header';
import HomePage from './pages/HomePage';
import GalleryPage from './pages/GalleryPage';

export default function App() {
  const prefs = loadPrefs();
  const [page, setPage] = useState<'create' | 'gallery'>('create');
  const [providers, setProviders] = useState<ProviderInfo[]>([]);
  const [quotaRemaining, setQuotaRemaining] = useState<number | null>(null);
  const [gallery, setGallery] = useState<GalleryItem[]>(() => loadGallery());
  const [prompt, setPrompt] = useState('');

  const [model, setModel] = useState(prefs.model || 'pollinations-flux');
  const [style, setStyle] = useState(prefs.style || 'none');
  const [format, setFormat] = useState(prefs.format || '1:1');
  const [count, setCount] = useState(prefs.count || 1);

  const refreshStatus = useCallback(async () => {
    try {
      const status = await fetchStatus();
      setProviders(status.providers);
      setQuotaRemaining(status.quota.remaining);
      // Si le modèle préféré n'est pas activé sur ce serveur, bascule sur le premier dispo.
      setModel((m) =>
        status.providers.some((p) => p.id === m && p.enabled)
          ? m
          : status.providers.find((p) => p.enabled)?.id || m
      );
    } catch {
      /* le backend est peut-être en cours de démarrage */
    }
  }, []);

  useEffect(() => {
    refreshStatus();
  }, [refreshStatus]);

  // Sauvegarde des préférences (mode invité — localStorage uniquement)
  useEffect(() => {
    savePrefs({ model, style, format, count });
  }, [model, style, format, count]);

  const deleteItem = (id: string) => setGallery(removeFromGallery(id));

  return (
    <div className="min-h-dvh">
      <Header
        page={page}
        onNavigate={setPage}
        quotaRemaining={quotaRemaining}
        galleryCount={gallery.length}
      />

      {quotaRemaining !== null && (
        <p className="mx-auto mt-3 block w-fit rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-[11px] text-cyan-300 md:hidden">
          Générations disponibles : {quotaRemaining}
        </p>
      )}

      {page === 'create' ? (
        <HomePage
          providers={providers}
          model={model}
          setModel={setModel}
          style={style}
          setStyle={setStyle}
          format={format}
          setFormat={setFormat}
          count={count}
          setCount={setCount}
          gallery={gallery}
          setGallery={setGallery}
          setQuotaRemaining={setQuotaRemaining}
          refreshStatus={refreshStatus}
          onDeleteGalleryItem={deleteItem}
          onSeeAll={() => setPage('gallery')}
          prompt={prompt}
          setPrompt={setPrompt}
        />
      ) : (
        <GalleryPage
          items={gallery}
          onDelete={deleteItem}
          onRegenerate={(item) => {
            setPrompt(item.prompt);
            setPage('create');
            window.scrollTo({ top: 0 });
          }}
        />
      )}

      <footer className="border-t border-white/5 px-4 py-6 text-center text-[11px] text-zinc-500">
        CheDo Image AI — génération gratuite via des APIs publiques (Pollinations.ai, et plus si
        configuré). Les limites des niveaux gratuits s'appliquent. Aucune donnée n'est stockée côté
        serveur.
      </footer>
    </div>
  );
}
