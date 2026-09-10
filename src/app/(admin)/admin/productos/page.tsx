'use client';

import { Pencil, Plus } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { AdminPage } from '@/components/admin/admin-shell';
import { ProductFormDialog, type ProductFormValues } from '@/components/admin/product-form-dialog';
import { createClient } from '@/lib/supabase/client';
import { fetchAllProductsStaff, insertProductStaff, updateProductStaff } from '@/lib/supabase/queries';
import { errorText, formatMXN, slugify } from '@/lib/utils';
import { productCategoryMeta, type Product } from '@/types/database';

export default function ProductosPage() {
  const [products, setProducts] = useState<Product[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchAllProductsStaff(createClient()).then((data) => {
      if (!cancelled) setProducts(data);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleCreate(values: ProductFormValues) {
    try {
      const created = await insertProductStaff(createClient(), {
        ...values,
        slug: slugify(values.title),
      });
      setProducts((prev) => [created, ...(prev ?? [])]);
      toast.success('Producto creado', { description: values.title });
    } catch (e) {
      toast.error('No se pudo crear el producto', { description: errorText(e) });
    }
  }

  async function handleEdit(id: string, values: ProductFormValues) {
    try {
      const updated = await updateProductStaff(createClient(), id, values);
      setProducts((prev) => (prev ?? []).map((p) => (p.id === id ? updated : p)));
      toast.success('Producto actualizado', { description: values.title });
    } catch (e) {
      toast.error('No se pudo guardar el producto', { description: errorText(e) });
    }
  }

  return (
    <AdminPage
      title="Productos"
      subtitle={products ? `${products.length} en catálogo` : 'Cargando…'}
      actions={
        <ProductFormDialog
          onSubmit={handleCreate}
          trigger={
            <button type="button" className="btn-neon px-5 py-2.5 text-xs">
              <Plus className="h-4 w-4" />
              Nuevo producto
            </button>
          }
        />
      }
    >
      {products === null ? (
        <p className="hud-panel p-8 text-center font-mono text-xs uppercase tracking-[0.3em] text-muted-foreground">
          Cargando productos…
        </p>
      ) : products.length === 0 ? (
        <p className="hud-panel p-12 text-center text-muted-foreground">
          Todavía no hay productos. Da de alta el primero con &ldquo;Nuevo producto&rdquo;.
        </p>
      ) : (
        <div className="hud-panel overflow-x-auto">
          <table className="w-full min-w-[680px] text-sm">
            <thead>
              <tr className="border-b border-surface-grey text-left">
                {['Producto', 'Categoría', 'Precio', 'Stock', 'Estado', ''].map((h) => (
                  <th
                    key={h}
                    className="p-4 font-mono text-[0.6rem] uppercase tracking-[0.25em] text-muted-foreground"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-grey">
              {products.map((p) => (
                <tr key={p.id} className="transition-colors hover:bg-surf-green/5">
                  <td className="p-4 font-medium">
                    {p.title}
                    {p.featured && (
                      <span className="ml-2 font-mono text-[0.55rem] uppercase tracking-widest text-surf-yellow">
                        ★ destacado
                      </span>
                    )}
                  </td>
                  <td className="p-4 text-muted-foreground">{productCategoryMeta[p.category]}</td>
                  <td className="p-4 font-mono text-surf-green">{formatMXN(p.price)}</td>
                  <td className="p-4 font-mono">{p.stock}</td>
                  <td className="p-4">
                    <span className="code-chip">
                      {p.status === 'active' ? 'visible' : p.status}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <ProductFormDialog
                      product={p}
                      onSubmit={(values) => handleEdit(p.id, values)}
                      trigger={
                        <button
                          type="button"
                          aria-label={`Editar ${p.title}`}
                          className="clip-hud-sm border border-surface-grey p-2 text-muted-foreground transition-colors hover:border-surf-green hover:text-surf-green"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                      }
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AdminPage>
  );
}
