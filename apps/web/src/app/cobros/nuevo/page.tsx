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

export default function NuevoCobroPage() {
  const router = useRouter();
  const { token } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [loadingPacientes, setLoadingPacientes] = useState(true);

  const [pacienteId, setPacienteId] = useState('');
  const [titulo, setTitulo] = useState('');
  const [costo, setCosto] = useState('');

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const monto = Number(costo);

    if (!titulo.trim()) {
      setError('Ingrese una descripción o título');
      return;
    }

    if (Number.isNaN(monto) || monto <= 0) {
      setError('El costo debe ser mayor a 0');
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
          items: [
            {
              tipo: 'PAQUETE',
              nombre: titulo.trim(),
              cantidad: 1,
              precioUnitario: monto,
            },
          ],
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        console.log('ERROR COBRO:', JSON.stringify(data, null, 2));
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

  const costoActual = Number(costo) || 0;

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
                Nuevo registro de cobro
              </h1>
              <p className="text-marengo mt-1">
                Descripción del producto o servicio y costo
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
            <div className="card p-8">
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

            <div className="card p-8">
              <h2 className="text-xl font-heading font-bold text-concreto mb-4">
                Registro
              </h2>

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div>
                  <label className="block text-xs font-medium text-concreto mb-2">
                    Descripción o título
                  </label>
                  <input
                    type="text"
                    value={titulo}
                    onChange={(e) => setTitulo(e.target.value)}
                    placeholder="Ej: Limpieza facial, producto reparador"
                    className="w-full px-3 py-2 text-sm rounded border border-marengo/30 
                             focus:border-morena outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-concreto mb-2">
                    Costo
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={costo}
                    onChange={(e) => setCosto(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded border border-marengo/30 
                             focus:border-morena outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="card p-8">
              <h2 className="text-xl font-heading font-bold text-concreto mb-4">
                Resumen
              </h2>
              
              <div className="space-y-4 max-w-md ml-auto">
                <div className="flex justify-between text-xl font-bold text-concreto border-t-2 border-marengo/30 pt-4">
                  <span>COSTO:</span>
                  <span className="text-morena">{formatMonto(costoActual)}</span>
                </div>
              </div>
            </div>

            {/* Botones */}
            <div className="flex gap-4">
              <button
                type="submit"
                disabled={isLoading || !titulo.trim() || costoActual <= 0}
                className="btn-primary"
              >
                {isLoading ? 'Guardando...' : 'Guardar registro'}
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
