'use client';

import { useState, useEffect } from 'react';
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
}

interface Usuario {
  id: string;
  nombre: string;
  apellido: string;
}

interface ItemReceta {
  id: string;
  tipo: string;
  nombre: string;
  cantidad: number;
  dosis?: string;
  frecuencia?: string;
  duracion?: string;
  estado: string;
}

interface Receta {
  id: string;
  fecha: string;
  indicaciones?: string;
  paciente: Paciente;
  usuario: Usuario;
  items: ItemReceta[];
}

export default function RecetasPage() {
  const { token } = useAuth();
  const [recetas, setRecetas] = useState<Receta[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) return;

    const fetchRecetas = async () => {
      try {
        const response = await fetch(apiEndpoint('/recetas'), {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Error al cargar recetas');
        }

        const data = await response.json();
        setRecetas(data.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error desconocido');
      } finally {
        setIsLoading(false);
      }
    };

    fetchRecetas();
  }, [token]);

  const formatFecha = (fecha: string) => {
    return new Date(fecha).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const countItemsByEstado = (items: ItemReceta[]) => {
    const prescritos = items.filter((i) => i.estado === 'PRESCRITO').length;
    const entregados = items.filter((i) => i.estado === 'ENTREGADO').length;
    return { prescritos, entregados };
  };

  if (isLoading) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="flex justify-center items-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-morena mx-auto mb-4"></div>
              <p className="text-marengo">Cargando recetas...</p>
            </div>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-heading font-bold text-concreto">
                Recetas
              </h1>
              <p className="text-marengo mt-1">
                Prescripciones y medicamentos
              </p>
            </div>
            <Link
              href="/recetas/nuevo"
              className="btn-primary"
            >
              Nueva Receta
            </Link>
          </div>

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {recetas.length === 0 ? (
            <div className="bg-white rounded-xl shadow-md p-12 text-center">
              <p className="text-marengo mb-4">
                No hay recetas registradas
              </p>
              <Link
                href="/recetas/nuevo"
                className="btn-primary"
              >
                Crear primera receta
              </Link>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <table className="min-w-full divide-y divide-marengo/20">
                <thead className="bg-marengo/10">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium text-concreto uppercase tracking-wider">
                      Fecha
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-concreto uppercase tracking-wider">
                      Paciente
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-concreto uppercase tracking-wider">
                      Prescriptor
                    </th>
                    <th className="px-6 py-4 text-center text-xs font-medium text-concreto uppercase tracking-wider">
                      Items Totales
                    </th>
                    <th className="px-6 py-4 text-center text-xs font-medium text-concreto uppercase tracking-wider">
                      Prescritos
                    </th>
                    <th className="px-6 py-4 text-center text-xs font-medium text-concreto uppercase tracking-wider">
                      Entregados
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-medium text-concreto uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-marengo/10">
                  {recetas.map((receta) => {
                    const { prescritos, entregados } = countItemsByEstado(receta.items);
                    return (
                      <tr key={receta.id} className="hover:bg-piel/5 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-concreto">
                          {formatFecha(receta.fecha)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-concreto">
                            {receta.paciente.nombre} {receta.paciente.apellido}
                          </div>
                          <div className="text-xs text-marengo">
                            {receta.paciente.tipoDocumento}: {receta.paciente.documento}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-concreto">
                          Dr. {receta.usuario.nombre} {receta.usuario.apellido}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium text-concreto">
                          {receta.items.length}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">
                            {prescritos}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                            {entregados}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                          <Link
                            href={`/recetas/${receta.id}`}
                            className="text-morena hover:text-morena/80 font-medium"
                          >
                            Ver detalle
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
