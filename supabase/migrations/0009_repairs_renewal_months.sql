-- =====================================================================
-- Intervalo de renovación por cliente (sep-2026)
-- =====================================================================
-- "Clientes atendidos" (ver 0008_repairs_archive.sql) usaba un umbral fijo
-- para todos (RENEWAL_REMINDER_MONTHS en código) para avisar "le toca
-- renovación". El dueño quiere elegirlo por cliente: a un cliente de
-- limpieza básica le puede tocar cada 3 meses, a otro de mantenimiento
-- profundo cada 12.
--
-- Se guarda en la reparación más reciente de cada cliente (la que ya se
-- usa para calcular "hace cuántos meses fue su última visita" en
-- customer-directory.tsx) — no hay tabla `customers` separada, así que
-- este es el lugar natural. `null` = usa el default global
-- (RENEWAL_REMINDER_MONTHS en src/config/customers.ts).

alter table repairs
  add column renewal_months integer check (renewal_months is null or renewal_months > 0);
