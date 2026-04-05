export interface ProductRequest {
  name?: string | null;
  description?: string | null;
  basePrice: number;
}

export interface ProductResponse extends ProductRequest {
  id: number;
}
