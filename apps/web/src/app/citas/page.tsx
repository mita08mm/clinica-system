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
  telefono: string;
  email?: string;
}

interface Cita {
  id: string;
  pacienteId: string;
  fecha: string;
  horaInicio: string;
  horaFin: string;
  motivo: string;
  estado: string;
  notas?: string;
  paciente: Paciente;
}

export default function CitasPage() {
  const [citas, setCitas] = useState<Cita[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const { token } = useAuth();

  useEffect(() => {
    if (!token) return;

    const fetchCitas = async () => {
      try {
        const response = await fetch(apiEndpoint('/citas'), {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Error al obtener citas');
        }

        const data = await response.json();
        setCitas(data.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error desconocido');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCitas();
  }, [token]);

  const formatFecha = (fecha: string) => {
    return new Date(fecha).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      weekday: 'short',
    });
  };

  const getEstadoColor = (estado: string) => {
    const colors: Record<string, string> = {
      PROGRAMADA: 'bg-blue-100 text-blue-800',
      CONFIRMADA: 'bg-green-100 text-green-800',
      EN_CURSO: 'bg-yellow-100 text-yellow-800',
      COMPLETADA: 'bg-gray-100 text-gray-800',
      CANCELADA: 'bg-red-100 text-red-800',
      NO_ASISTIO: 'bg-red-200 text-red-900',
    };
    return colors[estado] || 'bg-gray-100 text-gray-800';
  };

  if (isLoading) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-morena"></div>
            <span className="ml-3 text-marengo">Cargando citas...</span>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  if (error) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600">{error}</p>
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
                Citas
              </h1>
              <p className="text-marengo mt-1">
                Gestion de turnos y citas medicas
              </p>
            </div>
            <Link
              href="/citas/nueva"
              className="btn-primary"
            >
              Nueva Cita
            </Link>
          </div>

          {citas.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm p-12 text-center">
              <div className="text-6xl mb-4">📅</div>
              <h3 className="text-xl font-heading font-semibold text-concreto mb-2">
                No hay citas programadas
              </h3>
              <p className="text-marengo mb-6">
                Comienza creando tu primera cita
              </p>
              <Link
                href="/citas/nueva"
                className="inline-block px-6 py-3 bg-piel text-morena rounded-lg 
                         hover:bg-piel/90 transition-all"
              >
                Crear primera cita
              </Link>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <table className="min-w-full divide-y divide-marengo/20">
                <thead className="bg-piel/20">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium text-concreto uppercase tracking-wider">
                      Fecha y Hora
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-concreto uppercase tracking-wider">
                      Paciente
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-concreto uppercase tracking-wider">
                      Motivo
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-concreto uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-concreto uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-marengo/10">
                  {citas.map((cita) => (
                    <tr key={cita.id} className="hover:bg-piel/5 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-concreto">
                          {formatFecha(cita.fecha)}
                        </div>
                        <div className="text-sm text-marengo">
                          {cita.horaInicio} - {cita.horaFin}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-concreto">
                          {cita.paciente.nombre} {cita.paciente.apellido}
                        </div>
                        <div className="text-sm text-marengo">
                          {cita.paciente.telefono}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-concreto max-w-xs truncate">
                          {cita.motivo}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getEstadoColor(cita.estado)}`}>
                          {cita.estado.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <Link
                          href={`/citas/${cita.id}`}
                          className="text-morena hover:text-morena/80 font-medium"
                        >
                          Ver detalle
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
