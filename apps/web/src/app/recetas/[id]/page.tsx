'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { api } from '@/lib/api';
import { formatFecha } from '@/lib/utils/date';

interface Prescripcion {
  id: string;
  fecha: string;
  nombre: string;
  paciente: {
    id: string;
    nombre: string;
    apellido: string;
  };
  items: Array<{
    id: string;
    nombre: string;
    indicaciones: string;
  }>;
}

function RecetaDetailContent() {
  const params = useParams();
  const recetaId = params.id as string;

  const [prescripcion, setPrescripcion] = useState<Prescripcion | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchPrescripcion = async () => {
      try {
        const data = await api.get(`/protocolos/${recetaId}`);
        setPrescripcion(normalizePrescripcion(data));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error desconocido');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPrescripcion();
  }, [recetaId]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px] text-sm text-[var(--neutral-500)]">
        Cargando prescripción...
      </div>
    );
  }

  if (error || !prescripcion) {
    return (
      <div className="rounded-md border border-[rgba(181,58,58,0.2)] bg-[var(--semantic-danger-bg)] px-4 py-3 text-sm text-[var(--semantic-danger)]">
        {error || 'Prescripción no encontrada'}
      </div>
    );
  }

  return (
    <div className="max-w-4xl">
      <PageHeader
        overline="Recetas"
        title="Prescripción"
        subtitle={prescripcion.nombre}
        backHref="/recetas"
        actions={(
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 h-9 px-4 rounded-md border border-[var(--neutral-300)] text-sm font-medium text-[var(--neutral-700)] hover:bg-[var(--neutral-50)] transition-colors"
          >
            Imprimir
          </button>
        )}
      />

      <div className="space-y-5">
        <section className="rounded-[var(--radius-lg)] border border-[var(--neutral-200)] bg-white p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wider text-[var(--neutral-500)]">Paciente</p>
              <p className="mt-0.5 text-base font-medium text-[var(--neutral-900)]">
                {prescripcion.paciente.nombre} {prescripcion.paciente.apellido}
              </p>
            </div>
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wider text-[var(--neutral-500)]">Fecha</p>
              <p className="mt-0.5 text-base font-medium text-[var(--neutral-900)]">{formatFecha(prescripcion.fecha)}</p>
            </div>
          </div>
        </section>

        <section className="rounded-[var(--radius-lg)] border border-[var(--neutral-200)] bg-white overflow-hidden">
          <div className="px-6 py-4 border-b border-[var(--neutral-100)]">
            <p className="text-[11px] font-medium uppercase tracking-wider text-[var(--neutral-500)]">Items prescritos</p>
          </div>
          <table className="w-full">
            <thead className="bg-[var(--neutral-50)] border-b border-[var(--neutral-100)]">
              <tr>
                <th className="px-6 py-2.5 text-left text-[11px] font-medium uppercase tracking-wider text-[var(--neutral-600)] w-[260px]">Producto</th>
                <th className="px-6 py-2.5 text-left text-[11px] font-medium uppercase tracking-wider text-[var(--neutral-600)]">Indicaciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--neutral-100)]">
              {prescripcion.items.map((item) => (
                <tr key={item.id}>
                  <td className="px-6 py-3 text-sm font-medium text-[var(--neutral-900)]">{item.nombre}</td>
                  <td className="px-6 py-3 text-sm text-[var(--neutral-700)]">{item.indicaciones || <span className="italic text-[var(--neutral-400)]">Sin indicaciones</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>
    </div>
  );
}

function normalizePrescripcion(entry: unknown): Prescripcion {
  const raw = entry as {
    id?: string;
    fecha?: string;
    nombre?: string;
    paciente?: { id?: string; nombre?: string; apellido?: string };
    items?: Array<{ id?: string; nombre?: string; indicaciones?: string; aplicacion?: string; frecuencia?: string }>;
  };

  return {
    id: raw.id ?? '',
    fecha: raw.fecha ?? new Date().toISOString(),
    nombre: raw.nombre ?? 'Prescripción',
    paciente: {
      id: raw.paciente?.id ?? '',
      nombre: raw.paciente?.nombre ?? 'Paciente',
      apellido: raw.paciente?.apellido ?? '',
    },
    items: (raw.items ?? []).map((item, index) => ({
      id: item.id ?? `item-${index}`,
      nombre: item.nombre ?? 'Item',
      indicaciones: item.indicaciones ?? item.aplicacion ?? item.frecuencia ?? '',
    })),
  };
}

export default function RecetaDetailPage() {
  return (
    <ProtectedRoute>
      <DashboardLayout>
        <RecetaDetailContent />
      </DashboardLayout>
    </ProtectedRoute>
  );
}
