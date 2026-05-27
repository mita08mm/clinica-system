import { Request, Response } from 'express';
import { z } from 'zod';
import { CreateCitaUseCase } from '../../application/use-cases/cita/CreateCitaUseCase';
import { GetCitasUseCase } from '../../application/use-cases/cita/GetCitasUseCase';
import { GetCitaByIdUseCase } from '../../application/use-cases/cita/GetCitaByIdUseCase';
import { UpdateCitaUseCase } from '../../application/use-cases/cita/UpdateCitaUseCase';
import { CancelarCitaUseCase } from '../../application/use-cases/cita/CancelarCitaUseCase';
import { GetCitasByPacienteUseCase } from '../../application/use-cases/cita/GetCitasByPacienteUseCase';
import { GetCitasByFechaUseCase } from '../../application/use-cases/cita/GetCitasByFechaUseCase';
import { DeleteCitaUseCase } from '../../application/use-cases/cita/DeleteCitaUseCase';
const createCitaSchema = z.object({
  pacienteId: z.string().uuid('ID de paciente invalido'),
  fecha: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'Fecha invalida',
  }),
  horaInicio: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Formato de hora invalido (HH:MM)'),
  horaFin: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Formato de hora invalido (HH:MM)'),
  motivo: z.string().min(3, 'El motivo debe tener al menos 3 caracteres'),
  notas: z.string().optional(),
});

const updateCitaSchema = z.object({
  fecha: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'Fecha invalida',
  }).optional(),
  horaInicio: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Formato de hora invalido (HH:MM)').optional(),
  horaFin: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Formato de hora invalido (HH:MM)').optional(),
  motivo: z.string().min(3, 'El motivo debe tener al menos 3 caracteres').optional(),
  estado: z.enum(['PROGRAMADA', 'CONFIRMADA', 'EN_CURSO', 'COMPLETADA', 'CANCELADA', 'NO_ASISTIO']).optional(),
  notas: z.string().optional(),
});

const cancelarCitaSchema = z.object({
  notas: z.string().optional(),
});

export class CitaController {
  constructor(
    private createCitaUseCase: CreateCitaUseCase,
    private getCitasUseCase: GetCitasUseCase,
    private getCitaByIdUseCase: GetCitaByIdUseCase,
    private updateCitaUseCase: UpdateCitaUseCase,
    private cancelarCitaUseCase: CancelarCitaUseCase,
    private getCitasByPacienteUseCase: GetCitasByPacienteUseCase,
    private getCitasByFechaUseCase: GetCitasByFechaUseCase,
    private deleteCitaUseCase: DeleteCitaUseCase,
  ) {}

  create = async (req: Request, res: Response): Promise<void> => {
    try {
      const validatedData = createCitaSchema.parse(req.body);

      const cita = await this.createCitaUseCase.execute({
        ...validatedData,
        fecha: (() => {
          const [year, month, day] = validatedData.fecha.split('T')[0].split('-').map(Number);
          return new Date(year, month - 1, day);
        })(),
      });

      res.status(201).json({
        success: true,
        data: cita,
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

      if (error instanceof Error) {
        res.status(400).json({
          success: false,
          error: error.message,
        });
        return;
      }

      res.status(500).json({
        success: false,
        error: 'Error interno del servidor',
      });
    }
  };

  getAll = async (req: Request, res: Response): Promise<void> => {
    try {
      const { pacienteId, fecha } = req.query;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;

      let citas;

      if (pacienteId && typeof pacienteId === 'string') {
        citas = await this.getCitasByPacienteUseCase.execute(pacienteId);
      } else if (fecha && typeof fecha === 'string') {
        citas = await this.getCitasByFechaUseCase.execute(new Date(fecha));
      } else {
        citas = await this.getCitasUseCase.execute(page, limit);
      }

      res.status(200).json({
        success: true,
        data: citas,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Error interno del servidor',
      });
    }
  };

  getById = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      if (typeof id !== 'string') {
        res.status(400).json({
          success: false,
          error: 'ID invalido',
        });
        return;
      }

      const cita = await this.getCitaByIdUseCase.execute(id);

      res.status(200).json({
        success: true,
        data: cita,
      });
    } catch (error) {
      if (error instanceof Error && error.message === 'Cita no encontrada') {
        res.status(404).json({
          success: false,
          error: error.message,
        });
        return;
      }

      res.status(500).json({
        success: false,
        error: 'Error interno del servidor',
      });
    }
  };

  update = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      if (typeof id !== 'string') {
        res.status(400).json({
          success: false,
          error: 'ID invalido',
        });
        return;
      }

      const validatedData = updateCitaSchema.parse(req.body);

      const updateData: any = { ...validatedData };
      
      if (validatedData.fecha) {
        updateData.fecha = new Date(validatedData.fecha);
      }

      const cita = await this.updateCitaUseCase.execute(id, updateData);

      res.status(200).json({
        success: true,
        data: cita,
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

      if (error instanceof Error && error.message === 'Cita no encontrada') {
        res.status(404).json({
          success: false,
          error: error.message,
        });
        return;
      }

      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Error interno del servidor',
      });
    }
  };

  cancelar = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      if (typeof id !== 'string') {
        res.status(400).json({
          success: false,
          error: 'ID invalido',
        });
        return;
      }

      const validatedData = cancelarCitaSchema.parse(req.body);

      const cita = await this.cancelarCitaUseCase.execute(id, validatedData.notas);

      res.status(200).json({
        success: true,
        data: cita,
      });
    } catch (error) {
      if (error instanceof Error && error.message === 'Cita no encontrada') {
        res.status(404).json({
          success: false,
          error: error.message,
        });
        return;
      }

      if (error instanceof Error) {
        res.status(400).json({
          success: false,
          error: error.message,
        });
        return;
      }

      res.status(500).json({
        success: false,
        error: 'Error interno del servidor',
      });
    }
  };

  delete = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      if (typeof id !== 'string') {
        res.status(400).json({ success: false, error: 'ID invalido' });
        return;
      }

      await this.deleteCitaUseCase.execute(id);
      res.status(200).json({
        success: true,
        message: 'Cita eliminada correctamente',
      });
    } catch (error) {
      if (error instanceof Error && error.message === 'Cita no encontrada') {
        res.status(404).json({ success: false, error: error.message });
        return;
      }
      res.status(500).json({ success: false, error: 'Error interno del servidor' });
    }
  };
}
