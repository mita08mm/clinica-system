/**
 * Cliente API centralizado con autenticación automática y manejo de errores.
 *
 * Uso:
 *   const cobros = await api.get<Cobro[]>('/cobros', { params: { pacienteId } });
 *   const nuevo = await api.post<Cobro>('/cobros', { items: [...] });
 */

import { config } from '../config';
import { getClientToken } from '@/features/auth';

// ---------------------------------------------------------------------------
// Tipos
// ---------------------------------------------------------------------------

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
}

export interface ApiOptions {
  params?: Record<string, string | number | undefined>;
  signal?: AbortSignal;
  /** No incluir token de autenticación */
  skipAuth?: boolean;
  /** Headers adicionales */
  headers?: Record<string, string>;
}

export class ApiError extends Error {
  constructor(
    public status: number,
    public details: unknown,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getToken(): string | null {
  return getClientToken();
}

function buildUrl(path: string, params?: ApiOptions['params']): string {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  const url = new URL(`${config.apiUrl}${cleanPath}`);

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        url.searchParams.append(key, String(value));
      }
    });
  }

  return url.toString();
}

function buildHeaders(options?: ApiOptions, hasBody = false): HeadersInit {
  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...(options?.headers ?? {}),
  };

  if (hasBody) {
    headers['Content-Type'] = 'application/json';
  }

  if (!options?.skipAuth) {
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  return headers;
}

async function handleResponse<T>(response: Response): Promise<T> {
  const text = await response.text();
  const body = text ? safeJsonParse(text) : null;

  if (!response.ok) {
    const message =
      (body && typeof body === 'object' && 'error' in body && typeof body.error === 'string'
        ? body.error
        : null) ?? `Error ${response.status}`;
    throw new ApiError(response.status, body, message);
  }

  // Convención: el backend devuelve { success, data }
  if (body && typeof body === 'object' && 'data' in body) {
    return (body as ApiResponse<T>).data;
  }

  return body as T;
}

function safeJsonParse(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

async function get<T>(path: string, options?: ApiOptions): Promise<T> {
  const response = await fetch(buildUrl(path, options?.params), {
    method: 'GET',
    headers: buildHeaders(options),
    signal: options?.signal,
  });
  return handleResponse<T>(response);
}

async function post<T>(path: string, body?: unknown, options?: ApiOptions): Promise<T> {
  const response = await fetch(buildUrl(path, options?.params), {
    method: 'POST',
    headers: buildHeaders(options, true),
    body: body ? JSON.stringify(body) : undefined,
    signal: options?.signal,
  });
  return handleResponse<T>(response);
}

async function put<T>(path: string, body?: unknown, options?: ApiOptions): Promise<T> {
  const response = await fetch(buildUrl(path, options?.params), {
    method: 'PUT',
    headers: buildHeaders(options, true),
    body: body ? JSON.stringify(body) : undefined,
    signal: options?.signal,
  });
  return handleResponse<T>(response);
}

async function patch<T>(path: string, body?: unknown, options?: ApiOptions): Promise<T> {
  const response = await fetch(buildUrl(path, options?.params), {
    method: 'PATCH',
    headers: buildHeaders(options, true),
    body: body ? JSON.stringify(body) : undefined,
    signal: options?.signal,
  });
  return handleResponse<T>(response);
}

async function del<T>(path: string, options?: ApiOptions): Promise<T> {
  const response = await fetch(buildUrl(path, options?.params), {
    method: 'DELETE',
    headers: buildHeaders(options),
    signal: options?.signal,
  });
  return handleResponse<T>(response);
}

async function upload<T>(path: string, formData: FormData, options?: ApiOptions): Promise<T> {
  const headers: Record<string, string> = { ...(options?.headers ?? {}) };
  if (!options?.skipAuth) {
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(buildUrl(path, options?.params), {
    method: 'POST',
    headers,
    body: formData,
    signal: options?.signal,
  });
  return handleResponse<T>(response);
}

export const api = {
  get,
  post,
  put,
  patch,
  delete: del,
  upload,
};
