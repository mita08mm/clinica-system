'use client';

import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';

export interface PrescripcionItem {
  id: string;
  nombre: string;
  indicaciones: string;
}

export interface Prescripcion {
  id: string;
  nombre?: string;
  fecha?: string;
  items: PrescripcionItem[];
}

export interface NuevaPrescripcionItem {
  nombre: string;
  indicaciones: string;
}

export function usePacienteProtocolos(pacienteId: string) {
  const [prescripciones, setPrescripciones] = useState<Prescripcion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPrescripciones = useCallback(async () => {
    if (!pacienteId) return;
    try {
      setIsLoading(true);
      setError(null);
      const data = await api.get<unknown[]>(`/pacientes/${pacienteId}/protocolos`);
      setPrescripciones(normalizePrescriptions(data));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar prescripciones');
    } finally {
      setIsLoading(false);
    }
  }, [pacienteId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchPrescripciones();
  }, [fetchPrescripciones]);

  const crearPrescripcion = useCallback(
    async (items: NuevaPrescripcionItem[]) => {
      if (items.length === 0) throw new Error('Agregue al menos un item');

      await api.post('/protocolos', {
        pacienteId,
        nombre: buildPrescriptionName(items),
        items,
      });

      await fetchPrescripciones();
    },
    [pacienteId, fetchPrescripciones],
  );

  return { prescripciones, isLoading, error, refresh: fetchPrescripciones, crearPrescripcion };
}

function buildPrescriptionName(items: NuevaPrescripcionItem[]): string {
  if (items.length === 1) return items[0].nombre;
  return `${items[0].nombre} y ${items.length - 1} más`;
}

function normalizePrescriptions(data: unknown[]): Prescripcion[] {
  return (data as Array<Record<string, unknown>>).map((raw) => ({
    id: String(raw.id ?? ''),
    nombre: raw.nombre as string | undefined,
    fecha: (raw.fecha ?? raw.createdAt) as string | undefined,
    items: (raw.items as Array<Record<string, unknown>> | undefined)?.map((item) => ({
      id: String(item.id ?? ''),
      nombre: String(item.nombre ?? ''),
      indicaciones: String(item.indicaciones ?? item.instrucciones ?? ''),
    })) ?? [],
  }));
}
