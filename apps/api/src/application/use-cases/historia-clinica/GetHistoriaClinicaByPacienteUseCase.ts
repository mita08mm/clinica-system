import { HistoriaClinicaRepository } from '../../../infrastructure/repositories/HistoriaClinicaRepository';

export class GetHistoriaClinicaByPacienteUseCase {
  constructor(private historiaClinicaRepository: HistoriaClinicaRepository) {}

  async execute(pacienteId: string) {
    let historiaClinica = await this.historiaClinicaRepository.findByPaciente(pacienteId);

    // Si no existe, crear una vacía
    if (!historiaClinica) {
      historiaClinica = await this.historiaClinicaRepository.create({
        paciente: {
          connect: { id: pacienteId },
        },
      });
    }

    return historiaClinica;
  }
}
