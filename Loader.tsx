interface Props {
  message?: string;
  sub?: string;
}

export default function Loader({ message = 'Création de ton image...', sub }: Props) {
  return (
    <div className="glass fade-up flex flex-col items-center gap-5 rounded-3xl px-6 py-12 text-center">
      <div className="relative flex h-16 w-16 items-center justify-center">
        <span className="pulse-ring absolute inset-0 rounded-full border-2 border-violet-400/60" />
        <span className="pulse-ring absolute inset-0 rounded-full border-2 border-cyan-400/40 [animation-delay:0.5s]" />
        <span className="flex h-12 w-12 animate-spin items-center justify-center rounded-full border-2 border-violet-400 border-t-transparent" />
        <span className="absolute text-xl">✨</span>
      </div>
      <div>
        <p className="text-base font-semibold text-white">{message}</p>
        {sub && <p className="mt-1 text-sm text-zinc-400">{sub}</p>}
      </div>
      <div className="shimmer h-2 w-48 rounded-full" />
    </div>
  );
}
