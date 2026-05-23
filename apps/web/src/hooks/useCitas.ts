'use client';

import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';

export interface Cita {
  id: string;
  pacienteId: string;
  fecha: string;
  horaInicio: string;
  horaFin: string;
  motivo: string;
  estado: string;
  notas?: string;
  paciente: {
    id: string;
    nombre: string;
    apellido: string;
    telefono: string;
    email?: string;
  };
}

export function useCitas() {
  const [citas, setCitas] = useState<Cita[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setError(null);
      const data = await api.get<Cita[]>('/citas');
      setCitas(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar citas');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await api.get<Cita[]>('/citas');
        if (!cancelled) setCitas(data);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Error al cargar citas');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const removeCita = useCallback((id: string) => {
    setCitas((prev) => prev.filter((c) => c.id !== id));
  }, []);

  return { citas, isLoading, error, refresh, removeCita };
}
