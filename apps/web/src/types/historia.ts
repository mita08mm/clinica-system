export interface Paciente {
  id: string;
  nombre: string;
  apellido: string;
  fechaNacimiento: string;
  documento: string;
  sexo?: string;
  createdAt: string;
  objetivoEstetico?: string;
  alergias?: string;
  embarazoLactancia?: boolean;
}

export interface Medidas {
  peso?: number;
  talla?: number;
  imc?: number;
  circunferencias?: Record<string, number>; // ej: { cintura: 80, cadera: 95 }
  plieguesCutaneos?: Record<string, number>;
  otros?: Record<string, string | number>;
}

export interface ItemProtocolo {
  id: string;
  producto: {
    id: string;
    nombre: string;
    tipo: 'COSMECEUTICO' | 'DERMOCOSMETICO' | 'EQUIPO' | 'INSUMO';
  };
  cantidad: number;
  aplicacion?: string;
  frecuencia?: string;
  estado: 'INDICADO' | 'ADQUIRIDO' | 'EN_USO' | 'COMPLETADO';
}

export interface Protocolo {
  id: string;
  nombre?: string;
  fecha: string;
  indicaciones?: string;
  items: ItemProtocolo[];
}

export interface Documento {
  id: string;
  nombre: string;
  kind: 'FOTO' | 'DOCUMENTO';
  url: string;
  mimeType: string;
  tamaño: number;
  createdAt: string;
  descripcion?: string;
}

export interface Tratamiento {
  id: string;
  fecha: string;
  tipoTratamiento: 'FACIAL' | 'CORPORAL' | 'CAPILAR' | 'COMBINADO';
  nombreTratamiento: string;
  zonaTratada?: string;
  objetivo?: string;
  evaluacionInicial?: string;
  protocolo?: string;
  parametros?: string;
  reaccionesInmediatas?: string;
  observaciones?: string;
  sesionNumero?: number;
  totalSesiones?: number;
  proximaSesion?: string;
  medidas?: Medidas;
  usuario: {
    nombre: string;
    apellido?: string;
    rol: 'ADMIN' | 'TERAPEUTA' | 'RECEPCIONISTA';
  };
  protocolos?: Protocolo[];
  documentos?: Documento[];
}

export interface HistoriaClinica {
  id: string;
  tipoSangre?: string;
  objetivoEstetico?: string;
  condicionesMedicas?: string;
  medicacionActual?: string;
  alergias?: string;
  embarazoLactancia?: boolean;
  antecedentesPersonales?: string;
  antecedentesFamiliares?: string;
  antecedentesQuirurgicos?: string;
  paciente: Paciente;
  tratamientos: Tratamiento[];
}

export type TabType = 'tratamientos' | 'protocolos' | 'documentos' | 'resumen';
