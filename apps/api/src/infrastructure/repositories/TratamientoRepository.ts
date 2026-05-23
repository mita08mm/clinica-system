import { PrismaClient, Tratamiento, Prisma } from '@clinica/database';

export class TratamientoRepository {
  constructor(private prisma: PrismaClient) {}

  async create(data: Prisma.TratamientoCreateInput): Promise<Tratamiento> {
    return this.prisma.tratamiento.create({
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

  async findById(id: string): Promise<Tratamiento | null> {
    return this.prisma.tratamiento.findUnique({
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
        protocolos: {
          include: {
            items: {
              include: {
                producto: true,
              },
            },
          },
        },
        cobros: {
          include: {
            items: true,
            pagos: true,
          },
        },
      },
    });
  }

  async findByPaciente(pacienteId: string): Promise<Tratamiento[]> {
    return this.prisma.tratamiento.findMany({
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
        protocolos: {
          select: {
            id: true,
            fecha: true,
            items: {
              select: {
                producto: {
                  select: {
                    nombre: true,
                    tipo: true,
                  },
                },
                aplicacion: true,
                frecuencia: true,
                estado: true,
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

  async findByHistoriaClinica(historiaClinicaId: string): Promise<Tratamiento[]> {
    return this.prisma.tratamiento.findMany({
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

  async update(id: string, data: Prisma.TratamientoUpdateInput): Promise<Tratamiento> {
    return this.prisma.tratamiento.update({
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

  async delete(id: string): Promise<Tratamiento> {
    return this.prisma.tratamiento.delete({
      where: { id },
    });
  }

  // Obtener tratamientos recientes (últimos N días)
  async findRecent(dias: number = 7): Promise<Tratamiento[]> {
    const fecha = new Date();
    fecha.setDate(fecha.getDate() - dias);

    return this.prisma.tratamiento.findMany({
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

  // Contar tratamientos por tipo
  async countByTipo() {
    return this.prisma.tratamiento.groupBy({
      by: ['tipoTratamiento'],
      _count: true,
    });
  }

  // Obtener tratamientos por tipo
  async findByTipo(tipo: string): Promise<Tratamiento[]> {
    return this.prisma.tratamiento.findMany({
      where: {
        tipoTratamiento: tipo as any,
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
