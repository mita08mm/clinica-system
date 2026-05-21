import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { apiEndpoint } from '@/lib/config';
import { HistoriaClinica } from '@/types/historia';

export function useHistoriaClinica(pacienteId: string) {
  const { token } = useAuth();
  const [historia, setHistoria] = useState<HistoriaClinica | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token || !pacienteId) return;

    const fetchHistoria = async () => {
      try {
        const response = await fetch(
          apiEndpoint(`/pacientes/${pacienteId}/historia-clinica`),
          {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error('Error al cargar historia clínica');
        }

        const data = await response.json();
        setHistoria(data.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error desconocido');
      } finally {
        setIsLoading(false);
      }
    };

    fetchHistoria();
  }, [pacienteId, token]);

  return { historia, isLoading, error };
}
