export type Role = 'user' | 'admin';

export type OrderStatus =
  | 'order_received'
  | 'in_kitchen'
  | 'sent_to_delivery'
  | 'delivered'
  | 'cancelled';

export type PaymentMethod = 'razorpay' | 'cod';
export type PaymentStatus = 'pending' | 'completed' | 'failed';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  isVerified: boolean;
  phone?: string;
  address?: string;
  createdAt: string;
}

export type InventoryCategory = 'bases' | 'sauces' | 'cheeses' | 'vegetables';

export interface InventoryItem {
  id: string;
  name: string;
  category: InventoryCategory;
  stock: number;
  threshold: number;
  unit: string;
  price: number;
  description: string;
  imageEmoji?: string;
  badge?: string;
  updatedAt: string;
}

export interface PizzaCatalogItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: 'classic' | 'specialty' | 'veggie' | 'spicy';
  image: string;
  baseId: string;
  sauceId: string;
  cheeseId: string;
  vegetableIds: string[];
  isVegetarian: boolean;
  spiciness: number; // 0 to 3
  prepTimeMinutes: number;
}

export interface CustomPizzaConfig {
  baseId: string;
  sauceId: string;
  cheeseId: string;
  vegetableIds: string[];
  size?: 'Regular (10")' | 'Medium (12")' | 'Large (14")';
}

export interface OrderItem {
  id: string;
  type: 'catalog' | 'custom';
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  config: CustomPizzaConfig;
  customizationDetails?: {
    baseName: string;
    sauceName: string;
    cheeseName: string;
    vegetableNames: string[];
  };
}

export interface DeliveryAddress {
  fullName: string;
  phone: string;
  streetAddress: string;
  apartment?: string;
  city: string;
  state: string;
  postalCode: string;
  deliveryNotes?: string;
}

export interface OrderStatusHistory {
  status: OrderStatus;
  timestamp: string;
  note: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  userId: string;
  userEmail: string;
  customerName: string;
  items: OrderItem[];
  subtotal: number;
  deliveryFee: number;
  tax: number;
  discount: number;
  totalAmount: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  deliveryAddress: DeliveryAddress;
  status: OrderStatus;
  statusHistory: OrderStatusHistory[];
  estimatedDeliveryMinutes: number;
  createdAt: string;
  updatedAt: string;
}

export interface EmailNotificationLog {
  id: string;
  to: string;
  subject: string;
  type: 'verification' | 'password_reset' | 'stock_alert' | 'order_confirmation';
  previewText: string;
  actionLink?: string;
  sentAt: string;
  status: 'delivered' | 'simulated';
}

export interface StockAlert {
  itemId: string;
  itemName: string;
  category: InventoryCategory;
  currentStock: number;
  threshold: number;
  alertSentAt: string;
}

export interface AiPizzaRecipe {
  name: string;
  tagline: string;
  description: string;
  baseId: string;
  sauceId: string;
  cheeseId: string;
  vegetableIds: string[];
  flavorHarmonyScore: number;
  tastingNotes: string;
  beveragePairing: string;
  estimatedCalories: number;
  macros: {
    proteinGrams: number;
    carbsGrams: number;
    fatsGrams: number;
  };
}

export interface AiFlavorAnalysis {
  harmonyScore: number;
  harmonyGrade: string;
  flavorProfile: string;
  sommelierNote: string;
  pairingRecommendation: string;
  suggestedAddon: string;
  estimatedPerSliceCalories: number;
  macros: {
    proteinGrams: number;
    carbsGrams: number;
    fatsGrams: number;
  };
}

export interface CourierChatMessage {
  id: string;
  orderId: string;
  sender: 'customer' | 'courier' | 'kitchen';
  senderName: string;
  message: string;
  timestamp: string;
}

export interface PizzeriaPulse {
  activeOrdersCount: number;
  bakingCount: number;
  onDeliveryCount: number;
  deliveredTodayCount: number;
  hearthTempFahrenheit: number;
  averagePrepTimeMins: number;
  timestamp: string;
}

export interface AiKitchenInsightData {
  dynamicPrepTimeEst: number;
  ovenLoadStatus: string;
  ovenUtilizationPct: number;
  priorityRestockItem: string;
  recommendations: string[];
}

