'use client';

import { Documento } from '@/types/historia';
import { useMemo, useState } from 'react';
import PanelFrame from '@/components/historia/panels/PanelFrame';
import { AttachmentsDocumentsTab } from '@/components/historia/panels/attachments/AttachmentsDocumentsTab';
import { AttachmentsPhotoTab } from '@/components/historia/panels/attachments/AttachmentsPhotoTab';
import { PhotoViewerModal } from '@/components/historia/panels/attachments/PhotoViewerModal';
import { AttachmentTab } from '@/components/historia/panels/attachments/attachments.types';
import { useAttachments } from '@/components/historia/panels/attachments/useAttachments';

interface AttachmentsPanelProps {
  documentos: Documento[];
  pacienteId: string;
  onUploadSuccess?: () => void;
}

export default function AttachmentsPanel({ 
  documentos, 
  pacienteId,
  onUploadSuccess 
}: AttachmentsPanelProps) {
  const [activeTab, setActiveTab] = useState<AttachmentTab>('fotos');
  const [previewFotoId, setPreviewFotoId] = useState<string | null>(null);
  const [isFotoModalOpen, setIsFotoModalOpen] = useState(false);
  const [openDocumentoMenuId, setOpenDocumentoMenuId] = useState<string | null>(null);
  const {
    documentosClinicos,
    error,
    documentoInputRef,
    fotoInputRef,
    fotos,
    handleDelete,
    handleInlineUpload,
    isUploading,
  } = useAttachments({
    pacienteId,
    initialDocumentos: documentos,
    onUploadSuccess,
  });

  const previewFoto = useMemo(
    () => fotos.find((foto) => foto.id === previewFotoId) ?? null,
    [fotos, previewFotoId],
  );

  const handleClosePhotoModal = () => {
    setIsFotoModalOpen(false);
    setPreviewFotoId(null);
  };

  return (
    <PanelFrame title="Archivos">
      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
          {error}
        </div>
      )}

      <div className="mb-5 flex gap-1 border-b border-gray-200">
        <button
          type="button"
          onClick={() => setActiveTab('fotos')}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === 'fotos'
              ? 'border-b-2 border-morena text-morena'
              : 'text-marengo hover:text-concreto'
          }`}
        >
          Fotos ({fotos.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('documentos')}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === 'documentos'
              ? 'border-b-2 border-morena text-morena'
              : 'text-marengo hover:text-concreto'
          }`}
        >
          Documentos ({documentosClinicos.length})
        </button>
      </div>

      <div>
        <input
          ref={fotoInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => handleInlineUpload(e.target.files?.[0] || null, 'fotos')}
        />
        <input
          ref={documentoInputRef}
          type="file"
          accept=".pdf,.doc,.docx"
          className="hidden"
          onChange={(e) => handleInlineUpload(e.target.files?.[0] || null, 'documentos')}
        />
      </div>

      {activeTab === 'fotos' ? (
        <AttachmentsPhotoTab
          fotos={fotos}
          isUploading={isUploading}
          onOpenPhoto={(fotoId) => {
            setPreviewFotoId(fotoId);
            setIsFotoModalOpen(true);
          }}
          onTriggerUpload={() => fotoInputRef.current?.click()}
          previewFotoId={previewFotoId}
        />
      ) : (
        <AttachmentsDocumentsTab
          documentos={documentosClinicos}
          isUploading={isUploading}
          onDelete={(documentoId) => {
            setOpenDocumentoMenuId(null);
            handleDelete(documentoId);
          }}
          onToggleMenu={(documentoId) => {
            setOpenDocumentoMenuId((current) => current === documentoId ? null : documentoId);
          }}
          onTriggerUpload={() => documentoInputRef.current?.click()}
          openMenuId={openDocumentoMenuId}
        />
      )}

      {activeTab === 'fotos' && previewFoto && (
        <PhotoViewerModal
          foto={previewFoto}
          isOpen={isFotoModalOpen}
          onClose={handleClosePhotoModal}
          onDelete={handleDelete}
        />
      )}
    </PanelFrame>
  );
}
