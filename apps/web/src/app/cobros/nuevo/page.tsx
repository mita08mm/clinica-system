'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Link from 'next/link';
import { apiEndpoint } from '@/lib/config';

interface Paciente {
  id: string;
  nombre: string;
  apellido: string;
  documento: string;
  tipoDocumento: string;
  estado: string;
}

interface Item {
  tipo: 'SERVICIO' | 'MEDICAMENTO' | 'INSUMO';
  itemId: string;
  nombre: string;
  cantidad: number;
  precioUnitario: number;
}

export default function NuevoCobroPage() {
  const router = useRouter();
  const { token } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [loadingPacientes, setLoadingPacientes] = useState(true);

  const [pacienteId, setPacienteId] = useState('');
  const [items, setItems] = useState<Item[]>([]);
  const [descuento, setDescuento] = useState(0);
  const [notas, setNotas] = useState('');

  // Nuevo item temporal
  const [nuevoItem, setNuevoItem] = useState<Item>({
    tipo: 'SERVICIO',
    itemId: '',
    nombre: '',
    cantidad: 1,
    precioUnitario: 0,
  });

  useEffect(() => {
    if (!token) return;

    const fetchPacientes = async () => {
      try {
        const response = await fetch(apiEndpoint('/pacientes'), {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Error al cargar pacientes');
        }

        const data = await response.json();
        setPacientes(data.data.filter((p: Paciente) => p.estado === 'ACTIVO'));
      } catch (err) {
        console.error('Error cargando pacientes:', err);
      } finally {
        setLoadingPacientes(false);
      }
    };

    fetchPacientes();
  }, [token]);

  const agregarItem = () => {
    if (!nuevoItem.nombre || nuevoItem.cantidad <= 0 || nuevoItem.precioUnitario <= 0) {
      setError('Complete todos los campos del item');
      return;
    }

    setItems([...items, { ...nuevoItem, itemId: `temp-${Date.now()}` }]);
    setNuevoItem({
      tipo: 'SERVICIO',
      itemId: '',
      nombre: '',
      cantidad: 1,
      precioUnitario: 0,
    });
    setError('');
  };

  const eliminarItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const calcularSubtotal = () => {
    return items.reduce((sum, item) => sum + item.cantidad * item.precioUnitario, 0);
  };

  const calcularTotal = () => {
    return calcularSubtotal() - descuento;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (items.length === 0) {
      setError('Debe agregar al menos un item al cobro');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(apiEndpoint('/cobros'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          pacienteId,
          items,
          descuento,
          notas: notas || undefined,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Error al crear cobro');
      }

      router.push('/cobros');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setIsLoading(false);
    }
  };

  const formatMonto = (monto: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'USD',
    }).format(monto);
  };

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="max-w-5xl space-y-6">
          <div className="flex items-center gap-4">
            <Link href="/cobros" className="text-marengo hover:text-concreto">
              ← Volver
            </Link>
            <div>
              <h1 className="text-3xl font-heading font-bold text-concreto">
                Nuevo Cobro
              </h1>
              <p className="text-marengo mt-1">
                Registra un nuevo cobro o factura
              </p>
            </div>
          </div>

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Selección de paciente */}
            <div className="bg-white rounded-xl shadow-md p-8">
              <h2 className="text-xl font-heading font-bold text-concreto mb-4">
                Paciente
              </h2>
              {loadingPacientes ? (
                <div className="text-sm text-marengo">Cargando pacientes...</div>
              ) : (
                <select
                  value={pacienteId}
                  onChange={(e) => setPacienteId(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-marengo/30 
                           focus:border-morena focus:ring-2 focus:ring-piel/20 
                           transition-all outline-none"
                  required
                  disabled={isLoading}
                >
                  <option value="">Seleccione un paciente</option>
                  {pacientes.map((paciente) => (
                    <option key={paciente.id} value={paciente.id}>
                      {paciente.nombre} {paciente.apellido} - {paciente.tipoDocumento}: {paciente.documento}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Items del cobro */}
            <div className="bg-white rounded-xl shadow-md p-8">
              <h2 className="text-xl font-heading font-bold text-concreto mb-4">
                Items del Cobro
              </h2>

              {/* Formulario para agregar items */}
              <div className="grid grid-cols-12 gap-4 mb-6 p-4 bg-piel/10 rounded-lg">
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-concreto mb-2">
                    Tipo
                  </label>
                  <select
                    value={nuevoItem.tipo}
                    onChange={(e) => setNuevoItem({ ...nuevoItem, tipo: e.target.value as Item['tipo'] })}
                    className="w-full px-3 py-2 text-sm rounded border border-marengo/30 
                             focus:border-morena outline-none"
                  >
                    <option value="SERVICIO">Servicio</option>
                    <option value="MEDICAMENTO">Medicamento</option>
                    <option value="INSUMO">Insumo</option>
                  </select>
                </div>
                <div className="col-span-4">
                  <label className="block text-xs font-medium text-concreto mb-2">
                    Descripcion
                  </label>
                  <input
                    type="text"
                    value={nuevoItem.nombre}
                    onChange={(e) => setNuevoItem({ ...nuevoItem, nombre: e.target.value })}
                    placeholder="Nombre del item"
                    className="w-full px-3 py-2 text-sm rounded border border-marengo/30 
                             focus:border-morena outline-none"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-concreto mb-2">
                    Cantidad
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={nuevoItem.cantidad}
                    onChange={(e) => setNuevoItem({ ...nuevoItem, cantidad: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 text-sm rounded border border-marengo/30 
                             focus:border-morena outline-none"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-concreto mb-2">
                    Precio Unit.
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={nuevoItem.precioUnitario}
                    onChange={(e) => setNuevoItem({ ...nuevoItem, precioUnitario: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 text-sm rounded border border-marengo/30 
                             focus:border-morena outline-none"
                  />
                </div>
                <div className="col-span-2 flex items-end">
                  <button
                    type="button"
                    onClick={agregarItem}
                    className="w-full px-4 py-2 bg-morena text-white text-sm rounded 
                             hover:bg-morena/90 transition-all"
                  >
                    Agregar
                  </button>
                </div>
              </div>

              {/* Lista de items */}
              {items.length > 0 ? (
                <div className="border border-marengo/20 rounded-lg overflow-hidden">
                  <table className="min-w-full divide-y divide-marengo/20">
                    <thead className="bg-marengo/10">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-concreto">Tipo</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-concreto">Descripcion</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-concreto">Cantidad</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-concreto">Precio Unit.</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-concreto">Subtotal</th>
                        <th className="px-4 py-3"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-marengo/10">
                      {items.map((item, index) => (
                        <tr key={index}>
                          <td className="px-4 py-3 text-sm text-concreto">{item.tipo}</td>
                          <td className="px-4 py-3 text-sm text-concreto">{item.nombre}</td>
                          <td className="px-4 py-3 text-sm text-concreto text-right">{item.cantidad}</td>
                          <td className="px-4 py-3 text-sm text-concreto text-right">
                            {formatMonto(item.precioUnitario)}
                          </td>
                          <td className="px-4 py-3 text-sm text-concreto text-right font-medium">
                            {formatMonto(item.cantidad * item.precioUnitario)}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <button
                              type="button"
                              onClick={() => eliminarItem(index)}
                              className="text-red-600 hover:text-red-800 text-sm"
                            >
                              Eliminar
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8 text-marengo">
                  No hay items agregados. Agregue al menos uno para continuar.
                </div>
              )}
            </div>

            {/* Resumen y totales */}
            <div className="bg-white rounded-xl shadow-md p-8">
              <h2 className="text-xl font-heading font-bold text-concreto mb-4">
                Totales
              </h2>
              
              <div className="space-y-4 max-w-md ml-auto">
                <div className="flex justify-between text-concreto">
                  <span>Subtotal:</span>
                  <span className="font-medium">{formatMonto(calcularSubtotal())}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <label className="text-concreto">Descuento:</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={descuento}
                    onChange={(e) => setDescuento(parseFloat(e.target.value) || 0)}
                    className="w-32 px-3 py-2 text-right rounded border border-marengo/30 
                             focus:border-morena outline-none"
                  />
                </div>
                
                <div className="flex justify-between text-xl font-bold text-concreto border-t-2 border-marengo/30 pt-4">
                  <span>TOTAL:</span>
                  <span className="text-morena">{formatMonto(calcularTotal())}</span>
                </div>
              </div>

              <div className="mt-6">
                <label className="block text-sm font-medium text-concreto mb-2">
                  Notas / Observaciones
                </label>
                <textarea
                  value={notas}
                  onChange={(e) => setNotas(e.target.value)}
                  rows={3}
                  placeholder="Informacion adicional..."
                  className="w-full px-4 py-3 rounded-lg border border-marengo/30 
                           focus:border-morena focus:ring-2 focus:ring-piel/20 
                           transition-all outline-none resize-none"
                />
              </div>
            </div>

            {/* Botones */}
            <div className="flex gap-4">
              <button
                type="submit"
                disabled={isLoading || items.length === 0}
                className="btn-primary"
              >
                {isLoading ? 'Guardando...' : 'Guardar Cobro'}
              </button>
              <Link
                href="/cobros"
                className="btn-secondary"
              >
                Cancelar
              </Link>
            </div>
          </form>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
