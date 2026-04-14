export interface ProductoRequest {
  idCategoria?: number | null;
  nombre?: string | null;
  descripcion?: string | null;
  precio: number;
  estadoLogico: boolean;
}

export interface ProductoResponse extends ProductoRequest {
  id: number;
}
