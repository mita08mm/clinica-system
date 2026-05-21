import { PrismaClient, Consulta, Prisma } from '@clinica/database';

export class ConsultaRepository {
  constructor(private prisma: PrismaClient) {}

  async create(data: Prisma.ConsultaCreateInput): Promise<Consulta> {
    return this.prisma.consulta.create({
      data,
      include: {
        usuario: {
          select: {
            id: true,
            nombre: true,
            rol: true,
          },
        },
        cita: true,
      },
    });
  }

  async findById(id: string): Promise<Consulta | null> {
    return this.prisma.consulta.findUnique({
      where: { id },
      include: {
        usuario: {
          select: {
            id: true,
            nombre: true,
            rol: true,
          },
        },
        cita: true,
        recetas: {
          include: {
            items: true,
          },
        },
        cobros: {
          include: {
            items: true,
            pagos: true,
          },
        },
        documentos: true,
      },
    });
  }

  async findByPaciente(pacienteId: string): Promise<Consulta[]> {
    return this.prisma.consulta.findMany({
      where: { pacienteId },
      include: {
        usuario: {
          select: {
            id: true,
            nombre: true,
            rol: true,
          },
        },
        cita: true,
        recetas: {
          select: {
            id: true,
            fecha: true,
            items: {
              select: {
                nombre: true,
                cantidad: true,
              },
            },
          },
        },
      },
      orderBy: {
        fecha: 'desc',
      },
    });
  }

  async findByHistoriaClinica(historiaClinicaId: string): Promise<Consulta[]> {
    return this.prisma.consulta.findMany({
      where: { historiaClinicaId },
      include: {
        usuario: {
          select: {
            id: true,
            nombre: true,
            rol: true,
          },
        },
      },
      orderBy: {
        fecha: 'desc',
      },
    });
  }

  async update(id: string, data: Prisma.ConsultaUpdateInput): Promise<Consulta> {
    return this.prisma.consulta.update({
      where: { id },
      data,
      include: {
        usuario: {
          select: {
            id: true,
            nombre: true,
            rol: true,
          },
        },
      },
    });
  }

  async delete(id: string): Promise<Consulta> {
    return this.prisma.consulta.delete({
      where: { id },
    });
  }

  // Obtener consultas recientes (últimos N días)
  async findRecent(dias: number = 7): Promise<Consulta[]> {
    const fecha = new Date();
    fecha.setDate(fecha.getDate() - dias);

    return this.prisma.consulta.findMany({
      where: {
        fecha: {
          gte: fecha,
        },
      },
      include: {
        usuario: {
          select: {
            nombre: true,
          },
        },
        historiaClinica: {
          include: {
            paciente: {
              select: {
                nombre: true,
                apellido: true,
              },
            },
          },
        },
      },
      orderBy: {
        fecha: 'desc',
      },
    });
  }
}
