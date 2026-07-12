export default function AdminLoading() {
  return (
    <main className="grid min-h-screen place-items-center bg-[#080a0d] px-5 text-white">
      <div className="text-center" role="status" aria-live="polite">
        <span className="mx-auto block h-9 w-9 animate-spin rounded-full border-2 border-white/15 border-t-emerald-400" />
        <p className="mt-4 text-sm text-zinc-400">Caricamento area riservata…</p>
      </div>
    </main>
  );
}
