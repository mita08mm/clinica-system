import { v2 as cloudinary } from 'cloudinary';
import { DocumentoRepository } from '../../../infrastructure/repositories/DocumentoRepository';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export class DeleteDocumentoUseCase {
  constructor(private documentoRepository: DocumentoRepository) {}

  async execute(id: string): Promise<void> {
    const documento = await this.documentoRepository.findById(id);
    if (!documento) throw new Error('Documento no encontrado');

    if (documento.publicId) {
      await cloudinary.uploader.destroy(documento.publicId);
    }

    await this.documentoRepository.delete(id);
  }
}