export type Category = 'Electronics' | 'Home & Living' | 'Office' | 'Accessories' | 'Appliances';
export type StockFilter = 'all' | 'in-stock' | 'low-stock' | 'out-of-stock';
export type Page = 'dashboard' | 'inventory' | 'sales' | 'customers' | 'reports' | 'settings';

export interface Product {
  id: string;
  name: string;
  sku: string;
  category: Category;
  price: number;
  stock: number;
  minStock: number;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  registeredAt: string;
}

export interface SaleLine {
  productId: string;
  quantity: number;
  unitPrice: number;
}

export interface Sale {
  id: string;
  customerId: string;
  customerName: string;
  date: string;
  items: SaleLine[];
  total: number;
  status: 'completed';
}

export interface DemoData {
  products: Product[];
  customers: Customer[];
  sales: Sale[];
}
