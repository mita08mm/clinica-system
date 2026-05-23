'use client';

import { useMemo, useState } from 'react';
import PanelFrame, { PanelActionButton } from './PanelFrame';
import { Button, Input, Label, Modal, Spinner } from '@/components/ui';
import { usePacienteCobros, CobroRow } from '@/hooks/usePacienteCobros';

interface PagosHistoryProps {
  pacienteId: string;
}

interface CobroForm {
  titulo: string;
  costo: string;
  pagado: string;
}

const initialForm: CobroForm = { titulo: '', costo: '', pagado: '' };
const fmt = (n: number) => `Bs. ${n.toFixed(2)}`;

export default function PagosHistory({ pacienteId }: PagosHistoryProps) {
  const { cobros, totales, isLoading, error: loadError, crearCobro } = usePacienteCobros(pacienteId);

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
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
        </PanelActionButton>
      }
      contentClassName="px-0 py-0"
    >
      {isLoading ? (
        <div className="flex items-center justify-center py-10">
          <Spinner />
        </div>
      ) : loadError ? (
        <div className="px-5 py-4 text-sm text-[var(--semantic-danger)]">{loadError}</div>
      ) : cobros.length === 0 ? (
        <div className="px-5 py-10 text-center">
          <p className="text-sm font-medium text-[var(--neutral-800)]">Sin cobros registrados</p>
          <p className="mt-1 text-xs text-[var(--neutral-500)]">Usa el botón + para añadir el primero</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-3 divide-x divide-[var(--neutral-100)] border-b border-[var(--neutral-100)] bg-[var(--neutral-25)]">
            <Totals label="Total" value={totales.costoTotal} />
            <Totals label="Pagado" value={totales.pagadoTotal} tone="success" />
            <Totals label="Pendiente" value={totales.pendienteTotal} tone={totales.pendienteTotal > 0 ? 'warning' : 'success'} />
          </div>
          <ul className="divide-y divide-[var(--neutral-100)]">
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
            <Button type="button" variant="outline" onClick={closeModal}>Cancelar</Button>
            <Button type="submit" form="cobro-form" variant="primary" isLoading={isSaving}>
              Guardar
            </Button>
          </>
        }
      >
        <form id="cobro-form" onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-md bg-[var(--semantic-danger-bg)] border border-[rgba(181,58,58,0.2)] px-3 py-2 text-xs text-[var(--semantic-danger)]">
              {error}
            </div>
          )}

          <div>
            <Label htmlFor="titulo" required>Título</Label>
            <Input
              id="titulo"
              value={form.titulo}
              onChange={(e) => setForm({ ...form, titulo: e.target.value })}
              placeholder="Ej: Limpieza facial, sérum reparador"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="costo" required>Costo (Bs.)</Label>
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

          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-[var(--neutral-100)]">
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

function Totals({ label, value, tone }: { label: string; value: number; tone?: 'success' | 'warning' }) {
  const color =
    tone === 'success'
      ? 'text-[var(--semantic-success)]'
      : tone === 'warning'
      ? 'text-[var(--semantic-warning)]'
      : 'text-[var(--neutral-900)]';
  return (
    <div className="px-4 py-3 text-center">
      <p className="overline">{label}</p>
      <p className={`mt-1 font-heading text-base font-medium ${color}`}>{fmt(value)}</p>
    </div>
  );
}

function CobroLi({ cobro }: { cobro: CobroRow }) {
  return (
    <li className="px-5 py-3 flex items-center gap-3">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-[var(--neutral-900)] truncate">{cobro.titulo}</p>
        <p className="mt-0.5 text-[11px] text-[var(--neutral-500)] uppercase tracking-wide">
          {cobro.tipo === 'PRODUCTO' ? 'Producto' : 'Servicio'} · {fmt(cobro.costo)}
        </p>
      </div>
      {cobro.pendiente > 0 ? (
        <div className="text-right">
          <p className="text-xs text-[var(--neutral-500)]">Pendiente</p>
          <p className="text-sm font-semibold text-[var(--semantic-warning)]">{fmt(cobro.pendiente)}</p>
        </div>
      ) : (
        <div className="text-right">
          <p className="text-xs text-[var(--neutral-500)]">Pagado</p>
          <p className="text-sm font-semibold text-[var(--semantic-success)]">{fmt(cobro.pagado)}</p>
        </div>
      )}
    </li>
  );
}

function PreviewRow({ label, value, tone }: { label: string; value: string; tone?: 'success' | 'warning' }) {
  const color =
    tone === 'success'
      ? 'text-[var(--semantic-success)]'
      : tone === 'warning'
      ? 'text-[var(--semantic-warning)]'
      : 'text-[var(--neutral-800)]';
  return (
    <div>
      <p className="overline">{label}</p>
      <p className={`mt-1 text-sm font-semibold ${color}`}>{value}</p>
    </div>
  );
}
