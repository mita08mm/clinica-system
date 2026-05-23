'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
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
  fecha: string;
  total: number;
  paciente: Paciente;
  items: Array<{ id: string; nombre: string }>;
  pagos: Array<{ id: string; monto: number; fecha: string }>;
}

export default function CobroDetailPage() {
  const params = useParams();
  const { token } = useAuth();
  const [cobro, setCobro] = useState<Cobro | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) return;
    
    let mounted = true;
    
    const loadCobro = async () => {
      try {
        const response = await fetch(apiEndpoint(`/cobros/${params.id}`), {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Error al cargar el cobro');
        }

        const data = await response.json();
        if (mounted) {
          setCobro(data.data);
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Error desconocido');
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };
    
    loadCobro();
    
    return () => {
      mounted = false;
    };
  }, [token, params.id]);

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

  if (isLoading) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="flex justify-center items-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-lg h-12 w-12 border-b-2 border-morena mx-auto mb-4"></div>
              <p className="text-marengo">Cargando cobro...</p>
            </div>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  if (error && !cobro) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  if (!cobro) return null;

  const abonado = cobro.pagos.reduce((sum, pago) => sum + Number(pago.monto), 0);
  const pendiente = Math.max(Number(cobro.total) - abonado, 0);

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
                Registro de cobro
              </h1>
              <p className="text-marengo mt-1">
                {formatFecha(cobro.fecha)}
              </p>
            </div>
          </div>

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Información del paciente */}
          <div className="card p-8">
            <h2 className="text-xl font-heading font-bold text-concreto mb-4">
              Paciente
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-marengo">Nombre</p>
                <p className="text-lg font-medium text-concreto">
                  {cobro.paciente.nombre} {cobro.paciente.apellido}
                </p>
              </div>
              <div>
                <p className="text-sm text-marengo">Documento</p>
                <p className="text-lg font-medium text-concreto">
                  {cobro.paciente.tipoDocumento}: {cobro.paciente.documento}
                </p>
              </div>
            </div>
          </div>

          <div className="card p-8">
            <h2 className="text-xl font-heading font-bold text-concreto mb-4">
              Resumen
            </h2>
            <div className="space-y-4 rounded-lg border border-marengo/20 p-6">
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-marengo/70">Descripción o título</p>
                <p className="mt-1 text-lg font-medium text-concreto">{buildCobroTitle(cobro)}</p>
              </div>

              <div>
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-marengo/70">Monto</p>
                <p className="mt-1 text-lg font-medium text-concreto">{formatMonto(Number(cobro.total))}</p>
              </div>

              <div>
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-marengo/70">Abonado</p>
                <p className="mt-1 text-lg font-medium text-concreto">{formatMonto(abonado)}</p>
              </div>

              <div>
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-marengo/70">Pendiente</p>
                <p className="mt-1 text-lg font-medium text-red-600">{formatMonto(pendiente)}</p>
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}

function buildCobroTitle(cobro: Cobro) {
  if (!cobro.items || cobro.items.length === 0) {
    return 'Registro de cobro';
  }

  if (cobro.items.length === 1) {
    return cobro.items[0].nombre;
  }

  return `${cobro.items[0].nombre} y ${cobro.items.length - 1} mas`;
}
