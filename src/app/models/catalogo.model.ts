export interface GenericResponse<T> {
  id: number;
  nombre?: string | null;
  descripcion?: string | null;
  estadoLogico?: boolean;
}

export interface TipoDocumento extends GenericResponse<number> {}
export interface MetodoPago extends GenericResponse<number> {}
export interface TipoComprobante extends GenericResponse<number> {}
export interface EstadoPedido extends GenericResponse<number> {}
export interface Cargo extends GenericResponse<number> {}
export interface CategoriaProducto extends GenericResponse<number> {}
