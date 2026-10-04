import React, { useState, useEffect } from 'react';
import {
  PizzaCatalogItem,
  InventoryItem,
  OrderItem,
  User,
  CustomPizzaConfig,
  Order,
} from './types';
import { api, authStorage } from './api';
import { sound } from './utils/audio';

import { Navbar } from './components/Navbar';
import { PizzaCatalog } from './components/PizzaCatalog';
import { CustomPizzaBuilder } from './components/CustomPizzaBuilder';
import { OrderSummaryModal } from './components/OrderSummaryModal';
import { LiveOrderTracker } from './components/LiveOrderTracker';
import { AdminPortal } from './components/AdminPortal';
import { AuthModal } from './components/AuthModal';
import { EmailSandboxModal } from './components/EmailSandboxModal';
import { ChefLuigiModal } from './components/ChefLuigiModal';

import {
  Pizza,
  SlidersHorizontal,
  Clock,
  ShieldCheck,
  ShoppingBag,
  Volume2,
  VolumeX,
  Sparkles,
  PhoneCall,
  Flame,
  CheckCircle2,
  ChefHat,
} from 'lucide-react';

export default function App() {
  // Navigation
  const [activeTab, setActiveTab] = useState<'catalog' | 'builder' | 'orders' | 'admin'>('catalog');

  // App Data
  const [catalogPizzas, setCatalogPizzas] = useState<PizzaCatalogItem[]>([]);
  const [inventory, setInventory] = useState<{
    bases: InventoryItem[];
    sauces: InventoryItem[];
    cheeses: InventoryItem[];
    vegetables: InventoryItem[];
  }>({
    bases: [],
    sauces: [],
    cheeses: [],
    vegetables: [],
  });

  // Cart
  const [cartItems, setCartItems] = useState<OrderItem[]>(() => {
    try {
      const saved = localStorage.getItem('pizzacraft_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Users & Auth
  const [user, setUser] = useState<User | null>(null);
  const [adminUser, setAdminUser] = useState<User | null>(null);

  // Modals
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register' | 'verify' | 'forgot'>('login');
  const [authNoticeMessage, setAuthNoticeMessage] = useState<string | null>(null);
  const [pendingCartItem, setPendingCartItem] = useState<OrderItem | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isEmailSandboxOpen, setIsEmailSandboxOpen] = useState(false);
  const [isChefLuigiOpen, setIsChefLuigiOpen] = useState(false);

  // Builder pre-seed configuration
  const [builderConfig, setBuilderConfig] = useState<CustomPizzaConfig | undefined>(undefined);

  // Tracker order focus
  const [trackedOrderId, setTrackedOrderId] = useState<string | undefined>(undefined);
  const [activeOrdersCount, setActiveOrdersCount] = useState<number>(0);

  // Toast notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Sound mute state
  const [isMuted, setIsMuted] = useState(false);

  // Sync cart to local storage
  useEffect(() => {
    try {
      localStorage.setItem('pizzacraft_cart', JSON.stringify(cartItems));
    } catch (e) {
      console.error(e);
    }
  }, [cartItems]);

  // Initial Load: User profile, Catalog, Inventory, and Active Orders
  useEffect(() => {
    const initializeAppData = async () => {
      // 1. Fetch User Profile if token exists
      const token = authStorage.getToken();
      if (token) {
        try {
          const res = await api.getProfile();
          setUser(res.user);
        } catch {
          authStorage.removeToken();
        }
      }

      // 2. Fetch Catalog & Inventory
      try {
        const [catalogRes, inventoryRes] = await Promise.all([
          api.getCatalog(),
          api.getInventory(),
        ]);
        setCatalogPizzas(catalogRes.pizzas);
        setInventory(inventoryRes.grouped);
      } catch (err) {
        console.error('Failed to load initial catalog/inventory:', err);
      }

      // 3. Check active orders count
      try {
        const myOrdersRes = await api.getMyOrders(user?.email);
        const ongoing = myOrdersRes.orders.filter(
          (o) => o.status !== 'delivered' && o.status !== 'cancelled'
        );
        setActiveOrdersCount(ongoing.length);
      } catch {}
    };

    initializeAppData();
  }, [user?.email]);

  // Toast helper
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3200);
  };

  // Require auth handler
  const handleRequireAuth = (item?: OrderItem, customNotice?: string) => {
    sound.playAlert();
    if (item) {
      setPendingCartItem(item);
    }
    setAuthNoticeMessage(
      customNotice || 'Please sign in or create an account to add items to your cart and complete your order.'
    );
    setAuthModalMode('login');
    setIsAuthModalOpen(true);
    showToast('Sign in required to add items to cart.');
  };

  // Cart actions
  const handleAddToCart = (item: OrderItem) => {
    // STRICT AUTH GUARD: Unauthenticated users cannot add to cart
    if (!user) {
      handleRequireAuth(item, `Please sign in or create an account to add "${item.name}" to your cart.`);
      return;
    }

    sound.playSuccess();
    setCartItems((prev) => {
      // Check if identical item already exists in cart
      const existingIdx = prev.findIndex(
        (i) =>
          i.name === item.name &&
          i.config.size === item.config.size &&
          i.config.baseId === item.config.baseId &&
          i.config.sauceId === item.config.sauceId &&
          i.config.cheeseId === item.config.cheeseId &&
          JSON.stringify(i.config.vegetableIds?.sort()) ===
            JSON.stringify(item.config.vegetableIds?.sort())
      );

      if (existingIdx >= 0) {
        const updated = [...prev];
        updated[existingIdx].quantity += item.quantity;
        return updated;
      }
      return [...prev, item];
    });

    showToast(`Added "${item.name}" to your order.`);
  };

  const handleUpdateQuantity = (id: string, delta: number) => {
    setCartItems((prev) =>
      prev
        .map((item) => {
          if (item.id === id) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as OrderItem[]
    );
  };

  const handleRemoveItem = (id: string) => {
    setCartItems((prev) => prev.filter((i) => i.id !== id));
    sound.playClick();
  };

  // Switch to Builder with pre-loaded configuration
  const handleCustomizeInBuilder = (config: CustomPizzaConfig) => {
    sound.playClick();
    setBuilderConfig(config);
    setActiveTab('builder');
  };

  // Order Placement Success Handler
  const handleOrderCompleted = (newOrder: Order) => {
    setCartItems([]);
    setTrackedOrderId(newOrder.id);
    setActiveOrdersCount((prev) => prev + 1);
    setActiveTab('orders');
    showToast(`Order #${newOrder.orderNumber} successfully placed! Tracking live.`);
  };

  // User Logout
  const handleLogout = () => {
    sound.playClick();
    authStorage.removeToken();
    setUser(null);
    showToast('Signed out of user session.');
  };

  // Admin Logout
  const handleAdminLogout = () => {
    sound.playClick();
    authStorage.removeAdminToken();
    setAdminUser(null);
    showToast('Signed out of administrator console.');
  };

  const totalCartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="min-h-screen bg-[#faf8f5] text-stone-900 flex flex-col font-sans selection:bg-amber-500 selection:text-stone-950">
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={(tab) => {
          sound.playClick();
          setActiveTab(tab);
        }}
        cartCount={totalCartCount}
        openCart={() => {
          sound.playClick();
          setIsCartOpen(true);
        }}
        user={user}
        adminUser={adminUser}
        openAuthModal={() => {
          sound.playClick();
          setAuthModalMode('login');
          setIsAuthModalOpen(true);
        }}
        onLogout={handleLogout}
        onAdminLogout={handleAdminLogout}
        openEmailSandbox={() => {
          sound.playClick();
          setIsEmailSandboxOpen(true);
        }}
        activeOrdersCount={activeOrdersCount}
        openChefLuigiModal={() => {
          sound.playClick();
          setIsChefLuigiOpen(true);
        }}
      />

      {/* Main View Router Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-20">
        {/* VIEW 1: MENU CATALOG */}
        {activeTab === 'catalog' && (
          <PizzaCatalog
            pizzas={catalogPizzas}
            onAddToCart={handleAddToCart}
            onCustomizeInBuilder={handleCustomizeInBuilder}
            user={user}
            onRequireAuth={handleRequireAuth}
          />
        )}

        {/* VIEW 2: CUSTOM PIZZA BUILDER */}
        {activeTab === 'builder' && (
          <CustomPizzaBuilder
            inventory={inventory}
            initialConfig={builderConfig}
            onAddToCart={handleAddToCart}
            user={user}
            onRequireAuth={handleRequireAuth}
          />
        )}

        {/* VIEW 3: LIVE ORDER TRACKER */}
        {activeTab === 'orders' && (
          <LiveOrderTracker
            initialOrderId={trackedOrderId}
            userEmail={user?.email}
            onSelectPizzaBuilder={() => setActiveTab('builder')}
          />
        )}

        {/* VIEW 4: ADMIN PORTAL */}
        {activeTab === 'admin' && (
          <AdminPortal
            adminUser={adminUser}
            onAdminLoginSuccess={(adm) => setAdminUser(adm)}
            onAdminLogout={handleAdminLogout}
            openEmailSandbox={() => setIsEmailSandboxOpen(true)}
          />
        )}
      </main>

      {/* Mobile Bottom Navigation Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-stone-200 py-2 px-3 flex items-center justify-around text-center shadow-lg">
        <button
          onClick={() => {
            sound.playClick();
            setActiveTab('catalog');
          }}
          className={`flex flex-col items-center gap-1 p-1 rounded-xl transition ${
            activeTab === 'catalog' ? 'text-amber-800 font-bold' : 'text-stone-500'
          }`}
        >
          <Pizza className="w-5 h-5" />
          <span className="text-[10px]">Menu</span>
        </button>

        <button
          onClick={() => {
            sound.playClick();
            setActiveTab('builder');
          }}
          className={`flex flex-col items-center gap-1 p-1 rounded-xl transition relative ${
            activeTab === 'builder' ? 'text-amber-800 font-bold' : 'text-stone-500'
          }`}
        >
          <SlidersHorizontal className="w-5 h-5" />
          <span className="text-[10px]">Builder</span>
        </button>

        <button
          onClick={() => {
            sound.playClick();
            setIsCartOpen(true);
          }}
          className="flex flex-col items-center gap-1 p-1 rounded-xl text-stone-500 relative"
        >
          <div className="relative">
            <ShoppingBag className="w-5 h-5" />
            {totalCartCount > 0 && (
              <span className="absolute -top-1.5 -right-2 w-4 h-4 rounded-full bg-amber-500 text-stone-950 text-[10px] font-black flex items-center justify-center">
                {totalCartCount}
              </span>
            )}
          </div>
          <span className="text-[10px]">Cart</span>
        </button>

        <button
          onClick={() => {
            sound.playClick();
            setActiveTab('orders');
          }}
          className={`flex flex-col items-center gap-1 p-1 rounded-xl transition relative ${
            activeTab === 'orders' ? 'text-amber-800 font-bold' : 'text-stone-500'
          }`}
        >
          <Clock className="w-5 h-5" />
          <span className="text-[10px]">Tracker</span>
          {activeOrdersCount > 0 && (
            <span className="absolute top-0 right-2 w-2 h-2 rounded-full bg-emerald-500" />
          )}
        </button>

        <button
          onClick={() => {
            sound.playClick();
            setActiveTab('admin');
          }}
          className={`flex flex-col items-center gap-1 p-1 rounded-xl transition ${
            activeTab === 'admin' ? 'text-amber-800 font-bold' : 'text-stone-500'
          }`}
        >
          <ShieldCheck className="w-5 h-5" />
          <span className="text-[10px]">Admin</span>
        </button>
      </div>

      {/* Footer */}
      <footer className="border-t border-stone-200 bg-white py-10 mt-auto text-xs text-stone-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-amber-500 flex items-center justify-center text-stone-950 shadow-xs">
              <Pizza className="w-5 h-5" />
            </div>
            <div>
              <p className="font-serif font-bold text-stone-900 text-sm">
                PizzaCraft Artisan Kitchen
              </p>
              <p className="text-[11px] text-stone-500">
                Stone-Fired Neapolitan Craft • Razorpay Test Gateway & COD Integrated
              </p>
            </div>
          </div>

          {/* Quick Shortcuts */}
          <div className="flex items-center gap-4 text-xs font-medium">
            <button
              onClick={() => {
                sound.playClick();
                setIsEmailSandboxOpen(true);
              }}
              className="text-stone-600 hover:text-amber-800 transition underline underline-offset-4"
            >
              Email Outbox Sandbox ✉️
            </button>
            <span className="text-stone-300">•</span>
            <button
              onClick={() => {
                sound.playClick();
                setActiveTab('admin');
              }}
              className="text-stone-600 hover:text-amber-800 transition underline underline-offset-4"
            >
              Admin Dashboard (node-cron stock monitor)
            </button>
            <span className="text-stone-300">•</span>
            <button
              onClick={() => {
                const nextMute = sound.toggleMute();
                setIsMuted(nextMute);
              }}
              className="p-1 rounded text-stone-500 hover:text-stone-800"
              title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
          </div>

          <p className="text-[11px] text-stone-500">
            © {new Date().getFullYear()} PizzaCraft Inc. All rights reserved.
          </p>
        </div>
      </footer>

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-16 md:bottom-6 right-6 z-50 bg-amber-500 text-stone-950 px-4 py-2.5 rounded-2xl font-bold text-xs shadow-2xl flex items-center gap-2 animate-in slide-in-from-bottom-5 duration-200">
          <CheckCircle2 className="w-4 h-4 stroke-[3]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ORDER SUMMARY & CHECKOUT MODAL */}
      {isCartOpen && (
        <OrderSummaryModal
          isOpen={isCartOpen}
          onClose={() => setIsCartOpen(false)}
          items={cartItems}
          onUpdateQuantity={handleUpdateQuantity}
          onRemoveItem={handleRemoveItem}
          user={user}
          onOrderCompleted={handleOrderCompleted}
          onOpenAuth={() => {
            setIsCartOpen(false);
            setAuthModalMode('login');
            setIsAuthModalOpen(true);
          }}
        />
      )}

      {/* AUTHENTICATION MODAL */}
      {isAuthModalOpen && (
        <AuthModal
          isOpen={isAuthModalOpen}
          noticeMessage={authNoticeMessage}
          onClose={() => {
            setIsAuthModalOpen(false);
            setAuthNoticeMessage(null);
          }}
          onAuthSuccess={(authedUser) => {
            setUser(authedUser);
            showToast(`Welcome back, ${authedUser.name.split(' ')[0]}!`);
            if (pendingCartItem) {
              sound.playSuccess();
              setCartItems((prev) => [...prev, pendingCartItem]);
              showToast(`Added "${pendingCartItem.name}" to your cart!`);
              setPendingCartItem(null);
            }
            setAuthNoticeMessage(null);
          }}
          initialMode={authModalMode}
          openEmailSandbox={() => {
            setIsAuthModalOpen(false);
            setIsEmailSandboxOpen(true);
          }}
        />
      )}

      {/* EMAIL SANDBOX INSPECTOR */}
      {isEmailSandboxOpen && (
        <EmailSandboxModal
          isOpen={isEmailSandboxOpen}
          onClose={() => setIsEmailSandboxOpen(false)}
        />
      )}

      {/* Floating Maestro Luigi AI Assistant Button */}
      <button
        id="btn-floating-chef-luigi"
        onClick={() => {
          sound.playClick();
          setIsChefLuigiOpen(true);
        }}
        className="fixed bottom-20 md:bottom-6 right-6 z-40 p-3 sm:px-4 sm:py-3 rounded-full bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 text-stone-950 font-extrabold text-xs shadow-2xl flex items-center gap-2 hover:scale-105 active:scale-95 transition-all border-2 border-amber-300 ring-4 ring-amber-500/20 group"
      >
        <span className="relative flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-stone-950 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-stone-950"></span>
        </span>
        <ChefHat className="w-5 h-5 text-stone-950" />
        <span className="hidden sm:inline font-bold">Ask Chef Luigi AI</span>
      </button>

      {/* CHEF LUIGI AI ASSISTANT MODAL */}
      {isChefLuigiOpen && (
        <ChefLuigiModal
          isOpen={isChefLuigiOpen}
          onClose={() => setIsChefLuigiOpen(false)}
          onOpenBuilder={() => setActiveTab('builder')}
          onApplyRecipe={(cfg) => {
            setBuilderConfig(cfg);
            setActiveTab('builder');
          }}
        />
      )}
    </div>
  );
}
