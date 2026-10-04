import React, { useState, useEffect } from 'react';
import {
  Shield,
  Layers,
  ChefHat,
  Package,
  AlertTriangle,
  Mail,
  RefreshCw,
  Plus,
  Minus,
  Save,
  Clock,
  TrendingUp,
  CheckCircle2,
  Bike,
  XCircle,
  KeyRound,
  LogOut,
  ExternalLink,
  Lock,
  Eye,
  EyeOff,
  Sparkles,
  Wand2,
  Activity,
  Flame,
} from 'lucide-react';
import type { User, InventoryItem, Order, OrderStatus, AiKitchenInsightData } from '../types';
import { api, authStorage } from '../api';
import { sound } from '../utils/audio';

interface AdminPortalProps {
  adminUser: User | null;
  onAdminLoginSuccess: (user: User) => void;
  onAdminLogout: () => void;
  openEmailSandbox: () => void;
}

export const AdminPortal: React.FC<AdminPortalProps> = ({
  adminUser,
  onAdminLoginSuccess,
  onAdminLogout,
  openEmailSandbox,
}) => {
  // Login form state - clean, confidential state with no exposed default text
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState('');

  // Admin Dashboard State
  const [adminTab, setAdminTab] = useState<'inventory' | 'orders' | 'ai_insights'>('inventory');
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [orderStats, setOrderStats] = useState({
    totalOrders: 0,
    activeOrders: 0,
    deliveredOrders: 0,
    totalRevenue: 0,
  });
  const [selectedOrderStatusFilter, setSelectedOrderStatusFilter] = useState<string>('all');
  const [loadingData, setLoadingData] = useState(false);
  const [thresholdActionMessage, setThresholdActionMessage] = useState('');
  const [editingItem, setEditingItem] = useState<{ id: string; stock: number; threshold: number } | null>(null);
  const [customRestockInputs, setCustomRestockInputs] = useState<Record<string, string>>({});

  // AI Kitchen Insights State
  const [aiInsights, setAiInsights] = useState<AiKitchenInsightData | null>(null);
  const [loadingAiInsights, setLoadingAiInsights] = useState(false);

  const fetchAiKitchenInsights = async () => {
    setLoadingAiInsights(true);
    try {
      const res = await api.aiGetKitchenInsights();
      if (res.success && res.data) {
        setAiInsights(res.data);
      }
    } catch (err) {
      console.error('Failed to load AI insights:', err);
    } finally {
      setLoadingAiInsights(false);
    }
  };

  const handleDirectRestock = (item: InventoryItem) => {
    const rawVal = customRestockInputs[item.id];
    const val = parseInt(rawVal || '0', 10);
    if (isNaN(val) || val === 0) return;
    handleQuickAdjustStock(item, val);
    setCustomRestockInputs((prev) => ({ ...prev, [item.id]: '' }));
  };

  // Auto load admin data if logged in
  useEffect(() => {
    if (adminUser) {
      fetchAdminData();
      const poll = setInterval(() => {
        fetchAdminOrdersOnly();
      }, 5000);
      return () => clearInterval(poll);
    }
  }, [adminUser]);

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    sound.playClick();
    setLoginLoading(true);
    setLoginError('');

    try {
      const res = await api.adminLogin({ email, password });
      authStorage.setAdminToken(res.token);
      sound.playSuccess();
      onAdminLoginSuccess(res.user);
    } catch (err: any) {
      sound.playAlert();
      setLoginError(err.data?.message || err.message || 'Invalid administrator credentials.');
    } finally {
      setLoginLoading(false);
    }
  };

  const fetchAdminData = async () => {
    setLoadingData(true);
    try {
      const [invRes, ordRes] = await Promise.all([
        api.getInventory(),
        api.getAdminOrders(selectedOrderStatusFilter),
      ]);
      setInventoryItems(invRes.items);
      setOrders(ordRes.orders);
      setOrderStats(ordRes.stats);
    } catch (err) {
      console.error('Failed to load admin data:', err);
    } finally {
      setLoadingData(false);
    }
  };

  const fetchAdminOrdersOnly = async () => {
    try {
      const ordRes = await api.getAdminOrders(selectedOrderStatusFilter);
      setOrders(ordRes.orders);
      setOrderStats(ordRes.stats);
    } catch {}
  };

  // Quick stock adjustment
  const handleQuickAdjustStock = async (item: InventoryItem, delta: number) => {
    sound.playClick();
    const newStock = Math.max(0, item.stock + delta);
    try {
      const res = await api.updateInventoryItem(item.id, { stock: newStock });
      setInventoryItems((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, stock: newStock } : i))
      );
    } catch (err) {
      console.error('Failed to adjust stock:', err);
    }
  };

  // Save manual stock & threshold edit
  const handleSaveStockEdit = async () => {
    if (!editingItem) return;
    sound.playClick();
    try {
      await api.updateInventoryItem(editingItem.id, {
        stock: editingItem.stock,
        threshold: editingItem.threshold,
      });
      setInventoryItems((prev) =>
        prev.map((i) =>
          i.id === editingItem.id
            ? { ...i, stock: editingItem.stock, threshold: editingItem.threshold }
            : i
        )
      );
      setEditingItem(null);
      sound.playSuccess();
    } catch (err) {
      console.error('Save stock edit failed:', err);
    }
  };

  // Trigger Node-Cron / Threshold Check on demand
  const handleTriggerThresholdCheck = async () => {
    sound.playClick();
    setThresholdActionMessage('Executing stock threshold evaluation...');
    try {
      const res = await api.checkStockThresholds();
      setThresholdActionMessage(res.message);
      sound.playSuccess();
      setTimeout(() => setThresholdActionMessage(''), 6000);
      fetchAdminData();
    } catch (err: any) {
      setThresholdActionMessage('Threshold verification failed: ' + err.message);
    }
  };

  // Admin update order status
  const handleUpdateOrderStatus = async (orderId: string, status: OrderStatus) => {
    sound.playClick();
    try {
      const res = await api.updateOrderStatus(orderId, status);
      sound.playSuccess();
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? res.order : o))
      );
    } catch (err: any) {
      console.error('Failed to update status:', err);
    }
  };

  // If not logged in as Admin, show dedicated Admin Login Gateway
  if (!adminUser) {
    return (
      <div className="max-w-md mx-auto py-12 px-4">
        <div className="bg-white border border-stone-200 rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
          <div className="text-center space-y-2 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-700 mx-auto mb-3 shadow-xs">
              <Shield className="w-6 h-6" />
            </div>
            <h2 className="font-serif text-2xl font-bold text-stone-900">Restaurant Admin Portal</h2>
            <p className="text-xs text-stone-500">
              Restricted access for pizzeria kitchen managers, inventory monitoring, and order fulfillment.
            </p>
          </div>

          {loginError && (
            <div className="p-3 mb-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs text-center font-medium">
              {loginError}
            </div>
          )}

          <form onSubmit={handleAdminLogin} className="space-y-4">
            <div>
              <label className="text-xs text-stone-600 block mb-1 font-medium">Admin Email</label>
              <div className="relative">
                <input
                  id="input-admin-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter kitchen admin email"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 border border-stone-200 text-stone-900 text-sm focus:outline-none focus:border-amber-500 focus:bg-white transition"
                />
              </div>
            </div>

            <div>
              <label className="text-xs text-stone-600 block mb-1 font-medium">Master Password</label>
              <div className="relative">
                <input
                  id="input-admin-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter master password"
                  className="w-full pl-3.5 pr-10 py-2.5 rounded-xl bg-stone-50 border border-stone-200 text-stone-900 text-sm focus:outline-none focus:border-amber-500 focus:bg-white transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-stone-400 hover:text-stone-700 p-0.5 rounded transition"
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              id="btn-admin-submit-login"
              type="submit"
              disabled={loginLoading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-extrabold text-sm shadow-md shadow-amber-500/15 transition active:scale-[0.99]"
            >
              {loginLoading ? 'Authenticating Admin...' : 'Enter Admin Console'}
            </button>
          </form>

          {/* Secure Confidentiality Notice (Credentials Kept Private) */}
          <div className="mt-6 pt-4 border-t border-stone-200 text-center">
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-50 border border-stone-200 text-[11px] text-stone-600 font-medium">
              <Lock className="w-3.5 h-3.5 text-amber-700" />
              <span>Confidential Access • Kitchen Staff Only</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Group inventory items by category
  const bases = inventoryItems.filter((i) => i.category === 'bases');
  const sauces = inventoryItems.filter((i) => i.category === 'sauces');
  const cheeses = inventoryItems.filter((i) => i.category === 'cheeses');
  const vegetables = inventoryItems.filter((i) => i.category === 'vegetables');
  const lowStockItems = inventoryItems.filter((i) => i.stock < i.threshold);

  return (
    <div className="space-y-8 pb-12">
      {/* Admin Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-stone-200 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-700 shadow-xs">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-serif text-2xl font-bold text-stone-900">Restaurant Operations Portal</h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                ACTIVE ADMIN
              </span>
            </div>
            <p className="text-xs text-stone-500">
              Welcome back, {adminUser.name} • Scheduled threshold monitor: Every 5 mins (node-cron)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={openEmailSandbox}
            className="px-3.5 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-semibold border border-stone-200 transition flex items-center gap-1.5"
            title="Inspect Email Logs"
          >
            <Mail className="w-4 h-4 text-amber-600" />
            <span>Outbox Logs</span>
          </button>

          <button
            onClick={fetchAdminData}
            className="p-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 border border-stone-200 transition"
            title="Refresh dashboard data"
          >
            <RefreshCw className={`w-4 h-4 ${loadingData ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={onAdminLogout}
            className="px-3.5 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 text-xs font-semibold border border-red-200 transition flex items-center gap-1.5"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-stone-200 p-4 rounded-2xl shadow-xs">
          <span className="text-[11px] text-stone-500 font-medium">Total Orders Placed</span>
          <p className="text-2xl font-mono font-extrabold text-stone-900 mt-1">
            {orderStats.totalOrders}
          </p>
        </div>
        <div className="bg-white border border-stone-200 p-4 rounded-2xl shadow-xs">
          <span className="text-[11px] text-stone-500 font-medium">Active Kitchen / Delivery</span>
          <p className="text-2xl font-mono font-extrabold text-amber-700 mt-1">
            {orderStats.activeOrders}
          </p>
        </div>
        <div className="bg-white border border-stone-200 p-4 rounded-2xl shadow-xs">
          <span className="text-[11px] text-stone-500 font-medium">Delivered Orders</span>
          <p className="text-2xl font-mono font-extrabold text-emerald-700 mt-1">
            {orderStats.deliveredOrders}
          </p>
        </div>
        <div className="bg-white border border-stone-200 p-4 rounded-2xl shadow-xs">
          <span className="text-[11px] text-stone-500 font-medium">Total Revenue (Gross)</span>
          <p className="text-2xl font-serif font-extrabold text-amber-800 mt-1">
            ${orderStats.totalRevenue.toFixed(2)}
          </p>
        </div>
      </div>

      {/* Primary Section Tabs */}
      <div className="flex items-center gap-2 border-b border-stone-200 pb-2">
        <button
          onClick={() => setAdminTab('inventory')}
          className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-2 ${
            adminTab === 'inventory'
              ? 'bg-amber-500 text-stone-950 shadow-xs'
              : 'bg-white text-stone-700 hover:bg-stone-100 border border-stone-200'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Inventory Stock & Decrements</span>
          {lowStockItems.length > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-red-500 text-white text-[10px] font-extrabold">
              {lowStockItems.length} Low
            </span>
          )}
        </button>

        <button
          onClick={() => setAdminTab('orders')}
          className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-2 ${
            adminTab === 'orders'
              ? 'bg-amber-500 text-stone-950 shadow-xs'
              : 'bg-white text-stone-700 hover:bg-stone-100 border border-stone-200'
          }`}
        >
          <ChefHat className="w-4 h-4" />
          <span>Incoming Order Management</span>
          <span className="text-xs text-stone-500">({orders.length})</span>
        </button>

        <button
          onClick={() => {
            setAdminTab('ai_insights');
            fetchAiKitchenInsights();
          }}
          className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-2 ${
            adminTab === 'ai_insights'
              ? 'bg-amber-500 text-stone-950 shadow-xs'
              : 'bg-white text-stone-700 hover:bg-stone-100 border border-stone-200'
          }`}
        >
          <Sparkles className="w-4 h-4 text-amber-600 fill-amber-500" />
          <span>AI Kitchen Optimizer</span>
          <span className="px-1.5 py-0.2 rounded bg-amber-100 text-amber-900 text-[10px] font-bold">
            Gemini
          </span>
        </button>
      </div>

      {/* TAB 1: INVENTORY MANAGEMENT */}
      {adminTab === 'inventory' && (
        <div className="space-y-6">
          {/* Automated Cron Alert Banner & Action */}
          <div className="bg-amber-50/70 border border-amber-200 rounded-3xl p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <AlertTriangle className={`w-5 h-5 ${lowStockItems.length > 0 ? 'text-red-500' : 'text-emerald-600'}`} />
                <h3 className="font-bold text-stone-900 text-sm">
                  Automated Stock Threshold Notification (node-cron)
                </h3>
              </div>
              <p className="text-xs text-stone-600 mt-1 max-w-xl leading-relaxed">
                Background worker scans all stock levels every 5 minutes. If any item falls below its configured threshold (default &lt; 20 units), an automated email notification is dispatched to <strong className="text-stone-800">the authorized kitchen operations manager</strong>.
              </p>
              {thresholdActionMessage && (
                <p className="text-xs text-amber-800 font-semibold mt-2">{thresholdActionMessage}</p>
              )}
            </div>

            <button
              id="btn-trigger-threshold-check"
              onClick={handleTriggerThresholdCheck}
              className="py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-bold shadow-xs transition flex items-center gap-2 whitespace-nowrap self-stretch sm:self-auto justify-center"
            >
              <Mail className="w-4 h-4" />
              <span>Trigger Check & Send Email Alert</span>
            </button>
          </div>

          {/* Category Sections: Bases, Sauces, Cheeses, Vegetables */}
          {[
            { title: 'Pizza Bases (Crust Inventory)', items: bases, key: 'bases' },
            { title: 'Sauces (Reduction Stock)', items: sauces, key: 'sauces' },
            { title: 'Cheeses (Curd Stock)', items: cheeses, key: 'cheeses' },
            { title: 'Vegetables (Fresh Produce)', items: vegetables, key: 'vegetables' },
          ].map((sec) => (
            <div key={sec.key} className="bg-white border border-stone-200 rounded-3xl p-6 space-y-4 shadow-xs">
              <h3 className="font-serif text-lg font-bold text-stone-900 flex items-center justify-between">
                <span>{sec.title}</span>
                <span className="text-xs font-mono text-stone-500">{sec.items.length} Varieties</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {sec.items.map((item) => {
                  const isLow = item.stock < item.threshold;
                  const isEditing = editingItem?.id === item.id;

                  return (
                    <div
                      key={item.id}
                      className={`p-4 rounded-2xl border transition-all flex flex-col justify-between ${
                        isLow
                          ? 'bg-red-50/70 border-red-200 shadow-xs'
                          : 'bg-stone-50 border-stone-200'
                      }`}
                    >
                      <div>
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-2xl">{item.imageEmoji || '📦'}</span>
                            <div>
                              <h4 className="font-bold text-stone-900 text-sm">{item.name}</h4>
                              <span className="text-[10px] text-stone-500 capitalize">
                                {item.unit} • Threshold: &lt; {item.threshold}
                              </span>
                            </div>
                          </div>

                          {/* PRD Page 4: Stock Status Pills: IN STOCK (>20), LOW STOCK (<20), OUT OF STOCK (0) */}
                          {item.stock === 0 ? (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-800 border border-red-200">
                              OUT OF STOCK (0)
                            </span>
                          ) : item.stock < 20 ? (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                              LOW STOCK (&lt;20)
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                              IN STOCK (&gt;20)
                            </span>
                          )}
                        </div>

                        {/* Stock Level Display & Progress Bar */}
                        <div className="mt-4 space-y-1.5">
                          <div className="flex justify-between text-xs">
                            <span className="text-stone-500 font-medium">Stock Count</span>
                            <span className={`font-mono font-bold ${isLow ? 'text-red-600' : 'text-stone-900'}`}>
                              {item.stock} {item.unit}
                            </span>
                          </div>
                          <div className="w-full h-2 rounded-full bg-stone-200 overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${
                                isLow ? 'bg-red-500' : item.stock < 30 ? 'bg-amber-500' : 'bg-emerald-500'
                              }`}
                              style={{ width: `${Math.min(100, (item.stock / 60) * 100)}%` }}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Controls: Quick Add/Sub, Direct Restock Input & Edit */}
                      <div className="mt-4 pt-3 border-t border-stone-200 flex items-center justify-between gap-2">
                        {isEditing ? (
                          <div className="w-full space-y-2">
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              <div>
                                <label className="text-[10px] text-stone-500">Stock</label>
                                <input
                                  type="number"
                                  value={editingItem.stock}
                                  onChange={(e) =>
                                    setEditingItem({
                                      ...editingItem,
                                      stock: parseInt(e.target.value, 10) || 0,
                                    })
                                  }
                                  className="w-full px-2 py-1 rounded-lg bg-white border border-stone-200 text-stone-900 shadow-2xs"
                                />
                              </div>
                              <div>
                                <label className="text-[10px] text-stone-500">Alert Threshold</label>
                                <input
                                  type="number"
                                  value={editingItem.threshold}
                                  onChange={(e) =>
                                    setEditingItem({
                                      ...editingItem,
                                      threshold: parseInt(e.target.value, 10) || 0,
                                    })
                                  }
                                  className="w-full px-2 py-1 rounded-lg bg-white border border-stone-200 text-stone-900 shadow-2xs"
                                />
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={handleSaveStockEdit}
                                className="flex-1 py-1 px-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-bold shadow-2xs"
                              >
                                Save
                              </button>
                              <button
                                onClick={() => setEditingItem(null)}
                                className="py-1 px-2 rounded-lg bg-stone-200 text-stone-700 text-xs hover:bg-stone-300"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-col gap-2 w-full">
                            <div className="flex items-center justify-between gap-2 flex-wrap">
                              {/* Quick - / + & Direct Input */}
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <button
                                  onClick={() => handleQuickAdjustStock(item, -1)}
                                  className="p-1 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 border border-stone-200"
                                  title="Decrement 1"
                                >
                                  <Minus className="w-3.5 h-3.5" />
                                </button>

                                {/* PRD Page 4: Direct Input Field to restock ingredients immediately */}
                                <div className="flex items-center gap-1">
                                  <input
                                    type="number"
                                    min="1"
                                    placeholder="Qty"
                                    value={customRestockInputs[item.id] || ''}
                                    onChange={(e) =>
                                      setCustomRestockInputs((prev) => ({ ...prev, [item.id]: e.target.value }))
                                    }
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') handleDirectRestock(item);
                                    }}
                                    className="w-14 px-1.5 py-1 text-xs text-stone-900 bg-white border border-stone-200 rounded-lg text-center"
                                  />
                                  <button
                                    onClick={() => handleDirectRestock(item)}
                                    className="px-2 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-bold shadow-2xs"
                                    title="Add custom stock"
                                  >
                                    +Add
                                  </button>
                                </div>

                                <button
                                  onClick={() => handleQuickAdjustStock(item, 5)}
                                  className="px-2 py-1 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 border border-stone-200 text-xs font-bold"
                                  title="Restock +5"
                                >
                                  +5
                                </button>
                                <button
                                  onClick={() => handleQuickAdjustStock(item, 20)}
                                  className="px-2 py-1 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 border border-stone-200 text-xs font-bold"
                                  title="Restock +20"
                                >
                                  +20
                                </button>
                              </div>

                              <button
                                onClick={() =>
                                  setEditingItem({
                                    id: item.id,
                                    stock: item.stock,
                                    threshold: item.threshold,
                                  })
                                }
                                className="text-xs font-bold text-amber-700 hover:underline"
                              >
                                Edit Threshold
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 2: ORDER MANAGEMENT PANEL */}
      {adminTab === 'orders' && (
        <div className="space-y-6">
          {/* Status Filter Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            {[
              { id: 'all', label: 'All Incoming' },
              { id: 'order_received', label: 'Order Received' },
              { id: 'in_kitchen', label: 'In Kitchen' },
              { id: 'sent_to_delivery', label: 'In Delivery' },
              { id: 'delivered', label: 'Delivered' },
            ].map((st) => (
              <button
                key={st.id}
                onClick={() => setSelectedOrderStatusFilter(st.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                  selectedOrderStatusFilter === st.id
                    ? 'bg-amber-500 text-stone-950 shadow-xs'
                    : 'bg-white text-stone-700 hover:bg-stone-100 border border-stone-200'
                }`}
              >
                {st.label}
              </button>
            ))}
          </div>

          {orders.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-3xl border border-stone-200">
              <p className="text-sm text-stone-500">No orders matching this filter state.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((ord) => (
                <div
                  key={ord.id}
                  id={`admin-order-${ord.orderNumber}`}
                  className="bg-white border border-stone-200 rounded-3xl p-6 shadow-sm space-y-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-200 pb-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-base font-bold text-amber-800">
                          #{ord.orderNumber}
                        </span>
                        <span
                          className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                            ord.status === 'delivered'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : ord.status === 'in_kitchen'
                              ? 'bg-amber-100 text-amber-800 border border-amber-200'
                              : ord.status === 'sent_to_delivery'
                              ? 'bg-blue-100 text-blue-800 border border-blue-200'
                              : ord.status === 'cancelled'
                              ? 'bg-red-100 text-red-800 border border-red-200'
                              : 'bg-stone-100 text-stone-800 border border-stone-200'
                          }`}
                        >
                          {ord.status.replace(/_/g, ' ')}
                        </span>
                      </div>
                      <p className="text-xs text-stone-500 mt-0.5">
                        Customer: <strong className="text-stone-800">{ord.customerName}</strong> ({ord.userEmail}) •{' '}
                        {new Date(ord.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="font-serif text-lg font-bold text-amber-800">
                        ${ord.totalAmount.toFixed(2)}
                      </span>
                      <p className="text-[10px] text-stone-500 uppercase">
                        {ord.paymentMethod === 'razorpay' ? 'Razorpay Test' : 'Cash on Delivery (COD)'} •{' '}
                        <span className="text-emerald-700 font-bold">{ord.paymentStatus}</span>
                      </p>
                    </div>
                  </div>

                  {/* Items & Ingredients */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div className="space-y-1.5 bg-stone-50 p-3.5 rounded-2xl border border-stone-200">
                      <span className="font-bold text-stone-500 uppercase text-[10px]">Ordered Pizzas</span>
                      {ord.items.map((it) => (
                        <div key={it.id} className="text-stone-800">
                          <span className="font-semibold text-amber-800">{it.quantity}x</span> {it.name}
                          {it.customizationDetails && (
                            <p className="text-[11px] text-stone-600 pl-4 mt-0.5">
                              {it.customizationDetails.baseName} + {it.customizationDetails.sauceName} +{' '}
                              {it.customizationDetails.cheeseName}
                              {it.customizationDetails.vegetableNames.length > 0 &&
                                ` + [${it.customizationDetails.vegetableNames.join(', ')}]`}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>

                    <div className="space-y-1.5 bg-stone-50 p-3.5 rounded-2xl border border-stone-200">
                      <span className="font-bold text-stone-500 uppercase text-[10px]">Delivery Details</span>
                      <p className="text-stone-900 font-medium">
                        {ord.deliveryAddress.streetAddress}, {ord.deliveryAddress.city}
                      </p>
                      <p className="text-stone-600">Phone: {ord.deliveryAddress.phone}</p>
                      {ord.deliveryAddress.deliveryNotes && (
                        <p className="text-stone-500 italic">Notes: {ord.deliveryAddress.deliveryNotes}</p>
                      )}
                    </div>
                  </div>

                  {/* PRD Page 4: Status Control: One-click dropdown/buttons to advance state through 4 statuses */}
                  <div className="pt-2 flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-stone-600 font-medium">Status Control:</span>
                      {/* One-click Dropdown */}
                      <select
                        value={ord.status}
                        onChange={(e) => handleUpdateOrderStatus(ord.id, e.target.value as OrderStatus)}
                        className="px-2.5 py-1.5 rounded-xl text-xs font-bold bg-white border border-stone-300 text-stone-800 shadow-2xs focus:ring-1 focus:ring-amber-500 focus:outline-none"
                      >
                        <option value="order_received">Order Received</option>
                        <option value="in_kitchen">In Kitchen</option>
                        <option value="sent_to_delivery">Sent to Delivery</option>
                        <option value="delivered">Delivered</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        onClick={() => handleUpdateOrderStatus(ord.id, 'order_received')}
                        disabled={ord.status === 'order_received'}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                          ord.status === 'order_received'
                            ? 'bg-stone-100 text-stone-400 border border-stone-200 cursor-not-allowed'
                            : 'bg-white hover:bg-stone-100 text-stone-700 border border-stone-200 shadow-2xs'
                        }`}
                      >
                        Order Received
                      </button>

                      <button
                        onClick={() => handleUpdateOrderStatus(ord.id, 'in_kitchen')}
                        disabled={ord.status === 'in_kitchen'}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 ${
                          ord.status === 'in_kitchen'
                            ? 'bg-amber-100 text-amber-800 border border-amber-300 cursor-not-allowed'
                            : 'bg-amber-500 hover:bg-amber-400 text-stone-950 shadow-2xs'
                        }`}
                      >
                        <ChefHat className="w-3.5 h-3.5" />
                        <span>Move to Kitchen</span>
                      </button>

                      <button
                        onClick={() => handleUpdateOrderStatus(ord.id, 'sent_to_delivery')}
                        disabled={ord.status === 'sent_to_delivery'}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 ${
                          ord.status === 'sent_to_delivery'
                            ? 'bg-blue-100 text-blue-800 border border-blue-300 cursor-not-allowed'
                            : 'bg-blue-600 hover:bg-blue-500 text-white shadow-2xs'
                        }`}
                      >
                        <Bike className="w-3.5 h-3.5" />
                        <span>Dispatch Delivery</span>
                      </button>

                      <button
                        onClick={() => handleUpdateOrderStatus(ord.id, 'delivered')}
                        disabled={ord.status === 'delivered'}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 ${
                          ord.status === 'delivered'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 cursor-not-allowed'
                            : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-2xs'
                        }`}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 stroke-[2.5]" />
                        <span>Mark Delivered</span>
                      </button>

                      {ord.status !== 'delivered' && ord.status !== 'cancelled' && (
                        <button
                          onClick={() => handleUpdateOrderStatus(ord.id, 'cancelled')}
                          className="px-2.5 py-1.5 rounded-xl text-xs font-bold text-red-600 hover:bg-red-50 rounded-xl transition"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: AI KITCHEN OPTIMIZER & DEMAND FORECASTER */}
      {adminTab === 'ai_insights' && (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-stone-900 via-stone-850 to-stone-900 text-white rounded-3xl p-6 border border-stone-800 shadow-md">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-800 pb-5">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-500 text-stone-950 flex items-center justify-center shadow-lg">
                  <Sparkles className="w-6 h-6 fill-stone-950" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-serif font-bold text-xl text-white">AI Kitchen Operations Engine</h3>
                    <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-bold tracking-wider uppercase border border-amber-500/30">
                      Gemini 3.8
                    </span>
                  </div>
                  <p className="text-xs text-stone-400 mt-0.5">
                    Real-time operational analysis of queue load, hearth throughput, and ingredient depletion.
                  </p>
                </div>
              </div>

              <button
                onClick={fetchAiKitchenInsights}
                disabled={loadingAiInsights}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-xs font-bold transition flex items-center gap-2 self-start sm:self-auto"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingAiInsights ? 'animate-spin' : ''}`} />
                <span>Refresh AI Forecast</span>
              </button>
            </div>

            {loadingAiInsights && !aiInsights ? (
              <div className="py-12 text-center text-xs text-stone-400 flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
                <span>Synthesizing kitchen telemetry with Gemini...</span>
              </div>
            ) : aiInsights ? (
              <div className="mt-6 space-y-6">
                {/* 3 Metric cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-stone-800/80 rounded-2xl p-4 border border-stone-700">
                    <span className="text-[11px] text-stone-400 uppercase font-bold tracking-wider block">
                      Dynamic Prep Time Forecast
                    </span>
                    <p className="text-2xl font-mono font-extrabold text-amber-400 mt-1">
                      ~{aiInsights.dynamicPrepTimeEst} Mins
                    </p>
                    <span className="text-[10px] text-stone-400 mt-1 block">
                      Based on {orderStats.activeOrders} active orders in queue
                    </span>
                  </div>

                  <div className="bg-stone-800/80 rounded-2xl p-4 border border-stone-700">
                    <span className="text-[11px] text-stone-400 uppercase font-bold tracking-wider block">
                      Hearth Oven Load
                    </span>
                    <p className="text-2xl font-mono font-extrabold text-stone-100 mt-1">
                      {aiInsights.ovenLoadStatus}
                    </p>
                    <div className="w-full h-1.5 rounded-full bg-stone-700 mt-2 overflow-hidden">
                      <div
                        className="h-full bg-amber-500 rounded-full"
                        style={{ width: `${aiInsights.ovenUtilizationPct}%` }}
                      />
                    </div>
                  </div>

                  <div className="bg-stone-800/80 rounded-2xl p-4 border border-stone-700">
                    <span className="text-[11px] text-stone-400 uppercase font-bold tracking-wider block">
                      Priority Restocking Item
                    </span>
                    <p className="text-xl font-bold text-red-400 mt-1 truncate">
                      {aiInsights.priorityRestockItem}
                    </p>
                    <span className="text-[10px] text-stone-400 mt-1 block">
                      Highest depletion velocity
                    </span>
                  </div>
                </div>

                {/* AI Recommendations List */}
                <div className="bg-stone-800/50 rounded-2xl p-5 border border-stone-700/80 space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2">
                    <Wand2 className="w-3.5 h-3.5" />
                    <span>Pizzaiolo Operational Recommendations</span>
                  </h4>
                  <div className="space-y-2.5">
                    {aiInsights.recommendations.map((rec, i) => (
                      <div key={i} className="flex items-start gap-3 text-xs text-stone-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                        <p className="leading-relaxed">{rec}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
};
