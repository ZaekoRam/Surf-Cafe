import type { SupabaseClient } from '@supabase/supabase-js';

import type {
  Appointment,
  Product,
  ProductCategory,
  ProductCondition,
  Repair,
  RepairEvent,
  RepairStatus,
  WorkshopVideoRow,
  WorkshopVideoSource,
} from '@/types/database';

/**
 * Consultas a Supabase, compartidas entre el cliente de build
 * (`static.ts`, para el catálogo público que se hornea en `next build`) y
 * el cliente del navegador (`client.ts`, para /rastreo y todo /admin).
 * Reciben el `SupabaseClient` ya armado en vez de crearlo ellas mismas,
 * para no acoplarse a uno solo de los dos.
 *
 * Las funciones marcadas "Staff" dependen de las políticas RLS de
 * `is_staff()` (ver supabase/migrations/0001_init.sql) — solo devuelven
 * datos completos si quien llama tiene una sesión de Supabase Auth con
 * `profiles.role` en ('admin', 'tecnico'). Sin sesión de staff, Postgres
 * las responde como si el usuario fuera público (por eso el panel admin
 * necesita el login real de Supabase Auth, no solo la cortina vieja).
 */

// ---------------------------------------------------------------------------
// Público — catálogo
// ---------------------------------------------------------------------------

export async function fetchFeaturedProducts(
  supabase: SupabaseClient,
  limit = 4
): Promise<Product[]> {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('status', 'active')
    .eq('featured', true)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('fetchFeaturedProducts', error.message);
    return [];
  }
  return (data as Product[]) ?? [];
}

export async function fetchActiveProducts(
  supabase: SupabaseClient,
  category?: ProductCategory | 'todo'
): Promise<Product[]> {
  let query = supabase
    .from('products')
    .select('*')
    .eq('status', 'active')
    .order('created_at', { ascending: false });

  if (category && category !== 'todo') {
    query = query.eq('category', category);
  }

  const { data, error } = await query;
  if (error) {
    console.error('fetchActiveProducts', error.message);
    return [];
  }
  return (data as Product[]) ?? [];
}

export async function fetchProductBySlug(
  supabase: SupabaseClient,
  slug: string
): Promise<Product | null> {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'active')
    .maybeSingle();

  if (error) {
    console.error('fetchProductBySlug', error.message);
    return null;
  }
  return data as Product | null;
}

// ---------------------------------------------------------------------------
// Público — rastreo (sin sesión, vía funcion security definer)
// ---------------------------------------------------------------------------

/** Forma que devuelve `get_repair_by_tracking_code` — ver 0002_public_tracking.sql. */
export type PublicRepair = Pick<
  Repair,
  | 'tracking_code'
  | 'device_type'
  | 'device_model'
  | 'service_type'
  | 'reported_issues'
  | 'status'
  | 'estimated_cost'
  | 'final_cost'
  | 'timeline'
  | 'received_at'
  | 'promised_at'
  | 'delivered_at'
>;

export async function fetchRepairByTrackingCode(
  supabase: SupabaseClient,
  code: string
): Promise<PublicRepair | null> {
  const { data, error } = await supabase
    .rpc('get_repair_by_tracking_code', { code })
    .maybeSingle();

  if (error) {
    console.error('fetchRepairByTrackingCode', error.message);
    return null;
  }
  return data as PublicRepair | null;
}

// ---------------------------------------------------------------------------
// Staff — productos
// ---------------------------------------------------------------------------

/** A diferencia de `fetchActiveProducts`, trae TODOS los estados (draft, out_of_stock...). */
export async function fetchAllProductsStaff(supabase: SupabaseClient): Promise<Product[]> {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('fetchAllProductsStaff', error.message);
    return [];
  }
  return (data as Product[]) ?? [];
}

export interface ProductWriteValues {
  title: string;
  description: string | null;
  brand: string | null;
  category: ProductCategory;
  condition: ProductCondition;
  price: number;
  compare_at_price: number | null;
  stock: number;
  images_urls: string[];
  tags: string[];
  specs: Record<string, string> | null;
  featured: boolean;
  /** true -> visible en la tienda; false -> guardado como borrador. */
  visible: boolean;
}

/** Traduce los valores del formulario a las columnas reales de `products`. */
function toProductRow(values: ProductWriteValues) {
  const { visible, ...rest } = values;
  return { ...rest, status: visible ? 'active' : 'draft' };
}

export async function insertProductStaff(
  supabase: SupabaseClient,
  values: ProductWriteValues & { slug: string }
): Promise<Product> {
  const { slug, ...writeValues } = values;
  const { data, error } = await supabase
    .from('products')
    .insert({ ...toProductRow(writeValues), slug })
    .select()
    .single();

  if (error) {
    console.error('insertProductStaff', error.message);
    throw error;
  }
  return data as Product;
}

export async function updateProductStaff(
  supabase: SupabaseClient,
  id: string,
  values: ProductWriteValues
): Promise<Product> {
  const { data, error } = await supabase
    .from('products')
    .update(toProductRow(values))
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('updateProductStaff', error.message);
    throw error;
  }
  return data as Product;
}

// ---------------------------------------------------------------------------
// Staff — fotos de producto (Supabase Storage)
// ---------------------------------------------------------------------------

/** Sube un archivo al bucket `product-images` y regresa su URL pública. */
export async function uploadProductImage(
  supabase: SupabaseClient,
  file: File
): Promise<string> {
  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
  const path = `${crypto.randomUUID()}.${ext}`;

  const { error } = await supabase.storage
    .from('product-images')
    .upload(path, file, { contentType: file.type || 'image/jpeg', upsert: false });

  if (error) {
    console.error('uploadProductImage', error.message);
    throw error;
  }

  const { data } = supabase.storage.from('product-images').getPublicUrl(path);
  return data.publicUrl;
}

// ---------------------------------------------------------------------------
// Staff — reparaciones
// ---------------------------------------------------------------------------

export async function fetchAllRepairsStaff(supabase: SupabaseClient): Promise<Repair[]> {
  const { data, error } = await supabase
    .from('repairs')
    .select('*')
    .order('received_at', { ascending: false });

  if (error) {
    console.error('fetchAllRepairsStaff', error.message);
    return [];
  }
  return (data as Repair[]) ?? [];
}

/** Cambio rápido de estado (arrastre en el Kanban) — sin nota. */
export async function updateRepairStatusStaff(
  supabase: SupabaseClient,
  id: string,
  status: RepairStatus
): Promise<void> {
  const { error } = await supabase.from('repairs').update({ status }).eq('id', id);
  if (error) {
    console.error('updateRepairStatusStaff', error.message);
    throw error;
  }
}

export interface RepairIntakeValues {
  customer_name: string;
  customer_phone: string;
  customer_email: string | null;
  device_type: string;
  device_model: string | null;
  service_type: string;
  reported_issues: string[];
  estimated_cost: number | null;
  promised_at: string | null;
  notes: string | null;
}

/**
 * Registra un equipo nuevo. Genera el código de rastreo aquí (el `tracking_code`
 * lo pasa quien llama, con `generateTrackingCode()`), y siembra el primer
 * evento del timeline en "recibido".
 */
export async function insertRepairStaff(
  supabase: SupabaseClient,
  values: RepairIntakeValues & { tracking_code: string }
): Promise<Repair> {
  const now = new Date().toISOString();
  const firstEvent: RepairEvent = {
    status: 'recibido',
    at: now,
    note: 'Equipo recibido en mostrador.',
  };

  const { data, error } = await supabase
    .from('repairs')
    .insert({
      ...values,
      status: 'recibido',
      timeline: [firstEvent],
      received_at: now,
    })
    .select()
    .single();

  if (error) {
    console.error('insertRepairStaff', error.message);
    throw error;
  }
  return data as Repair;
}

export interface RepairUpdateValues {
  status: RepairStatus;
  /** Si viene, se agrega al timeline como evento nuevo con la fecha de ahora. */
  note: string | null;
  estimated_cost: number | null;
  final_cost: number | null;
  promised_at: string | null;
  /** Notas internas — NO se muestran al cliente. */
  internal_notes: string | null;
}

/**
 * Actualiza una reparación desde el detalle del panel. Reconstruye el
 * `timeline` (agregando un evento si hubo nota o cambio de estado) y marca
 * `delivered_at` automáticamente al pasar a "entregado".
 */
export async function updateRepairStaff(
  supabase: SupabaseClient,
  repair: Repair,
  values: RepairUpdateValues
): Promise<Repair> {
  const now = new Date().toISOString();
  const statusChanged = values.status !== repair.status;

  const timeline: RepairEvent[] = [...(repair.timeline ?? [])];
  if (values.note?.trim() || statusChanged) {
    timeline.push({
      status: values.status,
      at: now,
      note: values.note?.trim() || undefined,
    });
  }

  const patch: Record<string, unknown> = {
    status: values.status,
    timeline,
    estimated_cost: values.estimated_cost,
    final_cost: values.final_cost,
    promised_at: values.promised_at,
    notes: values.internal_notes,
  };

  if (values.status === 'entregado' && !repair.delivered_at) {
    patch.delivered_at = now;
  }

  const { data, error } = await supabase
    .from('repairs')
    .update(patch)
    .eq('id', repair.id)
    .select()
    .single();

  if (error) {
    console.error('updateRepairStaff', error.message);
    throw error;
  }
  return data as Repair;
}

// ---------------------------------------------------------------------------
// Staff — citas
// ---------------------------------------------------------------------------

export async function fetchTodayAppointmentsStaff(
  supabase: SupabaseClient
): Promise<Appointment[]> {
  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD, hora local del navegador
  const { data, error } = await supabase
    .from('appointments')
    .select('*')
    .eq('date', today)
    .order('time_slot', { ascending: true });

  if (error) {
    console.error('fetchTodayAppointmentsStaff', error.message);
    return [];
  }
  return (data as Appointment[]) ?? [];
}

// ---------------------------------------------------------------------------
// Staff — ventas de hoy (pedidos reales, no estimados)
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// "El Taller" — videos de la galería del inicio
// ---------------------------------------------------------------------------

export async function fetchPublishedWorkshopVideos(
  supabase: SupabaseClient
): Promise<WorkshopVideoRow[]> {
  const { data, error } = await supabase
    .from('workshop_videos')
    .select('*')
    .eq('published', true)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true });

  if (error) {
    console.error('fetchPublishedWorkshopVideos', error.message);
    return [];
  }
  return (data as WorkshopVideoRow[]) ?? [];
}

export async function fetchAllWorkshopVideosStaff(
  supabase: SupabaseClient
): Promise<WorkshopVideoRow[]> {
  const { data, error } = await supabase
    .from('workshop_videos')
    .select('*')
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true });

  if (error) {
    console.error('fetchAllWorkshopVideosStaff', error.message);
    return [];
  }
  return (data as WorkshopVideoRow[]) ?? [];
}

export interface WorkshopVideoWriteValues {
  title: string;
  description: string | null;
  tag: string;
  source_type: WorkshopVideoSource;
  video_url: string;
  youtube_id: string | null;
  poster_url: string | null;
  is_vertical: boolean;
  sort_order: number;
  published: boolean;
}

export async function insertWorkshopVideoStaff(
  supabase: SupabaseClient,
  values: WorkshopVideoWriteValues
): Promise<WorkshopVideoRow> {
  const { data, error } = await supabase
    .from('workshop_videos')
    .insert(values)
    .select()
    .single();

  if (error) {
    console.error('insertWorkshopVideoStaff', error.message);
    throw error;
  }
  return data as WorkshopVideoRow;
}

export async function updateWorkshopVideoStaff(
  supabase: SupabaseClient,
  id: string,
  values: WorkshopVideoWriteValues
): Promise<WorkshopVideoRow> {
  const { data, error } = await supabase
    .from('workshop_videos')
    .update(values)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('updateWorkshopVideoStaff', error.message);
    throw error;
  }
  return data as WorkshopVideoRow;
}

export async function deleteWorkshopVideoStaff(
  supabase: SupabaseClient,
  id: string
): Promise<void> {
  const { error } = await supabase.from('workshop_videos').delete().eq('id', id);
  if (error) {
    console.error('deleteWorkshopVideoStaff', error.message);
    throw error;
  }
}

/** Sube un archivo de video al bucket `workshop-videos` y regresa su URL pública. */
export async function uploadWorkshopVideo(
  supabase: SupabaseClient,
  file: File
): Promise<string> {
  const ext = file.name.split('.').pop()?.toLowerCase() || 'mp4';
  const path = `${crypto.randomUUID()}.${ext}`;

  const { error } = await supabase.storage
    .from('workshop-videos')
    .upload(path, file, { contentType: file.type || 'video/mp4', upsert: false });

  if (error) {
    console.error('uploadWorkshopVideo', error.message);
    throw error;
  }

  const { data } = supabase.storage.from('workshop-videos').getPublicUrl(path);
  return data.publicUrl;
}

export async function fetchTodayOrdersTotalStaff(supabase: SupabaseClient): Promise<{
  total: number;
  count: number;
}> {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const { data, error } = await supabase
    .from('orders')
    .select('total, status')
    .neq('status', 'cancelado')
    .gte('created_at', startOfDay.toISOString());

  if (error) {
    console.error('fetchTodayOrdersTotalStaff', error.message);
    return { total: 0, count: 0 };
  }

  const rows = data ?? [];
  return {
    total: rows.reduce((sum, r) => sum + Number(r.total), 0),
    count: rows.length,
  };
}
