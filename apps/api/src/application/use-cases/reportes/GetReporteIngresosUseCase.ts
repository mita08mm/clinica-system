import { PrismaClient } from '@clinica/database';
import { appCache } from '../../../infrastructure/config/cache';

export class GetReporteIngresosUseCase {
  constructor(private prisma: PrismaClient) {}

  async execute(fechaInicio: string, fechaFin: string) {
    const cacheKey = `reporte_ingresos_${fechaInicio}_${fechaFin}`;
    const cached = appCache.get(cacheKey);
    if (cached) return cached as any;

    const where = {
      fecha: { gte: new Date(fechaInicio), lte: new Date(fechaFin) },
      estado: { not: 'CANCELADO' as const },
    };

    // Una sola query: suma total facturado
    const { _sum: { total: totalIngresos } } = await this.prisma.cobro.aggregate({
      where,
      _sum: { total: true },
    });

    // Una sola query: suma todos los pagos de cobros en ese período
    const { _sum: { monto: totalPagos } } = await this.prisma.pago.aggregate({
      where: {
        cobro: where,
      },
      _sum: { monto: true },
    });

    // Ingresos agrupados por mes (en la DB)
    const pagosPorMes = await this.prisma.pago.groupBy({
      by: ['fecha'],
      where: { cobro: where },
      _sum: { monto: true },
    });

    const mesesNombre = ['Enero','Febrero','Marzo','Abril','Mayo','Junio',
                         'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

    const porMes: Record<string, number> = {};
    pagosPorMes.forEach(p => {
      const mes = mesesNombre[new Date(p.fecha).getMonth()];
      porMes[mes] = (porMes[mes] ?? 0) + Number(p._sum.monto ?? 0);
    });

    const ingresosNum = Number(totalIngresos ?? 0);
    const pagosNum = Number(totalPagos ?? 0);

    const result = {
      totalIngresos: ingresosNum,
      totalPagos: pagosNum,
      totalPendiente: ingresosNum - pagosNum,
      cobrosPorMes: Object.entries(porMes).map(([mes, total]) => ({ mes, total })),
    };

    appCache.set(cacheKey, result, 900);
    return result;
  }
}