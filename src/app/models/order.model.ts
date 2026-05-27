export interface OrderDetailResponse {
  id: number;
  productId: number;
  productName: string;
  sideId?: number | null;
  sideName?: string | null;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface OrderResponse {
  id: number;
  orderDate: string;
  clientId: number;
  userId: number;
  deliveryUserId?: number | null;
  totalAmount: number;
  details: OrderDetailResponse[];
  status: string;
  paymentStatus: string;
  paymentUrl?: string | null;
  pdfUrl?: string | null;
  notas?: string | null;
  customerName?: string | null;
  customerAddress?: string | null;
  customerPhone?: string | null;
}

export interface OrderDetailRequest {
  productId: number;
  sideId?: number | null;
  quantity: number;
}

export interface OrderRequest {
  clientId?: number | null;
  userId: number;
  deliveryUserId?: number | null;
  details?: OrderDetailRequest[] | null;
  isPos?: boolean;
  customerName?: string | null;
  customerAddress?: string | null;
  customerPhone?: string | null;
  documentNumber?: string | null;
  documentType?: string | null;
  customerEmail?: string | null;
  isPickup?: boolean;
}
