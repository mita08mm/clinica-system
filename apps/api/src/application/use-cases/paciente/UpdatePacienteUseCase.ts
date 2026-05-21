import { PacienteRepository, UpdatePacienteInput } from '../../../infrastructure/repositories/PacienteRepository';

export class UpdatePacienteUseCase {
  constructor(private pacienteRepository: PacienteRepository) {}

  async execute(id: string, data: UpdatePacienteInput) {
    const paciente = await this.pacienteRepository.findById(id);

    if (!paciente) {
      throw new Error('Paciente no encontrado');
    }

    return this.pacienteRepository.update(id, data);
  }
}
