import { Request, Response } from 'express';
import { z } from 'zod';
import { PrismaClient } from '@clinica/database';
import { ProductoRepository } from '../../infrastructure/repositories/ProductoRepository';
import { CreateProductoUseCase } from '../../application/use-cases/producto/CreateProductoUseCase';
import { GetProductosUseCase } from '../../application/use-cases/producto/GetProductosUseCase';
import { GetProductoByIdUseCase } from '../../application/use-cases/producto/GetProductoByIdUseCase';
import { GetProductosLowStockUseCase } from '../../application/use-cases/producto/GetProductosLowStockUseCase';
import { UpdateStockProductoUseCase } from '../../application/use-cases/producto/UpdateStockProductoUseCase';

const prisma = new PrismaClient();
const productoRepository = new ProductoRepository(prisma);

const createProductoSchema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido'),
  tipo: z.enum(['COSMECEUTICO', 'DERMOCOSMETICO', 'EQUIPO', 'INSUMO']),
  descripcion: z.string().optional(),
  precio: z.number().nonnegative('El precio debe ser mayor o igual a 0'),
  stock: z.number().int().nonnegative().optional(),
  stockMinimo: z.number().int().nonnegative().optional(),
  marca: z.string().optional(),
  principioActivo: z.string().optional(),
});

const updateStockSchema = z.object({
  cantidad: z.number().int().refine((val) => val !== 0, 'La cantidad debe ser diferente de 0'),
});

export class ProductoController {
  // POST /api/productos
  static async create(req: Request, res: Response): Promise<void> {
    try {
      const validatedData = createProductoSchema.parse(req.body);
      const useCase = new CreateProductoUseCase(productoRepository);
      const producto = await useCase.execute(validatedData);

      res.status(201).json({
        success: true,
        data: producto,
        message: 'Producto creado exitosamente',
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          error: 'Datos inválidos',
          details: error.errors,
        });
        return;
      }

      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Error al crear producto',
      });
    }
  }

  // GET /api/productos
  static async getAll(req: Request, res: Response): Promise<void> {
    try {
      const { includeInactive } = req.query;
      const useCase = new GetProductosUseCase(productoRepository);
      const productos = await useCase.execute(includeInactive === 'true');

      res.json({
        success: true,
        data: productos,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Error al obtener productos',
      });
    }
  }

  // GET /api/productos/low-stock
  static async getLowStock(_req: Request, res: Response): Promise<void> {
    try {
      const useCase = new GetProductosLowStockUseCase(productoRepository);
      const productos = await useCase.execute();

      res.json({
        success: true,
        data: productos,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Error al obtener productos',
      });
    }
  }

  // GET /api/productos/:id
  static async getById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      if (Array.isArray(id)) {
        res.status(400).json({ success: false, error: 'ID inválido' });
        return;
      }
      
      const useCase = new GetProductoByIdUseCase(productoRepository);
      const producto = await useCase.execute(id);

      res.json({
        success: true,
        data: producto,
      });
    } catch (error) {
      if (error instanceof Error && error.message === 'Producto no encontrado') {
        res.status(404).json({
          success: false,
          error: error.message,
        });
        return;
      }

      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Error al obtener producto',
      });
    }
  }

  // PATCH /api/productos/:id/stock
  static async updateStock(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      if (Array.isArray(id)) {
        res.status(400).json({ success: false, error: 'ID inválido' });
        return;
      }
      
      const validatedData = updateStockSchema.parse(req.body);
      
      const useCase = new UpdateStockProductoUseCase(productoRepository);
      const producto = await useCase.execute(id, validatedData.cantidad);

      res.json({
        success: true,
        data: producto,
        message: 'Stock actualizado exitosamente',
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          error: 'Datos inválidos',
          details: error.errors,
        });
        return;
      }

      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Error al actualizar stock',
      });
    }
  }
}
