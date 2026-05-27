import { PrismaClient, EstadoCobro, TipoItemCobro, MetodoPago } from '@clinica/database';

export interface CreateItemCobroInput {
  tipo: TipoItemCobro;
  servicioId?: string;
  productoId?: string;
  nombre: string;
  cantidad: number;
  precioUnitario: number;
}

export interface CreateCobroInput {
  pacienteId: string;
  items: CreateItemCobroInput[];
}

export interface UpdateCobroInput {
  estado?: EstadoCobro;
}

export interface CreatePagoInput {
  cobroId: string;
  monto: number;
  metodoPago: MetodoPago;
  referencia?: string;
  notas?: string;
}

export class CobroRepository {
  constructor(private prisma: PrismaClient) {}

  async create(input: CreateCobroInput): Promise<any> {
    const { items, ...cobroData } = input;

    // Calcular subtotal
    const subtotal = items.reduce((sum, item) => {
      return sum + item.cantidad * item.precioUnitario;
    }, 0);

    const total = subtotal;

    return this.prisma.cobro.create({
      data: {
        ...cobroData,
        subtotal,
        total,
        items: {
          create: items.map(item => ({
            tipo: item.tipo,
            servicioId: item.servicioId,
            productoId: item.productoId,
            nombre: item.nombre,
            cantidad: item.cantidad,
            precioUnitario: item.precioUnitario,
            subtotal: item.cantidad * item.precioUnitario,
          })),
        },
      },
      include: {
        paciente: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
            documento: true,
            tipoDocumento: true,
          },
        },
        items: true,
        pagos: true,
      },
    });
  }

  async findAll(): Promise<any> {
    return this.prisma.cobro.findMany({
      include: {
        paciente: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
            documento: true,
            tipoDocumento: true,
          },
        },
        items: true,
        pagos: true,
      },
      orderBy: { fecha: 'desc' },
    });
  }

  async findById(id: string): Promise<any> {
    return this.prisma.cobro.findUnique({
      where: { id },
      include: {
        paciente: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
            documento: true,
            tipoDocumento: true,
            telefono: true,
            email: true,
          },
        },
        items: true,
        pagos: {
          orderBy: { fecha: 'desc' },
        },
      },
    });
  }

  async findByPaciente(pacienteId: string): Promise<any> {
    return this.prisma.cobro.findMany({
      where: { pacienteId },
      include: {
        items: true,
        pagos: true,
      },
      orderBy: { fecha: 'desc' },
    });
  }

  async update(id: string, input: UpdateCobroInput): Promise<any> {
    return this.prisma.cobro.update({
      where: { id },
      data: input,
      include: {
        paciente: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
            documento: true,
            tipoDocumento: true,
          },
        },
        items: true,
        pagos: true,
      },
    });
  }

  async delete(id: string): Promise<any> {
    return this.prisma.cobro.delete({
      where: { id },
    });
  }

  async registrarPago(pagoInput: CreatePagoInput): Promise<any> {
    const cobro = await this.prisma.cobro.findUnique({
      where: { id: pagoInput.cobroId },
      select: { id: true, total: true }, // Select only necessary fields
    });

    if (!cobro) {
      throw new Error('Cobro no encontrado');
    }

    return this.prisma.$transaction(async (tx) => {
      const { _sum: { monto: totalPagado } } = await tx.pago.aggregate({
        where: { cobroId: pagoInput.cobroId },
        _sum: { monto: true },
      });

      const nuevoTotalPagado = Number(totalPagado ?? 0) + pagoInput.monto;

      let nuevoEstado: EstadoCobro;
      if (nuevoTotalPagado >= Number(cobro.total)) {
        nuevoEstado = 'PAGADO';
      } else if (nuevoTotalPagado > 0) {
        nuevoEstado = 'PARCIAL';
      } else {
        nuevoEstado = 'PENDIENTE';
      }

      const pago = await tx.pago.create({
        data: pagoInput,
      });

      const cobroActualizado = await tx.cobro.update({
        where: { id: pagoInput.cobroId },
        data: { estado: nuevoEstado },
        include: {
          paciente: {
            select: {
              id: true,
              nombre: true,
              apellido: true,
              documento: true,
              tipoDocumento: true,
            },
          },
          items: true,
          pagos: {
            orderBy: { fecha: 'desc' },
          },
        },
      });

      return { pago, cobro: cobroActualizado };
    });
  }

  async getSaldoPendiente(cobroId: string): Promise<number> {
    const cobro = await this.prisma.cobro.findUnique({
      where: { id: cobroId },
      select: { id: true, total: true }, // Select only necessary fields
    });

    if (!cobro) {
      throw new Error('Cobro no encontrado');
    }

    const { _sum: { monto: totalPagado } } = await this.prisma.pago.aggregate({
      where: { cobroId },
      _sum: { monto: true },
    });

    return Number(cobro.total) - Number(totalPagado ?? 0);
  }

  async findByFecha(fechaInicio: Date, fechaFin: Date): Promise<any[]> {
    return this.prisma.cobro.findMany({
      where: {
        fecha: {
          gte: fechaInicio,
          lte: fechaFin,
        },
      },
      include: {
        paciente: { select: { id: true, nombre: true, apellido: true } },
        pagos: true,
      },
      orderBy: { fecha: 'asc' },
    });
  }

  async findPendientes(): Promise<any[]> {
    return this.prisma.cobro.findMany({
      where: {
        estado: { in: ['PENDIENTE', 'PARCIAL'] },
      },
      include: {
        paciente: { select: { id: true, nombre: true, apellido: true } },
        pagos: true,
      },
      orderBy: { fecha: 'desc' },
    });
  }

}
