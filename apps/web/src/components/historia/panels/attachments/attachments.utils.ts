import { config } from '@/lib/config';

export const formatAttachmentDate = (date: Date | string) => {
  return new Date(date).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

export const getAttachmentFileUrl = (url: string) => {
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }

  const apiBaseUrl = (config.apiUrl ?? '')
    .replace(/\/api\/?$/, '')
    .replace(/\/$/, '');
  const normalizedPath = url.startsWith('/') ? url : `/${url}`;

  return `${apiBaseUrl}${normalizedPath}`;
};

export const formatAttachmentSize = (size: number) => {
  if (size >= 1024 * 1024) {
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  }

  return `${Math.max(1, Math.round(size / 1024))} KB`;
};