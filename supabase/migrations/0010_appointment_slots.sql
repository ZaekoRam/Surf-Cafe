-- =====================================================================
-- Citas públicas: consultar horarios ocupados sin exponer datos de otros
-- clientes (sep-2026)
-- =====================================================================
-- El formulario público de /citas necesita saber qué horarios ya están
-- tomados en una fecha para no dejar agendar encima (la tabla ya tiene
-- `unique (date, time_slot)`, pero sin esto el cliente no ve cuáles picar
-- hasta que le rebota el insert). Las policies normales de `appointments`
-- (0001_init.sql) NO dejan `select` público a propósito — expondría
-- nombre/teléfono de otros clientes.
--
-- Mismo patrón que `get_repair_by_tracking_code` (0002): una función
-- `security definer` que solo regresa lo mínimo indispensable —aquí,
-- nada más el `time_slot`, ni siquiera a quién pertenece.

create or replace function get_taken_appointment_slots(p_date date)
returns setof text
language sql
stable
security definer
set search_path = public
as $$
  select time_slot from appointments
  where date = p_date and status <> 'cancelada';
$$;

grant execute on function get_taken_appointment_slots(date) to anon, authenticated;
