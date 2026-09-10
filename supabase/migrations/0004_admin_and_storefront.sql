-- =====================================================================
-- Panel amigable + tienda auto-actualizable (sep-2026)
-- =====================================================================
-- El cliente es perezoso para actualizar catálogo. Para que valga la pena
-- mantenerlo, el panel tiene que ser fácil y lo que suba tiene que
-- reflejarse en la tienda sin recompilar el sitio. Esta migración agrega
-- lo que le faltaba al modelo para eso:
--
--   1. Categorías con nombres de tienda de verdad (gráficas, componentes,
--      almacenamiento...) en vez de las 5 genéricas de arranque.
--   2. Condición del producto: nuevo / usado / reacondicionado.
--   3. Etiquetas libres (`tags`): "envío gratis", "última pieza", etc.
--   4. Bucket de Storage para subir fotos de producto desde el panel
--      (antes solo se podían pegar URLs).

-- ---------- 1. Categorías nuevas ----------
-- La tabla `products` está vacía, así que se puede rehacer el enum limpio
-- (con datos habría que migrar valor por valor).
drop index if exists products_category_idx;
alter table products drop column category;
drop type product_category;

create type product_category as enum (
  'computadoras',       -- PCs armadas, laptops, all-in-one
  'tarjetas-graficas',  -- GPUs
  'componentes',        -- CPU, RAM, tarjetas madre, fuentes, gabinetes, coolers
  'almacenamiento',     -- SSD, HDD, USB
  'perifericos',        -- teclado, mouse, monitor, audio, sillas
  'redes',              -- routers, adaptadores, cable
  'consumibles',        -- pasta térmica, aire comprimido, kits de limpieza
  'software',           -- licencias, sistemas operativos
  'otros'
);

alter table products add column category product_category not null default 'otros';
create index products_category_idx on products (category) where status = 'active';

-- ---------- 2. Condición ----------
create type product_condition as enum ('nuevo', 'usado', 'reacondicionado');
alter table products add column condition product_condition not null default 'nuevo';

-- ---------- 3. Etiquetas libres ----------
alter table products add column tags text[] not null default '{}';

-- ---------- 4. Storage de fotos de producto ----------
-- Bucket público (cualquiera ve las fotos en la tienda); solo staff sube,
-- reemplaza o borra. Las políticas van sobre storage.objects, que ya trae
-- RLS activo por defecto en Supabase.
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

create policy "fotos de producto: lectura publica"
  on storage.objects for select
  using (bucket_id = 'product-images');

create policy "fotos de producto: staff sube"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'product-images' and public.is_staff());

create policy "fotos de producto: staff reemplaza"
  on storage.objects for update to authenticated
  using (bucket_id = 'product-images' and public.is_staff());

create policy "fotos de producto: staff borra"
  on storage.objects for delete to authenticated
  using (bucket_id = 'product-images' and public.is_staff());

-- Nota: las notas del timeline de reparación (lo que ve el cliente en
-- /rastreo) NO necesitan cambio de esquema — `repairs.timeline` ya es
-- jsonb. Lo que faltaba era la UI en el panel para escribirlas, y eso va
-- en el código (RepairDetailDialog / RepairIntakeDialog).
