import { PrismaClient } from '@clinica/database';

export interface CreateCitaInput {
  pacienteId: string;
  fecha: Date;
  horaInicio: string;
  horaFin: string;
  motivo: string;
  notas?: string;
}

export interface UpdateCitaInput {
  fecha?: Date;
  horaInicio?: string;
  horaFin?: string;
  motivo?: string;
  estado?: 'PROGRAMADA' | 'CONFIRMADA' | 'EN_CURSO' | 'COMPLETADA' | 'CANCELADA' | 'NO_ASISTIO';
  notas?: string;
}

export class CitaRepository {
  constructor(private prisma: PrismaClient) {}

  async create(input: CreateCitaInput) {
    return this.prisma.cita.create({
      data: input,
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
      },
    });
  }

  async findAll(page: number = 1, limit: number = 50) {
    const skip = (page - 1) * limit;
    return this.prisma.cita.findMany({
      skip,
      take: limit,
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
      },
      orderBy: [
        { fecha: 'desc' },
        { horaInicio: 'desc' },
      ],
    });
  }

  async findById(id: string) {
    return this.prisma.cita.findUnique({
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
            fechaNacimiento: true,
          },
        },
      },
    });
  }

  async findByPaciente(pacienteId: string) {
    return this.prisma.cita.findMany({
      where: { pacienteId },
      include: {
        paciente: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
          },
        },
      },
      orderBy: [
        { fecha: 'desc' },
        { horaInicio: 'desc' },
      ],
    });
  }

  async findByFecha(fecha: Date) {
    const dateStr = fecha.toISOString().split('T')[0]; // "2026-05-21"
    const startOfDay = new Date(`${dateStr}T00:00:00.000Z`);
    const endOfDay   = new Date(`${dateStr}T23:59:59.999Z`);

    return this.prisma.cita.findMany({
      where: {
        fecha: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      include: {
        paciente: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
            telefono: true,
          },
        },
      },
      orderBy: { horaInicio: 'asc' },
    });
  }

  async findByDateRange(fechaInicio: Date, fechaFin: Date) {
    return this.prisma.cita.findMany({
      where: {
        fecha: {
          gte: fechaInicio,
          lte: fechaFin,
        },
      },
      include: {
        paciente: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
            telefono: true,
          },
        },
      },
      orderBy: [
        { fecha: 'asc' },
        { horaInicio: 'asc' },
      ],
    });
  }

  async update(id: string, input: UpdateCitaInput) {
    return this.prisma.cita.update({
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
            telefono: true,
            email: true,
          },
        },
      },
    });
  }

  async delete(id: string) {
    return this.prisma.cita.delete({
      where: { id },
    });
  }

  async cancelar(id: string, notas?: string) {
    return this.prisma.cita.update({
      where: { id },
      data: {
        estado: 'CANCELADA',
        notas: notas || undefined,
      },
      include: {
        paciente: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
          },
        },
      },
    });
  }
}
