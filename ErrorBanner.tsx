interface Props {
  message: string;
  onClose: () => void;
}

export default function ErrorBanner({ message, onClose }: Props) {
  return (
    <div
      role="alert"
      className="fade-up flex items-start justify-between gap-3 rounded-2xl border border-red-400/30 bg-red-500/10 px-4 py-3.5 text-sm text-red-200"
    >
      <span className="flex items-start gap-2.5">
        <span aria-hidden>⚠️</span>
        <span>{message}</span>
      </span>
      <button
        onClick={onClose}
        aria-label="Fermer"
        className="shrink-0 rounded-lg px-2 py-0.5 text-red-300 transition hover:bg-red-400/10"
      >
        ✕
      </button>
    </div>
  );
}
