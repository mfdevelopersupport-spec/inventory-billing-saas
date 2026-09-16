import {
  DashboardStats,
  Product,
  Category,
  Branch,
  Sale,
  StockTransfer,
  CashRegister,
  CashMovement,
  KardexMovement,
} from '../types';

const API_BASE_URL = 'http://localhost:5000/api';

function getAuthHeader(): HeadersInit {
  const token = localStorage.getItem('saas_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function handleResponse<T = any>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Error en la solicitud: ${response.statusText}`);
  }
  return response.json();
}

export const api = {
  // Auth
  login: (data: any): Promise<{ token: string; user: any }> =>
    fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then((r) => handleResponse<{ token: string; user: any }>(r)),

  getMe: (): Promise<{ user: any }> =>
    fetch(`${API_BASE_URL}/auth/me`, {
      headers: getAuthHeader(),
    }).then((r) => handleResponse<{ user: any }>(r)),

  // Branches
  getBranches: (): Promise<{ branches: Branch[] }> =>
    fetch(`${API_BASE_URL}/branches`, {
      headers: getAuthHeader(),
    }).then((r) => handleResponse<{ branches: Branch[] }>(r)),

  createBranch: (data: any): Promise<{ branch: Branch }> =>
    fetch(`${API_BASE_URL}/branches`, {
      method: 'POST',
      headers: getAuthHeader(),
      body: JSON.stringify(data),
    }).then((r) => handleResponse<{ branch: Branch }>(r)),

  // Products
  getProducts: (params?: { branchId?: string; categoryId?: string; search?: string; status?: string }): Promise<{ products: Product[] }> => {
    const query = new URLSearchParams();
    if (params?.branchId) query.append('branchId', params.branchId);
    if (params?.categoryId) query.append('categoryId', params.categoryId);
    if (params?.search) query.append('search', params.search);
    if (params?.status) query.append('status', params.status);

    return fetch(`${API_BASE_URL}/products?${query.toString()}`, {
      headers: getAuthHeader(),
    }).then((r) => handleResponse<{ products: Product[] }>(r));
  },

  getCategories: (): Promise<{ categories: Category[] }> =>
    fetch(`${API_BASE_URL}/products/categories`, {
      headers: getAuthHeader(),
    }).then((r) => handleResponse<{ categories: Category[] }>(r)),

  createProduct: (data: any): Promise<{ product: Product }> =>
    fetch(`${API_BASE_URL}/products`, {
      method: 'POST',
      headers: getAuthHeader(),
      body: JSON.stringify(data),
    }).then((r) => handleResponse<{ product: Product }>(r)),

  updateStock: (data: { branchId: string; productId: string; quantity: number; minStockAlert?: number }): Promise<{ stock: any }> =>
    fetch(`${API_BASE_URL}/products/stock`, {
      method: 'POST',
      headers: getAuthHeader(),
      body: JSON.stringify(data),
    }).then((r) => handleResponse<{ stock: any }>(r)),

  // Sales
  createSale: (data: any): Promise<{ message: string; sale: Sale }> =>
    fetch(`${API_BASE_URL}/sales`, {
      method: 'POST',
      headers: getAuthHeader(),
      body: JSON.stringify(data),
    }).then((r) => handleResponse<{ message: string; sale: Sale }>(r)),

  getSales: (params?: { branchId?: string; documentType?: string; search?: string }): Promise<{ sales: Sale[] }> => {
    const query = new URLSearchParams();
    if (params?.branchId) query.append('branchId', params.branchId);
    if (params?.documentType) query.append('documentType', params.documentType);
    if (params?.search) query.append('search', params.search);

    return fetch(`${API_BASE_URL}/sales?${query.toString()}`, {
      headers: getAuthHeader(),
    }).then((r) => handleResponse<{ sales: Sale[] }>(r));
  },

  getSaleById: (id: string): Promise<{ sale: Sale }> =>
    fetch(`${API_BASE_URL}/sales/${id}`, {
      headers: getAuthHeader(),
    }).then((r) => handleResponse<{ sale: Sale }>(r)),

  downloadSalePdf: async (id: string, saleNumber: string): Promise<void> => {
    const token = localStorage.getItem('saas_token');
    const response = await fetch(`${API_BASE_URL}/sales/${id}/pdf`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });

    if (!response.ok) throw new Error('Error al descargar el PDF de la factura');

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `comprobante-${saleNumber}.pdf`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  },

  // Transfers
  createTransfer: (data: any): Promise<{ message: string; transfer: StockTransfer }> =>
    fetch(`${API_BASE_URL}/transfers`, {
      method: 'POST',
      headers: getAuthHeader(),
      body: JSON.stringify(data),
    }).then((r) => handleResponse<{ message: string; transfer: StockTransfer }>(r)),

  getTransfers: (branchId?: string): Promise<{ transfers: StockTransfer[] }> => {
    const query = new URLSearchParams();
    if (branchId) query.append('branchId', branchId);

    return fetch(`${API_BASE_URL}/transfers?${query.toString()}`, {
      headers: getAuthHeader(),
    }).then((r) => handleResponse<{ transfers: StockTransfer[] }>(r));
  },

  // Dashboard
  getDashboardStats: (branchId?: string): Promise<DashboardStats> => {
    const query = new URLSearchParams();
    if (branchId) query.append('branchId', branchId);

    return fetch(`${API_BASE_URL}/dashboard/stats?${query.toString()}`, {
      headers: getAuthHeader(),
    }).then((r) => handleResponse<DashboardStats>(r));
  },

  // SUNAT / RENIEC Lookup
  lookupDoc: (doc: string): Promise<{ type: string; found: boolean; data: any }> =>
    fetch(`${API_BASE_URL}/sunat/lookup?doc=${encodeURIComponent(doc)}`, {
      headers: getAuthHeader(),
    }).then((r) => handleResponse<{ type: string; found: boolean; data: any }>(r)),

  // Cash Register Shifts
  openShift: (branchId: string, initialAmount: number): Promise<{ message: string; cashRegister: CashRegister }> =>
    fetch(`${API_BASE_URL}/cash-register/open`, {
      method: 'POST',
      headers: getAuthHeader(),
      body: JSON.stringify({ branchId, initialAmount }),
    }).then((r) => handleResponse(r)),

  getCurrentShift: (branchId?: string): Promise<{ isOpen: boolean; cashRegister: CashRegister | null }> => {
    const query = branchId ? `?branchId=${encodeURIComponent(branchId)}` : '';
    return fetch(`${API_BASE_URL}/cash-register/current${query}`, {
      headers: getAuthHeader(),
    }).then((r) => handleResponse(r));
  },

  addCashMovement: (data: { cashRegisterId: string; type: 'INGRESO' | 'EGRESO'; amount: number; concept: string }): Promise<{ message: string; movement: CashMovement }> =>
    fetch(`${API_BASE_URL}/cash-register/movement`, {
      method: 'POST',
      headers: getAuthHeader(),
      body: JSON.stringify(data),
    }).then((r) => handleResponse(r)),

  closeShift: (cashRegisterId: string, finalAmount: number, notes?: string): Promise<{ message: string; cashRegister: CashRegister }> =>
    fetch(`${API_BASE_URL}/cash-register/close`, {
      method: 'POST',
      headers: getAuthHeader(),
      body: JSON.stringify({ cashRegisterId, finalAmount, notes }),
    }).then((r) => handleResponse(r)),

  getShiftsHistory: (branchId?: string): Promise<{ history: CashRegister[] }> => {
    const query = branchId ? `?branchId=${encodeURIComponent(branchId)}` : '';
    return fetch(`${API_BASE_URL}/cash-register/history${query}`, {
      headers: getAuthHeader(),
    }).then((r) => handleResponse(r));
  },

  // Kardex & SIRE
  getKardex: (params?: { branchId?: string; productId?: string; type?: string }): Promise<{ movements: KardexMovement[] }> => {
    const query = new URLSearchParams();
    if (params?.branchId) query.append('branchId', params.branchId);
    if (params?.productId) query.append('productId', params.productId);
    if (params?.type) query.append('type', params.type);

    return fetch(`${API_BASE_URL}/kardex/movements?${query.toString()}`, {
      headers: getAuthHeader(),
    }).then((r) => handleResponse(r));
  },

  downloadSireCsv: async (branchId?: string): Promise<void> => {
    const token = localStorage.getItem('saas_token');
    const query = branchId ? `?branchId=${encodeURIComponent(branchId)}` : '';
    const response = await fetch(`${API_BASE_URL}/kardex/sire-export${query}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });

    if (!response.ok) throw new Error('Error al generar reporte SIRE SUNAT');

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `registro-ventas-sire-sunat-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  },
};
