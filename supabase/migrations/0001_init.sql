-- =====================================================================
-- Surf Cafe PC Store — esquema inicial
-- Espejo de src/types/database.ts
-- =====================================================================

create extension if not exists "pgcrypto";

-- ---------- Enums ----------
create type user_role as enum ('admin', 'tecnico', 'customer');
create type product_category as enum ('hardware', 'perifericos', 'software', 'pc-armadas', 'consumibles');
create type product_status as enum ('draft', 'active', 'out_of_stock', 'archived');
create type repair_status as enum ('recibido', 'diagnostico', 'reparando', 'listo', 'entregado', 'cancelado');
create type appointment_status as enum ('pendiente', 'confirmada', 'atendida', 'no_asistio', 'cancelada');
create type order_status as enum ('pendiente', 'pagado', 'enviado', 'entregado', 'cancelado');

-- ---------- Perfiles ----------
-- auth.users guarda credenciales; aqui va todo lo demas.
create table profiles (
  id          uuid primary key references auth.users on delete cascade,
  email       text not null,
  full_name   text,
  phone       text,
  role        user_role not null default 'customer',
  avatar_url  text,
  created_at  timestamptz not null default now()
);

-- ---------- Productos ----------
create table products (
  id                uuid primary key default gen_random_uuid(),
  slug              text not null unique,
  title             text not null,
  description       text,
  specs             jsonb default '{}'::jsonb,
  brand             text,
  price             numeric(10,2) not null check (price >= 0),
  compare_at_price  numeric(10,2) check (compare_at_price >= price),
  stock             integer not null default 0 check (stock >= 0),
  category          product_category not null,
  images_urls       text[] not null default '{}',
  status            product_status not null default 'draft',
  featured          boolean not null default false,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index products_category_idx on products (category) where status = 'active';
create index products_featured_idx on products (featured) where status = 'active';

-- ---------- Reparaciones ----------
create table repairs (
  id              uuid primary key default gen_random_uuid(),
  tracking_code   text not null unique,
  customer_id     uuid references profiles on delete set null,
  customer_name   text not null,
  customer_phone  text not null,
  customer_email  text,
  device_type     text not null,
  device_model    text,
  service_type    text not null,
  reported_issues text[] not null default '{}',
  status          repair_status not null default 'recibido',
  estimated_cost  numeric(10,2),
  final_cost      numeric(10,2),
  notes           text,                       -- interno: nunca se expone al cliente
  timeline        jsonb not null default '[]'::jsonb,
  technician_id   uuid references profiles on delete set null,
  received_at     timestamptz not null default now(),
  promised_at     timestamptz,
  delivered_at    timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index repairs_status_idx on repairs (status);
create index repairs_tracking_idx on repairs (tracking_code);

-- ---------- Citas ----------
create table appointments (
  id              uuid primary key default gen_random_uuid(),
  customer_name   text not null,
  customer_email  text,
  customer_phone  text not null,
  service_type    text not null,
  device_type     text not null,
  date            date not null,
  time_slot       text not null,
  home_pickup     boolean not null default false,
  address         text,
  estimated_cost  numeric(10,2),
  status          appointment_status not null default 'pendiente',
  notes           text,
  created_at      timestamptz not null default now(),
  -- Un solo equipo por horario: evita empalmes en el taller.
  unique (date, time_slot)
);

create index appointments_date_idx on appointments (date);

-- ---------- Pedidos ----------
create table orders (
  id              uuid primary key default gen_random_uuid(),
  order_number    text not null unique,
  customer_id     uuid references profiles on delete set null,
  customer_name   text not null,
  customer_email  text not null,
  customer_phone  text not null,
  items           jsonb not null,
  subtotal        numeric(10,2) not null,
  shipping        numeric(10,2) not null default 0,
  total           numeric(10,2) not null,
  status          order_status not null default 'pendiente',
  payment_method  text,
  created_at      timestamptz not null default now()
);

-- =====================================================================
-- updated_at automatico
-- =====================================================================
create or replace function touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger products_touch before update on products
  for each row execute function touch_updated_at();

create trigger repairs_touch before update on repairs
  for each row execute function touch_updated_at();

-- =====================================================================
-- Row Level Security
-- La regla de oro: el cliente solo ve lo suyo; el staff ve todo.
-- =====================================================================
alter table profiles     enable row level security;
alter table products     enable row level security;
alter table repairs      enable row level security;
alter table appointments enable row level security;
alter table orders       enable row level security;

-- Helper: ¿el usuario actual es staff?
create or replace function is_staff()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from profiles
    where id = auth.uid() and role in ('admin', 'tecnico')
  );
$$;

-- Perfiles
create policy "perfil propio" on profiles
  for select using (id = auth.uid() or is_staff());
create policy "editar perfil propio" on profiles
  for update using (id = auth.uid());

-- Productos: catalogo publico, escritura solo staff
create policy "catalogo publico" on products
  for select using (status = 'active' or is_staff());
create policy "staff administra productos" on products
  for all using (is_staff()) with check (is_staff());

-- Reparaciones
-- OJO: la consulta publica por tracking_code NO pasa por aqui.
-- Se hace con una funcion security definer que devuelve solo los campos
-- publicos (sin `notes` ni telefono). Ver 0002_public_tracking.sql.
create policy "staff ve reparaciones" on repairs
  for all using (is_staff()) with check (is_staff());
create policy "cliente ve sus reparaciones" on repairs
  for select using (customer_id = auth.uid());

-- Citas: cualquiera puede agendar; solo staff lee y modifica.
create policy "agendar cita" on appointments
  for insert with check (true);
create policy "staff administra citas" on appointments
  for all using (is_staff()) with check (is_staff());

-- Pedidos
create policy "cliente ve sus pedidos" on orders
  for select using (customer_id = auth.uid() or is_staff());
create policy "staff administra pedidos" on orders
  for all using (is_staff()) with check (is_staff());
