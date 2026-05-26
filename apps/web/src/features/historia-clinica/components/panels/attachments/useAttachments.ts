'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useRef, useState } from 'react';
import { api } from '@/shared/api';
import { Documento } from '@/features/historia-clinica/types';
import { AttachmentUploadKind } from './attachments.types';
const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME!;
const UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!;

interface UseAttachmentsOptions {
  pacienteId: string;
  initialDocumentos: Documento[];
  onUploadSuccess?: () => void;
}

const documentosKey = (pacienteId: string) =>
  ['historia-clinica', pacienteId, 'documentos'] as const;

export function useAttachments({
  pacienteId,
  initialDocumentos,
  onUploadSuccess,
}: UseAttachmentsOptions) {
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const fotoInputRef = useRef<HTMLInputElement>(null);
  const documentoInputRef = useRef<HTMLInputElement>(null);

  const { data: documentos = initialDocumentos } = useQuery({
    queryKey: documentosKey(pacienteId),
    queryFn: async () => {
      const data = await api.get<Documento[]>(`/pacientes/${pacienteId}/documentos`);
      return data ?? [];
    },
    initialData: initialDocumentos,
    initialDataUpdatedAt: 0, // ← esto hace que siempre fetchee al montar
    staleTime: 1000 * 60 * 5, // ← pero luego cachea 5 minutos
    enabled: Boolean(pacienteId),
  });
  async function uploadToCloudinary(file: File) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', UPLOAD_PRESET);

    const tipo = file.type.startsWith('image/') ? 'image' : 'raw';

    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/${tipo}/upload`,
      { method: 'POST', body: formData }
    );

    if (!res.ok) throw new Error('Error al subir a Cloudinary');

    const data = await res.json();
    return {
      url: data.secure_url as string,
      publicId: data.public_id as string,
    };
  }
  const uploadMut = useMutation({
    mutationFn: async ({ url, publicId, kind, nombre }: {
      url: string;
      publicId: string;
      kind: AttachmentUploadKind;
      nombre: string;
    }) => {
      return api.post('/documentos', {
        pacienteId,
        url,
        publicId,
        kind: kind === 'fotos' ? 'FOTO' : 'DOCUMENTO',
        nombre,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: documentosKey(pacienteId) });
      onUploadSuccess?.();
    },
  });

  const deleteMut = useMutation({
    mutationFn: (documentoId: string) => api.delete(`/documentos/${documentoId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: documentosKey(pacienteId) });
      onUploadSuccess?.();
    },
  });

  const handleInlineUpload = async (file: File | null, kind: AttachmentUploadKind) => {
    if (!file) return;
    setError(null);
    try {
      const { url, publicId } = await uploadToCloudinary(file);
      await uploadMut.mutateAsync({ url, publicId, kind, nombre: file.name });
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : 'Error al subir archivo');
    } finally {
      if (kind === 'fotos' && fotoInputRef.current) fotoInputRef.current.value = '';
      if (kind === 'documentos' && documentoInputRef.current) documentoInputRef.current.value = '';
    }
  };

  const handleDelete = async (documentoId: string) => {
    if (!confirm('¿Eliminar este archivo?')) return;
    try {
      await deleteMut.mutateAsync(documentoId);
    } catch {
      setError('Error al eliminar el archivo');
    }
  };

  const fotos = useMemo(() => documentos.filter((d) => d.kind === 'FOTO'), [documentos]);
  const documentosClinicos = useMemo(
    () => documentos.filter((d) => d.kind === 'DOCUMENTO'),
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
    isUploading: uploadMut.isPending,
    setError,
  };
}
