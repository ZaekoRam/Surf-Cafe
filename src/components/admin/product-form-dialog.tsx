'use client';

import * as Dialog from '@radix-ui/react-dialog';
import { ExternalLink, ImagePlus, Plus, Search, Star, X } from 'lucide-react';
import { useEffect, useState, type FormEvent } from 'react';
import { toast } from 'sonner';

import { buildMarketSearchUrl, priceDelta } from '@/lib/market-price';
import { createClient } from '@/lib/supabase/client';
import { uploadProductImage } from '@/lib/supabase/queries';
import { cn, errorText, formatMXN } from '@/lib/utils';
import {
  productCategories,
  productCategoryMeta,
  productConditionMeta,
  type Product,
  type ProductCategory,
  type ProductCondition,
} from '@/types/database';

export interface ProductFormValues {
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
  visible: boolean;
}

/** "Socket: AM5\nTDP: 105W" -> { Socket: "AM5", TDP: "105W" } */
function parseSpecs(text: string): Record<string, string> | null {
  const entries = text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const idx = line.indexOf(':');
      if (idx === -1) return null;
      const key = line.slice(0, idx).trim();
      const value = line.slice(idx + 1).trim();
      return key && value ? ([key, value] as const) : null;
    })
    .filter((x): x is readonly [string, string] => x !== null);

  return entries.length ? Object.fromEntries(entries) : null;
}

function stringifySpecs(specs: Record<string, string> | null | undefined): string {
  if (!specs) return '';
  return Object.entries(specs)
    .map(([key, value]) => `${key}: ${value}`)
    .join('\n');
}

/**
 * Modal de alta/edición de producto. Pensado para que el cliente lo llene
 * rápido: sube fotos arrastrando o pegando una URL, elige categoría y
 * condición de una lista, marca si va en descuento o destacado, y lo que
 * guarde aparece en la tienda al instante (Supabase, sin recompilar).
 * `onSubmit` lo resuelve la página de productos (insert/update real).
 * El comparador de precio de mercado (DDTech/Cyberpuerta) es manual — ver
 * `src/lib/market-price.ts` para por qué no se puede traer en vivo.
 */
export function ProductFormDialog({
  trigger,
  product,
  onSubmit,
}: {
  trigger: React.ReactNode;
  /** Si viene, el diálogo edita ese producto; si no, crea uno nuevo. */
  product?: Product;
  onSubmit: (values: ProductFormValues) => void | Promise<void>;
}) {
  const [open, setOpen] = useState(false);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [brand, setBrand] = useState('');
  const [category, setCategory] = useState<ProductCategory>('otros');
  const [condition, setCondition] = useState<ProductCondition>('nuevo');
  const [price, setPrice] = useState('');
  const [compareAt, setCompareAt] = useState('');
  const [stock, setStock] = useState('');
  const [tags, setTags] = useState('');
  const [specsText, setSpecsText] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [imageUrlDraft, setImageUrlDraft] = useState('');
  const [featured, setFeatured] = useState(false);
  const [visible, setVisible] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Comparador de mercado — solo vive mientras el diálogo está abierto.
  const [ddtechPrice, setDdtechPrice] = useState('');
  const [cyberpuertaPrice, setCyberpuertaPrice] = useState('');

  useEffect(() => {
    if (!open) return;
    setTitle(product?.title ?? '');
    setDescription(product?.description ?? '');
    setBrand(product?.brand ?? '');
    setCategory(product?.category ?? 'otros');
    setCondition(product?.condition ?? 'nuevo');
    setPrice(product?.price?.toString() ?? '');
    setCompareAt(product?.compare_at_price?.toString() ?? '');
    setStock(product?.stock?.toString() ?? '');
    setTags((product?.tags ?? []).join(', '));
    setSpecsText(stringifySpecs(product?.specs));
    setImages(product?.images_urls ?? []);
    setImageUrlDraft('');
    setFeatured(product?.featured ?? false);
    setVisible(product ? product.status === 'active' : true);
    setDdtechPrice('');
    setCyberpuertaPrice('');
  }, [open, product]);

  const ownPrice = Number(price) || 0;
  const compareNum = compareAt ? Number(compareAt) : null;
  const discountPct =
    compareNum && compareNum > ownPrice ? Math.round((1 - ownPrice / compareNum) * 100) : null;
  const ddtechDelta = priceDelta(ownPrice, ddtechPrice ? Number(ddtechPrice) : null);
  const cyberpuertaDelta = priceDelta(ownPrice, cyberpuertaPrice ? Number(cyberpuertaPrice) : null);

  async function handleFiles(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;
    setUploading(true);
    try {
      const supabase = createClient();
      const uploaded: string[] = [];
      for (const file of Array.from(fileList)) {
        uploaded.push(await uploadProductImage(supabase, file));
      }
      setImages((prev) => [...prev, ...uploaded]);
    } catch (e) {
      toast.error('No se pudo subir la foto', { description: errorText(e) });
    } finally {
      setUploading(false);
    }
  }

  function addImageUrl() {
    const url = imageUrlDraft.trim();
    if (!url) return;
    setImages((prev) => (prev.includes(url) ? prev : [...prev, url]));
    setImageUrlDraft('');
  }

  function removeImage(url: string) {
    setImages((prev) => prev.filter((u) => u !== url));
  }

  function makePrimary(url: string) {
    setImages((prev) => [url, ...prev.filter((u) => u !== url)]);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!title.trim() || !price) return;

    setSaving(true);
    try {
      await onSubmit({
        title: title.trim(),
        description: description.trim() || null,
        brand: brand.trim() || null,
        category,
        condition,
        price: Number(price),
        compare_at_price: compareNum && compareNum > 0 ? compareNum : null,
        stock: Number(stock) || 0,
        images_urls: images,
        tags: tags
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean),
        specs: parseSpecs(specsText),
        featured,
        visible,
      });
      setOpen(false);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>{trigger}</Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[70] bg-surface-deep/80 backdrop-blur-sm data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=closed]:animate-out data-[state=closed]:fade-out-0" />

        <Dialog.Content className="glass-strong fixed left-1/2 top-1/2 z-[71] max-h-[90vh] w-[calc(100%-2rem)] max-w-2xl -translate-x-1/2 -translate-y-1/2 overflow-y-auto border border-surf-green/30 p-0 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95">
          <form onSubmit={handleSubmit}>
            <header className="glass-strong sticky top-0 z-10 flex items-center justify-between border-b border-surface-grey p-6">
              <div>
                <Dialog.Title className="font-display text-lg font-bold uppercase tracking-widest text-surf-green">
                  {product ? 'Editar producto' : 'Nuevo producto'}
                </Dialog.Title>
                <Dialog.Description className="mt-1 text-xs text-muted-foreground">
                  Se guarda directo en Supabase — aparece en la tienda al instante.
                </Dialog.Description>
              </div>
              <Dialog.Close asChild>
                <button
                  type="button"
                  aria-label="Cerrar"
                  className="p-2 text-muted-foreground transition-colors hover:text-surf-green"
                >
                  <X className="h-5 w-5" />
                </button>
              </Dialog.Close>
            </header>

            <div className="space-y-6 p-6">
              {/* ---- Datos del producto ---- */}
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Título" className="sm:col-span-2">
                  <input
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="admin-input"
                    placeholder="Tarjeta de Video ASUS RTX 4060 Dual OC 8GB"
                  />
                </Field>

                <Field label="Descripción" className="sm:col-span-2">
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    className="admin-input resize-y"
                    placeholder="Para qué sirve, qué incluye, garantía…"
                  />
                </Field>

                <Field label="Marca">
                  <input
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    className="admin-input"
                    placeholder="ASUS"
                  />
                </Field>

                <Field label="Categoría">
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as ProductCategory)}
                    className="admin-input"
                  >
                    {productCategories.map((c) => (
                      <option key={c} value={c}>
                        {productCategoryMeta[c]}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="Condición">
                  <select
                    value={condition}
                    onChange={(e) => setCondition(e.target.value as ProductCondition)}
                    className="admin-input"
                  >
                    {(Object.keys(productConditionMeta) as ProductCondition[]).map((c) => (
                      <option key={c} value={c}>
                        {productConditionMeta[c]}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="Stock">
                  <input
                    type="number"
                    min={0}
                    step="1"
                    value={stock}
                    onChange={(e) => setStock(e.target.value)}
                    className="admin-input"
                    placeholder="6"
                  />
                </Field>

                <Field label="Precio (MXN)">
                  <input
                    required
                    type="number"
                    min={0}
                    step="1"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="admin-input"
                    placeholder="8499"
                  />
                </Field>

                <Field label="Precio de lista (opcional)">
                  <input
                    type="number"
                    min={0}
                    step="1"
                    value={compareAt}
                    onChange={(e) => setCompareAt(e.target.value)}
                    className="admin-input"
                    placeholder="9999"
                  />
                  <span className="mt-1 block font-mono text-[0.6rem] text-muted-foreground">
                    {discountPct
                      ? `Se muestra como −${discountPct}% de descuento`
                      : 'Si es mayor al precio, se muestra tachado y con % de descuento'}
                  </span>
                </Field>

                <Field label="Etiquetas" className="sm:col-span-2">
                  <input
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                    className="admin-input"
                    placeholder="envío gratis, última pieza, edición limitada"
                  />
                  <span className="mt-1 block font-mono text-[0.6rem] text-muted-foreground">
                    Sepáralas con comas. Salen como chips en la tarjeta y la ficha.
                  </span>
                </Field>
              </div>

              {/* ---- Fotos ---- */}
              <div className="border-t border-surface-grey pt-6">
                <div className="mb-1 flex items-center gap-2">
                  <ImagePlus className="h-4 w-4 text-surf-cyan" />
                  <h3 className="font-display text-xs font-bold uppercase tracking-[0.2em] text-surf-cyan">
                    Fotos
                  </h3>
                </div>
                <p className="mb-4 text-xs text-muted-foreground">
                  Sube archivos desde tu compu o pega la URL de una imagen. La primera es la
                  principal (toca la estrella para cambiarla).
                </p>

                <div className="flex flex-wrap items-center gap-3">
                  <label className="clip-hud-sm inline-flex cursor-pointer items-center gap-2 border border-surf-green/50 bg-surf-green/10 px-4 py-2.5 font-display text-xs font-bold uppercase tracking-widest text-surf-green transition-colors hover:bg-surf-green hover:text-surface-deep">
                    <ImagePlus className="h-4 w-4" />
                    {uploading ? 'Subiendo…' : 'Subir fotos'}
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      disabled={uploading}
                      onChange={(e) => {
                        void handleFiles(e.target.files);
                        e.target.value = '';
                      }}
                    />
                  </label>

                  <div className="flex flex-1 items-center gap-2">
                    <input
                      type="url"
                      value={imageUrlDraft}
                      onChange={(e) => setImageUrlDraft(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addImageUrl();
                        }
                      }}
                      className="admin-input flex-1"
                      placeholder="https://…/foto.jpg"
                    />
                    <button
                      type="button"
                      onClick={addImageUrl}
                      className="clip-hud-sm shrink-0 border border-surface-grey px-3 py-2.5 font-display text-xs font-bold uppercase tracking-widest text-foreground/70 hover:border-surf-green hover:text-surf-green"
                    >
                      Agregar
                    </button>
                  </div>
                </div>

                {images.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-3">
                    {images.map((url, i) => (
                      <div
                        key={url}
                        className={cn(
                          'group relative h-20 w-20 overflow-hidden border',
                          i === 0 ? 'border-surf-green' : 'border-surface-grey'
                        )}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={url} alt="" className="h-full w-full object-cover" />
                        <div className="absolute inset-0 flex items-center justify-center gap-1 bg-surface-deep/70 opacity-0 transition-opacity group-hover:opacity-100">
                          {i !== 0 && (
                            <button
                              type="button"
                              onClick={() => makePrimary(url)}
                              aria-label="Hacer principal"
                              className="p-1 text-surf-yellow hover:text-white"
                            >
                              <Star className="h-4 w-4" />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => removeImage(url)}
                            aria-label="Quitar foto"
                            className="p-1 text-destructive hover:text-white"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                        {i === 0 && (
                          <span className="absolute bottom-0 left-0 right-0 bg-surf-green/90 py-0.5 text-center font-mono text-[0.5rem] uppercase tracking-widest text-surface-deep">
                            Principal
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* ---- Ficha técnica ---- */}
              <div className="border-t border-surface-grey pt-6">
                <Field label="Ficha técnica (opcional)">
                  <textarea
                    value={specsText}
                    onChange={(e) => setSpecsText(e.target.value)}
                    rows={4}
                    className="admin-input resize-y font-mono text-xs"
                    placeholder={'Memoria: 8 GB GDDR6\nInterfaz: PCIe 4.0\nSalidas: 3x DP, 1x HDMI'}
                  />
                  <span className="mt-1 block font-mono text-[0.6rem] text-muted-foreground">
                    Una por línea, en formato <b>Clave: Valor</b>.
                  </span>
                </Field>
              </div>

              {/* ---- Visibilidad ---- */}
              <div className="flex flex-wrap gap-6 border-t border-surface-grey pt-6">
                <label className="flex cursor-pointer items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={visible}
                    onChange={(e) => setVisible(e.target.checked)}
                    className="h-4 w-4 accent-surf-green"
                  />
                  Visible en la tienda
                </label>
                <label className="flex cursor-pointer items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={featured}
                    onChange={(e) => setFeatured(e.target.checked)}
                    className="h-4 w-4 accent-surf-green"
                  />
                  Destacado en el inicio
                </label>
              </div>

              {/* ---- Comparador de precio de mercado ---- */}
              <div className="border-t border-surface-grey pt-6">
                <div className="mb-1 flex items-center gap-2">
                  <Search className="h-4 w-4 text-surf-cyan" />
                  <h3 className="font-display text-xs font-bold uppercase tracking-[0.2em] text-surf-cyan">
                    Precio de referencia en el mercado
                  </h3>
                </div>
                <p className="mb-4 text-xs text-muted-foreground">
                  Abre la búsqueda, anota lo que veas y compara contra tu precio. Esto NO se trae
                  solo — no hay forma de leer esos sitios en vivo desde un sitio estático.
                </p>

                <div className="grid gap-4 sm:grid-cols-2">
                  <MarketPriceField
                    retailer="ddtech"
                    label="DDTech"
                    query={title}
                    value={ddtechPrice}
                    onChange={setDdtechPrice}
                    delta={ddtechDelta}
                  />
                  <MarketPriceField
                    retailer="cyberpuerta"
                    label="Cyberpuerta"
                    query={title}
                    value={cyberpuertaPrice}
                    onChange={setCyberpuertaPrice}
                    delta={cyberpuertaDelta}
                  />
                </div>
              </div>
            </div>

            <footer className="glass-strong sticky bottom-0 z-10 flex justify-end gap-3 border-t border-surface-grey p-6">
              <Dialog.Close asChild>
                <button
                  type="button"
                  className="px-5 py-2.5 font-display text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground"
                >
                  Cancelar
                </button>
              </Dialog.Close>
              <button
                type="submit"
                disabled={saving || uploading}
                className={cn(
                  'btn-neon px-5 py-2.5 text-xs',
                  (saving || uploading) && 'pointer-events-none opacity-60'
                )}
              >
                <Plus className="h-4 w-4" />
                {saving ? 'Guardando…' : product ? 'Guardar cambios' : 'Crear producto'}
              </button>
            </footer>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function Field({
  label,
  className,
  children,
}: {
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <label className={cn('block', className)}>
      <span className="hud-label mb-2 block">{label}</span>
      {children}
    </label>
  );
}

function MarketPriceField({
  retailer,
  label,
  query,
  value,
  onChange,
  delta,
}: {
  retailer: 'ddtech' | 'cyberpuerta';
  label: string;
  query: string;
  value: string;
  onChange: (v: string) => void;
  delta: { diff: number; pct: number } | null;
}) {
  return (
    <div className="clip-hud-sm border border-surface-grey bg-surface-metal/50 p-3">
      <div className="mb-2 flex items-center justify-between">
        <span className="font-display text-xs font-bold uppercase tracking-widest">{label}</span>
        <a
          href={buildMarketSearchUrl(retailer, query || label)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 font-mono text-[0.6rem] uppercase tracking-widest text-surf-cyan hover:underline"
        >
          Buscar
          <ExternalLink className="h-3 w-3" />
        </a>
      </div>

      <input
        type="number"
        min={0}
        step="1"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Precio visto"
        className="admin-input"
      />

      {delta && (
        <p
          className={cn(
            'mt-2 font-mono text-[0.65rem]',
            delta.diff <= 0 ? 'text-surf-green' : 'text-surf-yellow'
          )}
        >
          {delta.diff <= 0 ? 'Más barato por ' : 'Más caro por '}
          {formatMXN(Math.abs(delta.diff))} ({delta.pct > 0 ? '+' : ''}
          {delta.pct.toFixed(0)}%)
        </p>
      )}
    </div>
  );
}
