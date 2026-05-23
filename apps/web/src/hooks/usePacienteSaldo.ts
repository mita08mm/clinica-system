'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

export function usePacienteSaldo(pacienteId: string) {
  const [saldo, setSaldo] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!pacienteId) return;
    let cancelled = false;
    (async () => {
      try {
        setIsLoading(true);
        const data = await api.get<{ saldo?: number }>(`/pacientes/${pacienteId}/saldo`);
        if (!cancelled) setSaldo(Number(data?.saldo ?? 0));
      } catch {
        if (!cancelled) setSaldo(0);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [pacienteId]);

  return { saldo, isLoading };
}
