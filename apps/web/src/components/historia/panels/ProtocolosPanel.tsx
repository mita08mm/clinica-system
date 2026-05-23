'use client';

import { useState } from 'react';
import PanelFrame, { PanelActionButton } from './PanelFrame';
import { Button, Input, Label, Modal, Spinner } from '@/components/ui';
import { usePacienteProtocolos, NuevaPrescripcionItem } from '@/hooks/usePacienteProtocolos';

interface ProtocolosPanelProps {
  pacienteId: string;
}

export default function ProtocolosPanel({ pacienteId }: ProtocolosPanelProps) {
  const { prescripciones, isLoading, error: loadError, crearPrescripcion } = usePacienteProtocolos(pacienteId);

  const [showModal, setShowModal] = useState(false);
  const [items, setItems] = useState<NuevaPrescripcionItem[]>([]);
  const [nombre, setNombre] = useState('');
  const [indicaciones, setIndicaciones] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  const closeModal = () => {
    setShowModal(false);
    setItems([]);
    setNombre('');
    setIndicaciones('');
    setError('');
  };

  const addItem = () => {
    if (!nombre.trim() || !indicaciones.trim()) {
      setError('Ingrese nombre e indicaciones');
      return;
    }
    setItems([...items, { nombre: nombre.trim(), indicaciones: indicaciones.trim() }]);
    setNombre('');
    setIndicaciones('');
    setError('');
  };

  const removeItem = (i: number) => setItems(items.filter((_, idx) => idx !== i));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) return setError('Agregue al menos un item');
    try {
      setIsSaving(true);
      setError('');
      await crearPrescripcion(items);
      closeModal();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar prescripción');
    } finally {
      setIsSaving(false);
    }
  };

  const visible = prescripciones.slice(0, 5);

  return (
    <PanelFrame
      title="Prescripciones"
      description={
        prescripciones.length === 0
          ? undefined
          : `${prescripciones.length} ${prescripciones.length === 1 ? 'registro' : 'registros'}`
      }
      action={
        <PanelActionButton onClick={() => setShowModal(true)} title="Nueva prescripción">
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
      ) : prescripciones.length === 0 ? (
        <div className="px-5 py-10 text-center">
          <p className="text-sm font-medium text-[var(--neutral-800)]">Sin prescripciones</p>
          <p className="mt-1 text-xs text-[var(--neutral-500)]">Usa el botón + para agregar la primera</p>
        </div>
      ) : (
        <ul className="divide-y divide-[var(--neutral-100)]">
          {visible.map((p) => (
            <li key={p.id} className="px-5 py-4">
              <div className="flex items-center justify-between gap-3 mb-2">
                <p className="text-sm font-medium text-[var(--neutral-900)] truncate">
                  {p.nombre ?? 'Prescripción'}
                </p>
                <span className="overline shrink-0">
                  {p.items.length} {p.items.length === 1 ? 'item' : 'items'}
                </span>
              </div>
              <ul className="space-y-1.5 pl-3 border-l-2 border-[var(--neutral-200)]">
                {p.items.map((item) => (
                  <li key={item.id} className="text-xs">
                    <span className="font-medium text-[var(--neutral-800)]">{item.nombre}</span>
                    <span className="text-[var(--neutral-500)]"> — {item.indicaciones}</span>
                  </li>
                ))}
              </ul>
            </li>
          ))}
          {prescripciones.length > visible.length && (
            <li className="px-5 py-3 text-center">
              <button className="text-xs text-[var(--brand-morena)] hover:underline">
                Ver todas →
              </button>
            </li>
          )}
        </ul>
      )}

      <Modal
        open={showModal}
        onClose={closeModal}
        title="Nueva prescripción"
        description="Agrega los productos y sus indicaciones"
        footer={
          <>
            <Button type="button" variant="outline" onClick={closeModal}>Cancelar</Button>
            <Button
              type="submit"
              form="prescripcion-form"
              variant="primary"
              isLoading={isSaving}
              disabled={items.length === 0}
            >
              Guardar
            </Button>
          </>
        }
      >
        <form id="prescripcion-form" onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-md bg-[var(--semantic-danger-bg)] border border-[rgba(181,58,58,0.2)] px-3 py-2 text-xs text-[var(--semantic-danger)]">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-[1fr_1.5fr_auto] gap-3 items-end">
            <div>
              <Label htmlFor="prod-nombre" required>Producto</Label>
              <Input
                id="prod-nombre"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Ej: Protector solar"
              />
            </div>
            <div>
              <Label htmlFor="prod-ind" required>Indicaciones</Label>
              <Input
                id="prod-ind"
                value={indicaciones}
                onChange={(e) => setIndicaciones(e.target.value)}
                placeholder="Ej: Aplicar en la mañana"
              />
            </div>
            <Button type="button" variant="secondary" onClick={addItem}>
              Agregar
            </Button>
          </div>

          <section>
            <p className="overline mb-2">Items ({items.length})</p>
            {items.length === 0 ? (
              <p className="text-xs text-[var(--neutral-500)] italic">
                Aún no agregaste items.
              </p>
            ) : (
              <ul className="rounded-md border border-[var(--neutral-200)] divide-y divide-[var(--neutral-100)] overflow-hidden">
                {items.map((it, i) => (
                  <li key={i} className="flex items-start gap-3 px-3 py-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-[var(--neutral-900)] truncate">{it.nombre}</p>
                      <p className="text-xs text-[var(--neutral-600)]">{it.indicaciones}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeItem(i)}
                      className="text-[var(--neutral-400)] hover:text-[var(--semantic-danger)] transition-colors p-1"
                      aria-label="Quitar"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </form>
      </Modal>
    </PanelFrame>
  );
}
