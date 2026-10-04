import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import type {
  User,
  InventoryItem,
  PizzaCatalogItem,
  Order,
  EmailNotificationLog,
} from '../src/types';

interface DBData {
  users: Array<User & { passwordHash: string; verificationToken?: string; resetPasswordToken?: string }>;
  inventory: InventoryItem[];
  catalog: PizzaCatalogItem[];
  orders: Order[];
  emailLogs: EmailNotificationLog[];
}

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'pizzacraft_db.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const initialBases: InventoryItem[] = [
  {
    id: 'base-classic',
    name: 'Classic Hand Tossed',
    category: 'bases',
    stock: 50,
    threshold: 20,
    unit: 'crusts',
    price: 8.0,
    description: 'Golden-crisp exterior with a pillowy, airy crumb made from 48-hour fermented Italian flour.',
    imageEmoji: '🍕',
    badge: 'Chef Favorite',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'base-thin',
    name: 'Thin & Crispy Crust',
    category: 'bases',
    stock: 45,
    threshold: 20,
    unit: 'crusts',
    price: 8.5,
    description: 'Light, wafer-thin Roman style crust with exceptional crunch in every single bite.',
    imageEmoji: '🫓',
    badge: 'Low Calorie',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'base-cheese-burst',
    name: 'Cheese Burst Deluxe',
    category: 'bases',
    stock: 35,
    threshold: 20,
    unit: 'crusts',
    price: 10.5,
    description: 'Molten blend of premium mozzarella and cheddar folded directly inside the edge crust.',
    imageEmoji: '🧀',
    badge: 'Bestseller',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'base-multigrain',
    name: 'Whole Wheat Multigrain',
    category: 'bases',
    stock: 40,
    threshold: 20,
    unit: 'crusts',
    price: 9.0,
    description: 'High-fiber stoneground whole wheat enriched with flaxseeds, toasted oats, and sesame.',
    imageEmoji: '🌾',
    badge: 'Nutritious',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'base-gluten-free',
    name: 'Gluten-Free Cauliflower Herb',
    category: 'bases',
    stock: 25,
    threshold: 20,
    unit: 'crusts',
    price: 11.0,
    description: 'Crispy fire-baked crust crafted with roasted cauliflower florets and parmesan.',
    imageEmoji: '🥦',
    badge: 'Gluten-Free',
    updatedAt: new Date().toISOString(),
  },
];

const initialSauces: InventoryItem[] = [
  {
    id: 'sauce-san-marzano',
    name: 'Classic San Marzano Herb',
    category: 'sauces',
    stock: 60,
    threshold: 20,
    unit: 'portions',
    price: 1.5,
    description: 'Sun-ripened Italian plum tomatoes simmered with extra virgin olive oil and fresh basil.',
    imageEmoji: '🍅',
    badge: 'Signature',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'sauce-spicy-marinara',
    name: 'Fiery Arrabbiata Marinara',
    category: 'sauces',
    stock: 55,
    threshold: 20,
    unit: 'portions',
    price: 1.5,
    description: 'Slow-cooked tomato reduction infused with Calabrian chili flakes and roasted garlic.',
    imageEmoji: '🌶️',
    badge: 'Spicy',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'sauce-alfredo',
    name: 'Creamy Garlic Alfredo',
    category: 'sauces',
    stock: 40,
    threshold: 20,
    unit: 'portions',
    price: 2.0,
    description: 'Velvety rich cream, confit garlic cloves, and aged Parmigiano Reggiano reduction.',
    imageEmoji: '🧄',
    badge: 'Creamy',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'sauce-bbq',
    name: 'Smoky Chipotle BBQ',
    category: 'sauces',
    stock: 50,
    threshold: 20,
    unit: 'portions',
    price: 2.0,
    description: 'Hickory wood smoked dark sauce with brown sugar glaze and mild chipotle tang.',
    imageEmoji: '🔥',
    badge: 'Sweet & Smoky',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'sauce-pesto',
    name: 'Genovese Basil Pesto',
    category: 'sauces',
    stock: 35,
    threshold: 20,
    unit: 'portions',
    price: 2.5,
    description: 'Fragrant sweet basil leaves, toasted pine nuts, extra virgin olive oil, and pecorino.',
    imageEmoji: '🌿',
    badge: 'Artisan',
    updatedAt: new Date().toISOString(),
  },
];

const initialCheeses: InventoryItem[] = [
  {
    id: 'cheese-mozzarella',
    name: 'Fior di Latte Mozzarella',
    category: 'cheeses',
    stock: 65,
    threshold: 20,
    unit: 'portions',
    price: 2.5,
    description: 'Creamy artisanal mozzarella with extraordinary stretch and golden bubbling under high heat.',
    imageEmoji: '🧀',
    badge: 'Essential',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'cheese-cheddar',
    name: 'Aged Sharp Cheddar Blend',
    category: 'cheeses',
    stock: 45,
    threshold: 20,
    unit: 'portions',
    price: 3.0,
    description: '18-month aged sharp cheddar blended with creamy Monterey Jack for bold sharpness.',
    imageEmoji: '🧀',
    badge: 'Bold Flavor',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'cheese-gouda',
    name: 'Applewood Smoked Gouda',
    category: 'cheeses',
    stock: 30,
    threshold: 20,
    unit: 'portions',
    price: 3.5,
    description: 'Dutch curd gently smoked over applewood sawdust for a creamy, hazelnut-tinged finish.',
    imageEmoji: '🪵',
    badge: 'Gourmet',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'cheese-vegan',
    name: 'Plant-Based Almond Mozzarella',
    category: 'cheeses',
    stock: 30,
    threshold: 20,
    unit: 'portions',
    price: 3.5,
    description: '100% dairy-free certified cheese crafted from culturing almond milk with exceptional melt.',
    imageEmoji: '🌱',
    badge: 'Vegan',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'cheese-burrata',
    name: 'Burrata & Ricotta Silk',
    category: 'cheeses',
    stock: 22,
    threshold: 20,
    unit: 'portions',
    price: 4.0,
    description: 'Whipped whole-milk ricotta dotted with strands of decadent stracciatella burrata.',
    imageEmoji: '✨',
    badge: 'Ultra-Creamy',
    updatedAt: new Date().toISOString(),
  },
];

const initialVegetables: InventoryItem[] = [
  {
    id: 'veg-bell-peppers',
    name: 'Trio Bell Peppers',
    category: 'vegetables',
    stock: 70,
    threshold: 20,
    unit: 'portions',
    price: 1.2,
    description: 'Crisp green, red, and yellow bell peppers sliced thin for a sweet crunch.',
    imageEmoji: '🫑',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'veg-onions',
    name: 'Caramelized Red Onions',
    category: 'vegetables',
    stock: 65,
    threshold: 20,
    unit: 'portions',
    price: 1.0,
    description: 'Slow-braised Spanish red onions with balsamic glaze and rosemary.',
    imageEmoji: '🧅',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'veg-olives',
    name: 'Kalamata Black Olives',
    category: 'vegetables',
    stock: 55,
    threshold: 20,
    unit: 'portions',
    price: 1.5,
    description: 'Pitted Mediterranean black olives in extra virgin brine.',
    imageEmoji: '🫒',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'veg-jalapenos',
    name: 'Spicy Pickled Jalapeños',
    category: 'vegetables',
    stock: 50,
    threshold: 20,
    unit: 'portions',
    price: 1.0,
    description: 'House-pickled jalapeño rings delivering a lively zesty kick.',
    imageEmoji: '🌶️',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'veg-mushrooms',
    name: 'Sautéed Cremini Mushrooms',
    category: 'vegetables',
    stock: 48,
    threshold: 20,
    unit: 'portions',
    price: 1.5,
    description: 'Earthy brown button mushrooms pan-roasted with thyme and butter.',
    imageEmoji: '🍄',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'veg-corn',
    name: 'Sweet Golden Corn',
    category: 'vegetables',
    stock: 60,
    threshold: 20,
    unit: 'portions',
    price: 1.0,
    description: 'Charred sweet kernels bursting with juicy sweetness.',
    imageEmoji: '🌽',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'veg-tomatoes',
    name: 'Sun-Dried Roma Tomatoes',
    category: 'vegetables',
    stock: 35,
    threshold: 20,
    unit: 'portions',
    price: 1.8,
    description: 'Intensely flavorful Italian sun-dried tomatoes marinated in oregano oil.',
    imageEmoji: '🍅',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'veg-spinach',
    name: 'Crisp Baby Spinach Leaves',
    category: 'vegetables',
    stock: 45,
    threshold: 20,
    unit: 'portions',
    price: 1.2,
    description: 'Tender organic baby spinach wilted delicately under bubbling cheese.',
    imageEmoji: '🥬',
    updatedAt: new Date().toISOString(),
  },
];

const initialCatalog: PizzaCatalogItem[] = [
  {
    id: 'cat-margherita',
    name: 'Margherita Bella',
    description: 'The timeless Neapolitan masterpiece with San Marzano tomatoes, Fior di Latte mozzarella, fresh basil, and extra virgin olive oil.',
    price: 12.99,
    category: 'classic',
    image: 'https://images.unsplash.com/photo-1604382355076-af4b0eb60143?auto=format&fit=crop&w=600&q=80',
    baseId: 'base-classic',
    sauceId: 'sauce-san-marzano',
    cheeseId: 'cheese-mozzarella',
    vegetableIds: ['veg-tomatoes', 'veg-spinach'],
    isVegetarian: true,
    spiciness: 0,
    prepTimeMinutes: 18,
  },
  {
    id: 'cat-pepperoni',
    name: 'Firehouse Pepperoni Feast',
    description: 'Hand tossed crust topped with double aged pepperoni crisped to cupped perfection, sharp cheddar, mozzarella, and chili honey drizzle.',
    price: 15.99,
    category: 'specialty',
    image: 'https://images.unsplash.com/photo-1628840042765-356cda07504e?auto=format&fit=crop&w=600&q=80',
    baseId: 'base-cheese-burst',
    sauceId: 'sauce-spicy-marinara',
    cheeseId: 'cheese-cheddar',
    vegetableIds: ['veg-jalapenos', 'veg-onions'],
    isVegetarian: false,
    spiciness: 2,
    prepTimeMinutes: 20,
  },
  {
    id: 'cat-farmhouse',
    name: 'Artisan Farmhouse Harvest',
    description: 'Abundance of bell peppers, caramelized onions, sweet corn, cremini mushrooms, and black olives over rich herbaceous tomato sauce.',
    price: 14.49,
    category: 'veggie',
    image: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&w=600&q=80',
    baseId: 'base-multigrain',
    sauceId: 'sauce-san-marzano',
    cheeseId: 'cheese-mozzarella',
    vegetableIds: ['veg-bell-peppers', 'veg-onions', 'veg-mushrooms', 'veg-corn', 'veg-olives'],
    isVegetarian: true,
    spiciness: 1,
    prepTimeMinutes: 22,
  },
  {
    id: 'cat-truffle-shroom',
    name: 'Wild Truffle & Garlic Alfredo',
    description: 'Crispy thin crust coated in creamy roasted garlic Alfredo, sautéed cremini mushrooms, baby spinach, smoked gouda, and white truffle essence.',
    price: 16.99,
    category: 'specialty',
    image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=600&q=80',
    baseId: 'base-thin',
    sauceId: 'sauce-alfredo',
    cheeseId: 'cheese-gouda',
    vegetableIds: ['veg-mushrooms', 'veg-spinach', 'veg-onions'],
    isVegetarian: true,
    spiciness: 0,
    prepTimeMinutes: 24,
  },
  {
    id: 'cat-smoky-bbq',
    name: 'Rustic BBQ Smokehouse Supreme',
    description: 'Smoky hickory BBQ sauce base layered with sharp cheddar blend, caramelized onions, roasted bell peppers, and sun-dried tomatoes.',
    price: 15.49,
    category: 'specialty',
    image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=600&q=80',
    baseId: 'base-classic',
    sauceId: 'sauce-bbq',
    cheeseId: 'cheese-cheddar',
    vegetableIds: ['veg-onions', 'veg-bell-peppers', 'veg-tomatoes'],
    isVegetarian: true,
    spiciness: 1,
    prepTimeMinutes: 20,
  },
  {
    id: 'cat-pesto-burrata',
    name: 'Pesto Genovese & Silk Burrata',
    description: 'Cauliflower gluten-free crust painted with fresh basil pesto, topped with melting burrata silk, sweet cherry tomatoes, and Kalamata olives.',
    price: 17.5,
    category: 'specialty',
    image: 'https://images.unsplash.com/photo-1593560708920-61dd98c46a4e?auto=format&fit=crop&w=600&q=80',
    baseId: 'base-gluten-free',
    sauceId: 'sauce-pesto',
    cheeseId: 'cheese-burrata',
    vegetableIds: ['veg-tomatoes', 'veg-olives', 'veg-spinach'],
    isVegetarian: true,
    spiciness: 0,
    prepTimeMinutes: 20,
  },
];

function getInitialData(): DBData {
  const adminPasswordHash = bcrypt.hashSync('Admin@123', 10);
  const userPasswordHash = bcrypt.hashSync('User@123', 10);

  return {
    users: [
      {
        id: 'user-admin-01',
        name: 'Master Chef Admin',
        email: 'admin@pizzacraft.com',
        role: 'admin',
        isVerified: true,
        phone: '+1 (555) 902-8877',
        passwordHash: adminPasswordHash,
        createdAt: new Date(Date.now() - 86400000 * 30).toISOString(),
      },
      {
        id: 'user-demo-01',
        name: 'Alex Johnson',
        email: 'customer@example.com',
        role: 'user',
        isVerified: true,
        phone: '+1 (555) 345-6789',
        address: '428 Mulberry Street, Apt 3B, New York, NY 10012',
        passwordHash: userPasswordHash,
        createdAt: new Date(Date.now() - 86400000 * 10).toISOString(),
      },
    ],
    inventory: [
      ...initialBases,
      ...initialSauces,
      ...initialCheeses,
      ...initialVegetables,
    ],
    catalog: initialCatalog,
    orders: [
      {
        id: 'order-sample-01',
        orderNumber: 'PZ-8921',
        userId: 'user-demo-01',
        userEmail: 'customer@example.com',
        customerName: 'Alex Johnson',
        items: [
          {
            id: 'item-demo-1',
            type: 'catalog',
            name: 'Margherita Bella',
            quantity: 1,
            unitPrice: 12.99,
            totalPrice: 12.99,
            config: {
              baseId: 'base-classic',
              sauceId: 'sauce-san-marzano',
              cheeseId: 'cheese-mozzarella',
              vegetableIds: ['veg-tomatoes', 'veg-spinach'],
              size: 'Medium (12")',
            },
            customizationDetails: {
              baseName: 'Classic Hand Tossed',
              sauceName: 'Classic San Marzano Herb',
              cheeseName: 'Fior di Latte Mozzarella',
              vegetableNames: ['Sun-Dried Roma Tomatoes', 'Crisp Baby Spinach Leaves'],
            },
          },
        ],
        subtotal: 12.99,
        deliveryFee: 2.99,
        tax: 0.65,
        discount: 0,
        totalAmount: 16.63,
        paymentMethod: 'razorpay',
        paymentStatus: 'completed',
        razorpayOrderId: 'order_test_90123',
        razorpayPaymentId: 'pay_test_sample_8871',
        deliveryAddress: {
          fullName: 'Alex Johnson',
          phone: '+1 (555) 345-6789',
          streetAddress: '428 Mulberry Street',
          apartment: 'Apt 3B',
          city: 'New York',
          state: 'NY',
          postalCode: '10012',
          deliveryNotes: 'Please ring bell and leave on table outside door.',
        },
        status: 'in_kitchen',
        statusHistory: [
          {
            status: 'order_received',
            timestamp: new Date(Date.now() - 15 * 60000).toISOString(),
            note: 'Order confirmed and verified via Razorpay test payment.',
          },
          {
            status: 'in_kitchen',
            timestamp: new Date(Date.now() - 8 * 60000).toISOString(),
            note: 'Chef Giorgio is hand-stretching the fermented dough and baking in stone hearth.',
          },
        ],
        estimatedDeliveryMinutes: 25,
        createdAt: new Date(Date.now() - 15 * 60000).toISOString(),
        updatedAt: new Date(Date.now() - 8 * 60000).toISOString(),
      },
    ],
    emailLogs: [
      {
        id: 'log-seed-1',
        to: 'customer@example.com',
        subject: 'Welcome to PizzaCraft - Account Verified',
        type: 'verification',
        previewText: 'Your account has been successfully verified! Enjoy your first artisanal pizza.',
        sentAt: new Date(Date.now() - 86400000 * 10).toISOString(),
        status: 'simulated',
      },
    ],
  };
}

class Database {
  private data: DBData;

  constructor() {
    this.data = this.loadData();
  }

  private loadData(): DBData {
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        // Ensure all collections exist
        if (!parsed.inventory || parsed.inventory.length === 0) {
          const init = getInitialData();
          this.saveData(init);
          return init;
        }
        return parsed;
      }
    } catch (e) {
      console.error('Failed to load database file, creating fresh initial dataset:', e);
    }
    const initial = getInitialData();
    this.saveData(initial);
    return initial;
  }

  private saveData(dataToSave?: DBData): void {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(dataToSave || this.data, null, 2), 'utf-8');
    } catch (e) {
      console.error('Error persisting database:', e);
    }
  }

  // Collections access
  get users() {
    return {
      find: () => this.data.users,
      findById: (id: string) => this.data.users.find((u) => u.id === id),
      findByEmail: (email: string) =>
        this.data.users.find((u) => u.email.toLowerCase() === email.toLowerCase().trim()),
      findByVerificationToken: (token: string) =>
        this.data.users.find((u) => u.verificationToken === token),
      findByResetToken: (token: string) =>
        this.data.users.find((u) => u.resetPasswordToken === token),
      create: (user: User & { passwordHash: string; verificationToken?: string; resetPasswordToken?: string }) => {
        this.data.users.push(user);
        this.saveData();
        return user;
      },
      update: (id: string, updates: Partial<User & { passwordHash: string; verificationToken?: string; resetPasswordToken?: string }>) => {
        const idx = this.data.users.findIndex((u) => u.id === id);
        if (idx !== -1) {
          this.data.users[idx] = { ...this.data.users[idx], ...updates };
          this.saveData();
          return this.data.users[idx];
        }
        return null;
      },
    };
  }

  get inventory() {
    return {
      find: (category?: string) => {
        if (!category) return this.data.inventory;
        return this.data.inventory.filter((i) => i.category === category);
      },
      findById: (id: string) => this.data.inventory.find((i) => i.id === id),
      updateStock: (id: string, newStock: number) => {
        const item = this.data.inventory.find((i) => i.id === id);
        if (item) {
          item.stock = Math.max(0, newStock);
          item.updatedAt = new Date().toISOString();
          this.saveData();
          return item;
        }
        return null;
      },
      update: (id: string, updates: Partial<InventoryItem>) => {
        const idx = this.data.inventory.findIndex((i) => i.id === id);
        if (idx !== -1) {
          this.data.inventory[idx] = {
            ...this.data.inventory[idx],
            ...updates,
            updatedAt: new Date().toISOString(),
          };
          this.saveData();
          return this.data.inventory[idx];
        }
        return null;
      },
      decrementStockBatch: (itemsToDecrement: Array<{ id: string; quantity: number }>) => {
        // Validate stock availability first
        for (const req of itemsToDecrement) {
          const item = this.data.inventory.find((i) => i.id === req.id);
          if (!item) {
            return { success: false, error: `Ingredient not found: ${req.id}` };
          }
          if (item.stock < req.quantity) {
            return {
              success: false,
              error: `Insufficient stock for ${item.name}. Available: ${item.stock}, required: ${req.quantity}`,
            };
          }
        }
        // Execute decrement
        const updated: InventoryItem[] = [];
        for (const req of itemsToDecrement) {
          const item = this.data.inventory.find((i) => i.id === req.id)!;
          item.stock -= req.quantity;
          item.updatedAt = new Date().toISOString();
          updated.push(item);
        }
        this.saveData();
        return { success: true, updated };
      },
    };
  }

  get catalog() {
    return {
      find: () => this.data.catalog,
      findById: (id: string) => this.data.catalog.find((c) => c.id === id),
    };
  }

  get orders() {
    return {
      find: (filter?: { userId?: string; status?: string }) => {
        let results = [...this.data.orders];
        if (filter?.userId) {
          results = results.filter((o) => o.userId === filter.userId);
        }
        if (filter?.status) {
          results = results.filter((o) => o.status === filter.status);
        }
        // Sort newest first
        return results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      },
      findById: (id: string) => this.data.orders.find((o) => o.id === id || o.orderNumber === id),
      create: (order: Order) => {
        this.data.orders.unshift(order);
        this.saveData();
        return order;
      },
      updateStatus: (id: string, status: Order['status'], note?: string) => {
        const order = this.data.orders.find((o) => o.id === id || o.orderNumber === id);
        if (order) {
          order.status = status;
          order.updatedAt = new Date().toISOString();
          order.statusHistory.push({
            status,
            timestamp: new Date().toISOString(),
            note: note || `Order transitioned to ${status.replace(/_/g, ' ')}`,
          });
          this.saveData();
          return order;
        }
        return null;
      },
      update: (id: string, updates: Partial<Order>) => {
        const idx = this.data.orders.findIndex((o) => o.id === id || o.orderNumber === id);
        if (idx !== -1) {
          this.data.orders[idx] = { ...this.data.orders[idx], ...updates, updatedAt: new Date().toISOString() };
          this.saveData();
          return this.data.orders[idx];
        }
        return null;
      },
    };
  }

  get emailLogs() {
    return {
      find: () => [...this.data.emailLogs].sort((a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime()),
      create: (log: EmailNotificationLog) => {
        this.data.emailLogs.unshift(log);
        if (this.data.emailLogs.length > 50) {
          this.data.emailLogs.pop();
        }
        this.saveData();
        return log;
      },
    };
  }
}

export const db = new Database();
