export interface ClientRequest {
  name?: string | null;
  phone?: string | null;
  address?: string | null;
}

export interface ClientResponse extends ClientRequest {
  id: number;
}

export interface LoginRequest {
  email?: string | null;
  password?: string | null;
}

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
}

export interface ProductRequest {
  name?: string | null;
  description?: string | null;
  basePrice: number;
}

export interface ProductResponse extends ProductRequest {
  id: number;
}
