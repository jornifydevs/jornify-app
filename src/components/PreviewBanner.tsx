export function PreviewBanner() {
  if (process.env.VERCEL_ENV !== "preview") return null;

  return (
    <div className="w-full bg-amber-400 text-amber-950 text-center text-sm font-semibold py-1.5 px-4">
      ⚠ Entorno de PRE — conectado a Supabase de pre-producción
    </div>
  );
}
