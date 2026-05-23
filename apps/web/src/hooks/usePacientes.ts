'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

export interface Paciente {
  id: string;
  nombre: string;
  apellido: string;
  documento: string;
  tipoDocumento: string;
  telefono: string;
  email?: string;
  estado: string;
  fechaNacimiento: string;
}

export function usePacientes() {
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await api.get<Paciente[]>('/pacientes');
        if (!cancelled) setPacientes(data);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Error al cargar pacientes');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return { pacientes, isLoading, error };
}
