import { CitaRepository } from '../../../infrastructure/repositories/CitaRepository';

export class DeleteCitaUseCase {
  constructor(private citaRepository: CitaRepository) {}

  async execute(id: string) {
    const cita = await this.citaRepository.findById(id);

    if (!cita) {
      throw new Error('Cita no encontrada');
    }

    return this.citaRepository.delete(id); // ya existe en tu repo ✓
  }
}