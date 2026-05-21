import { ConsultaRepository } from '../../../infrastructure/repositories/ConsultaRepository';
import { HistoriaClinicaRepository } from '../../../infrastructure/repositories/HistoriaClinicaRepository';

interface CreateConsultaDTO {
  pacienteId: string;
  usuarioId: string;
  citaId?: string;
  motivoConsulta: string;
  examenFisico?: string;
  diagnostico: string;
  codigoCIE?: string;
  tratamiento?: string;
  observaciones?: string;
  proximaConsulta?: Date;
  signosVitales?: {
    pa_sistolica?: number;
    pa_diastolica?: number;
    fc?: number;
    temp?: number;
    peso?: number;
    talla?: number;
    imc?: number;
    spo2?: number;
  };
}

export class CreateConsultaUseCase {
  constructor(
    private consultaRepository: ConsultaRepository,
    private historiaClinicaRepository: HistoriaClinicaRepository
  ) {}

  async execute(data: CreateConsultaDTO) {
    // Obtener o crear historia clínica
    let historiaClinica = await this.historiaClinicaRepository.findByPaciente(data.pacienteId);

    if (!historiaClinica) {
      historiaClinica = await this.historiaClinicaRepository.create({
        paciente: {
          connect: { id: data.pacienteId },
        },
      });
    }

    // Crear evolución
    const consulta = await this.consultaRepository.create({
      paciente: {
        connect: { id: data.pacienteId },
      },
      historiaClinica: {
        connect: { id: historiaClinica.id },
      },
      usuario: {
        connect: { id: data.usuarioId },
      },
      ...(data.citaId && {
        cita: {
          connect: { id: data.citaId },
        },
      }),
      motivoConsulta: data.motivoConsulta,
      examenFisico: data.examenFisico,
      diagnostico: data.diagnostico,
      codigoCIE: data.codigoCIE,
      tratamiento: data.tratamiento,
      observaciones: data.observaciones,
      proximaConsulta: data.proximaConsulta,
      signosVitales: data.signosVitales || {},
    });

    return consulta;
  }
}
