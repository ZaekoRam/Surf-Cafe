import Link from 'next/link';

import { FrogMascot } from '@/components/brand/frog-mascot';

export default function NotFound() {
  return (
    <div className="container flex min-h-screen flex-col items-center justify-center gap-6 text-center">
      <FrogMascot state="inspecting" size={160} />

      <p className="font-mono text-xs uppercase tracking-[0.4em] text-surf-green">error 404</p>

      <h1 className="font-display text-4xl font-black uppercase md:text-6xl">
        Esta ruta no existe
      </h1>

      <p className="max-w-md text-muted-foreground">
        La rana buscó por todo el taller y no encontró esta página.
      </p>

      <Link href="/" className="btn-neon">
        Volver al inicio
      </Link>
    </div>
  );
}
