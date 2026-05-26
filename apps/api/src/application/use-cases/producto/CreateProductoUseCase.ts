import { ProductoRepository } from '../../../infrastructure/repositories/ProductoRepository';

interface CreateProductoDTO {
  nombre: string;
  tipo: 'COSMECEUTICO' | 'DERMOCOSMETICO' | 'EQUIPO' | 'INSUMO';
  descripcion?: string;
  precio: number;
  stock?: number;
  stockMinimo?: number;
  marca?: string;
  principioActivo?: string;
}

function generarCodigo(tipo: string): string {
  const prefijos: Record<string, string> = {
    COSMECEUTICO: 'CC',
    DERMOCOSMETICO: 'DC',
    EQUIPO: 'EQ',
    INSUMO: 'IN',
  };
  const prefijo = prefijos[tipo] ?? 'PR';
  const timestamp = Date.now().toString(36).toUpperCase(); // base36 corto
  const random = Math.random().toString(36).slice(2, 5).toUpperCase();
  return `${prefijo}-${timestamp}-${random}`;
}

export class CreateProductoUseCase {
  constructor(private productoRepository: ProductoRepository) {}

  async execute(data: CreateProductoDTO) {
    let codigo: string;
    let intentos = 0;

    // En caso rarísimo de colisión, reintenta
    do {
      codigo = generarCodigo(data.tipo);
      const existente = await this.productoRepository.findByCodigo(codigo);
      if (!existente) break;
      intentos++;
    } while (intentos < 5);

    return this.productoRepository.create({ ...data, codigo });
  }
}