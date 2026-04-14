export interface DetallePedidoRequest {
  idProducto?: number | null;
  cantidad: number;
  subtotal: number;
}

export interface PedidoRequest {
  idCliente?: number | null;
  idEmpleado?: number | null;
  idRepartidor?: number | null;
  idMetodo?: number | null;
  idComprobante?: number | null;
  idEstadoActual?: number | null;
  fecha?: string | null;
  fechaPago?: string | null;
  montoPagado?: number | null;
  notas?: string | null;
  detalles?: DetallePedidoRequest[] | null;
}

export interface PedidoResponse extends PedidoRequest {
  id: number;
}
