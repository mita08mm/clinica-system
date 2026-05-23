'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { apiEndpoint } from '@/lib/config';
import PanelFrame from './PanelFrame';
import { Button, Input, Label } from '@/components/ui';

interface PagosHistoryProps {
  pacienteId: string;
}

interface CobroRecord {
  id: string;
  titulo: string;
  tipo: 'SERVICIO' | 'PRODUCTO';
  costo: number;
  pagado: number;
  pendiente: number;
  total: number;
}

interface CobroForm {
  titulo: string;
  costo: string;
  pagado: string;
}

const initialForm: CobroForm = {
  titulo: '',
  costo: '',
  pagado: '',
};

export default function PagosHistory({ pacienteId }: PagosHistoryProps) {
  const [cobros, setCobros] = useState<CobroRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState<CobroForm>(initialForm);

  const fetchCobros = useCallback(async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(apiEndpoint(`/cobros?pacienteId=${pacienteId}`), {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error('Error al cargar cobros');
      }

      const data = await response.json();
      setCobros(normalizeCobros(data.data || []));
    } catch (err) {
      console.error('Error cargando historial de cobros:', err);
    } finally {
      setIsLoading(false);
    }
  }, [pacienteId]);

  useEffect(() => {
    void (async () => {
      await fetchCobros();
    })();
  }, [fetchCobros]);

  const resumenActual = useMemo(() => {
    const costo = Number(form.costo) || 0;
    const pagado = Number(form.pagado) || 0;

    return {
      total: costo,
      pendiente: Math.max(costo - pagado, 0),
    };
  }, [form.costo, form.pagado]);

  const handleChange = (field: keyof CobroForm, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
    setError('');
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setForm(initialForm);
    setError('');
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    const titulo = form.titulo.trim();
    const costo = Number(form.costo);
    const pagado = Number(form.pagado || 0);

    if (!titulo) {
      setError('Ingrese un titulo');
      return;
    }

    if (Number.isNaN(costo) || costo <= 0) {
      setError('El costo debe ser mayor a 0');
      return;
    }

    if (Number.isNaN(pagado) || pagado < 0) {
      setError('Lo pagado no puede ser negativo');
      return;
    }

    if (pagado > costo) {
      setError('Lo pagado no puede ser mayor al total');
      return;
    }

    setIsSaving(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const createResponse = await fetch(apiEndpoint('/cobros'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          pacienteId,
          items: [
            {
              tipo: 'PAQUETE',
              nombre: titulo,
              cantidad: 1,
              precioUnitario: costo,
            },
          ],
        }),
      });

      const createData = await createResponse.json();

      if (!createResponse.ok) {
        throw new Error(createData.error || 'Error al registrar cobro');
      }

      const cobroId = createData.data?.id as string | undefined;

      if (pagado > 0 && cobroId) {
        const paymentResponse = await fetch(apiEndpoint(`/cobros/${cobroId}/pago`), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            monto: pagado,
            metodoPago: 'EFECTIVO',
            notas: 'Registro manual desde historia del paciente',
          }),
        });

        const paymentData = await paymentResponse.json();

        if (!paymentResponse.ok) {
          throw new Error(paymentData.error || 'Error al registrar pago');
        }
      }

      handleCloseModal();
      await fetchCobros();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar cobro');
    } finally {
      setIsSaving(false);
    }
  };

  const formatCurrency = (amount: number) => `Bs. ${amount.toFixed(2)}`;

  return (
    <PanelFrame
      title="Registro de cobros"
      action={
        <button
          onClick={() => setShowModal(true)}
          className="rounded-lg p-1.5 text-marengo transition-colors hover:bg-stone-100 hover:text-concreto"
          title="Agregar registro de cobro"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
      }
    >
      <div className="space-y-4">
        {isLoading ? (
          <div className="text-center py-8">
            <div className="mx-auto h-8 w-8 animate-spin rounded-lg border-b-2 border-gray-400"></div>
            <p className="mt-2 text-xs text-gray-400">Cargando registro de cobros...</p>
          </div>
        ) : cobros.length === 0 ? (
          <div className="rounded-lg bg-gradient-to-br from-stone-50 to-white border border-stone-200 px-6 py-10 text-center">
            <svg className="mx-auto h-12 w-12 text-stone-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="mt-4 text-sm font-medium text-concreto">Sin registros de cobro</p>
            <p className="mt-1 text-xs text-marengo">Presiona el botón + para crear el primer registro</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="hidden grid-cols-[minmax(0,2fr)_repeat(5,1fr)] gap-4 border-b border-stone-200 pb-3 text-[11px] font-semibold uppercase tracking-wider text-marengo/80 sm:grid">
              <p>Título</p>
              <p className="text-center">Tipo</p>
              <p className="text-right">Costo</p>
              <p className="text-right">Pagado</p>
              <p className="text-right">Pendiente</p>
              <p className="text-right">Total</p>
            </div>

            {cobros.map((cobro) => (
              <div key={cobro.id} className="grid grid-cols-1 gap-3 border-b border-stone-100 py-4 sm:grid-cols-[minmax(0,2fr)_repeat(5,1fr)] sm:gap-4">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-marengo/60 sm:hidden mb-1">Título</p>
                  <p className="text-sm font-medium text-concreto">{cobro.titulo}</p>
                </div>

                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-marengo/60 sm:hidden mb-1">Tipo</p>
                  <p className="text-sm text-marengo sm:text-center">
                    <span className="inline-block px-2 py-0.5 bg-stone-100 rounded text-xs">
                      {cobro.tipo === 'SERVICIO' ? 'Servicio' : 'Producto'}
                    </span>
                  </p>
                </div>

                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-marengo/60 sm:hidden mb-1">Costo</p>
                  <p className="text-sm font-medium text-concreto sm:text-right">{formatCurrency(cobro.costo)}</p>
                </div>

                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-marengo/60 sm:hidden mb-1">Pagado</p>
                  <p className="text-sm font-medium text-green-700 sm:text-right">{formatCurrency(cobro.pagado)}</p>
                </div>

                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-marengo/60 sm:hidden mb-1">Pendiente</p>
                  <p className={`text-sm font-semibold sm:text-right ${cobro.pendiente > 0 ? 'text-red-600' : 'text-green-700'}`}>
                    {formatCurrency(cobro.pendiente)}
                  </p>
                </div>

                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-marengo/60 sm:hidden mb-1">Total</p>
                  <p className="text-sm font-semibold text-concreto sm:text-right">{formatCurrency(cobro.total)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-concreto/15 p-4 backdrop-blur-[2px]">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white shadow-xl">
            <div className="sticky top-0 border-b border-gray-200 bg-white px-6 py-4">
              <div className="flex items-center justify-between">
                <h3 className="font-serif text-xl font-light text-gray-900">Nuevo registro de cobro</h3>
                <button
                  onClick={handleCloseModal}
                  className="rounded-lg p-2 transition-colors hover:bg-gray-100"
                >
                  <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 p-6">
              {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">
                  {error}
                </div>
              )}

              <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-marengo/75">
                Entrada
              </p>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <Label htmlFor="titulo" required>Titulo</Label>
                  <Input
                    id="titulo"
                    value={form.titulo}
                    onChange={(event) => handleChange('titulo', event.target.value)}
                    placeholder="Ej: Limpieza facial, serum reparador"
                  />
                </div>

                <div>
                  <Label htmlFor="costo" required>Costo</Label>
                  <Input
                    id="costo"
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.costo}
                    onChange={(event) => handleChange('costo', event.target.value)}
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <Label htmlFor="pagado">Lo que me pago</Label>
                  <Input
                    id="pagado"
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.pagado}
                    onChange={(event) => handleChange('pagado', event.target.value)}
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <Label>Total</Label>
                  <div className="rounded-lg border border-stone-200 bg-stone-50 px-4 py-2.5 text-sm text-concreto">
                    {formatCurrency(resumenActual.total)}
                  </div>
                </div>

                <div>
                  <Label>Pendiente</Label>
                  <div className="rounded-lg border border-stone-200 bg-stone-50 px-4 py-2.5 text-sm text-concreto">
                    {formatCurrency(resumenActual.pendiente)}
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 border-t border-gray-200 pt-4">
                <Button type="button" onClick={handleCloseModal} variant="outline">
                  Cancelar
                </Button>
                <Button type="submit" disabled={isSaving} variant="primary">
                  {isSaving ? 'Guardando...' : 'Guardar registro'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </PanelFrame>
  );
}

function normalizeCobros(data: unknown[]): CobroRecord[] {
  return data.flatMap((entry, index) => {
    const rawCobro = entry as {
      id?: string;
      total?: number | string;
      items?: Array<{
        id?: string;
        tipo?: string;
        nombre?: string;
        precioUnitario?: number | string;
        cantidad?: number;
      }>;
      pagos?: Array<{
        monto?: number | string;
      }>;
    };

    const total = Number(rawCobro.total ?? 0);
    
    // Calcular total pagado desde el array de pagos
    const pagado = (rawCobro.pagos ?? []).reduce((sum, pago) => {
      return sum + Number(pago.monto ?? 0);
    }, 0);
    
    const saldo = Math.max(total - pagado, 0);

    if (!rawCobro.items || rawCobro.items.length === 0) {
      return [
        {
          id: rawCobro.id ?? `cobro-${index}`,
          titulo: 'Cobro',
          tipo: 'SERVICIO',
          costo: total,
          pagado,
          pendiente: saldo,
          total,
        },
      ];
    }

    return rawCobro.items.map((item, itemIndex) => ({
      id: item.id ?? `${rawCobro.id ?? index}-${itemIndex}`,
      titulo: item.nombre ?? 'Cobro',
      tipo: (item.tipo === 'PRODUCTO' ? 'PRODUCTO' : 'SERVICIO') as 'SERVICIO' | 'PRODUCTO',
      costo: Number(item.precioUnitario ?? 0) * Number(item.cantidad ?? 1),
      pagado,
      pendiente: saldo,
      total,
    }));
  });
}
