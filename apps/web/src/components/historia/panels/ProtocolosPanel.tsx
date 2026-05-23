'use client';

import { useState, useEffect, useCallback } from 'react';
import { Protocolo } from '@/types/historia';
import { apiEndpoint } from '@/lib/config';
import { useAuth } from '@/contexts/AuthContext';
import PanelFrame from '@/components/historia/panels/PanelFrame';
import { Badge, Button, Input, Label, Select } from '@/components/ui';

interface ProtocolosPanelProps {
  pacienteId: string;
}

interface Producto {
  id: string;
  nombre: string;
  tipo: 'COSMECEUTICO' | 'DERMOCOSMETICO' | 'EQUIPO' | 'INSUMO';
  precio: number;
  stock: number;
}

interface ItemForm {
  productoId: string;
  nombre: string;
  cantidad: number;
  instrucciones: string;
}

export default function ProtocolosPanel({ pacienteId }: ProtocolosPanelProps) {
  const { token } = useAuth();
  const [protocolos, setProtocolos] = useState<Protocolo[]>([]);
  const [isLoadingProtocolos, setIsLoadingProtocolos] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [isLoadingProductos, setIsLoadingProductos] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  // Formulario simplificado
  const [items, setItems] = useState<ItemForm[]>([]);
  
  // Item actual (solo 3 campos)
  const [selectedProducto, setSelectedProducto] = useState('');
  const [cantidad, setCantidad] = useState(1);
  const [instrucciones, setInstrucciones] = useState('');

  // Cargar protocolos del paciente
  const fetchProtocolos = useCallback(async () => {
    if (!token) return;
    
    try {
      setIsLoadingProtocolos(true);
      const response = await fetch(apiEndpoint(`/pacientes/${pacienteId}/protocolos`), {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error('Error al cargar prescripciones');

      const data = await response.json();
      setProtocolos(data.data || []);
    } catch (err) {
      console.error('Error cargando prescripciones:', err);
    } finally {
      setIsLoadingProtocolos(false);
    }
  }, [pacienteId, token]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchProtocolos();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchProductos = useCallback(async () => {
    setIsLoadingProductos(true);
    try {
      const response = await fetch(apiEndpoint('/productos'), {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error('Error al cargar productos');

      const data = await response.json();
      setProductos(data.data || []);
    } catch {
      setError('No se pudieron cargar los productos');
    } finally {
      setIsLoadingProductos(false);
    }
  }, [token]);

  useEffect(() => {
    if (showModal && productos.length === 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchProductos();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showModal]);

  const handleAgregarItem = () => {
    if (!selectedProducto || !instrucciones.trim()) {
      setError('Seleccione un producto e ingrese las instrucciones');
      return;
    }

    const producto = productos.find(p => p.id === selectedProducto);
    if (!producto) return;

    const nuevoItem: ItemForm = {
      productoId: producto.id,
      nombre: producto.nombre,
      cantidad,
      instrucciones: instrucciones.trim(),
    };

    setItems([...items, nuevoItem]);
    
    // Limpiar campos
    setSelectedProducto('');
    setCantidad(1);
    setInstrucciones('');
    setError('');
  };

  const handleEliminarItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (items.length === 0) {
      setError('Agregue al menos un producto');
      return;
    }

    setIsSaving(true);
    setError('');

    try {
      // Transformar a formato esperado por backend
      const itemsParaBackend = items.map(item => ({
        productoId: item.productoId,
        nombre: item.nombre,
        cantidad: Number(item.cantidad),
        aplicacion: item.instrucciones, // Mapear instrucciones a aplicacion
        frecuencia: item.instrucciones, // Usar mismo valor para frecuencia
      }));

      const payload = {
        pacienteId,
        nombre: buildProtocolName(items),
        items: itemsParaBackend,
      };

      const response = await fetch(apiEndpoint('/protocolos'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const responseText = await response.text();
        
        try {
          const errorData = JSON.parse(responseText);
          
          if (errorData.details && Array.isArray(errorData.details)) {
            const mensajes = errorData.details.map((d: { path?: string[]; message: string }) => `${d.path?.join('.')}: ${d.message}`).join(', ');
            throw new Error(`Errores de validación: ${mensajes}`);
          }
          
          throw new Error(errorData.error || 'Error al crear prescripción');
        } catch {
          throw new Error(`Error del servidor (${response.status}): ${responseText || 'Sin detalles'}`);
        }
      }

      // Limpiar y cerrar
      setItems([]);
      setShowModal(false);
      
      // Recargar protocolos
      await fetchProtocolos();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar prescripción');
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
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        }
      >
        <div className="space-y-4">
          {isLoadingProtocolos ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-lg h-8 w-8 border-b-2 border-gray-400 mx-auto"></div>
              <p className="text-xs text-gray-400 mt-2">Cargando prescripciones...</p>
            </div>
          ) : protocolos.length === 0 ? (
            <div className="rounded-lg bg-stone-50 px-4 py-8 text-center">
              <p className="text-sm font-medium text-concreto">Sin prescripciones activas</p>
              <p className="mt-1 text-xs text-marengo">Usa el boton + para registrar la primera.</p>
            </div>
          ) : (
            protocolos.slice(0, 5).map((protocolo) => (
              <div key={protocolo.id} className="rounded-lg border border-stone-100 px-4 py-4 last:pb-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <h4 className="text-sm font-medium text-concreto">{getProtocolDisplayName(protocolo)}</h4>
                  </div>
                  <Badge variant="default" className="px-2.5 py-1 text-[11px] font-semibold">
                    {protocolo.items.length} item{protocolo.items.length === 1 ? '' : 's'}
                  </Badge>
                </div>
                {protocolo.items.map((item) => (
                  <div key={item.id} className="mt-3 border-t border-stone-100 pt-3 first:mt-0 first:border-t-0 first:pt-0">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <p className="text-sm text-concreto">
                          {item.producto.nombre} <span className="text-marengo">x{item.cantidad}</span>
                        </p>
                        <p className="mt-1 text-xs italic text-marengo">
                          {item.aplicacion || item.frecuencia}
                        </p>
                      </div>
                      <span className={`flex-shrink-0 rounded-lg px-2 py-0.5 text-xs font-medium ${
                        item.estado === 'COMPLETADO'
                          ? 'bg-gray-100 text-gray-600'
                          : 'bg-green-100 text-green-700'
                      }`}>
                        {item.estado === 'COMPLETADO' ? 'Finalizado' : 'Activo'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ))
          )}

          {protocolos.length > 5 && (
            <button className="w-full pt-1 text-xs text-marengo transition-colors hover:text-concreto">
              Ver todas las prescripciones →
            </button>
          )}
        </div>
      </PanelFrame>

      {/* Modal simplificado - Solo 3 campos por producto */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-concreto/15 p-4 backdrop-blur-[2px]">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-serif font-light text-gray-900">Nueva Prescripción</h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
                  {error}
                </div>
              )}

              {/* Productos agregados */}
              {items.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-medium uppercase tracking-[0.16em] text-marengo">
                    Recetado · {items.length} item{items.length === 1 ? '' : 's'}
                  </p>
                  {items.map((item, index) => (
                    <div key={index} className="flex items-start justify-between gap-3 rounded-lg bg-stone-50 px-3 py-2.5">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-concreto">{item.nombre} <span className="text-marengo">x{item.cantidad}</span></p>
                        <p className="mt-1 text-xs italic text-marengo">{item.instrucciones}</p>
                      </div>
                      <Button
                        type="button"
                        onClick={() => handleEliminarItem(index)}
                        variant="ghost"
                        size="sm"
                        className="px-2 py-1 text-red-600 hover:bg-red-50 hover:text-red-700"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              <div className="border-t border-gray-200 pt-6">
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="producto" required>Producto</Label>
                    {isLoadingProductos ? (
                      <div className="text-sm text-marengo">Cargando productos...</div>
                    ) : (
                      <Select
                        id="producto"
                        value={selectedProducto}
                        onChange={(e) => setSelectedProducto(e.target.value)}
                      >
                        <option value="">Seleccionar producto...</option>
                        {productos.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.nombre} (Stock: {p.stock})
                          </option>
                        ))}
                      </Select>
                    )}
                  </div>

                  <div className="grid grid-cols-[120px_1fr] gap-3 max-sm:grid-cols-1">
                    <div>
                    <Label htmlFor="cantidad">Cantidad</Label>
                    <Input
                      id="cantidad"
                      type="number"
                      min="1"
                      value={cantidad}
                      onChange={(e) => setCantidad(parseInt(e.target.value) || 1)}
                    />
                    </div>

                    <div>
                      <Label htmlFor="instrucciones" required>Indicación</Label>
                      <Input
                        id="instrucciones"
                        value={instrucciones}
                        onChange={(e) => setInstrucciones(e.target.value)}
                        placeholder="Ej: 2 veces al día por 30 días"
                      />
                    </div>
                  </div>

                  <Button
                    type="button"
                    onClick={handleAgregarItem}
                    variant="primary"
                    className="w-full"
                  >
                    Agregar a la receta
                  </Button>
                </div>
              </div>

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
                  {isSaving ? 'Guardando...' : 'Guardar Prescripción'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

function buildProtocolName(items: ItemForm[]) {
  if (items.length === 1) {
    return items[0].nombre;
  }

  return `${items[0].nombre} y ${items.length - 1} mas`;
}

function getProtocolDisplayName(protocolo: Protocolo) {
  if (protocolo.nombre?.trim()) {
    return protocolo.nombre;
  }

  if (protocolo.items.length === 0) {
    return 'Prescripción';
  }

  if (protocolo.items.length === 1) {
    return protocolo.items[0].producto.nombre;
  }

  return `${protocolo.items[0].producto.nombre} y ${protocolo.items.length - 1} mas`;
}
