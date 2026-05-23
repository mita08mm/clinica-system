'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

export interface CobroResumen {
  id: string;
  fecha: string;
  total: number;
  paciente: {
    id: string;
    nombre: string;
    apellido: string;
    documento: string;
    tipoDocumento: string;
  };
  items?: Array<{ id: string; nombre: string }>;
  pagos: Array<{ monto: number }>;
}

export function useCobros() {
  const [cobros, setCobros] = useState<CobroResumen[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await api.get<CobroResumen[]>('/cobros');
        if (!cancelled) setCobros(data);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Error al cargar cobros');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return { cobros, isLoading, error };
}
