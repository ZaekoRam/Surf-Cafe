-- =====================================================================
-- Crear el perfil automáticamente cuando se crea un usuario en Auth
-- =====================================================================
-- `profiles` y `auth.users` son tablas separadas a propósito (Supabase no
-- deja tocar `auth.users` directamente). Sin este trigger, crear un
-- usuario en Authentication → Users NO deja ninguna fila en `profiles` —
-- se descubrió esto al crear el primer usuario admin manualmente.
--
-- Este trigger corre justo después de cada alta en `auth.users` y crea su
-- fila espejo en `profiles`, con `role = 'customer'` por default (el rol
-- se sube a mano después, ver el paso 3 de DEPLOY_HOSTINGER.md).

create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();
