import { Request, Response } from 'express';
import { PrismaClient } from '@clinica/database';
import { GetReporteIngresosUseCase } from '../../application/use-cases/reportes/GetReporteIngresosUseCase';
import { GetReportePagosUseCase } from '../../application/use-cases/reportes/GetReportePagosUseCase';

const prisma = new PrismaClient();

export class ReporteController {
  static async getIngresos(req: Request, res: Response): Promise<void> {
    try {
      const { fechaInicio, fechaFin } = req.query;

      if (!fechaInicio || !fechaFin) {
        res.status(400).json({ success: false, error: 'fechaInicio y fechaFin son requeridos' });
        return;
      }

      const data = await new GetReporteIngresosUseCase(prisma).execute(
        String(fechaInicio),
        String(fechaFin),
      );

      res.json({ success: true, data });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Error interno',
      });
    }
  }

  static async getPagosPendientes(_req: Request, res: Response): Promise<void> {
    try {
      const data = await new GetReportePagosUseCase(prisma).execute();
      res.json({ success: true, data });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Error interno',
      });
    }
  }
}