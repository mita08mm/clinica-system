import { PacienteRepository } from '../../../infrastructure/repositories/PacienteRepository';

export class GetPacientesUseCase {
  constructor(private pacienteRepository: PacienteRepository) {}

  async execute() {
    return this.pacienteRepository.findAll();
  }
}
