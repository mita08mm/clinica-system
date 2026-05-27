import { Request, Response } from 'express';
import { CreatePacienteUseCase } from '../../application/use-cases/paciente/CreatePacienteUseCase';
import { GetPacientesUseCase } from '../../application/use-cases/paciente/GetPacientesUseCase';
import { GetPacienteByIdUseCase } from '../../application/use-cases/paciente/GetPacienteByIdUseCase';
import { UpdatePacienteUseCase } from '../../application/use-cases/paciente/UpdatePacienteUseCase';
import { z } from 'zod';
import { TipoDocumentoIdentidad } from '@clinica/database';

const createPacienteSchema = z.object({
  nombre: z.string().min(2, 'Nombre debe tener minimo 2 caracteres'),
  apellido: z.string().min(2, 'Apellido debe tener minimo 2 caracteres'),
  documento: z.string().min(6, 'Documento invalido'),
  tipoDocumento: z.enum(['DNI', 'PASAPORTE']),
  fechaNacimiento: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: 'Fecha invalida',
  }),
  telefono: z.string().min(7, 'Telefono invalido'),
  email: z.preprocess(
    (val) => (val === '' ? undefined : val),
    z.string().email('Email invalido').optional()
  ),
  direccion: z.string().optional(),
  sexo: z.string().optional(),
  objetivoEstetico: z.string().optional(),
  alergias: z.string().optional(),
  condicionesMedicas: z.string().optional(),
  medicacionActual: z.string().optional(),
  embarazoLactancia: z.boolean().optional(),
  contactoEmergenciaNombre: z.string().optional(),
  contactoEmergenciaTelefono: z.string().optional(),
});

const updatePacienteSchema = z.object({
  nombre: z.string().min(2).optional(),
  apellido: z.string().min(2).optional(),
  telefono: z.string().min(7).optional(),
  email: z.string().email().optional(),
  direccion: z.string().optional(),
  sexo: z.string().optional(),
  objetivoEstetico: z.string().optional(),
  alergias: z.string().optional(),
  condicionesMedicas: z.string().optional(),
  medicacionActual: z.string().optional(),
  embarazoLactancia: z.boolean().optional(),
  contactoEmergenciaNombre: z.string().optional(),
  contactoEmergenciaTelefono: z.string().optional(),
  estado: z.enum(['ACTIVO', 'INACTIVO']).optional(),
});

export class PacienteController {
  constructor(
    private createPacienteUseCase: CreatePacienteUseCase,
    private getPacientesUseCase: GetPacientesUseCase,
    private getPacienteByIdUseCase: GetPacienteByIdUseCase,
    private updatePacienteUseCase: UpdatePacienteUseCase
  ) {}

  create = async (req: Request, res: Response): Promise<void> => {
    try {
      const validatedData = createPacienteSchema.parse(req.body);

      const paciente = await this.createPacienteUseCase.execute({
        ...validatedData,
        tipoDocumento: validatedData.tipoDocumento as TipoDocumentoIdentidad,
        fechaNacimiento: new Date(validatedData.fechaNacimiento),
      });

      res.status(201).json({
        success: true,
        data: paciente,
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
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;
      const pacientes = await this.getPacientesUseCase.execute(page, limit);

      res.status(200).json({
        success: true,
        data: pacientes,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Error al obtener pacientes',
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

      const paciente = await this.getPacienteByIdUseCase.execute(id);

      res.status(200).json({
        success: true,
        data: paciente,
      });
    } catch (error) {
      if (error instanceof Error) {
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

      const validatedData = updatePacienteSchema.parse(req.body);

      const paciente = await this.updatePacienteUseCase.execute(id, validatedData);

      res.status(200).json({
        success: true,
        data: paciente,
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
}
