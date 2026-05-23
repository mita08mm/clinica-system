import { TipoDocumento } from '@clinica/database';
import { DocumentoRepository } from '../../../infrastructure/repositories/DocumentoRepository';

interface UpdateDocumentoInput {
  nombre?: string;
  descripcion?: string;
  tipo?: TipoDocumento;
}

export class UpdateDocumentoUseCase {
  constructor(private documentoRepository: DocumentoRepository) {}

  async execute(id: string, data: UpdateDocumentoInput) {
    const documento = await this.documentoRepository.findById(id);

    if (!documento) {
      throw new Error('Documento no encontrado');
    }

    return this.documentoRepository.update(id, data);
  }
}