'use client';

import { api } from '@/lib/api/client';
import { Documento } from '@/types/historia';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AttachmentUploadKind } from './attachments.types';

interface UseAttachmentsOptions {
  pacienteId: string;
  initialDocumentos: Documento[];
  onUploadSuccess?: () => void;
}

export function useAttachments({
  pacienteId,
  initialDocumentos,
  onUploadSuccess,
}: UseAttachmentsOptions) {
  const [documentos, setDocumentos] = useState<Documento[]>(initialDocumentos);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fotoInputRef = useRef<HTMLInputElement>(null);
  const documentoInputRef = useRef<HTMLInputElement>(null);

  const fetchDocumentos = useCallback(async () => {
    const data = await api.get<Documento[]>(`/pacientes/${pacienteId}/documentos`);
    setDocumentos(data ?? []);
  }, [pacienteId]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      fetchDocumentos().catch((fetchError) => {
        setError(fetchError instanceof Error ? fetchError.message : 'Error al cargar archivos');
      });
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [fetchDocumentos]);

  const uploadFile = useCallback(async (file: File, kind: AttachmentUploadKind) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('pacienteId', pacienteId);
    formData.append('kind', kind === 'fotos' ? 'FOTO' : 'DOCUMENTO');

    return api.upload('/documentos/upload', formData);
  }, [pacienteId]);

  const handleInlineUpload = useCallback(async (file: File | null, kind: AttachmentUploadKind) => {
    if (!file) {
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      await uploadFile(file, kind);
      await fetchDocumentos();
      onUploadSuccess?.();
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : 'Error al subir archivo');
    } finally {
      setIsUploading(false);

      if (kind === 'fotos' && fotoInputRef.current) {
        fotoInputRef.current.value = '';
      }

      if (kind === 'documentos' && documentoInputRef.current) {
        documentoInputRef.current.value = '';
      }
    }
  }, [fetchDocumentos, onUploadSuccess, uploadFile]);

  const handleDelete = useCallback(async (documentoId: string) => {
    if (!confirm('¿Eliminar este archivo?')) {
      return;
    }

    try {
      await api.delete(`/documentos/${documentoId}`);
      await fetchDocumentos();
      onUploadSuccess?.();
    } catch {
      setError('Error al eliminar el archivo');
    }
  }, [fetchDocumentos, onUploadSuccess]);

  const fotos = useMemo(() => documentos.filter((documento) => documento.kind === 'FOTO'), [documentos]);
  const documentosClinicos = useMemo(
    () => documentos.filter((documento) => documento.kind === 'DOCUMENTO'),
    [documentos],
  );

  return {
    documentos,
    documentosClinicos,
    error,
    fotoInputRef,
    documentoInputRef,
    fotos,
    handleDelete,
    handleInlineUpload,
    isUploading,
    setError,
  };
}