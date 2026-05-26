import { PrismaClient } from '@clinica/database';

export class GetReportePagosUseCase {
  constructor(private prisma: PrismaClient) {}

  async execute() {
    // Una query con aggregation en la DB
    const cobros = await this.prisma.cobro.findMany({
      where: { estado: { in: ['PENDIENTE', 'PARCIAL'] } },
      select: {
        id: true,
        total: true,
        pacienteId: true,
        paciente: { select: { nombre: true, apellido: true } },
        // Solo suma de pagos, no todos los campos
        _count: false,
        pagos: { select: { monto: true } },
      },
      orderBy: { fecha: 'desc' },
    });

    const resultado = cobros.map(c => {
      const pagado = c.pagos.reduce((s, p) => s + Number(p.monto), 0);
      return {
        id: c.id,
        paciente: c.paciente,
        total: Number(c.total),
        pagado,
        saldo: Number(c.total) - pagado,
      };
    });

    const totalDeuda = resultado.reduce((s, c) => s + c.saldo, 0);
    const pacientesUnicos = new Set(cobros.map(c => c.pacienteId));

    return {
      totalDeuda,
      pacientesConDeuda: pacientesUnicos.size,
      cobros: resultado,
    };
  }
}