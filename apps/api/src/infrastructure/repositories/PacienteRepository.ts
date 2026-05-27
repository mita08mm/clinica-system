import { PrismaClient, Paciente, TipoDocumentoIdentidad, EstadoPaciente } from '@clinica/database';

export interface CreatePacienteInput {
  nombre: string;
  apellido: string;
  documento: string;
  tipoDocumento: TipoDocumentoIdentidad;
  fechaNacimiento: Date;
  telefono: string;
  email?: string;
  direccion?: string;
  sexo?: string;
  alergias?: string;
  objetivoEstetico?: string;
  condicionesMedicas?: string;
  medicacionActual?: string;
  embarazoLactancia?: boolean;
  contactoEmergenciaNombre?: string;
  contactoEmergenciaTelefono?: string;
}

export interface UpdatePacienteInput {
  nombre?: string;
  apellido?: string;
  telefono?: string;
  email?: string;
  direccion?: string;
  sexo?: string;
  objetivoEstetico?: string;
  condicionesMedicas?: string;
  medicacionActual?: string;
  alergias?: string;
  embarazoLactancia?: boolean;
  contactoEmergenciaNombre?: string;
  contactoEmergenciaTelefono?: string;
  estado?: EstadoPaciente;
}

export class PacienteRepository {
  constructor(private prisma: PrismaClient) {}

  async create(data: CreatePacienteInput): Promise<Paciente> {
    return this.prisma.paciente.create({
      data,
    });
  }

  async findAll(page: number = 1, limit: number = 50): Promise<Paciente[]> {
    const skip = (page - 1) * limit;
    return this.prisma.paciente.findMany({
      skip,
      take: limit,
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findById(id: string): Promise<Paciente | null> {
    return this.prisma.paciente.findUnique({
      where: { id },
      include: {
        historiaClinica: true,
        citas: {
          orderBy: { fecha: 'desc' },
          take: 5,
        },
        cobros: {
          orderBy: { fecha: 'desc' },
          take: 5,
        },
      },
    });
  }

  async findByDocumento(documento: string, tipoDocumento: TipoDocumentoIdentidad): Promise<Paciente | null> {
    return this.prisma.paciente.findUnique({
      where: {
        documento_tipoDocumento: {
          documento,
          tipoDocumento,
        },
      },
    });
  }

  async update(id: string, data: UpdatePacienteInput): Promise<Paciente> {
    return this.prisma.paciente.update({
      where: { id },
      data,
    });
  }

  async delete(id: string): Promise<Paciente> {
    return this.prisma.paciente.update({
      where: { id },
      data: { estado: 'INACTIVO' },
    });
  }

  async search(query: string): Promise<Paciente[]> {
    return this.prisma.paciente.findMany({
      where: {
        OR: [
          { nombre: { contains: query, mode: 'insensitive' } },
          { apellido: { contains: query, mode: 'insensitive' } },
          { documento: { contains: query, mode: 'insensitive' } },
        ],
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }
}
