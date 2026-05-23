// Tipos principales del sistema clínico

export interface Paciente {
  id: string;
  nombre: string;
  apellido: string;
  documento: string;
  tipoDocumento: 'DNI' | 'PASAPORTE' | 'OTRO';
  fechaNacimiento: Date;
  edad: number;
  telefono: string;
  email?: string;
  direccion?: string;
  fotoUrl?: string;
  estado: 'ACTIVO' | 'INACTIVO';
  notas?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface HistoriaClinica {
  id: string;
  pacienteId: string;
  diagnostico?: string;
  antecedentes?: string;
  alergias?: string;
  medicacionHabitual?: string;
  notasClinicas?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Evolucion {
  id: string;
  pacienteId: string;
  historiaClinicaId: string;
  fecha: Date;
  motivoConsulta: string;
  diagnostico: string;
  tratamiento?: string;
  observaciones?: string;
  proximaConsulta?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Cita {
  id: string;
  pacienteId: string;
  fecha: Date;
  horaInicio: string;
  horaFin: string;
  motivo: string;
  estado: 'PROGRAMADA' | 'CONFIRMADA' | 'EN_CURSO' | 'COMPLETADA' | 'CANCELADA' | 'NO_ASISTIO';
  notas?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Servicio {
  id: string;
  nombre: string;
  descripcion?: string;
  precio: number;
  duracionMinutos?: number;
  activo: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Medicamento {
  id: string;
  nombre: string;
  descripcion?: string;
  precio: number;
  stock: number;
  stockMinimo?: number;
  activo: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Insumo {
  id: string;
  nombre: string;
  descripcion?: string;
  precio: number;
  stock: number;
  stockMinimo?: number;
  activo: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ItemReceta {
  id: string;
  recetaId: string;
  tipo: 'MEDICAMENTO' | 'INSUMO';
  itemId: string;
  nombre: string;
  cantidad: number;
  dosis?: string;
  frecuencia?: string;
  duracion?: string;
  estado: 'PRESCRITO' | 'ENTREGADO';
  precio: number;
  createdAt: Date;
}

export interface Receta {
  id: string;
  pacienteId: string;
  evolucionId?: string;
  fecha: Date;
  items: ItemReceta[];
  indicaciones?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ItemCobro {
  id: string;
  cobroId: string;
  tipo: 'SERVICIO' | 'PRODUCTO' | 'PAQUETE';
  servicioId?: string;
  productoId?: string;
  nombre: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
}

export interface Pago {
  id: string;
  cobroId: string;
  fecha: Date;
  monto: number;
  metodoPago: 'EFECTIVO' | 'TARJETA' | 'TRANSFERENCIA' | 'OTRO';
  referencia?: string;
  notas?: string;
  createdAt: Date;
}

export interface Cobro {
  id: string;
  pacienteId: string;
  evolucionId?: string;
  fecha: Date;
  items: ItemCobro[];
  subtotal: number;
  descuento: number;
  total: number;
  pagos: Pago[];
  totalPagado: number;
  saldoPendiente: number;
  estado: 'PENDIENTE' | 'PARCIAL' | 'PAGADO' | 'CANCELADO';
  notas?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Archivo {
  id: string;
  pacienteId: string;
  nombre: string;
  tipo: 'FOTO' | 'PDF' | 'IMAGEN_MEDICA' | 'ESTUDIO' | 'OTRO';
  url: string;
  categoria?: 'ANTES' | 'DESPUES' | 'DURANTE' | 'ESTUDIO' | 'DOCUMENTO';
  fecha: Date;
  descripcion?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Usuario {
  id: string;
  nombre: string;
  apellido: string;
  email: string;
  rol: 'ADMIN' | 'MEDICO' | 'RECEPCIONISTA';
  activo: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Tipos para formularios
export type PacienteFormData = Omit<Paciente, 'id' | 'createdAt' | 'updatedAt' | 'edad'>;
export type CitaFormData = Omit<Cita, 'id' | 'createdAt' | 'updatedAt'>;
export type EvolucionFormData = Omit<Evolucion, 'id' | 'createdAt' | 'updatedAt'>;
export type ServicioFormData = Omit<Servicio, 'id' | 'createdAt' | 'updatedAt'>;
export type MedicamentoFormData = Omit<Medicamento, 'id' | 'createdAt' | 'updatedAt'>;

// Tipos para respuestas API
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Tipos para paginación
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// Tipos para filtros
export interface FiltrosPaciente {
  busqueda?: string;
  estado?: 'ACTIVO' | 'INACTIVO';
  ordenarPor?: 'nombre' | 'fecha' | 'ultimaVisita';
  orden?: 'asc' | 'desc';
}

export interface FiltrosCitas {
  fecha?: Date;
  fechaDesde?: Date;
  fechaHasta?: Date;
  estado?: Cita['estado'];
  pacienteId?: string;
}

export interface FiltrosCobros {
  fechaDesde?: Date;
  fechaHasta?: Date;
  estado?: Cobro['estado'];
  pacienteId?: string;
}
