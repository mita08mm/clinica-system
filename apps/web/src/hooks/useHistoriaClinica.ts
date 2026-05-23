import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api/client';
import { HistoriaClinica } from '@/types/historia';

export function useHistoriaClinica(pacienteId: string) {
  const [historia, setHistoria] = useState<HistoriaClinica | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchHistoria = useCallback(async () => {
    if (!pacienteId) return;

    try {
      setIsLoading(true);
      const data = await api.get<HistoriaClinica>(`/pacientes/${pacienteId}/historia-clinica`);
      setHistoria(data);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setIsLoading(false);
    }
  }, [pacienteId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchHistoria();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { historia, isLoading, error, refresh: fetchHistoria };
}
