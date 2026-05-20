'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Link from 'next/link';
import { apiEndpoint } from '@/lib/config';

interface Paciente {
  id: string;
  nombre: string;
  apellido: string;
  documento: string;
  tipoDocumento: string;
}

interface ItemCobro {
  id: string;
  tipo: string;
  nombre: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
}

interface Pago {
  id: string;
  fecha: string;
  monto: number;
  metodoPago: string;
  referencia?: string;
  notas?: string;
}

interface Cobro {
  id: string;
  fecha: string;
  subtotal: number;
  descuento: number;
  total: number;
  estado: string;
  notas?: string;
  paciente: Paciente;
  items: ItemCobro[];
  pagos: Pago[];
}

export default function CobroDetailPage() {
  const params = useParams();
  const { token } = useAuth();
  const [cobro, setCobro] = useState<Cobro | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Estado para registrar pago
  const [mostrarFormPago, setMostrarFormPago] = useState(false);
  const [procesandoPago, setProcesandoPago] = useState(false);
  const [monto, setMonto] = useState('');
  const [metodoPago, setMetodoPago] = useState('EFECTIVO');
  const [referencia, setReferencia] = useState('');
  const [notasPago, setNotasPago] = useState('');

  useEffect(() => {
    if (!token) return;
    
    let mounted = true;
    
    const loadCobro = async () => {
      try {
        const response = await fetch(apiEndpoint(`/cobros/${params.id}`), {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Error al cargar el cobro');
        }

        const data = await response.json();
        if (mounted) {
          setCobro(data.data);
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Error desconocido');
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };
    
    loadCobro();
    
    return () => {
      mounted = false;
    };
  }, [token, params.id]);

  const formatFecha = (fecha: string) => {
    return new Date(fecha).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const formatMonto = (monto: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'USD',
    }).format(monto);
  };

  const calcularPagado = () => {
    if (!cobro) return 0;
    return cobro.pagos.reduce((sum, pago) => sum + Number(pago.monto), 0);
  };

  const calcularSaldo = () => {
    return Number(cobro?.total || 0) - calcularPagado();
  };

  const getEstadoColor = (estado: string) => {
    const colors: Record<string, string> = {
      PENDIENTE: 'bg-red-100 text-red-800 border-red-200',
      PARCIAL: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      PAGADO: 'bg-green-100 text-green-800 border-green-200',
      CANCELADO: 'bg-gray-100 text-gray-800 border-gray-200',
    };
    return colors[estado] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const handleRegistrarPago = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const montoNumerico = parseFloat(monto);
    const saldoPendiente = calcularSaldo();

    if (montoNumerico <= 0) {
      setError('El monto debe ser mayor a 0');
      return;
    }

    if (montoNumerico > saldoPendiente) {
      setError(`El monto no puede superar el saldo pendiente (${formatMonto(saldoPendiente)})`);
      return;
    }

    setProcesandoPago(true);

    try {
      const response = await fetch(apiEndpoint(`/cobros/${params.id}/pago`), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          monto: montoNumerico,
          metodoPago,
          referencia: referencia || undefined,
          notas: notasPago || undefined,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Error al registrar pago');
      }

      // Refrescar datos del cobro
      const refetchResponse = await fetch(apiEndpoint(`/cobros/${params.id}`), {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (refetchResponse.ok) {
        const refetchData = await refetchResponse.json();
        setCobro(refetchData.data);
      }

      // Limpiar formulario
      setMonto('');
      setReferencia('');
      setNotasPago('');
      setMostrarFormPago(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setProcesandoPago(false);
    }
  };

  if (isLoading) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="flex justify-center items-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-morena mx-auto mb-4"></div>
              <p className="text-marengo">Cargando cobro...</p>
            </div>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  if (error && !cobro) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  if (!cobro) return null;

  const saldoPendiente = calcularSaldo();
  const puedePagar = cobro.estado !== 'PAGADO' && cobro.estado !== 'CANCELADO';

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="max-w-5xl space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/cobros" className="text-marengo hover:text-concreto">
                ← Volver
              </Link>
              <div>
                <h1 className="text-3xl font-heading font-bold text-concreto">
                  Detalle de Cobro
                </h1>
                <p className="text-marengo mt-1">
                  {formatFecha(cobro.fecha)}
                </p>
              </div>
            </div>
            <span className={`px-4 py-2 rounded-full text-sm font-medium border ${getEstadoColor(cobro.estado)}`}>
              {cobro.estado}
            </span>
          </div>

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Información del paciente */}
          <div className="bg-white rounded-xl shadow-sm p-8">
            <h2 className="text-xl font-heading font-bold text-concreto mb-4">
              Paciente
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-marengo">Nombre</p>
                <p className="text-lg font-medium text-concreto">
                  {cobro.paciente.nombre} {cobro.paciente.apellido}
                </p>
              </div>
              <div>
                <p className="text-sm text-marengo">Documento</p>
                <p className="text-lg font-medium text-concreto">
                  {cobro.paciente.tipoDocumento}: {cobro.paciente.documento}
                </p>
              </div>
            </div>
          </div>

          {/* Items del cobro */}
          <div className="bg-white rounded-xl shadow-sm p-8">
            <h2 className="text-xl font-heading font-bold text-concreto mb-4">
              Items del Cobro
            </h2>
            <div className="border border-marengo/20 rounded-lg overflow-hidden">
              <table className="min-w-full divide-y divide-marengo/20">
                <thead className="bg-marengo/10">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-concreto">Tipo</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-concreto">Descripcion</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-concreto">Cantidad</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-concreto">Precio Unit.</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-concreto">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-marengo/10">
                  {cobro.items?.map((item) => (
                    <tr key={item.id}>
                      <td className="px-4 py-3 text-sm text-concreto">{item.tipo}</td>
                      <td className="px-4 py-3 text-sm text-concreto">{item.nombre}</td>
                      <td className="px-4 py-3 text-sm text-concreto text-right">{item.cantidad}</td>
                      <td className="px-4 py-3 text-sm text-concreto text-right">
                        {formatMonto(Number(item.precioUnitario))}
                      </td>
                      <td className="px-4 py-3 text-sm text-concreto text-right font-medium">
                        {formatMonto(Number(item.subtotal))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Resumen financiero */}
            <div className="mt-6 bg-piel/10 rounded-lg p-6 max-w-md ml-auto">
              <div className="space-y-3">
                <div className="flex justify-between text-concreto">
                  <span>Subtotal:</span>
                  <span className="font-medium">{formatMonto(Number(cobro.subtotal))}</span>
                </div>
                <div className="flex justify-between text-concreto">
                  <span>Descuento:</span>
                  <span className="text-red-600">-{formatMonto(Number(cobro.descuento))}</span>
                </div>
                <div className="flex justify-between text-xl font-bold text-concreto border-t-2 border-marengo/30 pt-3">
                  <span>TOTAL:</span>
                  <span className="text-morena">{formatMonto(Number(cobro.total))}</span>
                </div>
              </div>
            </div>

            {cobro.notas && (
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <p className="text-sm font-medium text-concreto mb-1">Notas:</p>
                <p className="text-sm text-marengo">{cobro.notas}</p>
              </div>
            )}
          </div>

          {/* Historial de pagos */}
          <div className="bg-white rounded-xl shadow-sm p-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-heading font-bold text-concreto">
                Historial de Pagos
              </h2>
              {puedePagar && (
                <button
                  onClick={() => setMostrarFormPago(!mostrarFormPago)}
                  className="px-4 py-2 bg-morena text-white rounded-lg hover:bg-morena/90 transition-all"
                >
                  {mostrarFormPago ? 'Cancelar' : 'Registrar Pago'}
                </button>
              )}
            </div>

            {/* Balance actual */}
            <div className="grid grid-cols-3 gap-4 mb-6 p-4 bg-piel/10 rounded-lg">
              <div>
                <p className="text-xs text-marengo mb-1">Total</p>
                <p className="text-lg font-bold text-concreto">{formatMonto(Number(cobro.total))}</p>
              </div>
              <div>
                <p className="text-xs text-marengo mb-1">Pagado</p>
                <p className="text-lg font-bold text-green-600">{formatMonto(calcularPagado())}</p>
              </div>
              <div>
                <p className="text-xs text-marengo mb-1">Saldo Pendiente</p>
                <p className="text-lg font-bold text-red-600">{formatMonto(saldoPendiente)}</p>
              </div>
            </div>

            {/* Formulario para registrar pago */}
            {mostrarFormPago && puedePagar && (
              <div className="mb-6 p-6 bg-morena/5 border-2 border-morena/20 rounded-lg">
                <h3 className="text-lg font-semibold text-concreto mb-4">Nuevo Pago</h3>
                <form onSubmit={handleRegistrarPago} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-concreto mb-2">
                        Monto *
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0.01"
                        max={saldoPendiente}
                        value={monto}
                        onChange={(e) => setMonto(e.target.value)}
                        placeholder="0.00"
                        className="w-full px-4 py-3 rounded-lg border border-marengo/30 
                                 focus:border-morena focus:ring-2 focus:ring-piel/20 
                                 transition-all outline-none"
                        required
                      />
                      <p className="text-xs text-marengo mt-1">
                        Máximo: {formatMonto(saldoPendiente)}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-concreto mb-2">
                        Metodo de Pago *
                      </label>
                      <select
                        value={metodoPago}
                        onChange={(e) => setMetodoPago(e.target.value)}
                        className="w-full px-4 py-3 rounded-lg border border-marengo/30 
                                 focus:border-morena focus:ring-2 focus:ring-piel/20 
                                 transition-all outline-none"
                        required
                      >
                        <option value="EFECTIVO">Efectivo</option>
                        <option value="TARJETA">Tarjeta</option>
                        <option value="TRANSFERENCIA">Transferencia</option>
                        <option value="OTRO">Otro</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-concreto mb-2">
                      Referencia / Comprobante
                    </label>
                    <input
                      type="text"
                      value={referencia}
                      onChange={(e) => setReferencia(e.target.value)}
                      placeholder="Numero de comprobante, transferencia, etc."
                      className="w-full px-4 py-3 rounded-lg border border-marengo/30 
                               focus:border-morena focus:ring-2 focus:ring-piel/20 
                               transition-all outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-concreto mb-2">
                      Notas
                    </label>
                    <textarea
                      value={notasPago}
                      onChange={(e) => setNotasPago(e.target.value)}
                      rows={2}
                      placeholder="Observaciones adicionales..."
                      className="w-full px-4 py-3 rounded-lg border border-marengo/30 
                               focus:border-morena focus:ring-2 focus:ring-piel/20 
                               transition-all outline-none resize-none"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={procesandoPago}
                    className="btn-primary"
                  >
                    {procesandoPago ? 'Procesando...' : 'Confirmar Pago'}
                  </button>
                </form>
              </div>
            )}

            {/* Lista de pagos */}
            {cobro.pagos && cobro.pagos.length > 0 ? (
              <div className="border border-marengo/20 rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-marengo/20">
                  <thead className="bg-marengo/10">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-concreto">Fecha</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-concreto">Monto</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-concreto">Metodo</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-concreto">Referencia</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-concreto">Notas</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-marengo/10">
                    {cobro.pagos.map((pago) => (
                      <tr key={pago.id}>
                        <td className="px-4 py-3 text-sm text-concreto">{formatFecha(pago.fecha)}</td>
                        <td className="px-4 py-3 text-sm text-green-600 text-right font-medium">
                          {formatMonto(Number(pago.monto))}
                        </td>
                        <td className="px-4 py-3 text-sm text-concreto">{pago.metodoPago}</td>
                        <td className="px-4 py-3 text-sm text-marengo">{pago.referencia || '-'}</td>
                        <td className="px-4 py-3 text-sm text-marengo">{pago.notas || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 text-marengo">
                No se han registrado pagos aún.
              </div>
            )}
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
