'use client';

import { Lock } from 'lucide-react';
import { useEffect, useState, type FormEvent } from 'react';

import { FrogMascot } from '@/components/brand/frog-mascot';
import { getAdminSession, signInAdmin, type AdminSession } from '@/lib/admin-auth';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';

/**
 * Puerta de acceso del panel admin — Supabase Auth real (ver
 * `src/lib/admin-auth.ts` para el detalle de cómo valida el rol de staff).
 *
 * El único límite que sigue siendo "de navegador" es este: con
 * `output: 'export'` no hay middleware ni Route Handler que bloquee la
 * descarga de `/admin/index.html` en sí — ese archivo siempre existe en
 * `public_html`. Lo que sí es real ahora es que ese HTML no trae ningún
 * dato de clientes horneado: todo se pide después, en el navegador, con
 * Supabase, y sin sesión de staff las consultas regresan vacías por RLS.
 */
export function AdminGate({ children }: { children: React.ReactNode }) {
  // `null` = todavía no sabemos (evita parpadeo de login antes de checar la sesión)
  const [session, setSession] = useState<AdminSession | null | 'checking'>('checking');

  useEffect(() => {
    let cancelled = false;

    getAdminSession().then((s) => {
      if (!cancelled) setSession(s);
    });

    // Si la sesión expira o se cierra desde otra pestaña, refleja el cambio aquí.
    const supabase = createClient();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, authSession) => {
      if (!authSession) setSession(null);
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  if (session === 'checking') {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <FrogMascot state="idle" size={64} />
      </div>
    );
  }

  if (!session) {
    return <AdminLoginForm onSuccess={setSession} />;
  }

  return <>{children}</>;
}

function AdminLoginForm({ onSuccess }: { onSuccess: (session: AdminSession) => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setChecking(true);
    setError(null);

    const result = await signInAdmin(email, password);
    setChecking(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    onSuccess(result.session);
  }

  return (
    <div className="bg-hud flex min-h-screen items-center justify-center bg-grid-hud px-4">
      <form
        onSubmit={handleSubmit}
        className="hud-panel w-full max-w-sm space-y-6 p-8"
        aria-label="Iniciar sesión de administrador"
      >
        <div className="flex flex-col items-center gap-3 text-center">
          <FrogMascot state="inspecting" size={72} />
          <div>
            <h1 className="font-display text-lg font-black uppercase tracking-widest text-surf-green">
              Panel Surf Cafe
            </h1>
            <p className="mt-1 flex items-center justify-center gap-1.5 font-mono text-[0.65rem] uppercase tracking-[0.25em] text-muted-foreground">
              <Lock className="h-3 w-3" />
              Acceso restringido
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label htmlFor="admin-email" className="hud-label mb-2 block">
              Correo
            </label>
            <input
              id="admin-email"
              type="email"
              required
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="clip-hud-sm w-full border border-surface-grey bg-surface-metal/70 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/40 focus:border-surf-green"
              placeholder="tu@correo.com"
            />
          </div>

          <div>
            <label htmlFor="admin-password" className="hud-label mb-2 block">
              Contraseña
            </label>
            <input
              id="admin-password"
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="clip-hud-sm w-full border border-surface-grey bg-surface-metal/70 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/40 focus:border-surf-green"
              placeholder="••••••••"
            />
          </div>
        </div>

        {error && (
          <p role="alert" className="border-l-2 border-destructive bg-destructive/10 p-3 text-sm">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={checking}
          className={cn('btn-neon w-full justify-center', checking && 'pointer-events-none opacity-60')}
        >
          {checking ? 'Verificando…' : 'Entrar'}
        </button>
      </form>
    </div>
  );
}
