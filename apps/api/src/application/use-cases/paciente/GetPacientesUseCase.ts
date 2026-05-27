import { PacienteRepository } from '../../../infrastructure/repositories/PacienteRepository';

export class GetPacientesUseCase {
  constructor(private pacienteRepository: PacienteRepository) {}

  async execute(page: number = 1, limit: number = 50) {
    return this.pacienteRepository.findAll(page, limit);
  }
}
