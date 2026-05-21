import { PacienteRepository } from '../../../infrastructure/repositories/PacienteRepository';

export class GetPacienteByIdUseCase {
  constructor(private pacienteRepository: PacienteRepository) {}

  async execute(id: string) {
    const paciente = await this.pacienteRepository.findById(id);

    if (!paciente) {
      throw new Error('Paciente no encontrado');
    }

    return paciente;
  }
}
