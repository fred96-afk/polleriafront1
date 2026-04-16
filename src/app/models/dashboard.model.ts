export interface DashboardStats {
  totalSales: number;
  totalOrders: number;
  pendingOrders: number;
  totalProducts: number;
  totalCustomers: number;
  recentOrders: DashboardRecentOrder[];
  topProducts: DashboardTopProduct[];
  salesByDay: DashboardSalesByDay[];
}

export interface DashboardRecentOrder {
  id: number;
  clientName: string;
  totalAmount: number;
  orderDate: string;
}

export interface DashboardTopProduct {
  name: string;
  quantity: number;
}

export interface DashboardSalesByDay {
  date: string;
  amount: number;
}

export interface DashboardStatsResponse {
  totalSales?: number;
  totalRevenue?: number;
  totalOrders?: number;
  pendingOrders?: number;
  totalProducts?: number;
  totalCustomers?: number;
  recentOrders?: Array<{
    id?: number;
    clientName?: string;
    total?: number;
    totalAmount?: number;
    date?: string;
    orderDate?: string;
  }>;
  topProducts?: Array<{
    name?: string;
    productName?: string;
    quantity?: number;
    quantitySold?: number;
  }>;
  salesByDay?: Array<{
    date?: string;
    day?: string;
    amount?: number;
    total?: number;
  }>;
  salesLast7Days?: Array<{
    date?: string;
    day?: string;
    amount?: number;
    total?: number;
  }>;
}
