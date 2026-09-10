-- =====================================================================
-- Rastreo público por código — sin sesión, sin exponer de más
-- =====================================================================
-- `/rastreo` deja que cualquiera con el código (SC-7K2M9Q) consulte el
-- estado de su equipo sin haber iniciado sesión. Las policies normales de
-- `repairs` (0001_init.sql) NO permiten esto — a propósito: exigen ser
-- staff o ser el dueño autenticado del registro.
--
-- La salida es esta función `security definer`: corre con permisos del
-- dueño de la función (se salta RLS por dentro), pero el `returns table`
-- controla exactamente qué columnas salen. Nunca devuelve `notes`
-- (interno), ni customer_name/phone/email, ni el id del técnico — el
-- código es el único "permiso" que hace falta, igual que un número de
-- guía de paquetería.
--
-- Nota de seguridad: esto no tiene rate-limit propio. El espacio de
-- códigos (7 caracteres de un alfabeto de 32, sin I/O/0/1) da ~34 mil
-- millones de combinaciones — impráctico de adivinar a fuerza bruta sin
-- infraestructura dedicada, mismo perfil de riesgo que un tracking number
-- de FedEx/UPS. Si algún día se ve tráfico raro, revisar Supabase →
-- Authentication → Rate Limits.

create or replace function get_repair_by_tracking_code(code text)
returns table (
  tracking_code   text,
  device_type     text,
  device_model    text,
  service_type    text,
  reported_issues text[],
  status          repair_status,
  estimated_cost  numeric,
  final_cost      numeric,
  timeline        jsonb,
  received_at     timestamptz,
  promised_at     timestamptz,
  delivered_at    timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select
    r.tracking_code,
    r.device_type,
    r.device_model,
    r.service_type,
    r.reported_issues,
    r.status,
    r.estimated_cost,
    r.final_cost,
    r.timeline,
    r.received_at,
    r.promised_at,
    r.delivered_at
  from repairs r
  where r.tracking_code = upper(trim(code))
  limit 1;
$$;

-- El cliente del sitio llama esto sin haber iniciado sesión — hay que
-- darle permiso explícito al rol `anon` (así se llama en Supabase el
-- visitante sin autenticar). `authenticated` también, por si algún día
-- un cliente con cuenta usa la misma pantalla.
grant execute on function get_repair_by_tracking_code(text) to anon, authenticated;

-- Se llama desde el navegador así (ver src/lib/supabase/client.ts):
--   const { data, error } = await supabase
--     .rpc('get_repair_by_tracking_code', { code: 'SC-7K2M9Q' })
--     .maybeSingle();
