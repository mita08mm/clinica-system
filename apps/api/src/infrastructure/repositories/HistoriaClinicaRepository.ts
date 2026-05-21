import { PrismaClient, HistoriaClinica, Prisma } from '@clinica/database';

export class HistoriaClinicaRepository {
  constructor(private prisma: PrismaClient) {}

  async create(data: Prisma.HistoriaClinicaCreateInput): Promise<HistoriaClinica> {
    return this.prisma.historiaClinica.create({
      data,
      include: {
        paciente: true,
      },
    });
  }

  async findById(id: string): Promise<HistoriaClinica | null> {
    return this.prisma.historiaClinica.findUnique({
      where: { id },
      include: {
        paciente: true,
        consultas: {
          include: {
            usuario: {
              select: {
                id: true,
                nombre: true,
                rol: true,
              },
            },
            recetas: {
              select: {
                id: true,
                fecha: true,
              },
            },
          },
          orderBy: {
            fecha: 'desc',
          },
        },
      },
    });
  }

  async findByPaciente(pacienteId: string): Promise<HistoriaClinica | null> {
    return this.prisma.historiaClinica.findUnique({
      where: { pacienteId },
      include: {
        paciente: true,
        consultas: {
          include: {
            usuario: {
              select: {
                id: true,
                nombre: true,
                apellido: true,
                rol: true,
              },
            },
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
            documentos: {
              select: {
                id: true,
                nombre: true,
                tipo: true,
                url: true,
                createdAt: true,
              },
            },
          },
          orderBy: {
            fecha: 'desc',
          },
          take: 20, // Últimas 20 consultas
        },
      },
    });
  }

  async update(id: string, data: Prisma.HistoriaClinicaUpdateInput): Promise<HistoriaClinica> {
    return this.prisma.historiaClinica.update({
      where: { id },
      data,
      include: {
        paciente: true,
      },
    });
  }

  // Crear o actualizar historia clínica de un paciente
  async upsertByPaciente(
    pacienteId: string,
    data: Omit<Prisma.HistoriaClinicaCreateInput, 'paciente'>
  ): Promise<HistoriaClinica> {
    return this.prisma.historiaClinica.upsert({
      where: { pacienteId },
      create: {
        ...data,
        paciente: {
          connect: { id: pacienteId },
        },
      },
      update: data,
      include: {
        paciente: true,
      },
    });
  }
}
