/**
 * Modelo de dominio de Surf Cafe.
 * Espejo 1:1 de supabase/migrations/0001_init.sql.
 *
 * Cuando el proyecto de Supabase este creado, este archivo se reemplaza por:
 *   npm run db:types
 */

export type UserRole = 'admin' | 'tecnico' | 'customer';

export type ProductCategory =
  | 'computadoras'
  | 'tarjetas-graficas'
  | 'componentes'
  | 'almacenamiento'
  | 'perifericos'
  | 'redes'
  | 'consumibles'
  | 'software'
  | 'otros';

export type ProductCondition = 'nuevo' | 'usado' | 'reacondicionado';

export type ProductStatus = 'draft' | 'active' | 'out_of_stock' | 'archived';

export type RepairStatus =
  | 'recibido'
  | 'diagnostico'
  | 'reparando'
  | 'listo'
  | 'entregado'
  | 'cancelado';

export type AppointmentStatus = 'pendiente' | 'confirmada' | 'atendida' | 'no_asistio' | 'cancelada';

export type OrderStatus = 'pendiente' | 'pagado' | 'enviado' | 'entregado' | 'cancelado';

export interface Profile {
  id: string; // = auth.users.id
  email: string;
  full_name: string | null;
  phone: string | null;
  role: UserRole;
  avatar_url: string | null;
  created_at: string;
}

export interface Product {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  /** Ficha tecnica libre: { "socket": "AM5", "tdp": "105W" } */
  specs: Record<string, string> | null;
  brand: string | null;
  price: number;
  compare_at_price: number | null;
  stock: number;
  category: ProductCategory;
  condition: ProductCondition;
  /** Etiquetas libres para la tarjeta: "envío gratis", "última pieza"... */
  tags: string[];
  images_urls: string[];
  status: ProductStatus;
  featured: boolean;
  created_at: string;
  updated_at: string;
}

/** Etiqueta legible de cada categoría, para selects y filtros de la tienda. */
export const productCategoryMeta: Record<ProductCategory, string> = {
  computadoras: 'Computadoras y laptops',
  'tarjetas-graficas': 'Tarjetas gráficas',
  componentes: 'Componentes',
  almacenamiento: 'Almacenamiento',
  perifericos: 'Periféricos',
  redes: 'Redes',
  consumibles: 'Consumibles y limpieza',
  software: 'Software y licencias',
  otros: 'Otros',
};

/** Orden en que aparecen las categorías en la tienda y el panel. */
export const productCategories = Object.keys(productCategoryMeta) as ProductCategory[];

export const productConditionMeta: Record<ProductCondition, string> = {
  nuevo: 'Nuevo',
  usado: 'Usado',
  reacondicionado: 'Reacondicionado',
};

export interface Repair {
  id: string;
  /** SC-7K2M9Q — lo que el cliente teclea en /rastreo */
  tracking_code: string;
  customer_id: string | null;
  customer_name: string;
  customer_phone: string;
  customer_email: string | null;
  device_type: string;
  device_model: string | null;
  service_type: string;
  reported_issues: string[];
  status: RepairStatus;
  estimated_cost: number | null;
  final_cost: number | null;
  /** Notas internas: NO se muestran al cliente. */
  notes: string | null;
  /** Bitacora publica que el cliente ve en /rastreo. */
  timeline: RepairEvent[];
  technician_id: string | null;
  received_at: string;
  promised_at: string | null;
  delivered_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface RepairEvent {
  status: RepairStatus;
  at: string;
  note?: string;
}

export type WorkshopVideoSource = 'upload' | 'youtube';

export interface WorkshopVideoRow {
  id: string;
  title: string;
  description: string | null;
  /** Misma etiqueta que src/config/workshop.ts: "#Ensambles", "#Mantenimiento"... */
  tag: string;
  source_type: WorkshopVideoSource;
  /** URL pública del Storage (upload) o URL de YouTube. */
  video_url: string;
  /** id de YouTube para el embed; null si es archivo subido. */
  youtube_id: string | null;
  poster_url: string | null;
  /** true = Short/Reel 9:16; false = video horizontal 16:9. */
  is_vertical: boolean;
  sort_order: number;
  published: boolean;
  created_at: string;
  updated_at: string;
}

export interface Appointment {
  id: string;
  customer_name: string;
  customer_email: string | null;
  customer_phone: string;
  service_type: string;
  device_type: string;
  date: string; // YYYY-MM-DD
  time_slot: string; // "10:00"
  /** true = pasamos por el equipo; false = el cliente lo lleva. */
  home_pickup: boolean;
  address: string | null;
  estimated_cost: number | null;
  status: AppointmentStatus;
  notes: string | null;
  created_at: string;
}

export interface Order {
  id: string;
  order_number: string;
  customer_id: string | null;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  items: OrderItem[];
  subtotal: number;
  shipping: number;
  total: number;
  status: OrderStatus;
  payment_method: string | null;
  created_at: string;
}

export interface OrderItem {
  product_id: string;
  title: string;
  price: number;
  quantity: number;
  image_url: string | null;
}

/** Etiquetas y color de cada estado, para HUD y Kanban. */
export const repairStatusMeta: Record<
  RepairStatus,
  { label: string; short: string; tone: 'cyan' | 'yellow' | 'green' | 'grey' | 'red'; step: number }
> = {
  recibido: { label: 'Equipo recibido', short: 'Recibido', tone: 'cyan', step: 1 },
  diagnostico: { label: 'En diagnóstico', short: 'Diagnóstico', tone: 'cyan', step: 2 },
  reparando: { label: 'En reparación', short: 'Reparando', tone: 'yellow', step: 3 },
  listo: { label: 'Listo para recoger', short: 'Listo', tone: 'green', step: 4 },
  entregado: { label: 'Entregado', short: 'Entregado', tone: 'grey', step: 5 },
  cancelado: { label: 'Cancelado', short: 'Cancelado', tone: 'red', step: 0 },
};

/** Columnas del tablero Kanban del admin, en orden. */
export const kanbanColumns: RepairStatus[] = [
  'recibido',
  'diagnostico',
  'reparando',
  'listo',
  'entregado',
];
