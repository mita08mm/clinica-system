'use client';

import { useMemo, useState } from 'react';
import PanelFrame, { PanelActionButton } from './PanelFrame';
import { Button, Input, Label, Modal, Spinner, PlusIcon, CloseIcon, BodyStrong, SearchIcon } from '@/shared/ui';
import { usePacienteProtocolos, NuevaPrescripcionItem } from '@/features/pacientes';
import { useProductos } from '@/features/inventario';

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

  const { productos } = useProductos();

  const [showModal, setShowModal] = useState(false);
  const [items, setItems] = useState<NuevaPrescripcionItem[]>([]);
  const [indicaciones, setIndicaciones] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  const [selectedProducto, setSelectedProducto] = useState<{ id: string; nombre: string } | null>(null);
  const [productoQuery, setProductoQuery] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [esExterno, setEsExterno] = useState(false);
  const [nombreExterno, setNombreExterno] = useState('');

  const productosFiltrados = useMemo(
    () => productos.filter((p) =>
      p.nombre.toLowerCase().includes(productoQuery.toLowerCase())
    ),
    [productos, productoQuery],
  );

  const closeModal = () => {
    setShowModal(false);
    setItems([]);
    setIndicaciones('');
    setError('');
    setSelectedProducto(null);
    setProductoQuery('');
    setDropdownOpen(false);
    setEsExterno(false);
    setNombreExterno('');
  };

  const addItem = () => {
    const nombreFinal = esExterno
      ? nombreExterno.trim()
      : selectedProducto?.nombre ?? '';

    if (!nombreFinal || !indicaciones.trim()) {
      setError(!nombreFinal ? 'Seleccioná o ingresá un producto' : 'Ingresá las indicaciones');
      return;
    }

    setItems([...items, { nombre: nombreFinal, indicaciones: indicaciones.trim() }]);
    setSelectedProducto(null);
    setNombreExterno('');
    setEsExterno(false);
    setProductoQuery('');
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
        description="Agrega los productos y sus indicaciones"
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

            {/* ── PRODUCTO: ancho completo ── */}
            <div className="relative">
              <Label required>Producto</Label>

              {/* Caso 1: producto del inventario seleccionado → chip grande */}
              {!esExterno && selectedProducto ? (
                <div className="flex items-center justify-between gap-3 rounded-md border-2 border-neutral-200 bg-neutral-50 px-4 py-3 sm:px-5 sm:py-4">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-neutral-200 bg-white text-lg sm:h-11 sm:w-11 sm:text-xl">
                      📦
                    </div>
                    <span className="truncate text-sm font-semibold text-neutral-900 sm:text-lg">
                      {selectedProducto.nombre}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedProducto(null)}
                    className="shrink-0 rounded-full p-1 text-neutral-400 hover:bg-neutral-200 hover:text-neutral-700"
                  >
                    <CloseIcon className="h-4 w-4" />
                  </button>
                </div>

              /* Caso 2: producto externo → input libre */
              ) : esExterno ? (
                <div className="flex items-center gap-2">
                  <Input
                    autoFocus
                    value={nombreExterno}
                    onChange={(e) => setNombreExterno(e.target.value)}
                    placeholder="Nombre del producto externo"
                    className="flex-1 text-sm sm:text-base"
                  />
                  <button
                    type="button"
                    onClick={() => { setEsExterno(false); setNombreExterno(''); }}
                    className="shrink-0 rounded-full p-1 text-neutral-400 hover:bg-neutral-200 hover:text-neutral-700"
                    title="Cancelar"
                  >
                    <CloseIcon className="h-4 w-4" />
                  </button>
                </div>

              /* Caso 3: buscador del inventario */
              ) : (
                <div className="relative">
                  <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-neutral-400">
                    <SearchIcon className="h-4 w-4" />
                  </span>
                  <Input
                    value={productoQuery}
                    onChange={(e) => { setProductoQuery(e.target.value); setDropdownOpen(true); }}
                    onFocus={() => setDropdownOpen(true)}
                    onBlur={() => setTimeout(() => setDropdownOpen(false), 150)}
                    placeholder="Buscar producto en inventario..."
                    className="pl-9 text-sm sm:text-base"
                    autoComplete="off"
                  />
                  {dropdownOpen && (
                    <div className="absolute z-50 mt-1 w-full overflow-hidden rounded-md border border-neutral-200 bg-white shadow-lg">
                      <p className="px-3 pb-1 pt-2 text-xs font-medium text-neutral-400">
                        Sugerencias del inventario
                      </p>
                      <ul className="max-h-52 overflow-y-auto sm:max-h-48">
                        {productosFiltrados.length === 0 ? (
                          <li className="px-3 py-3 text-sm text-neutral-400">Sin resultados</li>
                        ) : (
                          productosFiltrados.map((p) => (
                            <li key={p.id} className="border-t border-neutral-100 first:border-0">
                              <button
                                type="button"
                                onMouseDown={() => {
                                  setSelectedProducto({ id: p.id, nombre: p.nombre });
                                  setProductoQuery('');
                                  setDropdownOpen(false);
                                }}
                                className="flex w-full items-center gap-3 px-3 py-3 text-left hover:bg-neutral-50 sm:py-2.5"
                              >
                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-neutral-100 sm:h-8 sm:w-8">
                                  <span className="text-base sm:text-sm">📦</span>
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className="truncate text-sm font-semibold text-neutral-900">{p.nombre}</p>
                                  <p className="text-xs text-neutral-400">{p.unidad}</p>
                                </div>
                                <span className={`shrink-0 text-xs font-medium ${p.stock <= p.stockMinimo ? 'text-danger' : 'text-success'}`}>
                                  Stock: {p.stock}
                                </span>
                                <PlusIcon className="h-4 w-4 shrink-0 text-neutral-400" />
                              </button>
                            </li>
                          ))
                        )}
                      </ul>
                      <div className="border-t border-neutral-100">
                        <button
                          type="button"
                          onMouseDown={() => { setEsExterno(true); setDropdownOpen(false); setProductoQuery(''); }}
                          className="flex w-full items-center gap-2 px-3 py-3 text-left text-sm text-[#c8855a] hover:bg-orange-50 sm:py-2.5"
                        >
                          <span className="flex h-4 w-4 items-center justify-center rounded-full border border-current text-xs leading-none">+</span>
                          Agregar producto externo (no está en el inventario)
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* ── INDICACIONES + AGREGAR: columna en mobile, fila en desktop ── */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <div className="flex-1">
                <Label htmlFor="prod-ind" required>Indicaciones</Label>
                <Input
                  id="prod-ind"
                  value={indicaciones}
                  onChange={(e) => setIndicaciones(e.target.value)}
                  placeholder="Ej: Aplicar en la mañana"
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