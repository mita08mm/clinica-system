import { Request, Response } from 'express';
import { z } from 'zod';
import { Documento, PrismaClient, TipoDocumento } from '@clinica/database';
import { DocumentoRepository } from '../../infrastructure/repositories/DocumentoRepository';
import { CreateDocumentoUseCase } from '../../application/use-cases/documento/CreateDocumentoUseCase';
import { GetDocumentosByPacienteUseCase } from '../../application/use-cases/documento/GetDocumentosByPacienteUseCase';
import { DeleteDocumentoUseCase } from '../../application/use-cases/documento/DeleteDocumentoUseCase';
import { UpdateDocumentoUseCase } from '../../application/use-cases/documento/UpdateDocumentoUseCase';

const prisma = new PrismaClient();
const documentoRepository = new DocumentoRepository(prisma);

const updateDocumentoSchema = z.object({
  nombre: z.string().min(1).optional(),
  kind: z.enum(['FOTO', 'DOCUMENTO']).optional(),
});

function mapKindToTipo(kind: 'FOTO' | 'DOCUMENTO'): TipoDocumento {
  return kind;
}

function mapTipoToKind(tipo: TipoDocumento): 'FOTO' | 'DOCUMENTO' {
  return tipo;
}

function serializeDocumento(documento: Documento) {
  return {
    id: documento.id,
    nombre: documento.nombre,
    kind: mapTipoToKind(documento.tipo),
    url: documento.url,
    createdAt: documento.createdAt,
  };
}

export class DocumentoController {
  static async list(req: Request, res: Response): Promise<void> {
    try {
      const pacienteId = typeof req.query.pacienteId === 'string' ? req.query.pacienteId : undefined;
      const documentos = pacienteId
        ? await documentoRepository.findByPaciente(pacienteId)
        : await documentoRepository.findAll();
      res.json({ success: true, data: documentos.map(serializeDocumento) });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Error al listar documentos' });
    }
  }

  static async create(req: Request, res: Response): Promise<void> {
    try {
      const schema = z.object({
        pacienteId: z.string().uuid(),
        kind: z.enum(['FOTO', 'DOCUMENTO']),
        url: z.string().url(),
        publicId: z.string(),
        nombre: z.string().optional(),
      });

      const { pacienteId, kind, url, publicId, nombre } = schema.parse(req.body);

      const useCase = new CreateDocumentoUseCase(documentoRepository);
      const documento = await useCase.execute({
        pacienteId,
        tipo: kind,
        url,
        publicId,
        nombre: nombre ?? url.split('/').pop() ?? 'sin-nombre',
      });

      res.status(201).json({ success: true, data: serializeDocumento(documento) });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ success: false, error: 'Datos inválidos', details: error.errors });
        return;
      }
      console.error('Error al guardar documento:', error);
      res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Error al guardar documento' });
    }
  }

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
      res.json({ success: true, data: serializeDocumento(documento) });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ success: false, error: 'Datos inválidos', details: error.errors });
        return;
      }
      res.status(500).json({ success: false, error: 'Error al actualizar documento' });
    }
  }

  static async getByPaciente(req: Request, res: Response): Promise<void> {
    try {
      const pacienteId = req.params.pacienteId as string;
      const useCase = new GetDocumentosByPacienteUseCase(documentoRepository);
      const documentos = await useCase.execute(pacienteId);
      res.json({ success: true, data: documentos.map(serializeDocumento) });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Error al obtener documentos' });
    }
  }

  static async getById(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;
      const documento = await documentoRepository.findById(id);
      if (!documento) {
        res.status(404).json({ success: false, error: 'Documento no encontrado' });
        return;
      }
      res.json({ success: true, data: serializeDocumento(documento) });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Error al obtener documento' });
    }
  }

  static async delete(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;
      const useCase = new DeleteDocumentoUseCase(documentoRepository);
      await useCase.execute(id);
      res.json({ success: true, message: 'Documento eliminado correctamente' });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Error al eliminar documento' });
    }
  }
}