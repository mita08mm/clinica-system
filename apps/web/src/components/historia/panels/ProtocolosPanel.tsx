"use client";

import { useState, useEffect, useCallback } from "react";
import { apiEndpoint } from "@/lib/config";
import { useAuth } from "@/contexts/AuthContext";
import PanelFrame from "@/components/historia/panels/PanelFrame";
import { Button, Input, Label } from "@/components/ui";

interface ProtocolosPanelProps {
  pacienteId: string;
}

interface PrescripcionItem {
  id: string;
  nombre: string;
  indicaciones: string;
}

interface Prescripcion {
  id: string;
  nombre?: string;
  items: PrescripcionItem[];
}

interface ItemForm {
  nombre: string;
  instrucciones: string;
}

export default function ProtocolosPanel({ pacienteId }: ProtocolosPanelProps) {
  const { token } = useAuth();
  const [prescripciones, setPrescripciones] = useState<Prescripcion[]>([]);
  const [isLoadingPrescripciones, setIsLoadingPrescripciones] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  const [items, setItems] = useState<ItemForm[]>([]);
  const [nombreItem, setNombreItem] = useState("");
  const [instrucciones, setInstrucciones] = useState("");

  const fetchPrescripciones = useCallback(async () => {
    if (!token) return;

    try {
      setIsLoadingPrescripciones(true);
      const response = await fetch(
        apiEndpoint(`/pacientes/${pacienteId}/protocolos`),
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (!response.ok) throw new Error("Error al cargar prescripciones");

      const data = await response.json();
      setPrescripciones(normalizePrescriptions(data.data || []));
    } catch (err) {
      console.error("Error cargando prescripciones:", err);
    } finally {
      setIsLoadingPrescripciones(false);
    }
  }, [pacienteId, token]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchPrescripciones();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAgregarItem = () => {
    if (!nombreItem.trim() || !instrucciones.trim()) {
      setError("Ingrese el nombre y las indicaciones");
      return;
    }

    const nuevoItem: ItemForm = {
      nombre: nombreItem.trim(),
      instrucciones: instrucciones.trim(),
    };

    setItems([...items, nuevoItem]);

    setNombreItem("");
    setInstrucciones("");
    setError("");
  };

  const handleEliminarItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (items.length === 0) {
      setError("Agregue al menos un producto");
      return;
    }

    setIsSaving(true);
    setError("");

    try {
      const itemsParaBackend = items.map((item) => ({
        nombre: item.nombre,
        indicaciones: item.instrucciones,
      }));

      const payload = {
        pacienteId,
        nombre: buildPrescriptionName(items),
        items: itemsParaBackend,
      };

      const response = await fetch(apiEndpoint("/protocolos"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const responseText = await response.text();

        try {
          const errorData = JSON.parse(responseText);

          if (errorData.details && Array.isArray(errorData.details)) {
            const mensajes = errorData.details
              .map(
                (d: { path?: string[]; message: string }) =>
                  `${d.path?.join(".")}: ${d.message}`,
              )
              .join(", ");
            throw new Error(`Errores de validación: ${mensajes}`);
          }

          throw new Error(errorData.error || "Error al crear prescripción");
        } catch {
          throw new Error(
            `Error del servidor (${response.status}): ${responseText || "Sin detalles"}`,
          );
        }
      }

      // Limpiar y cerrar
      setItems([]);
      setNombreItem("");
      setInstrucciones("");
      setShowModal(false);

      await fetchPrescripciones();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error al guardar prescripción",
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <PanelFrame
        title="Prescripciones"
        action={
          <button
            onClick={() => setShowModal(true)}
            className="rounded-lg p-1.5 text-marengo transition-colors hover:bg-stone-100 hover:text-concreto"
            title="Agregar prescripción"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
          </button>
        }
      >
        <div className="space-y-4">
          {isLoadingPrescripciones ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-lg h-8 w-8 border-b-2 border-gray-400 mx-auto"></div>
              <p className="text-xs text-gray-400 mt-2">
                Cargando prescripciones...
              </p>
            </div>
          ) : prescripciones.length === 0 ? (
            <div className="rounded-lg bg-gradient-to-br from-stone-50 to-white border border-stone-200 px-6 py-10 text-center">
              <svg className="mx-auto h-12 w-12 text-stone-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="mt-4 text-sm font-medium text-concreto">Sin prescripciones</p>
              <p className="mt-1 text-xs text-marengo">Presiona el botón + para crear la primera prescripción</p>
            </div>
          ) : (
            prescripciones.slice(0, 5).map((prescripcion) => (
              <div
                key={prescripcion.id}
                className="rounded-lg border border-stone-200 bg-white shadow-sm"
              >
                <div className="hidden grid-cols-[minmax(0,1fr)_minmax(0,2fr)] gap-6 border-b border-stone-200 bg-stone-50/50 px-5 py-3 text-[10px] font-semibold uppercase tracking-wider text-marengo/80 sm:grid">
                  <p>Nombre del producto</p>
                  <p>Indicaciones</p>
                </div>
                {prescripcion.items.map((item) => (
                  <div
                    key={item.id}
                    className="grid grid-cols-1 gap-3 border-t border-stone-100 px-5 py-4 first:border-t-0 sm:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] sm:gap-6"
                  >
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-marengo/60 mb-1 sm:hidden">
                        Nombre del producto
                      </p>
                      <p className="text-sm font-medium text-concreto">{item.nombre}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-marengo/60 mb-1 sm:hidden">
                        Indicaciones
                      </p>
                      <p className="text-sm leading-relaxed text-marengo">
                        {item.indicaciones}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ))
          )}

          {prescripciones.length > 5 && (
            <button className="w-full pt-1 text-xs text-marengo transition-colors hover:text-concreto">
              Ver todas las prescripciones →
            </button>
          )}
        </div>
      </PanelFrame>

      {/* Modal simplificado */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-concreto/15 p-4 backdrop-blur-[2px]">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-serif font-light text-gray-900">
                  Nueva Prescripción
                </h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <svg
                    className="w-5 h-5 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
                  {error}
                </div>
              )}

              <div>
                <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-marengo/75">
                  Entrada
                </p>
              </div>

              <div className="space-y-5">
                <div className="px-0 py-0">
                  <Label htmlFor="nombreItem" required>
                    Nombre del producto
                  </Label>
                  <Input
                    id="nombreItem"
                    value={nombreItem}
                    onChange={(e) => setNombreItem(e.target.value)}
                    placeholder="Ej: Protector solar, crema reparadora, control en 15 dias"
                  />
                </div>

                <div>
                  <Label htmlFor="instrucciones" required>
                    Indicaciones
                  </Label>
                  <Input
                    id="instrucciones"
                    value={instrucciones}
                    onChange={(e) => setInstrucciones(e.target.value)}
                    placeholder="Ej: Aplicar por la noche durante 30 dias"
                  />
                </div>

                <div className="flex items-center justify-between gap-3 border-stone-200  max-sm:flex-col max-sm:items-stretch">
                  <button
                    type="button"
                    onClick={handleAgregarItem}
                    className="inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-concreto transition-colors hover:bg-stone-100"
                  >
                    <span className="flex h-6 w-6 items-center justify-center rounded-full border border-stone-300 text-marengo">
                      <svg
                        className="h-3.5 w-3.5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 4v16m8-8H4"
                        />
                      </svg>
                    </span>
                    Agregar
                  </button>
                </div>
              </div>

              <section className="space-y-3 pt-1">
                <div>
                  <div>
                    <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-marengo/75">
                      Lista previa
                    </p>
                    <p className="mt-1 text-xs text-marengo/80">
                      {items.length === 0
                        ? "Aun no agregaste items."
                        : `${items.length} item${items.length === 1 ? "" : "s"} listo${items.length === 1 ? "" : "s"} para guardar.`}
                    </p>
                  </div>
                </div>

                {items.length > 0 ? (
                  <div className="overflow-hidden rounded-lg border border-stone-200 bg-white">
                    <div className="hidden grid-cols-[minmax(0,220px)_minmax(0,1fr)_auto] gap-4 border-b border-stone-200 px-3 py-2 text-[11px] font-medium uppercase tracking-[0.18em] text-marengo/70 sm:grid">
                      <p>Nombre del producto</p>
                      <p>Indicaciones</p>
                      <p className="text-right">Accion</p>
                    </div>
                    {items.map((item, index) => (
                      <div
                        key={index}
                        className="grid grid-cols-1 gap-2 border-t border-stone-200 px-3 py-3 first:border-t-0 sm:grid-cols-[minmax(0,220px)_minmax(0,1fr)_auto] sm:gap-4"
                      >
                        <div>
                          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-marengo/60 sm:hidden">
                            Nombre del producto
                          </p>
                          <p className="text-sm font-medium text-concreto">
                            {item.nombre}
                          </p>
                        </div>
                        <div>
                          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-marengo/60 sm:hidden">
                            Indicaciones
                          </p>
                          <p className="text-sm text-marengo">
                            {item.instrucciones}
                          </p>
                        </div>
                        <Button
                          type="button"
                          onClick={() => handleEliminarItem(index)}
                          variant="ghost"
                          size="sm"
                          className="justify-self-start px-2 py-1 text-red-600 hover:bg-red-50 hover:text-red-700 sm:justify-self-end"
                        >
                          <svg
                            className="w-5 h-5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="px-1 py-2 text-sm text-marengo">
                    La prescripción aparecerá aquí cuando presiones agregar.
                  </div>
                )}
              </section>

              {/* Botones de acción */}
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <Button
                  type="button"
                  onClick={() => setShowModal(false)}
                  variant="outline"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={isSaving || items.length === 0}
                  variant="primary"
                >
                  {isSaving ? "Guardando..." : "Guardar Prescripción"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

function buildPrescriptionName(items: ItemForm[]) {
  if (items.length === 1) {
    return items[0].nombre;
  }

  return `${items[0].nombre} y ${items.length - 1} mas`;
}

function normalizePrescriptions(data: unknown[]): Prescripcion[] {
  return data.map((entry, index) => {
    const rawPrescription = entry as {
      id?: string;
      nombre?: string;
      items?: Array<{
        id?: string;
        nombre?: string;
        indicaciones?: string;
        aplicacion?: string;
        frecuencia?: string;
      }>;
    };

    return {
      id: rawPrescription.id ?? `prescripcion-${index}`,
      nombre: rawPrescription.nombre,
      items: (rawPrescription.items ?? []).map((item, itemIndex) => ({
        id: item.id ?? `${rawPrescription.id ?? index}-${itemIndex}`,
        nombre: item.nombre ?? "Item",
        indicaciones:
          item.indicaciones ?? item.aplicacion ?? item.frecuencia ?? "",
      })),
    };
  });
}
