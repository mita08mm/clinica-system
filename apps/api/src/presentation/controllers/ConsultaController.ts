import { Request, Response } from 'express';
import { z } from 'zod';
import { PrismaClient } from '@clinica/database';
import { ConsultaRepository } from '../../infrastructure/repositories/ConsultaRepository';
import { HistoriaClinicaRepository } from '../../infrastructure/repositories/HistoriaClinicaRepository';
import { CreateConsultaUseCase } from '../../application/use-cases/consulta/CreateConsultaUseCase';
import { GetConsultaByIdUseCase } from '../../application/use-cases/consulta/GetConsultaByIdUseCase';
import { GetConsultasByPacienteUseCase } from '../../application/use-cases/consulta/GetConsultasByPacienteUseCase';
import { UpdateConsultaUseCase } from '../../application/use-cases/consulta/UpdateConsultaUseCase';
import type { AuthRequest } from '../middlewares/auth.middleware';

const prisma = new PrismaClient();
const consultaRepository = new ConsultaRepository(prisma);
const historiaClinicaRepository = new HistoriaClinicaRepository(prisma);

// Schemas de validación
const signosVitalesSchema = z.object({
  pa_sistolica: z.number().optional(),
  pa_diastolica: z.number().optional(),
  fc: z.number().optional(),
  temp: z.number().optional(),
  peso: z.number().optional(),
  talla: z.number().optional(),
  imc: z.number().optional(),
  spo2: z.number().optional(),
}).optional();

const createConsultaSchema = z.object({
  pacienteId: z.string().uuid(),
  citaId: z.string().uuid().optional(),
  motivoConsulta: z.string().min(1, 'Motivo de consulta requerido'),
  examenFisico: z.string().optional(),
  diagnostico: z.string().min(1, 'Diagnóstico requerido'),
  codigoCIE: z.string().optional(),
  tratamiento: z.string().optional(),
  observaciones: z.string().optional(),
  proximaConsulta: z.string().datetime().optional(),
  signosVitales: signosVitalesSchema,
});

const updateConsultaSchema = z.object({
  motivoConsulta: z.string().optional(),
  examenFisico: z.string().optional(),
  diagnostico: z.string().optional(),
  codigoCIE: z.string().optional(),
  tratamiento: z.string().optional(),
  observaciones: z.string().optional(),
  proximaConsulta: z.string().datetime().optional(),
  signosVitales: signosVitalesSchema,
});

export class ConsultaController {
  // POST /api/consultas
  static async create(req: AuthRequest, res: Response): Promise<void> {
    try {
      const validatedData = createConsultaSchema.parse(req.body);
      const usuarioId = req.user?.userId;

      if (!usuarioId) {
        res.status(401).json({
          success: false,
          error: 'Usuario no autenticado',
        });
        return;
      }

      const useCase = new CreateConsultaUseCase(
        consultaRepository,
        historiaClinicaRepository
      );

      const consulta = await useCase.execute({
        ...validatedData,
        usuarioId,
        proximaConsulta: validatedData.proximaConsulta
          ? new Date(validatedData.proximaConsulta)
          : undefined,
      });

      res.status(201).json({
        success: true,
        data: consulta,
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
        error: error instanceof Error ? error.message : 'Error al crear consulta',
      });
    }
  }

  // GET /api/consultas/:id
  static async getById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const useCase = new GetConsultaByIdUseCase(consultaRepository);
      const consulta = await useCase.execute(id);

      res.json({
        success: true,
        data: consulta,
      });
    } catch (error) {
      if (error instanceof Error && error.message === 'Consulta no encontrada') {
        res.status(404).json({
          success: false,
          error: error.message,
        });
        return;
      }

      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Error al obtener consulta',
      });
    }
  }

  // GET /api/pacientes/:pacienteId/consultas
  static async getByPaciente(req: Request, res: Response): Promise<void> {
    try {
      const { pacienteId } = req.params;

      const useCase = new GetConsultasByPacienteUseCase(consultaRepository);
      const consultas = await useCase.execute(pacienteId);

      res.json({
        success: true,
        data: consultas,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Error al obtener consultas',
      });
    }
  }

  // PUT /api/consultas/:id
  static async update(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const validatedData = updateConsultaSchema.parse(req.body);

      const useCase = new UpdateConsultaUseCase(consultaRepository);
      const consulta = await useCase.execute(id, {
        ...validatedData,
        proximaConsulta: validatedData.proximaConsulta
          ? new Date(validatedData.proximaConsulta)
          : undefined,
      });

      res.json({
        success: true,
        data: consulta,
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

      if (error instanceof Error && error.message === 'Consulta no encontrada') {
        res.status(404).json({
          success: false,
          error: error.message,
        });
        return;
      }

      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Error al actualizar consulta',
      });
    }
  }
}
