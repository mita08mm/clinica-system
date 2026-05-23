'use client';

import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';

export type ProductoTipo = 'COSMECEUTICO' | 'DERMOCOSMETICO' | 'EQUIPO' | 'INSUMO';

export interface Producto {
  id: string;
  nombre: string;
  tipo: ProductoTipo;
  precio: number;
  stock: number;
  stockMinimo: number;
  unidad: string;
  descripcion?: string;
}

export function useProductos() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProductos = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await api.get<Producto[]>('/productos');
      setProductos(data.map((p) => ({ ...p, precio: Number(p.precio) })));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar productos');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProductos();
  }, [fetchProductos]);

  const actualizarStock = useCallback(
    async (id: string, stock: number) => {
      await api.patch(`/productos/${id}`, { stock });
      await fetchProductos();
    },
    [fetchProductos]
  );

  return { productos, isLoading, error, refresh: fetchProductos, actualizarStock };
}
