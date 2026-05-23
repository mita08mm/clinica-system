'use client';

import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';

export interface CobroItem {
  id?: string;
  tipo?: string;
  nombre?: string;
  precioUnitario?: number | string;
  cantidad?: number;
}

export interface CobroPago {
  monto?: number | string;
}

export interface CobroRaw {
  id?: string;
  total?: number | string;
  items?: CobroItem[];
  pagos?: CobroPago[];
}

export interface CobroRow {
  id: string;
  cobroId: string;
  titulo: string;
  tipo: 'SERVICIO' | 'PRODUCTO';
  costo: number;
  pagado: number;
  pendiente: number;
  total: number;
}

export interface CobroTotales {
  costoTotal: number;
  pagadoTotal: number;
  pendienteTotal: number;
}

export interface CrearCobroPayload {
  titulo: string;
  costo: number;
  pagado: number;
}

export function usePacienteCobros(pacienteId: string) {
  const [cobros, setCobros] = useState<CobroRow[]>([]);
  const [totales, setTotales] = useState<CobroTotales>({ costoTotal: 0, pagadoTotal: 0, pendienteTotal: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCobros = useCallback(async () => {
    if (!pacienteId) return;
    try {
      setIsLoading(true);
      setError(null);
      const data = await api.get<CobroRaw[]>('/cobros', { params: { pacienteId } });
      const rows = normalizeCobros(data);
      setCobros(rows);
      setTotales(calcularTotales(rows));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar cobros');
    } finally {
      setIsLoading(false);
    }
  }, [pacienteId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchCobros();
  }, [fetchCobros]);

  const crearCobro = useCallback(
    async ({ titulo, costo, pagado }: CrearCobroPayload) => {
      const cobro = await api.post<{ id: string }>('/cobros', {
        pacienteId,
        items: [{ tipo: 'PAQUETE', nombre: titulo, cantidad: 1, precioUnitario: costo }],
      });

      if (pagado > 0 && cobro?.id) {
        await api.post(`/cobros/${cobro.id}/pago`, {
          monto: pagado,
          metodoPago: 'EFECTIVO',
          notas: 'Registro manual desde historia del paciente',
        });
      }

      await fetchCobros();
    },
    [pacienteId, fetchCobros],
  );

  return { cobros, totales, isLoading, error, refresh: fetchCobros, crearCobro };
}

function normalizeCobros(data: CobroRaw[]): CobroRow[] {
  return data.flatMap((raw, index) => {
    const total = Number(raw.total ?? 0);
    const pagado = (raw.pagos ?? []).reduce((sum, p) => sum + Number(p.monto ?? 0), 0);
    const pendiente = Math.max(total - pagado, 0);
    const cobroId = raw.id ?? `cobro-${index}`;

    if (!raw.items || raw.items.length === 0) {
      return [{ id: cobroId, cobroId, titulo: 'Cobro', tipo: 'SERVICIO', costo: total, pagado, pendiente, total }];
    }

    return raw.items.map((item, itemIndex) => ({
      id: item.id ?? `${cobroId}-${itemIndex}`,
      cobroId,
      titulo: item.nombre ?? 'Cobro',
      tipo: (item.tipo === 'PRODUCTO' ? 'PRODUCTO' : 'SERVICIO') as 'SERVICIO' | 'PRODUCTO',
      costo: Number(item.precioUnitario ?? 0) * Number(item.cantidad ?? 1),
      pagado,
      pendiente,
      total,
    }));
  });
}

function calcularTotales(rows: CobroRow[]): CobroTotales {
  const seen = new Set<string>();
  let costoTotal = 0;
  let pagadoTotal = 0;
  let pendienteTotal = 0;

  rows.forEach((row) => {
    costoTotal += row.costo;
    if (!seen.has(row.cobroId)) {
      seen.add(row.cobroId);
      pagadoTotal += row.pagado;
      pendienteTotal += row.pendiente;
    }
  });

  return { costoTotal, pagadoTotal, pendienteTotal };
}
