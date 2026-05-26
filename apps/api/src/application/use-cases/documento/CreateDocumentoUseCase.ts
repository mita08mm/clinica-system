import { DocumentoRepository, CreateDocumentoData } from '../../../infrastructure/repositories/DocumentoRepository';

export class CreateDocumentoUseCase {
  constructor(private documentoRepository: DocumentoRepository) {}

  async execute(documento: CreateDocumentoData) {
    return this.documentoRepository.create(documento);
  }
}