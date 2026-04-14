export interface ClienteRequest {
  idTipoDocumento?: number | null;
  nombre?: string | null;
  apellidos?: string | null;
  telefono?: string | null;
  estadoLogico: boolean;
}

export interface ClienteResponse extends ClienteRequest {
  id: number;
}
