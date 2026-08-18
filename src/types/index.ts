export interface PatenteItem {
  id?: string;
  patenteCamion: string;
  patenteCarro: string;
  siglaCamion: string;
  transportista: string;
}

export interface ConductorItem {
  id?: string;
  rutConductor: string;
  nombreConductor: string;
  transportista: string;
}

export interface ProductoItem {
  id?: string;
  especie: 'PINO RADIATA' | 'EUCALIPTUS GLOBULUS' | 'EUCALIPTUS NITENS' | string;
  codigoProducto: string;
  largo: string;
}

export type TicketType = 'recepcion' | 'despacho';

export interface TicketItem {
  id: string;
  tipo: TicketType;
  numeroGuia: string;
  fechaPrograma: string;
  hora: string;
  patenteCamion: string;
  siglaCamion: string;
  patenteCarro: string;
  transportista: string;
  rutConductor: string;
  nombreConductor: string;
  especie: string;
  codigoProducto: string;
  largo: string;
  fechaCorta: string;
  anoPlantacion: string;
  volumenMR: string;
  origen: string;
  destino: string;
  zonaForestal: string;
  emseforDespacho: string;
  numeroGiro: string;
  grua: string;
  observaciones: string;
  creadoPor?: string;
  createdAt: string;
  updatedAt: string;
}

export type UserRole = 'admin' | 'usuario';

export interface UserAccount {
  id: string;
  username: string;
  password?: string;
  nombre: string;
  rol: UserRole;
  cargo?: string;
}

export interface FilterState {
  fechaPrograma: string;
  zonaForestal: string;
  emseforDespacho: string;
  origen: string;
  destino: string;
  numeroGiro: string;
  grua: string;
  textoBusqueda: string;
}
