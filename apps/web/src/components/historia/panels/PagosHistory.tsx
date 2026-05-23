'use client';

import { useState, useEffect } from 'react';
import { apiEndpoint } from '@/lib/config';
import PanelFrame from './PanelFrame';

interface PagosHistoryProps {
  pacienteId: string;
}

interface Pago {
  id: string;
  fecha: string;
  monto: number;
  metodoPago: string;
  referencia?: string;
}

interface Cobro {
  id: string;
  fecha: string;
  subtotal: number;
  descuento: number;
  total: number;
  estado: string;
  pagado: number;
  saldo: number;
  pagos: Pago[];
  tratamiento?: {
    id: string;
    nombreTratamiento: string;
    objetivo: string;
  };
}

export default function PagosHistory({ pacienteId }: PagosHistoryProps) {
  const [cobros, setCobros] = useState<Cobro[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    const fetchCobros = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(apiEndpoint(`/pacientes/${pacienteId}/cobros`), {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.ok) {
          const data = await response.json();
          setCobros(data.data || []);
        }
      } catch (err) {
        console.error('Error cargando historial de pagos:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCobros();
  }, [pacienteId]);

  const formatCurrency = (amount: number) => {
    return `Bs. ${amount.toFixed(2)}`;
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const getEstadoBadge = (saldo: number, estado: string) => {
    if (estado === 'PAGADO' || saldo === 0) {
      return <span className="px-2 py-0.5 text-xs font-medium bg-green-100 text-green-700 rounded">Pagado</span>;
    }
    if (estado === 'PARCIAL') {
      return <span className="px-2 py-0.5 text-xs font-medium bg-amber-100 text-amber-700 rounded">Parcial</span>;
    }
    return <span className="px-2 py-0.5 text-xs font-medium bg-red-100 text-red-700 rounded">Pendiente</span>;
  };

  const cobrosAMostrar = showAll ? cobros : cobros.slice(0, 5);

  if (loading) {
    return (
      <PanelFrame title="Historial de Pagos">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            <div className="h-12 bg-gray-100 rounded"></div>
            <div className="h-12 bg-gray-100 rounded"></div>
          </div>
        </div>
      </PanelFrame>
    );
  }

  return (
    <PanelFrame
      title="Historial de Pagos"
      action={<span className="text-xs text-gray-500">{cobros.length} registros</span>}
    >

      <div className="space-y-4">
        {cobrosAMostrar.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-sm text-gray-400">Sin registros de pagos</p>
          </div>
        ) : (
          cobrosAMostrar.map((cobro) => (
            <div key={cobro.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
              {/* Header del cobro */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="text-sm font-medium text-gray-900">
                      {cobro.tratamiento?.nombreTratamiento || 'Servicios varios'}
                    </h4>
                    {getEstadoBadge(cobro.saldo, cobro.estado)}
                  </div>
                  <p className="text-xs text-gray-500">{formatDate(cobro.fecha)}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-900">{formatCurrency(cobro.total)}</p>
                  {cobro.descuento > 0 && (
                    <p className="text-xs text-gray-500">Desc: {formatCurrency(cobro.descuento)}</p>
                  )}
                </div>
              </div>

              {/* Resumen de pagos */}
              <div className="grid grid-cols-3 gap-3 pt-3 border-t border-gray-100">
                <div>
                  <p className="text-xs text-gray-500">Total</p>
                  <p className="text-sm font-medium text-gray-900">{formatCurrency(cobro.total)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Pagado</p>
                  <p className="text-sm font-medium text-green-600">{formatCurrency(cobro.pagado)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Saldo</p>
                  <p className={`text-sm font-medium ${cobro.saldo > 0 ? 'text-red-600' : 'text-gray-400'}`}>
                    {formatCurrency(cobro.saldo)}
                  </p>
                </div>
              </div>

              {/* Detalle de pagos si existen */}
              {cobro.pagos.length > 0 && (
                <details className="mt-3">
                  <summary className="text-xs text-gray-600 cursor-pointer hover:text-gray-900">
                    Ver {cobro.pagos.length} pago(s)
                  </summary>
                  <div className="mt-2 space-y-2 pl-3 border-l-2 border-gray-200">
                    {cobro.pagos.map((pago) => (
                      <div key={pago.id} className="flex items-center justify-between text-xs">
                        <div>
                          <span className="text-gray-600">{formatDate(pago.fecha)}</span>
                          <span className="mx-2 text-gray-400">•</span>
                          <span className="text-gray-500">{pago.metodoPago}</span>
                          {pago.referencia && (
                            <span className="ml-2 text-gray-400">({pago.referencia})</span>
                          )}
                        </div>
                        <span className="font-medium text-green-600">{formatCurrency(pago.monto)}</span>
                      </div>
                    ))}
                  </div>
                </details>
              )}
            </div>
          ))
        )}

        {cobros.length > 5 && (
          <button
            onClick={() => setShowAll(!showAll)}
            className="w-full text-xs text-gray-500 hover:text-gray-700 pt-3 transition-colors"
          >
            {showAll ? 'Ver menos' : `Ver todos (${cobros.length})`} →
          </button>
        )}
      </div>
    </PanelFrame>
  );
}
