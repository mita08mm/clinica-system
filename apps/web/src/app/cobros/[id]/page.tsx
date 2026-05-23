'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { api } from '@/lib/api';

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
  const [cobro, setCobro] = useState<Cobro | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;

    const loadCobro = async () => {
      try {
        const data = await api.get<Cobro>(`/cobros/${params.id}`);
        if (mounted) setCobro(data);
      } catch (err) {
        if (mounted) setError(err instanceof Error ? err.message : 'Error desconocido');
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    loadCobro();

    return () => {
      mounted = false;
    };
  }, [params.id]);

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
          <div className="flex justify-center items-center min-h-[400px] text-sm text-[var(--neutral-500)]">
            Cargando cobro...
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  if (error && !cobro) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="rounded-md border border-[rgba(181,58,58,0.2)] bg-[var(--semantic-danger-bg)] px-4 py-3 text-sm text-[var(--semantic-danger)]">
            {error}
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  if (!cobro) return null;

  const abonado = cobro.pagos.reduce((sum, pago) => sum + Number(pago.monto), 0);
  const pendiente = Math.max(Number(cobro.total) - abonado, 0);
  const totalNum = Number(cobro.total);
  const porcentajeAbonado = totalNum > 0 ? Math.min((abonado / totalNum) * 100, 100) : 0;

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="max-w-4xl">
          <PageHeader
            overline="Cobros"
            title="Registro de cobro"
            subtitle={formatFecha(cobro.fecha)}
            backHref="/cobros"
          />

          {error && (
            <div className="mb-5 rounded-md border border-[rgba(181,58,58,0.2)] bg-[var(--semantic-danger-bg)] px-4 py-3 text-sm text-[var(--semantic-danger)]">
              {error}
            </div>
          )}

          <div className="space-y-5">
            <section className="rounded-[var(--radius-lg)] border border-[var(--neutral-200)] bg-white p-6">
              <p className="text-[11px] font-medium uppercase tracking-wider text-[var(--neutral-500)] mb-3">
                Paciente
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <p className="text-xs text-[var(--neutral-500)]">Nombre</p>
                  <p className="mt-0.5 text-base font-medium text-[var(--neutral-900)]">
                    {cobro.paciente.nombre} {cobro.paciente.apellido}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-[var(--neutral-500)]">Documento</p>
                  <p className="mt-0.5 text-base font-medium text-[var(--neutral-900)]">
                    {cobro.paciente.tipoDocumento}: {cobro.paciente.documento}
                  </p>
                </div>
              </div>
            </section>

            <section className="rounded-[var(--radius-lg)] border border-[var(--neutral-200)] bg-white p-6">
              <p className="text-[11px] font-medium uppercase tracking-wider text-[var(--neutral-500)] mb-3">
                Detalle
              </p>
              <div>
                <p className="text-xs text-[var(--neutral-500)]">Descripción</p>
                <p className="mt-0.5 text-base font-medium text-[var(--neutral-900)]">{buildCobroTitle(cobro)}</p>
              </div>

              <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="rounded-md bg-[var(--neutral-50)] border border-[var(--neutral-100)] px-4 py-3">
                  <p className="text-[11px] font-medium uppercase tracking-wider text-[var(--neutral-500)]">Monto total</p>
                  <p className="font-heading text-xl font-medium text-[var(--neutral-900)] mt-1 tabular-nums">
                    {formatMonto(totalNum)}
                  </p>
                </div>
                <div className="rounded-md bg-[var(--semantic-success-bg)] border border-[rgba(58,138,79,0.18)] px-4 py-3">
                  <p className="text-[11px] font-medium uppercase tracking-wider text-[var(--semantic-success)]">Abonado</p>
                  <p className="font-heading text-xl font-medium text-[var(--semantic-success)] mt-1 tabular-nums">
                    {formatMonto(abonado)}
                  </p>
                </div>
                <div className={`rounded-md px-4 py-3 border ${
                  pendiente > 0
                    ? 'bg-[var(--semantic-danger-bg)] border-[rgba(181,58,58,0.18)]'
                    : 'bg-[var(--neutral-50)] border-[var(--neutral-100)]'
                }`}>
                  <p className={`text-[11px] font-medium uppercase tracking-wider ${pendiente > 0 ? 'text-[var(--semantic-danger)]' : 'text-[var(--neutral-500)]'}`}>
                    Pendiente
                  </p>
                  <p className={`font-heading text-xl font-medium mt-1 tabular-nums ${pendiente > 0 ? 'text-[var(--semantic-danger)]' : 'text-[var(--neutral-700)]'}`}>
                    {formatMonto(pendiente)}
                  </p>
                </div>
              </div>

              <div className="mt-4">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-medium text-[var(--neutral-600)]">Progreso de cobro</span>
                  <span className="text-xs font-medium text-[var(--neutral-700)] tabular-nums">
                    {porcentajeAbonado.toFixed(0)}%
                  </span>
                </div>
                <div className="w-full bg-[var(--neutral-100)] rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-[var(--brand-morena)] h-2 rounded-full transition-all"
                    style={{ width: `${porcentajeAbonado}%` }}
                  />
                </div>
              </div>
            </section>

            {cobro.pagos.length > 0 && (
              <section className="rounded-[var(--radius-lg)] border border-[var(--neutral-200)] bg-white overflow-hidden">
                <div className="px-6 py-4 border-b border-[var(--neutral-100)]">
                  <p className="text-[11px] font-medium uppercase tracking-wider text-[var(--neutral-500)]">
                    Historial de pagos
                  </p>
                </div>
                <table className="w-full">
                  <thead className="bg-[var(--neutral-50)] border-b border-[var(--neutral-100)]">
                    <tr>
                      <th className="px-6 py-2.5 text-left text-[11px] font-medium uppercase tracking-wider text-[var(--neutral-600)]">Fecha</th>
                      <th className="px-6 py-2.5 text-right text-[11px] font-medium uppercase tracking-wider text-[var(--neutral-600)]">Monto</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--neutral-100)]">
                    {cobro.pagos.map((pago) => (
                      <tr key={pago.id}>
                        <td className="px-6 py-3 text-sm text-[var(--neutral-700)]">{formatFecha(pago.fecha)}</td>
                        <td className="px-6 py-3 text-right text-sm font-medium text-[var(--neutral-900)] tabular-nums">
                          {formatMonto(Number(pago.monto))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </section>
            )}
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
