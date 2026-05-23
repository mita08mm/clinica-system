/**
 * Formatea un monto como moneda USD
 */
export function formatMonto(monto: number | string): string {
  const value = typeof monto === 'string' ? Number(monto) : monto;
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'USD',
  }).format(value);
}
