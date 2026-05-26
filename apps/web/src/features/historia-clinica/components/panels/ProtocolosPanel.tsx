'use client';

import { useState } from 'react';
import PanelFrame, { PanelActionButton } from './PanelFrame';
import { Button, Input, Label, Modal, Spinner, PlusIcon, CloseIcon, BodyStrong } from '@/shared/ui';
import { usePacienteProtocolos, NuevaPrescripcionItem } from '@/features/pacientes';

interface ProtocolosPanelProps {
  pacienteId: string;
}

export default function ProtocolosPanel({ pacienteId }: ProtocolosPanelProps) {
  const {
    prescripciones,
    isLoading,
    error: loadError,
    crearPrescripcion,
  } = usePacienteProtocolos(pacienteId);

  const [showModal, setShowModal] = useState(false);
  const [items, setItems] = useState<NuevaPrescripcionItem[]>([]);
  const [prescripcion, setPrescripcion] = useState('');
  const [indicaciones, setIndicaciones] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  const closeModal = () => {
    setShowModal(false);
    setItems([]);
    setPrescripcion('');
    setIndicaciones('');
    setError('');
  };

  const addItem = () => {
    if (!prescripcion.trim()) {
      setError('Ingresá la prescripción');
      return;
    }
    if (!indicaciones.trim()) {
      setError('Ingresá las indicaciones');
      return;
    }

    setItems([...items, { nombre: prescripcion.trim(), indicaciones: indicaciones.trim() }]);
    setPrescripcion('');
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
      ) : prescripciones.length === 0 ? (
        <div className="px-5 py-10 text-center">
          <BodyStrong as="p">Sin prescripciones</BodyStrong>
          <p className="muted mt-1">Usa el botón + para agregar la primera</p>
        </div>
      ) : (
        <ul className="divide-y divide-neutral-100">
          {visible.map((p) => (
            <li key={p.id} className="px-4 py-4 sm:px-5">
              <div className="mb-2 flex items-center justify-between gap-3">
                <p className="body-strong truncate text-neutral-900">
                  {p.nombre ?? 'Prescripción'}
                </p>
                <span className="shrink-0 overline">
                  {p.items.length} {p.items.length === 1 ? 'item' : 'items'}
                </span>
              </div>
              <ul className="space-y-1.5 border-l-2 border-neutral-200 pl-3">
                {p.items.map((item) => (
                  <li key={item.id} className="text-xs">
                    <span className="font-medium text-neutral-800">{item.nombre}</span>
                    <span className="text-neutral-500"> — {item.indicaciones}</span>
                  </li>
                ))}
              </ul>
            </li>
          ))}
          {prescripciones.length > visible.length && (
            <li className="px-5 py-3 text-center">
              <button className="text-brand-morena text-xs hover:underline">Ver todas →</button>
            </li>
          )}
        </ul>
      )}

      <Modal
        open={showModal}
        onClose={closeModal}
        title="Nueva prescripción"
        description="Agrega las prescripciones y sus indicaciones"
        footer={
          <>
            <Button type="button" variant="outline" onClick={closeModal} className="flex-1 sm:flex-none">
              Cancelar
            </Button>
            <Button
              type="submit"
              form="prescripcion-form"
              variant="primary"
              isLoading={isSaving}
              disabled={items.length === 0}
              className="flex-1 sm:flex-none"
            >
              Guardar
            </Button>
          </>
        }
      >
        <form id="prescripcion-form" onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="alert-danger text-xs">{error}</div>}

          <div className="space-y-3">
            {/* ── PRESCRIPCIÓN + INDICACIONES + AGREGAR ── */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <div className="flex-1">
                <Label htmlFor="prescripcion" required>Prescripción</Label>
                <Input
                  id="prescripcion"
                  value={prescripcion}
                  onChange={(e) => setPrescripcion(e.target.value)}
                  placeholder="Ej: Vitamina C"
                  className="text-sm sm:text-base"
                />
              </div>
              <div className="flex-1">
                <Label htmlFor="indicaciones" required>Indicaciones</Label>
                <Input
                  id="indicaciones"
                  value={indicaciones}
                  onChange={(e) => setIndicaciones(e.target.value)}
                  placeholder="Ej: Tomar en la mañana"
                  className="text-sm sm:text-base"
                />
              </div>
              <Button
                type="button"
                variant="secondary"
                onClick={addItem}
                className="w-full sm:w-auto"
              >
                Agregar
              </Button>
            </div>
          </div>

          {/* ── LISTA DE ITEMS ── */}
          <section>
            <p className="mb-2 overline">Items ({items.length})</p>
            {items.length === 0 ? (
              <p className="muted italic">Aún no agregaste items.</p>
            ) : (
              <ul className="divide-y divide-neutral-100 overflow-hidden rounded-md border border-neutral-200">
                {items.map((it, i) => (
                  <li key={i} className="flex items-start gap-3 px-3 py-3 sm:py-2">
                    <div className="min-w-0 flex-1">
                      <p className="body-strong truncate text-sm text-neutral-900 sm:text-base">{it.nombre}</p>
                      <p className="text-xs text-neutral-600">{it.indicaciones}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeItem(i)}
                      className="hover:text-danger shrink-0 rounded-full p-1.5 text-neutral-400 transition-colors hover:bg-neutral-100"
                      aria-label="Quitar"
                    >
                      <CloseIcon className="h-4 w-4" />
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