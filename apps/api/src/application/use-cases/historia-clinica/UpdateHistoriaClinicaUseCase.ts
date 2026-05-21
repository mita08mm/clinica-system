import { HistoriaClinicaRepository } from '../../../infrastructure/repositories/HistoriaClinicaRepository';

interface UpdateHistoriaClinicaDTO {
  tipoSangre?: string;
  diagnosticoPrincipal?: string;
  alergias?: string;
  medicacionHabitual?: string;
  antecedentesPersonales?: string;
  antecedentesFamiliares?: string;
  antecedentesQuirurgicos?: string;
  notasGenerales?: string;
}

export class UpdateHistoriaClinicaUseCase {
  constructor(private historiaClinicaRepository: HistoriaClinicaRepository) {}

  async execute(pacienteId: string, data: UpdateHistoriaClinicaDTO) {
    const historiaClinica = await this.historiaClinicaRepository.upsertByPaciente(pacienteId, data);
    return historiaClinica;
  }
}
