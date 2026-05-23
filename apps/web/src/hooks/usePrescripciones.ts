'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

export interface Prescripcion {
  id: string;
  fecha: string;
  nombre: string;
  paciente: { id: string; nombre: string; apellido: string };
  items: Array<{ id: string; nombre: string; indicaciones: string }>;
}

interface RawPrescripcion {
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
}

function normalize(data: RawPrescripcion[]): Prescripcion[] {
  return data.map((raw, index) => {
    const items = (raw.items ?? []).map((item, itemIndex) => ({
      id: item.id ?? `${raw.id ?? index}-${itemIndex}`,
      nombre: item.nombre ?? 'Item',
      indicaciones: item.indicaciones ?? item.aplicacion ?? item.frecuencia ?? '',
    }));
    return {
      id: raw.id ?? `prescripcion-${index}`,
      fecha: raw.fecha ?? new Date().toISOString(),
      nombre: raw.nombre ?? (items[0]?.nombre || 'Prescripción'),
      paciente: {
        id: raw.paciente?.id ?? '',
        nombre: raw.paciente?.nombre ?? 'Paciente',
        apellido: raw.paciente?.apellido ?? '',
      },
      items,
    };
  });
}

export function usePrescripciones() {
  const [prescripciones, setPrescripciones] = useState<Prescripcion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await api.get<RawPrescripcion[]>('/protocolos');
        if (!cancelled) setPrescripciones(normalize(data));
      } catch (err) {
        if (!cancelled)
          setError(err instanceof Error ? err.message : 'Error al cargar prescripciones');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return { prescripciones, isLoading, error };
}
