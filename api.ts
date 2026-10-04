import type {
  User,
  InventoryItem,
  PizzaCatalogItem,
  Order,
  EmailNotificationLog,
  OrderStatus,
  PaymentMethod,
} from './types';

const TOKEN_KEY = 'pizzacraft_auth_token';
const ADMIN_TOKEN_KEY = 'pizzacraft_admin_token';

export const authStorage = {
  getToken: () => localStorage.getItem(TOKEN_KEY),
  setToken: (token: string) => localStorage.setItem(TOKEN_KEY, token),
  clearToken: () => localStorage.removeItem(TOKEN_KEY),
  removeToken: () => localStorage.removeItem(TOKEN_KEY),

  getAdminToken: () => localStorage.getItem(ADMIN_TOKEN_KEY),
  setAdminToken: (token: string) => localStorage.setItem(ADMIN_TOKEN_KEY, token),
  clearAdminToken: () => localStorage.removeItem(ADMIN_TOKEN_KEY),
  removeAdminToken: () => localStorage.removeItem(ADMIN_TOKEN_KEY),
};

async function request<T>(
  endpoint: string,
  options: RequestInit = {},
  useAdminAuth = false
): Promise<T> {
  const headers = new Headers(options.headers || {});
  headers.set('Content-Type', 'application/json');

  const token = useAdminAuth ? authStorage.getAdminToken() : authStorage.getToken();
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const res = await fetch(endpoint, {
    ...options,
    headers,
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const errorMsg = data.message || data.error || `HTTP error ${res.status}`;
    const err = new Error(errorMsg) as any;
    err.status = res.status;
    err.data = data;
    throw err;
  }

  return data as T;
}

export const api = {
  // Auth
  register: (payload: { name: string; email: string; password: string; phone?: string; address?: string }) =>
    request<{ message: string; email: string; verificationToken: string }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  verifyEmail: (payload: { email?: string; token: string }) =>
    request<{ message: string; token: string; user: User }>('/api/auth/verify-email', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  resendVerification: (email: string) =>
    request<{ message: string; verificationToken: string }>('/api/auth/resend-verification', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),

  login: (payload: { email: string; password: string }) =>
    request<{ message: string; token: string; user: User }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  adminLogin: (payload: { email: string; password: string }) =>
    request<{ message: string; token: string; user: User }>('/api/auth/admin-login', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  forgotPassword: (email: string) =>
    request<{ message: string; resetToken?: string }>('/api/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),

  resetPassword: (payload: { token: string; newPassword: string }) =>
    request<{ message: string }>('/api/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  getMe: (asAdmin = false) =>
    request<{ user: User }>('/api/auth/me', { method: 'GET' }, asAdmin),

  getProfile: (asAdmin = false) =>
    request<{ user: User }>('/api/auth/me', { method: 'GET' }, asAdmin),

  // Inventory
  getInventory: (category?: string) =>
    request<{
      items: InventoryItem[];
      grouped: {
        bases: InventoryItem[];
        sauces: InventoryItem[];
        cheeses: InventoryItem[];
        vegetables: InventoryItem[];
      };
      lowStockCount: number;
    }>(`/api/inventory${category ? `?category=${category}` : ''}`),

  getLowStockItems: () =>
    request<{ lowStockItems: InventoryItem[]; count: number }>('/api/inventory/low-stock'),

  updateInventoryItem: (id: string, updates: Partial<InventoryItem>) =>
    request<{ message: string; item: InventoryItem }>(`/api/inventory/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    }, true),

  checkStockThresholds: () =>
    request<{
      message: string;
      checked: number;
      lowCount: number;
      alerted: boolean;
      items: InventoryItem[];
    }>('/api/inventory/check-thresholds', {
      method: 'POST',
    }, true),

  // Catalog & Orders
  getCatalog: () =>
    request<{ pizzas: PizzaCatalogItem[] }>('/api/orders/catalog'),

  getPizzas: () =>
    request<{ pizzas: PizzaCatalogItem[] }>('/api/pizzas'),

  createRazorpayOrder: (amount: number, currency = 'INR') =>
    request<{
      orderId: string;
      amount: number;
      currency: string;
      keyId: string;
      notes: any;
    }>('/api/orders/create-razorpay-order', {
      method: 'POST',
      body: JSON.stringify({ amount, currency }),
    }),

  verifyPayment: (payload: {
    orderId?: string;
    razorpayOrderId: string;
    razorpayPaymentId: string;
    razorpaySignature?: string;
  }) =>
    request<{ message: string; order?: Order; verified: boolean }>('/api/orders/verify-payment', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  placeOrder: (orderPayload: {
    items: any[];
    deliveryAddress: any;
    paymentMethod: PaymentMethod;
    razorpayOrderId?: string;
    razorpayPaymentId?: string;
    discountCode?: string;
    notes?: string;
    email?: string;
  }) =>
    request<{ message: string; order: Order }>('/api/orders', {
      method: 'POST',
      body: JSON.stringify(orderPayload),
    }),

  getMyOrders: (email?: string) =>
    request<{ orders: Order[] }>(`/api/orders/my-orders${email ? `?email=${encodeURIComponent(email)}` : ''}`),

  getOrderById: (id: string) =>
    request<{ order: Order }>(`/api/orders/${id}`),

  // Admin Orders
  getAdminOrders: (status?: string) =>
    request<{
      orders: Order[];
      stats: {
        totalOrders: number;
        activeOrders: number;
        deliveredOrders: number;
        totalRevenue: number;
      };
    }>(`/api/orders/admin/all${status ? `?status=${status}` : ''}`, {}, true),

  updateOrderStatus: (id: string, status: OrderStatus, note?: string) =>
    request<{ message: string; order: Order }>(`/api/orders/admin/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, note }),
    }, true),

  // Email Sandbox Logs
  getRecentEmailLogs: () =>
    request<{ logs: EmailNotificationLog[] }>('/api/emails/recent'),

  getSimulatedEmails: () =>
    request<{ emails: any[] }>('/api/auth/simulated-emails'),

  // AI Powered Endpoints (Gemini 3.8 Flash)
  aiCraftPizza: (prompt: string) =>
    request<{ success: boolean; data: import('./types').AiPizzaRecipe }>('/api/ai/craft', {
      method: 'POST',
      body: JSON.stringify({ prompt }),
    }),

  aiAnalyzeFlavor: (payload: {
    baseName: string;
    sauceName: string;
    cheeseName: string;
    vegetableNames: string[];
  }) =>
    request<{ success: boolean; analysis: import('./types').AiFlavorAnalysis }>('/api/ai/flavor-analysis', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  aiChatLuigi: (messages: Array<{ role: 'user' | 'assistant'; content: string }>) =>
    request<{ success: boolean; reply: string }>('/api/ai/chat', {
      method: 'POST',
      body: JSON.stringify({ messages }),
    }),

  aiGetKitchenInsights: () =>
    request<{ success: boolean; data: import('./types').AiKitchenInsightData }>('/api/ai/kitchen-insights'),
};
