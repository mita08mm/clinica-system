import { Request, Response } from 'express';
import { z } from 'zod';
import { PrismaClient } from '@clinica/database';
import { HistoriaClinicaRepository } from '../../infrastructure/repositories/HistoriaClinicaRepository';
import { GetHistoriaClinicaByPacienteUseCase } from '../../application/use-cases/historia-clinica/GetHistoriaClinicaByPacienteUseCase';
import { UpdateHistoriaClinicaUseCase } from '../../application/use-cases/historia-clinica/UpdateHistoriaClinicaUseCase';

const prisma = new PrismaClient();
const historiaClinicaRepository = new HistoriaClinicaRepository(prisma);

const updateHistoriaClinicaSchema = z.object({
  tipoSangre: z.string().optional(),
  diagnosticoPrincipal: z.string().optional(),
  alergias: z.string().optional(),
  medicacionHabitual: z.string().optional(),
  antecedentesPersonales: z.string().optional(),
  antecedentesFamiliares: z.string().optional(),
  antecedentesQuirurgicos: z.string().optional(),
  notasGenerales: z.string().optional(),
});

export class HistoriaClinicaController {
  // GET /api/pacientes/:pacienteId/historia-clinica
  static async getByPaciente(req: Request, res: Response): Promise<void> {
    try {
      const pacienteId = req.params.pacienteId as string;

      const useCase = new GetHistoriaClinicaByPacienteUseCase(historiaClinicaRepository);
      const historiaClinica = await useCase.execute(pacienteId);

      res.json({
        success: true,
        data: historiaClinica,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Error al obtener historia clínica',
      });
    }
  }

  // PUT /api/pacientes/:pacienteId/historia-clinica
  static async update(req: Request, res: Response): Promise<void> {
    try {
      const pacienteId = req.params.pacienteId as string;
      const validatedData = updateHistoriaClinicaSchema.parse(req.body);

      const useCase = new UpdateHistoriaClinicaUseCase(historiaClinicaRepository);
      const historiaClinica = await useCase.execute(pacienteId, validatedData);

      res.json({
        success: true,
        data: historiaClinica,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          error: 'Datos invalidos',
          details: error.errors,
        });
        return;
      }

      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Error al actualizar historia clínica',
      });
    }
  }
}
