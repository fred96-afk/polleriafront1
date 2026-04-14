export interface EmpleadoRequest {
  idCargo?: number | null;
  idTipoDocumento?: number | null;
  numeroDocumento?: string | null;
  nombre?: string | null;
  nombreUsuario?: string | null;
  contrasena?: string | null;
  estadoLogico: boolean;
}

export interface EmpleadoResponse {
  id: number;
  idCargo?: number | null;
  idTipoDocumento?: number | null;
  numeroDocumento?: string | null;
  nombre?: string | null;
  nombreUsuario?: string | null;
  estadoLogico: boolean;
}
