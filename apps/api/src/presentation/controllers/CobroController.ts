import { Request, Response } from 'express';
import { z } from 'zod';
import { CreateCobroUseCase } from '../../application/use-cases/cobro/CreateCobroUseCase';
import { GetCobrosUseCase } from '../../application/use-cases/cobro/GetCobrosUseCase';
import { GetCobroByIdUseCase } from '../../application/use-cases/cobro/GetCobroByIdUseCase';
import { UpdateCobroUseCase } from '../../application/use-cases/cobro/UpdateCobroUseCase';
import { RegistrarPagoUseCase } from '../../application/use-cases/cobro/RegistrarPagoUseCase';
import { GetCobrosByPacienteUseCase } from '../../application/use-cases/cobro/GetCobrosByPacienteUseCase';

const itemCobroSchema = z.object({
  tipo: z.enum(['SERVICIO', 'MEDICAMENTO', 'INSUMO']),
  itemId: z.string().uuid('ID de item invalido').optional(),
  nombre: z.string().min(1, 'El nombre del item es requerido'),
  cantidad: z.number().int().positive('La cantidad debe ser mayor a 0'),
  precioUnitario: z.number().nonnegative('El precio unitario no puede ser negativo'),
});

const createCobroSchema = z.object({
  pacienteId: z.string().uuid('ID de paciente invalido'),
  evolucionId: z.string().uuid('ID de evolucion invalido').optional(),
  items: z.array(itemCobroSchema).min(1, 'Debe incluir al menos un item'),
  descuento: z.number().nonnegative('El descuento no puede ser negativo').optional(),
  notas: z.string().optional(),
});

const updateCobroSchema = z.object({
  descuento: z.number().nonnegative('El descuento no puede ser negativo').optional(),
  estado: z.enum(['PENDIENTE', 'PARCIAL', 'PAGADO', 'CANCELADO']).optional(),
  notas: z.string().optional(),
});

const registrarPagoSchema = z.object({
  monto: z.number().positive('El monto debe ser mayor a 0'),
  metodoPago: z.enum(['EFECTIVO', 'TARJETA', 'TRANSFERENCIA', 'OTRO']),
  referencia: z.string().optional(),
  notas: z.string().optional(),
});

export class CobroController {
  constructor(
    private createCobroUseCase: CreateCobroUseCase,
    private getCobrosUseCase: GetCobrosUseCase,
    private getCobroByIdUseCase: GetCobroByIdUseCase,
    private updateCobroUseCase: UpdateCobroUseCase,
    private registrarPagoUseCase: RegistrarPagoUseCase,
    private getCobrosByPacienteUseCase: GetCobrosByPacienteUseCase,
  ) {}

  create = async (req: Request, res: Response): Promise<void> => {
    try {
      const validatedData = createCobroSchema.parse(req.body);

      const cobro = await this.createCobroUseCase.execute(validatedData);

      res.status(201).json({
        success: true,
        data: cobro,
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
      const { pacienteId } = req.query;

      let cobros;

      if (pacienteId && typeof pacienteId === 'string') {
        cobros = await this.getCobrosByPacienteUseCase.execute(pacienteId);
      } else {
        cobros = await this.getCobrosUseCase.execute();
      }

      res.status(200).json({
        success: true,
        data: cobros,
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

      const cobro = await this.getCobroByIdUseCase.execute(id);

      res.status(200).json({
        success: true,
        data: cobro,
      });
    } catch (error) {
      if (error instanceof Error && error.message === 'Cobro no encontrado') {
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

      const validatedData = updateCobroSchema.parse(req.body);

      const cobro = await this.updateCobroUseCase.execute(id, validatedData);

      res.status(200).json({
        success: true,
        data: cobro,
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

      if (error instanceof Error && error.message === 'Cobro no encontrado') {
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

  registrarPago = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      if (typeof id !== 'string') {
        res.status(400).json({
          success: false,
          error: 'ID invalido',
        });
        return;
      }

      const validatedData = registrarPagoSchema.parse(req.body);

      const result = await this.registrarPagoUseCase.execute({
        cobroId: id,
        ...validatedData,
      });

      res.status(201).json({
        success: true,
        data: result,
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

      if (error instanceof Error && error.message === 'Cobro no encontrado') {
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
}
