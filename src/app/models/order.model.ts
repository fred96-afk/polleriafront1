export interface OrderDetailRequest {
  productId: number;
  sideId?: number | null;
  quantity: number;
}

export interface OrderDetailResponse extends OrderDetailRequest {
  id: number;
  productName?: string | null;
}

export interface OrderRequest {
  clientId?: number | null;
  userId: number;
  deliveryUserId?: number | null;
  details?: OrderDetailRequest[] | null;
}

export interface OrderResponse {
  id: number;
  clientId?: number | null;
  userId: number;
  deliveryUserId?: number | null;
  details?: OrderDetailResponse[] | null;
  orderDate?: string;
  checkoutUrl?: string; // URL de Mercado Pago
}
