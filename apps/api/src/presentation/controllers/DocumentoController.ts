import { Request, Response } from 'express';
import { z } from 'zod';
import { Documento, PrismaClient, TipoDocumento } from '@clinica/database';
import { DocumentoRepository } from '../../infrastructure/repositories/DocumentoRepository';
import { CreateDocumentoUseCase } from '../../application/use-cases/documento/CreateDocumentoUseCase';
import { GetDocumentosByPacienteUseCase } from '../../application/use-cases/documento/GetDocumentosByPacienteUseCase';
import { DeleteDocumentoUseCase } from '../../application/use-cases/documento/DeleteDocumentoUseCase';
import { UpdateDocumentoUseCase } from '../../application/use-cases/documento/UpdateDocumentoUseCase';
import * as path from 'path';
import * as fs from 'fs';

const prisma = new PrismaClient();
const documentoRepository = new DocumentoRepository(prisma);

const createDocumentoSchema = z.object({
  pacienteId: z.string().uuid(),
  tratamientoId: z.string().uuid().optional(),
  descripcion: z.string().optional(),
  kind: z.enum(['FOTO', 'DOCUMENTO']),
});

const updateDocumentoSchema = z.object({
  nombre: z.string().min(1).optional(),
  descripcion: z.string().optional(),
  kind: z.enum(['FOTO', 'DOCUMENTO']).optional(),
});

function mapKindToTipo(kind: 'FOTO' | 'DOCUMENTO'): TipoDocumento {
  return kind === 'FOTO' ? 'FOTO_FACIAL' : 'OTRO';
}

function mapTipoToKind(tipo: TipoDocumento): 'FOTO' | 'DOCUMENTO' {
  return tipo.startsWith('FOTO_') ? 'FOTO' : 'DOCUMENTO';
}

function serializeDocumento(documento: Documento) {
  return {
    id: documento.id,
    nombre: documento.nombre,
    kind: mapTipoToKind(documento.tipo),
    url: documento.url,
    mimeType: documento.mimeType,
    tamaño: documento.tamaño,
    createdAt: documento.createdAt,
    descripcion: documento.descripcion,
  };
}

export class DocumentoController {
  // GET /api/documentos
  static async list(req: Request, res: Response): Promise<void> {
    try {
      const pacienteId = typeof req.query.pacienteId === 'string' ? req.query.pacienteId : undefined;
      const documentos = pacienteId
        ? await documentoRepository.findByPaciente(pacienteId)
        : await documentoRepository.findAll();

      res.json({
        success: true,
        data: documentos.map(serializeDocumento),
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Error al listar documentos',
      });
    }
  }

  // POST /api/documentos/upload
  static async upload(req: Request, res: Response): Promise<void> {
    try {
      if (!req.file) {
        res.status(400).json({
          success: false,
          error: 'No se ha proporcionado ningún archivo',
        });
        return;
      }

      const validatedData = createDocumentoSchema.parse(req.body);
      const { kind, ...rest } = validatedData;

      const useCase = new CreateDocumentoUseCase(documentoRepository);
      const documento = await useCase.execute({
        ...rest,
        nombre: req.file.originalname,
        tipo: mapKindToTipo(kind),
        url: `/uploads/${req.file.filename}`,
        tamaño: req.file.size,
        mimeType: req.file.mimetype,
      });

      res.status(201).json({
        success: true,
        data: serializeDocumento(documento),
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

      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Error al subir documento',
      });
    }
  }

  // PUT /api/documentos/:id
  static async update(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;
      const validatedData = updateDocumentoSchema.parse(req.body);
      const { kind, ...rest } = validatedData;

      const useCase = new UpdateDocumentoUseCase(documentoRepository);
      const documento = await useCase.execute(id, {
        ...rest,
        ...(kind ? { tipo: mapKindToTipo(kind) } : {}),
      });

      res.json({
        success: true,
        data: serializeDocumento(documento),
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

      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Error al actualizar documento',
      });
    }
  }

  // GET /api/pacientes/:pacienteId/documentos
  static async getByPaciente(req: Request, res: Response): Promise<void> {
    try {
      const pacienteId = req.params.pacienteId as string;

      const useCase = new GetDocumentosByPacienteUseCase(documentoRepository);
      const documentos = await useCase.execute(pacienteId);

      res.json({
        success: true,
        data: documentos.map(serializeDocumento),
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Error al obtener documentos',
      });
    }
  }

  // GET /api/documentos/:id
  static async getById(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;
      const documento = await documentoRepository.findById(id);

      if (!documento) {
        res.status(404).json({
          success: false,
          error: 'Documento no encontrado',
        });
        return;
      }

      res.json({
        success: true,
        data: serializeDocumento(documento),
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Error al obtener documento',
      });
    }
  }

  // GET /api/documentos/:id/download
  static async download(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;
      const documento = await documentoRepository.findById(id);

      if (!documento) {
        res.status(404).json({
          success: false,
          error: 'Documento no encontrado',
        });
        return;
      }

      const uploadsDir = process.env.UPLOADS_DIR || './uploads';
      const filePath = path.join(uploadsDir, path.basename(documento.url));

      if (!fs.existsSync(filePath)) {
        res.status(404).json({
          success: false,
          error: 'Archivo físico no encontrado',
        });
        return;
      }

      res.download(filePath, documento.nombre);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Error al descargar documento',
      });
    }
  }

  // DELETE /api/documentos/:id
  static async delete(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;

      const useCase = new DeleteDocumentoUseCase(documentoRepository);
      await useCase.execute(id);

      res.json({
        success: true,
        message: 'Documento eliminado correctamente',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Error al eliminar documento',
      });
    }
  }
}
