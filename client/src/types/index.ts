export type Role = 'SUPERADMIN' | 'BRANCH_MANAGER' | 'CASHIER';
export type PaymentMethod = 'CASH' | 'YAPE' | 'PLIN' | 'CARD' | 'TRANSFER';
export type SaleStatus = 'COMPLETED' | 'CANCELLED';
export type TransferStatus = 'COMPLETED' | 'PENDING' | 'CANCELLED';
export type DocumentType = 'FACTURA' | 'BOLETA' | 'NOTA_VENTA';
export type SunatStatus = 'ACEPTADO' | 'PENDIENTE' | 'RECHAZADO';
export type ShiftStatus = 'OPEN' | 'CLOSED';
export type MovementType = 'INGRESO' | 'EGRESO';
export type KardexType = 'VENTA' | 'COMPRA' | 'TRANSFERENCIA_ENTRADA' | 'TRANSFERENCIA_SALIDA' | 'AJUSTE' | 'MERMA';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  branchId?: string | null;
  branch?: Branch | null;
}

export interface Branch {
  id: string;
  name: string;
  code: string;
  address: string;
  phone?: string | null;
  isMain: boolean;
  active: boolean;
  _count?: {
    users: number;
    sales: number;
    stocks: number;
  };
}

export interface Category {
  id: string;
  name: string;
  description?: string | null;
  _count?: {
    products: number;
  };
}

export interface BranchStock {
  id: string;
  branchId: string;
  productId: string;
  quantity: number;
  minStockAlert: number;
  branch?: Branch;
}

export interface Product {
  id: string;
  sku: string;
  barcode?: string | null;
  name: string;
  description?: string | null;
  price: number;
  costPrice: number;
  category: Category;
  minStockAlert: number;
  currentStock: number;
  isOutOfStock: boolean;
  isLowStock: boolean;
  branchStocks?: BranchStock[];
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface SaleItem {
  id: string;
  saleId: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  product: {
    id: string;
    sku: string;
    name: string;
  };
}

export interface Sale {
  id: string;
  saleNumber: string;
  documentType: DocumentType;
  series: string;
  correlative: number;
  branchId: string;
  branch: {
    id: string;
    name: string;
    code: string;
    address?: string;
  };
  userId: string;
  user: {
    id: string;
    name: string;
    email?: string;
  };
  customerName: string;
  customerDoc?: string | null;
  customerEmail?: string | null;
  customerAddress?: string | null;
  customerPhone?: string | null;
  paymentMethod: PaymentMethod;
  operationCode?: string | null;
  amountPaid?: number | null;
  changeAmount?: number | null;
  currency: string;
  subtotal: number;
  tax: number;
  total: number;
  hash?: string | null;
  qrString?: string | null;
  sunatStatus: SunatStatus;
  status: SaleStatus;
  notes?: string | null;
  createdAt: string;
  items: SaleItem[];
}

export interface StockTransfer {
  id: string;
  transferNumber: string;
  fromBranchId: string;
  fromBranch: {
    id: string;
    name: string;
    code: string;
  };
  toBranchId: string;
  toBranch: {
    id: string;
    name: string;
    code: string;
  };
  userId: string;
  user: {
    name: string;
  };
  notes?: string | null;
  status: TransferStatus;
  createdAt: string;
  items: Array<{
    id: string;
    productId: string;
    quantity: number;
    product: {
      id: string;
      sku: string;
      name: string;
    };
  }>;
}

export interface CashMovement {
  id: string;
  cashRegisterId: string;
  type: MovementType;
  amount: number;
  concept: string;
  createdAt: string;
}

export interface CashRegister {
  id: string;
  branchId: string;
  branch?: { id: string; name: string; code: string };
  userId: string;
  user?: { name: string };
  initialAmount: number;
  finalAmount?: number | null;
  cashSalesAmount: number;
  yapeSalesAmount: number;
  plinSalesAmount: number;
  cardSalesAmount: number;
  transferSalesAmount: number;
  totalSalesAllMethods?: number;
  totalIncomes: number;
  totalExpenses: number;
  expectedCashInDrawer?: number;
  expectedAmount?: number | null;
  differenceAmount?: number | null;
  status: ShiftStatus;
  notes?: string | null;
  openedAt: string;
  closedAt?: string | null;
  movements?: CashMovement[];
  sales?: Array<{
    id: string;
    saleNumber: string;
    total: number;
    paymentMethod: PaymentMethod;
    createdAt: string;
  }>;
  _count?: {
    sales: number;
    movements: number;
  };
}

export interface KardexMovement {
  id: string;
  branchId: string;
  branch: { id: string; name: string; code: string };
  productId: string;
  product: { id: string; name: string; sku: string; price: number };
  type: KardexType;
  quantity: number;
  previousStock: number;
  newStock: number;
  reference?: string | null;
  createdAt: string;
}

export interface DashboardStats {
  metrics: {
    totalRevenue: number;
    totalSalesCount: number;
    todayRevenue: number;
    todaySalesCount: number;
    lowStockCount: number;
    outOfStockCount: number;
  };
  lowStockAlerts: Array<{
    stockId: string;
    branch: string;
    branchCode: string;
    product: string;
    sku: string;
    quantity: number;
    minStockAlert: number;
  }>;
  outOfStockAlerts: Array<{
    stockId: string;
    branch: string;
    branchCode: string;
    product: string;
    sku: string;
    quantity: number;
  }>;
  salesByBranch: Array<{
    branchId: string;
    name: string;
    code: string;
    totalSales: number;
    count: number;
  }>;
  topProducts: Array<{
    productId: string;
    name: string;
    sku: string;
    quantitySold: number;
    totalRevenue: number;
  }>;
  recentSales: Sale[];
}
