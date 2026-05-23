'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Badge, Spinner } from '@/components/ui';
import { useProductos, type Producto, type ProductoTipo } from '@/hooks/useProductos';
import { useDebounce } from '@/hooks/useDebounce';
import { formatMonto } from '@/lib/utils/money';

const TIPO_LABELS: Record<ProductoTipo, string> = {
  COSMECEUTICO: 'Cosmecéutico',
  DERMOCOSMETICO: 'Dermocosmético',
  EQUIPO: 'Equipo',
  INSUMO: 'Insumo',
};

export default function InventarioPage() {
  const { productos, isLoading, error, actualizarStock } = useProductos();
  const [query, setQuery] = useState('');
  const [filterTipo, setFilterTipo] = useState<'' | ProductoTipo>('');
  const [soloBajoStock, setSoloBajoStock] = useState(false);
  const [editing, setEditing] = useState<{ id: string; value: string } | null>(null);
  const debounced = useDebounce(query, 200);

  const filtrados = useMemo(() => {
    const q = debounced.trim().toLowerCase();
    return productos.filter((p) => {
      const matchQ =
        !q || p.nombre.toLowerCase().includes(q) || p.descripcion?.toLowerCase().includes(q);
      const matchTipo = !filterTipo || p.tipo === filterTipo;
      const matchStock = !soloBajoStock || p.stock <= p.stockMinimo;
      return matchQ && matchTipo && matchStock;
    });
  }, [productos, debounced, filterTipo, soloBajoStock]);

  const alertas = useMemo(
    () => productos.filter((p) => p.stock <= p.stockMinimo),
    [productos]
  );
  const valorInventario = useMemo(
    () => productos.reduce((sum, p) => sum + p.precio * p.stock, 0),
    [productos]
  );

  const handleSaveStock = async () => {
    if (!editing) return;
    const value = parseInt(editing.value, 10);
    if (isNaN(value) || value < 0) return;
    try {
      await actualizarStock(editing.id, value);
      setEditing(null);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="max-w-6xl">
          <header className="flex flex-wrap items-end justify-between gap-4 mb-6">
            <div>
              <p className="overline">Stock</p>
              <h1 className="font-heading text-2xl font-medium text-[var(--neutral-900)] mt-1">
                Inventario
              </h1>
              <p className="text-sm text-[var(--neutral-500)] mt-0.5">
                {productos.length} productos · {formatMonto(valorInventario)} en stock
              </p>
            </div>
            <Link
              href="/inventario/nuevo"
              className="inline-flex items-center gap-2 h-10 px-4 rounded-md bg-[var(--brand-morena)] text-white text-sm font-medium hover:bg-[var(--brand-morena-dark)] transition-colors shadow-[var(--shadow-xs)]"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Nuevo producto
            </Link>
          </header>

          {/* Alertas */}
          {alertas.length > 0 && (
            <div className="mb-5 rounded-md border border-[rgba(192,138,46,0.25)] bg-[var(--semantic-warning-bg)] px-4 py-3">
              <p className="text-sm font-medium text-[var(--semantic-warning)]">
                {alertas.length} producto{alertas.length !== 1 ? 's' : ''} con stock bajo
              </p>
              <p className="text-xs text-[var(--neutral-600)] mt-0.5 truncate">
                {alertas.map((p) => p.nombre).join(' · ')}
              </p>
            </div>
          )}

          {/* Filtros */}
          <div className="flex flex-wrap items-center gap-3 mb-5">
            <div className="relative flex-1 min-w-[220px] max-w-md">
              <svg
                className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--neutral-400)] pointer-events-none"
                fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
              </svg>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar productos..."
                className="w-full h-10 pl-10 pr-3 rounded-md border border-[var(--neutral-300)] bg-white text-sm text-[var(--neutral-800)] placeholder:text-[var(--neutral-400)] focus:outline-none focus:border-[var(--brand-morena)] focus:ring-[3px] focus:ring-[rgba(117,76,36,0.12)] transition-colors"
              />
            </div>
            <select
              value={filterTipo}
              onChange={(e) => setFilterTipo(e.target.value as '' | ProductoTipo)}
              className="h-10 px-3 rounded-md border border-[var(--neutral-300)] bg-white text-sm text-[var(--neutral-800)] focus:outline-none focus:border-[var(--brand-morena)]"
            >
              <option value="">Todos los tipos</option>
              {(Object.entries(TIPO_LABELS) as [ProductoTipo, string][]).map(([k, label]) => (
                <option key={k} value={k}>{label}</option>
              ))}
            </select>
            <button
              onClick={() => setSoloBajoStock((s) => !s)}
              className={`h-10 px-3 rounded-md text-xs font-medium transition-colors ${
                soloBajoStock
                  ? 'bg-[var(--semantic-warning-bg)] text-[var(--semantic-warning)] border border-[rgba(192,138,46,0.3)]'
                  : 'bg-white text-[var(--neutral-600)] border border-[var(--neutral-300)] hover:text-[var(--neutral-900)]'
              }`}
            >
              {soloBajoStock ? '✓ Stock bajo' : 'Stock bajo'}
            </button>
            <span className="text-xs text-[var(--neutral-500)] tabular-nums ml-auto">
              {isLoading ? '—' : `${filtrados.length} ${filtrados.length === 1 ? 'producto' : 'productos'}`}
            </span>
          </div>

          {error && (
            <div className="mb-4 rounded-md border border-[rgba(181,58,58,0.2)] bg-[var(--semantic-danger-bg)] px-4 py-3 text-sm text-[var(--semantic-danger)]">
              {error}
            </div>
          )}

          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Spinner size="lg" />
            </div>
          ) : filtrados.length === 0 ? (
            <EmptyInventario tieneFiltro={!!query || !!filterTipo || soloBajoStock} />
          ) : (
            <div className="rounded-[var(--radius-lg)] border border-[var(--neutral-200)] bg-white overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[var(--neutral-200)] bg-[var(--neutral-25)]">
                    {[
                      { label: 'Producto', align: 'left' },
                      { label: 'Tipo', align: 'left' },
                      { label: 'Precio', align: 'right' },
                      { label: 'Stock', align: 'center' },
                      { label: 'Valor', align: 'right' },
                      { label: '', align: 'right' },
                    ].map((c) => (
                      <th
                        key={c.label || 'acciones'}
                        className={`px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--neutral-500)] text-${c.align}`}
                      >
                        {c.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--neutral-100)]">
                  {filtrados.map((p) => (
                    <ProductoRow
                      key={p.id}
                      producto={p}
                      editing={editing?.id === p.id ? editing : null}
                      onEdit={(value) => setEditing({ id: p.id, value })}
                      onChange={(value) => setEditing({ id: p.id, value })}
                      onCancel={() => setEditing(null)}
                      onSave={handleSaveStock}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}

function ProductoRow({
  producto,
  editing,
  onEdit,
  onChange,
  onCancel,
  onSave,
}: {
  producto: Producto;
  editing: { id: string; value: string } | null;
  onEdit: (value: string) => void;
  onChange: (value: string) => void;
  onCancel: () => void;
  onSave: () => void;
}) {
  const stockBajo = producto.stock <= producto.stockMinimo;
  return (
    <tr className="hover:bg-[var(--neutral-25)] transition-colors group">
      <td className="px-4 py-3">
        <p className="text-sm font-medium text-[var(--neutral-900)]">{producto.nombre}</p>
        {producto.descripcion && (
          <p className="text-xs text-[var(--neutral-500)] mt-0.5 truncate max-w-xs">
            {producto.descripcion}
          </p>
        )}
      </td>
      <td className="px-4 py-3">
        <Badge variant="default">{TIPO_LABELS[producto.tipo]}</Badge>
      </td>
      <td className="px-4 py-3 text-right">
        <p className="text-sm text-[var(--neutral-800)] tabular-nums">
          {formatMonto(producto.precio)}
        </p>
        <p className="text-xs text-[var(--neutral-500)]">/ {producto.unidad}</p>
      </td>
      <td className="px-4 py-3 text-center">
        {editing ? (
          <div className="inline-flex items-center gap-1">
            <input
              type="number"
              value={editing.value}
              onChange={(e) => onChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') onSave();
                if (e.key === 'Escape') onCancel();
              }}
              className="w-16 h-7 px-2 text-center text-sm border border-[var(--brand-morena)] rounded focus:outline-none"
              autoFocus
            />
            <button
              onClick={onSave}
              className="h-7 w-7 inline-flex items-center justify-center rounded text-[var(--semantic-success)] hover:bg-[var(--semantic-success-bg)]"
              aria-label="Guardar"
            >
              ✓
            </button>
            <button
              onClick={onCancel}
              className="h-7 w-7 inline-flex items-center justify-center rounded text-[var(--neutral-500)] hover:bg-[var(--neutral-100)]"
              aria-label="Cancelar"
            >
              ✕
            </button>
          </div>
        ) : (
          <button
            onClick={() => onEdit(producto.stock.toString())}
            className={`text-sm font-medium tabular-nums hover:underline ${
              stockBajo ? 'text-[var(--semantic-danger)]' : 'text-[var(--neutral-800)]'
            }`}
          >
            {producto.stock} {producto.unidad}
            {stockBajo && (
              <span className="block text-[10px] text-[var(--neutral-500)] mt-0.5">
                mín {producto.stockMinimo}
              </span>
            )}
          </button>
        )}
      </td>
      <td className="px-4 py-3 text-right text-sm font-medium text-[var(--neutral-800)] tabular-nums">
        {formatMonto(producto.precio * producto.stock)}
      </td>
      <td className="px-4 py-3 text-right">
        <Link
          href={`/inventario/${producto.id}/editar`}
          className="inline-flex items-center h-7 px-2.5 rounded-md text-xs font-medium text-[var(--brand-morena)] hover:bg-[rgba(204,175,125,0.18)] transition-colors opacity-0 group-hover:opacity-100"
        >
          Editar
        </Link>
      </td>
    </tr>
  );
}

function EmptyInventario({ tieneFiltro }: { tieneFiltro: boolean }) {
  return (
    <div className="rounded-[var(--radius-lg)] border border-dashed border-[var(--neutral-300)] bg-white px-6 py-16 text-center">
      <p className="text-sm font-medium text-[var(--neutral-800)]">
        {tieneFiltro ? 'Sin resultados' : 'Sin productos registrados'}
      </p>
      <p className="mt-1 text-xs text-[var(--neutral-500)]">
        {tieneFiltro
          ? 'Ajusta los filtros para ver más productos'
          : 'Agrega el primer producto para comenzar tu inventario'}
      </p>
      {!tieneFiltro && (
        <Link
          href="/inventario/nuevo"
          className="mt-5 inline-flex items-center gap-1.5 h-9 px-4 rounded-md bg-[var(--brand-morena)] text-white text-sm font-medium hover:bg-[var(--brand-morena-dark)] transition-colors"
        >
          Crear primer producto
        </Link>
      )}
    </div>
  );
}
