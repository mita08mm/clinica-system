import { ConsultaRepository } from '../../../infrastructure/repositories/ConsultaRepository';

export class GetConsultasByPacienteUseCase {
  constructor(private consultaRepository: ConsultaRepository) {}

  async execute(pacienteId: string) {
    const consultas = await this.consultaRepository.findByPaciente(pacienteId);
    return consultas;
  }
}
