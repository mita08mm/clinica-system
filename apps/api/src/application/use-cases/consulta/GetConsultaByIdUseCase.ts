import { ConsultaRepository } from '../../../infrastructure/repositories/ConsultaRepository';

export class GetConsultaByIdUseCase {
  constructor(private consultaRepository: ConsultaRepository) {}

  async execute(id: string) {
    const consulta = await this.consultaRepository.findById(id);

    if (!consulta) {
      throw new Error('Consulta no encontrada');
    }

    return consulta;
  }
}
