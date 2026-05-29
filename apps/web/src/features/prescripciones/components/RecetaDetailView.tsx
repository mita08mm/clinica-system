'use client';

import { useState, useEffect } from 'react';
import { PageHeader } from '@/shared/layout/PageHeader';
import { alertError, Overline, Button } from '@/shared/ui';
import { api } from '@/shared/api';
import { formatFecha } from '@/shared/utils/date';

interface Prescripcion {
  id: string;
  fecha: string;
  nombre: string;
  paciente: { id: string; nombre: string; apellido: string };
  items: Array<{ id: string; nombre: string; indicaciones: string }>;
}

function normalize(entry: unknown): Prescripcion {
  const raw = entry as {
    id?: string;
    fecha?: string;
    nombre?: string;
    paciente?: { id?: string; nombre?: string; apellido?: string };
    items?: Array<{
      id?: string;
      nombre?: string;
      indicaciones?: string;
      aplicacion?: string;
      frecuencia?: string;
    }>;
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
    items: (raw.items ?? []).map((item, idx) => ({
      id: item.id ?? `item-${idx}`,
      nombre: item.nombre ?? 'Item',
      indicaciones: item.indicaciones ?? item.aplicacion ?? item.frecuencia ?? '',
    })),
  };
}

export function RecetaDetailView({ recetaId }: { recetaId: string }) {
  const [prescripcion, setPrescripcion] = useState<Prescripcion | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const data = await api.get(`/prescripciones/${recetaId}`);
        setPrescripcion(normalize(data));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error desconocido');
      } finally {
        setIsLoading(false);
      }
    })();
  }, [recetaId]);

  if (isLoading) {
    return (
      <div className="subtitle flex min-h-[400px] items-center justify-center">
        Cargando prescripción...
      </div>
    );
  }

  if (error || !prescripcion) {
    return <div className={alertError}>{error || 'Prescripción no encontrada'}</div>;
  }

  return (
    <div className="max-w-4xl">
      <PageHeader
        overline="Recetas"
        title="Prescripción"
        subtitle={prescripcion.nombre}
        backHref="/prescripciones"
        actions={
          <Button type="button" variant="secondary" size="sm" onClick={() => window.print()}>
            Imprimir
          </Button>
        }
      />

      <div className="space-y-5">
        <section className="surface p-6">
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <div>
              <Overline>Paciente</Overline>
              <p className="mt-0.5 text-base font-medium text-neutral-900">
                {prescripcion.paciente.nombre} {prescripcion.paciente.apellido}
              </p>
            </div>
            <div>
              <Overline>Fecha</Overline>
              <p className="mt-0.5 text-base font-medium text-neutral-900">
                {formatFecha(prescripcion.fecha)}
              </p>
            </div>
          </div>
        </section>

        <section className="surface overflow-hidden">
          <div className="border-b border-neutral-100 px-6 py-4">
            <Overline>Items prescritos</Overline>
          </div>
          <table className="w-full">
            <thead className="border-b border-neutral-100 bg-neutral-50">
              <tr>
                <Overline as="th" className="w-[260px] px-6 py-2.5 text-left">
                  Producto
                </Overline>
                <Overline as="th" className="px-6 py-2.5 text-left">
                  Indicaciones
                </Overline>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {prescripcion.items.map((item) => (
                <tr key={item.id}>
                  <td className="body-strong px-6 py-3 text-neutral-900">{item.nombre}</td>
                  <td className="body px-6 py-3">
                    {item.indicaciones || (
                      <span className="text-neutral-400 italic">Sin indicaciones</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>
    </div>
  );
}
