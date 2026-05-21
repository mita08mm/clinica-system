import { CitaRepository, CreateCitaInput } from '../../../infrastructure/repositories/CitaRepository';

export class CreateCitaUseCase {
  constructor(private citaRepository: CitaRepository) {}

  async execute(input: CreateCitaInput) {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const fechaStr = input.fecha instanceof Date
      ? input.fecha.toISOString().split('T')[0]
      : String(input.fecha).split('T')[0];

    const [year, month, day] = fechaStr.split('-').map(Number);
    const fechaCita = new Date(year, month - 1, day); // local, no UTC

    if (fechaCita < hoy) {
      throw new Error('No se puede crear una cita en el pasado');
    }

    // Verificar conflicto de horario
    const citasDelDia = await this.citaRepository.findByFecha(fechaCita);
    const hayConflicto = citasDelDia.some(cita => {
      if (cita.estado === 'CANCELADA') return false;
      if (cita.horaFin <= cita.horaInicio) return false;
      return cita.horaInicio < input.horaFin && cita.horaFin > input.horaInicio;
    });

    if (hayConflicto) {
      throw new Error('Ya existe una cita en ese horario');
    }

    return this.citaRepository.create(input);
  }
}