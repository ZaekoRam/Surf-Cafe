'use client';

import { Radar } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';

import { cn } from '@/lib/utils';

/**
 * Buscador de codigo de rastreo.
 * Se usa igual en el home (compacto) y en /rastreo (completo).
 */
export function TrackingForm({ compact = false }: { compact?: boolean }) {
  const router = useRouter();
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const clean = code.trim().toUpperCase();

    if (!/^SC-[A-Z0-9]{5,9}$/.test(clean)) {
      setError('El código se ve así: SC-7K2M9Q. Revisa tu comprobante.');
      return;
    }

    setError(null);
    router.push(`/rastreo?code=${encodeURIComponent(clean)}`);
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-md">
      <label
        htmlFor="tracking-code"
        className="hud-label mb-3 block"
      >
        Código de rastreo
      </label>

      <div className="flex gap-2">
        <input
          id="tracking-code"
          name="code"
          value={code}
          onChange={(e) => {
            setCode(e.target.value);
            if (error) setError(null);
          }}
          placeholder="SC-7K2M9Q"
          autoComplete="off"
          spellCheck={false}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? 'tracking-error' : undefined}
          className={cn(
            'clip-hud-sm w-full border bg-surface-metal/70 px-4 py-3 font-mono uppercase tracking-[0.25em] text-foreground placeholder:text-muted-foreground/40',
            error ? 'border-destructive' : 'border-surface-grey focus:border-surf-green'
          )}
        />

        <button type="submit" className="btn-neon shrink-0 px-5">
          <Radar className="h-4 w-4" />
          <span className={cn(compact && 'sr-only sm:not-sr-only')}>Rastrear</span>
        </button>
      </div>

      {error && (
        <p id="tracking-error" role="alert" className="mt-2 text-sm text-destructive">
          {error}
        </p>
      )}

      {!error && (
        <p className="mt-2 text-xs text-muted-foreground">
          Lo encuentras en el ticket que te dimos al dejar tu equipo.
        </p>
      )}
    </form>
  );
}
