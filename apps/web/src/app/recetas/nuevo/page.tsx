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
  tipo: 'MEDICAMENTO' | 'INSUMO';
  itemId: string;
  nombre: string;
  cantidad: number;
  dosis?: string;
  frecuencia?: string;
  duracion?: string;
  precio?: number;
}

export default function NuevaRecetaPage() {
  const router = useRouter();
  const { token, usuario } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [loadingPacientes, setLoadingPacientes] = useState(true);

  const [pacienteId, setPacienteId] = useState('');
  const [indicaciones, setIndicaciones] = useState('');
  const [items, setItems] = useState<Item[]>([]);

  // Nuevo item temporal
  const [nuevoItem, setNuevoItem] = useState<Item>({
    tipo: 'MEDICAMENTO',
    itemId: '',
    nombre: '',
    cantidad: 1,
    dosis: '',
    frecuencia: '',
    duracion: '',
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
    if (!nuevoItem.nombre || nuevoItem.cantidad <= 0) {
      setError('Complete el nombre y cantidad del item');
      return;
    }

    setItems([...items, { ...nuevoItem, itemId: `temp-${Date.now()}` }]);
    setNuevoItem({
      tipo: 'MEDICAMENTO',
      itemId: '',
      nombre: '',
      cantidad: 1,
      dosis: '',
      frecuencia: '',
      duracion: '',
    });
    setError('');
  };

  const eliminarItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (items.length === 0) {
      setError('Debe agregar al menos un item a la receta');
      return;
    }

    if (!usuario?.id) {
      setError('Usuario no identificado');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(apiEndpoint('/recetas'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          pacienteId,
          usuarioId: usuario.id,
          indicaciones: indicaciones || undefined,
          items,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Error al crear receta');
      }

      router.push('/recetas');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="max-w-5xl space-y-6">
          <div className="flex items-center gap-4">
            <Link href="/recetas" className="text-marengo hover:text-concreto">
              ← Volver
            </Link>
            <div>
              <h1 className="text-3xl font-heading font-bold text-concreto">
                Nueva Receta
              </h1>
              <p className="text-marengo mt-1">
                Prescripción de medicamentos e insumos
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

            {/* Items de la receta */}
            <div className="bg-white rounded-xl shadow-md p-8">
              <h2 className="text-xl font-heading font-bold text-concreto mb-4">
                Medicamentos e Insumos
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
                    <option value="MEDICAMENTO">Medicamento</option>
                    <option value="INSUMO">Insumo</option>
                  </select>
                </div>
                <div className="col-span-3">
                  <label className="block text-xs font-medium text-concreto mb-2">
                    Nombre
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
                <div className="col-span-1">
                  <label className="block text-xs font-medium text-concreto mb-2">
                    Cant.
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
                    Dosis
                  </label>
                  <input
                    type="text"
                    value={nuevoItem.dosis}
                    onChange={(e) => setNuevoItem({ ...nuevoItem, dosis: e.target.value })}
                    placeholder="ej: 500mg"
                    className="w-full px-3 py-2 text-sm rounded border border-marengo/30 
                             focus:border-morena outline-none"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-concreto mb-2">
                    Frecuencia
                  </label>
                  <input
                    type="text"
                    value={nuevoItem.frecuencia}
                    onChange={(e) => setNuevoItem({ ...nuevoItem, frecuencia: e.target.value })}
                    placeholder="ej: Cada 8 horas"
                    className="w-full px-3 py-2 text-sm rounded border border-marengo/30 
                             focus:border-morena outline-none"
                  />
                </div>
                <div className="col-span-1">
                  <label className="block text-xs font-medium text-concreto mb-2">
                    Duracion
                  </label>
                  <input
                    type="text"
                    value={nuevoItem.duracion}
                    onChange={(e) => setNuevoItem({ ...nuevoItem, duracion: e.target.value })}
                    placeholder="7 dias"
                    className="w-full px-3 py-2 text-sm rounded border border-marengo/30 
                             focus:border-morena outline-none"
                  />
                </div>
                <div className="col-span-1 flex items-end">
                  <button
                    type="button"
                    onClick={agregarItem}
                    className="w-full px-4 py-2 bg-morena text-white text-sm rounded 
                             hover:bg-morena/90 transition-all"
                  >
                    +
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
                        <th className="px-4 py-3 text-left text-xs font-medium text-concreto">Nombre</th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-concreto">Cant.</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-concreto">Dosis</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-concreto">Frecuencia</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-concreto">Duracion</th>
                        <th className="px-4 py-3"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-marengo/10">
                      {items.map((item, index) => (
                        <tr key={index}>
                          <td className="px-4 py-3 text-sm text-concreto">{item.tipo}</td>
                          <td className="px-4 py-3 text-sm text-concreto">{item.nombre}</td>
                          <td className="px-4 py-3 text-sm text-concreto text-center">{item.cantidad}</td>
                          <td className="px-4 py-3 text-sm text-marengo">{item.dosis || '-'}</td>
                          <td className="px-4 py-3 text-sm text-marengo">{item.frecuencia || '-'}</td>
                          <td className="px-4 py-3 text-sm text-marengo">{item.duracion || '-'}</td>
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

            {/* Indicaciones generales */}
            <div className="bg-white rounded-xl shadow-md p-8">
              <h2 className="text-xl font-heading font-bold text-concreto mb-4">
                Indicaciones Generales
              </h2>
              <textarea
                value={indicaciones}
                onChange={(e) => setIndicaciones(e.target.value)}
                rows={4}
                placeholder="Instrucciones adicionales para el paciente..."
                className="w-full px-4 py-3 rounded-lg border border-marengo/30 
                         focus:border-morena focus:ring-2 focus:ring-piel/20 
                         transition-all outline-none resize-none"
              />
            </div>

            {/* Botones */}
            <div className="flex gap-4">
              <button
                type="submit"
                disabled={isLoading || items.length === 0}
                className="btn-primary"
              >
                {isLoading ? 'Guardando...' : 'Guardar Receta'}
              </button>
              <Link
                href="/recetas"
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
