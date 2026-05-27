import { CitaRepository } from '../../../infrastructure/repositories/CitaRepository';

export class GetCitasUseCase {
  constructor(private citaRepository: CitaRepository) {}

  async execute(page: number = 1, limit: number = 50) {
    return this.citaRepository.findAll(page, limit);
  }
}
