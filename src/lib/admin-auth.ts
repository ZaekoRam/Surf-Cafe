/**
 * Acceso al panel admin — Supabase Auth real.
 *
 * Antes (Fase 1.5/1.6) esto era una cortina puramente de navegador:
 * credenciales sembradas en variables de entorno, comparadas por hash en
 * el propio JS del bundle. Servía para no toparse con el panel por
 * accidente, pero cualquiera con la URL podía ver el HTML fuente y no
 * había validación real de nada.
 *
 * Ahora sí hay servidor de verdad detrás — no en Hostinger (que sigue
 * sirviendo puro HTML estático, sin PHP/Node), sino en Supabase: el login
 * pasa por `supabase.auth.signInWithPassword`, que valida contra
 * `auth.users` en el proyecto de Postgres, y cada consulta a `products`/
 * `repairs`/`appointments` desde el panel pasa por las políticas RLS
 * (`is_staff()`, ver supabase/migrations/0001_init.sql) — que sí corren en
 * el servidor de Supabase, no en el navegador. Aunque alguien viera el
 * código fuente de `/admin/index.html`, sin una sesión válida con
 * `profiles.role` en ('admin','tecnico') las consultas no devuelven nada.
 *
 * `profiles.role` se sube a mano la primera vez (ver el paso 3 de
 * DEPLOY_HOSTINGER.md) — no hay señal de "quién es admin" dentro del JWT
 * de Supabase Auth por defecto, así que después de iniciar sesión se
 * confirma el rol con una consulta a `profiles`.
 */

import type { Session } from '@supabase/supabase-js';

import { createClient } from '@/lib/supabase/client';

export interface AdminSession {
  email: string;
  role: 'admin' | 'tecnico';
}

/** Revisa la sesión actual de Supabase Auth y confirma que sea staff. */
export async function getAdminSession(): Promise<AdminSession | null> {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  return session ? resolveStaffSession(session) : null;
}

async function resolveStaffSession(session: Session): Promise<AdminSession | null> {
  const supabase = createClient();
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', session.user.id)
    .maybeSingle();

  if (error || !profile || (profile.role !== 'admin' && profile.role !== 'tecnico')) {
    return null;
  }

  return { email: session.user.email ?? '', role: profile.role };
}

/**
 * Inicia sesión y confirma que sea staff. Si el correo/contraseña son
 * válidos en Supabase Auth pero la cuenta no tiene `role` de staff en
 * `profiles`, cierra la sesión de inmediato — no debe quedar "medio
 * autenticado" un cliente normal que se registró para /rastreo o compras.
 */
export async function signInAdmin(
  email: string,
  password: string
): Promise<{ ok: true; session: AdminSession } | { ok: false; error: string }> {
  const supabase = createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error || !data.session) {
    return { ok: false, error: 'Correo o contraseña incorrectos.' };
  }

  const staffSession = await resolveStaffSession(data.session);
  if (!staffSession) {
    await supabase.auth.signOut();
    return { ok: false, error: 'Esta cuenta no tiene permisos de administrador.' };
  }

  return { ok: true, session: staffSession };
}

export async function signOutAdmin(): Promise<void> {
  const supabase = createClient();
  await supabase.auth.signOut();
}
