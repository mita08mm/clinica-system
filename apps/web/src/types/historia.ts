export interface Paciente {
  id: string;
  nombre: string;
  apellido: string;
  fechaNacimiento: string;
  documento: string;
  sexo?: string;
}

export interface SignosVitales {
  pa_sistolica?: number;
  pa_diastolica?: number;
  fc?: number;
  temp?: number;
  peso?: number;
  talla?: number;
  imc?: number;
  spo2?: number;
}

export interface Receta {
  id: string;
  fecha: string;
  items: Array<{
    nombre: string;
    cantidad: number;
  }>;
}

export interface Documento {
  id: string;
  nombre: string;
  tipo: string;
  url: string;
}

export interface Consulta {
  id: string;
  fecha: string;
  motivoConsulta: string;
  diagnostico: string;
  codigoCIE?: string;
  tratamiento?: string;
  examenFisico?: string;
  observaciones?: string;
  proximaConsulta?: string;
  signosVitales?: SignosVitales;
  usuario: {
    nombre: string;
    apellido?: string;
  };
  recetas?: Receta[];
  documentos?: Documento[];
}

export interface HistoriaClinica {
  id: string;
  tipoSangre?: string;
  diagnosticoPrincipal?: string;
  alergias?: string;
  medicacionHabitual?: string;
  antecedentesPersonales?: string;
  antecedentesFamiliares?: string;
  antecedentesQuirurgicos?: string;
  paciente: Paciente;
  consultas: Consulta[];
}

export type TabType = 'consultas' | 'recetas' | 'documentos' | 'resumen';
