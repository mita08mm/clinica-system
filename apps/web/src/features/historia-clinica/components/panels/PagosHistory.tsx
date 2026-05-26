'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import PanelFrame, { PanelActionButton } from './PanelFrame';
import {
  Button,
  Input,
  Label,
  Modal,
  Spinner,
  PlusIcon,
  BodyStrong,
  Muted,
  Overline,
} from '@/shared/ui';
import { usePacienteCobros, CobroRow } from '@/features/pacientes';
import { useProductos, type Producto } from '@/features/inventario';

// ─── Types ────────────────────────────────────────────────────────────────────

interface PagosHistoryProps {
  pacienteId: string;
}

interface CobroForm {
  titulo: string;
  costo: string;
  pagado: string;
}

// ─── Constants ─────────────────────────────────────────────────────────────────

const initialForm: CobroForm = { titulo: '', costo: '', pagado: '' };
const fmt = (n: number) => `Bs. ${n.toFixed(2)}`;

// ─── ProductoCombobox ──────────────────────────────────────────────────────────

interface ProductoComboboxProps {
  value: string;
  onChange: (value: string) => void;
  onSelect: (producto: Producto) => void;
}

function ProductoCombobox({ value, onChange, onSelect }: ProductoComboboxProps) {
  const { productos, isLoading: isFetching } = useProductos();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Filter by query
  const filtered = useMemo(() => {
    const q = value.trim().toLowerCase();
    if (!q) return productos;
    return productos.filter((p) => p.nombre.toLowerCase().includes(q));
  }, [value, productos]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const showDropdown = isOpen && (isFetching || filtered.length > 0 || value.trim().length > 0);

  return (
    <div ref={containerRef} className="relative">
      <Input
        id="titulo"
        value={value}
        autoComplete="off"
        placeholder="Ej: Limpieza facial, sérum reparador"
        onChange={(e) => {
          onChange(e.target.value);
          setIsOpen(true);
        }}
        onFocus={() => setIsOpen(true)}
      />

      {showDropdown && (
        <div className="absolute z-50 mt-1 w-full overflow-auto rounded-md border border-neutral-200 bg-white shadow-lg max-h-56">
          {isFetching ? (
            <div className="flex items-center justify-center py-4">
              <Spinner />
            </div>
          ) : filtered.length === 0 ? (
            // No match → inform user they can keep typing freely
            <div className="px-3 py-2.5 text-sm text-neutral-500">
              No encontrado en inventario —{' '}
              <span className="text-neutral-700 font-medium">se guardará como texto libre</span>
            </div>
          ) : (
            filtered.map((p) => (
              <button
                key={p.id}
                type="button"
                className="flex w-full items-center justify-between px-3 py-2.5 text-left hover:bg-neutral-50 transition-colors"
                onMouseDown={(e) => {
                  // Prevent input blur before we handle the click
                  e.preventDefault();
                  onSelect(p);
                  setIsOpen(false);
                }}
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-neutral-900">{p.nombre}</p>
                  <p className="text-xs text-neutral-500">
                    {fmt(p.precio)}
                    <span className="mx-1.5">·</span>
                    Stock:{' '}
                    <span className={p.stock === 0 ? 'text-danger font-semibold' : ''}>
                      {p.stock}
                    </span>
                  </p>
                </div>
                <span className="ml-3 shrink-0 text-xs font-semibold text-neutral-400">
                  {fmt(p.precio)}
                </span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

// ─── PagosHistory ──────────────────────────────────────────────────────────────

export default function PagosHistory({ pacienteId }: PagosHistoryProps) {
  const {
    cobros,
    totales,
    isLoading,
    error: loadError,
    crearCobro,
  } = usePacienteCobros(pacienteId);

  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<CobroForm>(initialForm);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  const preview = useMemo(() => {
    const costo = Number(form.costo) || 0;
    const pagado = Number(form.pagado) || 0;
    return { total: costo, pendiente: Math.max(costo - pagado, 0) };
  }, [form.costo, form.pagado]);

  const closeModal = () => {
    setShowModal(false);
    setForm(initialForm);
    setError('');
  };

  // Called when user picks a product from the combobox
  const handleProductoSelect = (producto: Producto) => {
    setForm((prev) => ({
      ...prev,
      titulo: producto.nombre,
      costo: producto.precio.toFixed(2),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const titulo = form.titulo.trim();
    const costo = Number(form.costo);
    const pagado = Number(form.pagado || 0);

    if (!titulo) return setError('Ingrese un título');
    if (Number.isNaN(costo) || costo <= 0) return setError('El costo debe ser mayor a 0');
    if (Number.isNaN(pagado) || pagado < 0) return setError('Lo pagado no puede ser negativo');
    if (pagado > costo) return setError('Lo pagado no puede ser mayor al total');

    try {
      setIsSaving(true);
      setError('');
      await crearCobro({ titulo, costo, pagado });
      closeModal();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar cobro');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <PanelFrame
      title="Cobros"
      description={
        cobros.length === 0
          ? undefined
          : `${cobros.length} ${cobros.length === 1 ? 'registro' : 'registros'}`
      }
      action={
        <PanelActionButton onClick={() => setShowModal(true)} title="Nuevo cobro">
          <PlusIcon className="h-4 w-4" />
        </PanelActionButton>
      }
      contentClassName="px-0 py-0"
    >
      {isLoading ? (
        <div className="flex items-center justify-center py-10">
          <Spinner />
        </div>
      ) : loadError ? (
        <div className="text-danger px-5 py-4 text-sm">{loadError}</div>
      ) : cobros.length === 0 ? (
        <div className="px-5 py-10 text-center">
          <BodyStrong as="p">Sin cobros registrados</BodyStrong>
          <p className="muted mt-1">Usa el botón + para añadir el primero</p>
        </div>
      ) : (
        <>
          <div className="bg-neutral-25 grid grid-cols-3 divide-x divide-neutral-100 border-b border-neutral-100">
            <Totals label="Total" value={totales.costoTotal} />
            <Totals label="Pagado" value={totales.pagadoTotal} tone="success" />
            <Totals
              label="Pendiente"
              value={totales.pendienteTotal}
              tone={totales.pendienteTotal > 0 ? 'warning' : 'success'}
            />
          </div>
          <ul className="divide-y divide-neutral-100">
            {cobros.map((c) => (
              <CobroLi key={c.id} cobro={c} />
            ))}
          </ul>
        </>
      )}

      <Modal
        open={showModal}
        onClose={closeModal}
        title="Nuevo cobro"
        description="Registra un cargo y opcionalmente un pago inicial"
        footer={
          <>
            <Button type="button" variant="outline" onClick={closeModal}>
              Cancelar
            </Button>
            <Button type="submit" form="cobro-form" variant="primary" isLoading={isSaving}>
              Guardar
            </Button>
          </>
        }
      >
        <form id="cobro-form" onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="alert-danger text-xs">{error}</div>}

          {/* ── Título (combobox con inventario) ── */}
          <div>
            <Label htmlFor="titulo" required>
              Título
            </Label>
            <ProductoCombobox
              value={form.titulo}
              onChange={(v) => setForm({ ...form, titulo: v })}
              onSelect={handleProductoSelect}
            />
          </div>

          {/* ── Costo y Pagado ── */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="costo" required>
                Costo (Bs.)
              </Label>
              <Input
                id="costo"
                type="number"
                min="0"
                step="0.01"
                value={form.costo}
                onChange={(e) => setForm({ ...form, costo: e.target.value })}
                placeholder="0.00"
              />
            </div>
            <div>
              <Label htmlFor="pagado">Pagado (Bs.)</Label>
              <Input
                id="pagado"
                type="number"
                min="0"
                step="0.01"
                value={form.pagado}
                onChange={(e) => setForm({ ...form, pagado: e.target.value })}
                placeholder="0.00"
              />
            </div>
          </div>

          {/* ── Preview ── */}
          <div className="grid grid-cols-2 gap-3 border-t border-neutral-100 pt-2">
            <PreviewRow label="Total" value={fmt(preview.total)} />
            <PreviewRow
              label="Pendiente"
              value={fmt(preview.pendiente)}
              tone={preview.pendiente > 0 ? 'warning' : 'success'}
            />
          </div>
        </form>
      </Modal>
    </PanelFrame>
  );
}

// ─── Sub-components (sin cambios) ──────────────────────────────────────────────

function Totals({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone?: 'success' | 'warning';
}) {
  const color =
    tone === 'success' ? 'text-success' : tone === 'warning' ? 'text-warning' : 'text-neutral-900';
  return (
    <div className="px-4 py-3 text-center">
      <Overline>{label}</Overline>
      <p className={`font-heading mt-1 text-base font-medium ${color}`}>{fmt(value)}</p>
    </div>
  );
}

function CobroLi({ cobro }: { cobro: CobroRow }) {
  return (
    <li className="flex items-center gap-3 px-5 py-3">
      <div className="min-w-0 flex-1">
        <p className="body-strong truncate text-neutral-900">{cobro.titulo}</p>
        <p className="mt-0.5 text-[11px] tracking-wide text-neutral-500 uppercase">
          {cobro.tipo === 'PRODUCTO' ? 'Producto' : 'Servicio'} · {fmt(cobro.costo)}
        </p>
      </div>
      {cobro.pendiente > 0 ? (
        <div className="text-right">
          <Muted>Pendiente</Muted>
          <p className="text-warning text-sm font-semibold">{fmt(cobro.pendiente)}</p>
        </div>
      ) : (
        <div className="text-right">
          <Muted>Pagado</Muted>
          <p className="text-success text-sm font-semibold">{fmt(cobro.pagado)}</p>
        </div>
      )}
    </li>
  );
}

function PreviewRow({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: 'success' | 'warning';
}) {
  const color =
    tone === 'success' ? 'text-success' : tone === 'warning' ? 'text-warning' : 'text-neutral-800';
  return (
    <div>
      <Overline>{label}</Overline>
      <p className={`mt-1 text-sm font-semibold ${color}`}>{value}</p>
    </div>
  );
}