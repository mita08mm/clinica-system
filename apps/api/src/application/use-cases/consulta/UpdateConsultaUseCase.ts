import { ConsultaRepository } from '../../../infrastructure/repositories/ConsultaRepository';

interface UpdateConsultaDTO {
  motivoConsulta?: string;
  examenFisico?: string;
  diagnostico?: string;
  codigoCIE?: string;
  tratamiento?: string;
  observaciones?: string;
  proximaConsulta?: Date;
  signosVitales?: Record<string, any>;
}

export class UpdateConsultaUseCase {
  constructor(private consultaRepository: ConsultaRepository) {}

  async execute(id: string, data: UpdateConsultaDTO) {
    const consultaExistente = await this.consultaRepository.findById(id);

    if (!consultaExistente) {
      throw new Error('Consulta no encontrada');
    }

    const consulta = await this.consultaRepository.update(id, data);
    return consulta;
  }
}
