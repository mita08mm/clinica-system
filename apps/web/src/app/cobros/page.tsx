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

interface Cobro {
  id: string;
  pacienteId: string;
  fecha: string;
  subtotal: number;
  descuento: number;
  total: number;
  estado: string;
  paciente: Paciente;
  pagos: Array<{ monto: number }>;
}

export default function CobrosPage() {
  const [cobros, setCobros] = useState<Cobro[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const { token } = useAuth();

  useEffect(() => {
    if (!token) return;

    const fetchCobros = async () => {
      try {
        const response = await fetch(apiEndpoint('/cobros'), {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Error al obtener cobros');
        }

        const data = await response.json();
        setCobros(data.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error desconocido');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCobros();
  }, [token]);

  const formatFecha = (fecha: string) => {
    return new Date(fecha).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const formatMonto = (monto: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'USD',
    }).format(monto);
  };

  const calcularPagado = (pagos: Array<{ monto: number }>) => {
    return pagos.reduce((sum, pago) => sum + Number(pago.monto), 0);
  };

  const getEstadoColor = (estado: string) => {
    const colors: Record<string, string> = {
      PENDIENTE: 'bg-red-100 text-red-800',
      PARCIAL: 'bg-yellow-100 text-yellow-800',
      PAGADO: 'bg-green-100 text-green-800',
      CANCELADO: 'bg-gray-100 text-gray-800',
    };
    return colors[estado] || 'bg-gray-100 text-gray-800';
  };

  if (isLoading) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-morena"></div>
            <span className="ml-3 text-marengo">Cargando cobros...</span>
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
                Cobros
              </h1>
              <p className="text-marengo mt-1">
                Facturacion y control de pagos
              </p>
            </div>
            <Link
              href="/cobros/nuevo"
              className="btn-primary"
            >
              Nuevo Cobro
            </Link>
          </div>

          {cobros.length === 0 ? (
            <div className="bg-white rounded-xl shadow-md p-12 text-center">
              <div className="text-6xl mb-4">💰</div>
              <h3 className="text-xl font-heading font-semibold text-concreto mb-2">
                No hay cobros registrados
              </h3>
              <p className="text-marengo mb-6">
                Comienza creando tu primer cobro
              </p>
              <Link
                href="/cobros/nuevo"
                className="inline-block px-6 py-3 bg-piel text-morena rounded-lg 
                         hover:bg-piel/90 transition-all"
              >
                Crear primer cobro
              </Link>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <table className="min-w-full divide-y divide-marengo/20">
                <thead className="bg-piel/20">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium text-concreto uppercase tracking-wider">
                      Fecha
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-concreto uppercase tracking-wider">
                      Paciente
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-medium text-concreto uppercase tracking-wider">
                      Total
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-medium text-concreto uppercase tracking-wider">
                      Pagado
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-medium text-concreto uppercase tracking-wider">
                      Saldo
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
                  {cobros.map((cobro) => {
                    const pagado = calcularPagado(cobro.pagos);
                    const saldo = Number(cobro.total) - pagado;
                    
                    return (
                      <tr key={cobro.id} className="hover:bg-piel/5 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-concreto">
                          {formatFecha(cobro.fecha)}
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-concreto">
                            {cobro.paciente.nombre} {cobro.paciente.apellido}
                          </div>
                          <div className="text-sm text-marengo">
                            {cobro.paciente.tipoDocumento}: {cobro.paciente.documento}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-concreto text-right font-medium">
                          {formatMonto(Number(cobro.total))}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 text-right">
                          {formatMonto(pagado)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 text-right font-medium">
                          {formatMonto(saldo)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getEstadoColor(cobro.estado)}`}>
                            {cobro.estado}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <Link
                            href={`/cobros/${cobro.id}`}
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
