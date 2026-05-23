import { PrismaClient, Documento, TipoDocumento } from '@clinica/database';

export interface CreateDocumentoData {
  pacienteId: string;
  tratamientoId?: string;
  nombre: string;
  descripcion?: string;
  tipo: TipoDocumento;
  url: string;
  tamaño: number;
  mimeType: string;
}

export class DocumentoRepository {
  constructor(private prisma: PrismaClient) {}

  async findAll(): Promise<Documento[]> {
    return this.prisma.documento.findMany({
      include: {
        tratamiento: {
          select: {
            id: true,
            fecha: true,
            tipoTratamiento: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async create(data: CreateDocumentoData): Promise<Documento> {
    return this.prisma.documento.create({
      data,
      include: {
        paciente: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
          },
        },
        tratamiento: {
          select: {
            id: true,
            fecha: true,
            tipoTratamiento: true,
          },
        },
      },
    });
  }

  async findById(id: string): Promise<Documento | null> {
    return this.prisma.documento.findUnique({
      where: { id },
      include: {
        paciente: true,
        tratamiento: true,
      },
    });
  }

  async findByPaciente(pacienteId: string): Promise<Documento[]> {
    return this.prisma.documento.findMany({
      where: { pacienteId },
      include: {
        tratamiento: {
          select: {
            id: true,
            fecha: true,
            tipoTratamiento: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findByTratamiento(tratamientoId: string): Promise<Documento[]> {
    return this.prisma.documento.findMany({
      where: { tratamientoId },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findByTipo(tipo: TipoDocumento, pacienteId?: string): Promise<Documento[]> {
    return this.prisma.documento.findMany({
      where: {
        tipo,
        ...(pacienteId && { pacienteId }),
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
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async update(id: string, data: Partial<CreateDocumentoData>): Promise<Documento> {
    return this.prisma.documento.update({
      where: { id },
      data,
      include: {
        paciente: true,
        tratamiento: true,
      },
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.documento.delete({
      where: { id },
    });
  }

  async count(pacienteId?: string): Promise<number> {
    return this.prisma.documento.count({
      where: pacienteId ? { pacienteId } : undefined,
    });
  }
}
