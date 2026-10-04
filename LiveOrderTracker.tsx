import React, { useState, useEffect } from 'react';
import {
  CheckCircle2,
  Clock,
  ChefHat,
  Bike,
  PackageCheck,
  RotateCcw,
  Receipt,
  MapPin,
  Sparkles,
  AlertCircle,
  ShieldCheck,
  Lock,
  PhoneCall,
  Copy,
  Check,
  MessageSquare,
} from 'lucide-react';
import type { Order, OrderStatus } from '../types';
import { api } from '../api';
import { sound } from '../utils/audio';
import { realtime, useRealtimeStatus } from '../utils/realtime';
import { DeliveryRadarMap } from './DeliveryRadarMap';
import { CourierChatDrawer } from './CourierChatDrawer';

interface LiveOrderTrackerProps {
  initialOrderId?: string;
  userEmail?: string;
  onSelectPizzaBuilder: () => void;
}

export const LiveOrderTracker: React.FC<LiveOrderTrackerProps> = ({
  initialOrderId,
  userEmail,
  onSelectPizzaBuilder,
}) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [copied, setCopied] = useState<boolean>(false);
  const [callAlert, setCallAlert] = useState<string | null>(null);
  const [isCourierChatOpen, setIsCourierChatOpen] = useState<boolean>(false);
  const isWsConnected = useRealtimeStatus();

  // Fetch orders initially
  const fetchOrders = async (silently = false) => {
    if (!silently) setLoading(true);
    try {
      const res = await api.getMyOrders(userEmail);
      setOrders(res.orders);

      if (res.orders.length > 0) {
        if (initialOrderId) {
          const match = res.orders.find((o) => o.id === initialOrderId || o.orderNumber === initialOrderId);
          if (match) {
            setSelectedOrder(match);
          } else {
            setSelectedOrder(res.orders[0]);
          }
        } else if (!selectedOrder) {
          setSelectedOrder(res.orders[0]);
        } else {
          const updatedCurrent = res.orders.find((o) => o.id === selectedOrder.id);
          if (updatedCurrent) {
            setSelectedOrder(updatedCurrent);
          }
        }
      }
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Failed to fetch orders:', err);
    } finally {
      if (!silently) setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();

    // Subscribe to live WebSocket updates
    const unsubStatus = realtime.on('order:status_updated', (payload) => {
      const updatedOrder = payload.order as Order;
      if (!updatedOrder) return;

      setOrders((prev) =>
        prev.map((o) => (o.id === updatedOrder.id ? updatedOrder : o))
      );
      setSelectedOrder((prev) =>
        prev && prev.id === updatedOrder.id ? updatedOrder : prev
      );
      sound.playSuccess();
      setLastUpdated(new Date());
    });

    const unsubCreated = realtime.on('order:created', (payload) => {
      const newOrder = payload.order as Order;
      if (!newOrder) return;

      setOrders((prev) => [newOrder, ...prev.filter((o) => o.id !== newOrder.id)]);
      setSelectedOrder(newOrder);
      sound.playSuccess();
      setLastUpdated(new Date());
    });

    // Fallback sync every 15s in case of reconnect
    const interval = setInterval(() => {
      fetchOrders(true);
    }, 15000);

    return () => {
      unsubStatus();
      unsubCreated();
      clearInterval(interval);
    };
  }, [initialOrderId, userEmail]);

  // Status mapping
  const steps: Array<{
    status: OrderStatus;
    title: string;
    subtitle: string;
    icon: React.ReactNode;
  }> = [
    {
      status: 'order_received',
      title: 'Order Received',
      subtitle: 'Ticket printed & paid',
      icon: <CheckCircle2 className="w-5 h-5" />,
    },
    {
      status: 'in_kitchen',
      title: 'In Kitchen',
      subtitle: 'Hand-tossed & baking',
      icon: <ChefHat className="w-5 h-5" />,
    },
    {
      status: 'sent_to_delivery',
      title: 'Sent to Delivery',
      subtitle: 'Dispatched in thermal bag',
      icon: <Bike className="w-5 h-5" />,
    },
    {
      status: 'delivered',
      title: 'Delivered',
      subtitle: 'Arrived at your door',
      icon: <PackageCheck className="w-5 h-5" />,
    },
  ];

  const getStepIndex = (status: OrderStatus) => {
    switch (status) {
      case 'order_received':
        return 0;
      case 'in_kitchen':
        return 1;
      case 'sent_to_delivery':
        return 2;
      case 'delivered':
        return 3;
      case 'cancelled':
        return -1;
      default:
        return 0;
    }
  };

  const currentStepIndex = selectedOrder ? getStepIndex(selectedOrder.status) : 0;

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold uppercase tracking-wider mb-2">
            <span
              className={`w-2 h-2 rounded-full ${
                isWsConnected ? 'bg-emerald-500 animate-ping' : 'bg-stone-400'
              }`}
            />
            <span>{isWsConnected ? 'WebSocket Live Real-Time Feed' : 'Connecting to Live Feed...'}</span>
          </div>
          <h2 className="font-serif text-3xl font-bold text-stone-900">Live Order Tracking</h2>
          <p className="text-stone-600 text-sm mt-1">
            Status updates stream directly from the kitchen stone-hearth in real-time.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="text-[11px] text-stone-500">
            Last synced: {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </span>
          <button
            onClick={() => fetchOrders()}
            className="p-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl border border-stone-200 transition"
            title="Refresh order status"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {loading && orders.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-stone-200 shadow-xs">
          <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-stone-700 font-medium">Connecting to kitchen order logs...</p>
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-stone-200 p-6 max-w-md mx-auto shadow-xs">
          <ChefHat className="w-12 h-12 text-stone-400 mx-auto mb-3" />
          <h3 className="font-serif text-lg font-bold text-stone-900">No Orders Found</h3>
          <p className="text-xs text-stone-600 mt-1 mb-5 leading-relaxed">
            You haven't placed an artisan pizza order yet. Jump into our interactive pizza builder or select from the catalog!
          </p>
          <button
            onClick={onSelectPizzaBuilder}
            className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-bold transition shadow-xs"
          >
            Build Your First Pizza
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Active Order Spotlight Tracker (8 cols) */}
          {selectedOrder && (
            <div className="lg:col-span-8 space-y-6">
              {/* Order Status Banner */}
              <div className="bg-white border border-stone-200 rounded-3xl p-6 sm:p-8 shadow-xs relative overflow-hidden">
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-stone-200 pb-5">
                  <div>
                    <span className="text-xs text-stone-500 font-mono">Order Number</span>
                    <div className="flex items-center gap-2">
                      <h3 className="text-2xl font-mono font-extrabold text-amber-700">
                        #{selectedOrder.orderNumber}
                      </h3>
                      <button
                        id="btn-copy-order-num"
                        onClick={() => {
                          sound.playClick();
                          navigator.clipboard?.writeText(selectedOrder.orderNumber);
                          setCopied(true);
                          setTimeout(() => setCopied(false), 2000);
                        }}
                        title="Copy order number"
                        className="p-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-600 hover:text-stone-900 transition"
                      >
                        {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <span className="text-[11px] text-stone-500 block">Payment Method</span>
                      <span className="text-xs font-bold uppercase tracking-wide text-stone-800">
                        {selectedOrder.paymentMethod === 'razorpay' ? 'Razorpay Test Mode' : 'Cash on Delivery (COD)'}
                      </span>
                    </div>
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-extrabold uppercase ${
                        selectedOrder.paymentStatus === 'completed'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          : 'bg-amber-100 text-amber-800 border border-amber-200'
                      }`}
                    >
                      {selectedOrder.paymentStatus}
                    </span>
                  </div>
                </div>

                {/* 4-Step Visual Progression Tracker */}
                {selectedOrder.status === 'cancelled' ? (
                  <div className="my-8 p-5 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-center">
                    <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
                    <h4 className="font-bold text-base">Order Cancelled</h4>
                    <p className="text-xs text-red-600 mt-1">
                      This order was cancelled by the pizzeria or customer request.
                    </p>
                  </div>
                ) : (
                  <div className="my-8">
                    {/* Stepper Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 relative">
                      {steps.map((step, idx) => {
                        const isDone = currentStepIndex > idx;
                        const isCurrent = currentStepIndex === idx;

                        return (
                          <div
                            key={step.status}
                            className={`p-4 rounded-2xl border transition-all relative flex flex-col justify-between ${
                              isCurrent
                                ? 'bg-amber-50/80 border-amber-500 shadow-xs ring-1 ring-amber-400'
                                : isDone
                                ? 'bg-emerald-50/50 border-emerald-300'
                                : 'bg-stone-50 border-stone-200 opacity-60'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-3">
                              <div
                                className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                                  isCurrent
                                    ? 'bg-amber-500 text-stone-950 font-bold shadow-xs'
                                    : isDone
                                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                    : 'bg-stone-200 text-stone-600'
                                }`}
                              >
                                {step.icon}
                              </div>
                              <span className="text-[10px] font-mono font-bold text-stone-500">
                                Step 0{idx + 1}
                              </span>
                            </div>

                            <div>
                              <h4
                                className={`text-xs font-bold leading-tight ${
                                  isCurrent
                                    ? 'text-stone-950'
                                    : isDone
                                    ? 'text-stone-800'
                                    : 'text-stone-500'
                                }`}
                              >
                                {step.title}
                              </h4>
                              <p className="text-[10px] text-stone-600 mt-1 leading-snug">
                                {step.subtitle}
                              </p>
                            </div>

                            {isCurrent && (
                              <div className="mt-3 pt-2 border-t border-amber-300/60 flex items-center gap-1.5 text-[10px] font-extrabold text-amber-800">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-600 animate-ping" />
                                <span>In Progress</span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Interactive Real-Time Delivery Radar Simulation */}
                    <div className="mt-5">
                      <DeliveryRadarMap
                        order={selectedOrder}
                        onOpenChat={() => {
                          sound.playClick();
                          setIsCourierChatOpen(true);
                        }}
                      />
                    </div>

                    {/* Courier & Dispatch Unit Card */}
                    {selectedOrder.status !== 'delivered' && (
                      <div className="mt-4 p-4 rounded-2xl bg-gradient-to-r from-stone-900 to-stone-850 text-white shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border border-stone-800">
                        <div className="flex items-center gap-3.5">
                          <div className="w-11 h-11 rounded-2xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-400 shrink-0">
                            <Bike className="w-6 h-6" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h5 className="text-xs sm:text-sm font-bold text-white">
                                Courier Marco Rossi
                              </h5>
                              <span className="px-2 py-0.5 rounded-md bg-amber-500 text-stone-950 text-[10px] font-extrabold uppercase">
                                Vespa #12
                              </span>
                            </div>
                            <p className="text-[11px] text-stone-300 mt-0.5">
                              Thermal insulated chamber active (165°F) • Tamper-evident Italian wax seal
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 self-stretch sm:self-auto">
                          <button
                            id="btn-chat-courier"
                            onClick={() => {
                              sound.playClick();
                              setIsCourierChatOpen(true);
                            }}
                            className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-bold transition flex items-center justify-center gap-2 active:scale-95 shadow-xs"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                            <span>Live Chat</span>
                          </button>
                          <button
                            id="btn-call-courier-sim"
                            onClick={() => {
                              sound.playSuccess();
                              setCallAlert('Calling Courier Marco via secure p2p dispatch line...');
                              setTimeout(() => {
                                setCallAlert('Courier Marco: "Ciao! Your pizza is safe in the thermal vault, heading your way shortly!"');
                                setTimeout(() => setCallAlert(null), 5000);
                              }, 1500);
                            }}
                            className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-bold transition flex items-center justify-center gap-2 active:scale-95"
                          >
                            <PhoneCall className="w-3.5 h-3.5 text-amber-400" />
                            <span>Call</span>
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Call Alert Reassurance Banner */}
                    {callAlert && (
                      <div className="mt-3 p-3 rounded-xl bg-amber-50 border border-amber-300 text-amber-950 text-xs font-medium flex items-center gap-2 animate-in fade-in slide-in-from-top-1">
                        <span className="w-2 h-2 rounded-full bg-amber-600 animate-ping" />
                        <span>{callAlert}</span>
                      </div>
                    )}

                    {/* Kitchen-Controlled Live Stream Status (Customer Read-Only) */}
                    <div className="mt-5 p-4 bg-stone-50 border border-stone-200 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs">
                      <div className="flex items-center gap-3 text-left">
                        <div className="w-9 h-9 rounded-xl bg-amber-100/80 border border-amber-200 text-amber-800 flex items-center justify-center shrink-0 shadow-2xs">
                          <ShieldCheck className="w-4.5 h-4.5 text-amber-700" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h5 className="text-xs font-bold text-stone-900">
                              Official Kitchen Progress Stream
                            </h5>
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-stone-200/80 text-stone-700 text-[10px] font-mono font-bold tracking-wider uppercase">
                              <Lock className="w-2.5 h-2.5" />
                              Read-Only
                            </span>
                          </div>
                          <p className="text-[11px] text-stone-600 mt-0.5 leading-relaxed">
                            Order transitions are verified and logged directly by our kitchen pizzaiolos and dispatch couriers. Customers cannot modify order steps once placed.
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-bold whitespace-nowrap self-stretch sm:self-auto justify-center shadow-2xs">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span>Live Sync Active</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Status Timeline History Logs */}
                <div className="bg-stone-50 rounded-2xl p-4 sm:p-5 border border-stone-200 space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-stone-600">
                    Kitchen Event Stream Logs
                  </h4>
                  <div className="space-y-3">
                    {selectedOrder.statusHistory.map((hist, idx) => (
                      <div key={idx} className="flex items-start gap-3 text-xs">
                        <div className="w-2 h-2 rounded-full bg-amber-600 mt-1.5 shrink-0" />
                        <div className="flex-1">
                          <p className="text-stone-800 font-medium">{hist.note}</p>
                          <span className="text-[10px] text-stone-500 font-mono">
                            {new Date(hist.timestamp).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                              second: '2-digit',
                            })}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Delivery Information Footer */}
                <div className="mt-6 pt-5 border-t border-stone-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs">
                  <div className="flex items-center gap-2 text-stone-700">
                    <MapPin className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>
                      {selectedOrder.deliveryAddress.streetAddress},{' '}
                      {selectedOrder.deliveryAddress.city} (Phone:{' '}
                      {selectedOrder.deliveryAddress.phone})
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="text-stone-500 block text-[11px]">Total Paid/Due</span>
                    <span className="font-serif text-lg font-black text-amber-700">
                      ${selectedOrder.totalAmount.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Items Details in this Order */}
              <div className="bg-white border border-stone-200 rounded-3xl p-6 shadow-xs space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-stone-600">
                  Ordered Items & Recipes
                </h4>
                <div className="divide-y divide-stone-100">
                  {selectedOrder.items.map((it) => (
                    <div key={it.id} className="py-3.5 first:pt-0 last:pb-0 flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-stone-900 text-sm">{it.name}</span>
                          <span className="text-xs text-amber-700 font-bold">x{it.quantity}</span>
                          <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-stone-100 text-stone-700 border border-stone-200">
                            {it.config.size || 'Medium (12")'}
                          </span>
                        </div>
                        {it.customizationDetails && (
                          <p className="text-xs text-stone-600 mt-1">
                            Crust: {it.customizationDetails.baseName} • Sauce: {it.customizationDetails.sauceName} • Cheese: {it.customizationDetails.cheeseName}
                            {it.customizationDetails.vegetableNames.length > 0 && (
                              <> • Veggies: {it.customizationDetails.vegetableNames.join(', ')}</>
                            )}
                          </p>
                        )}
                      </div>
                      <span className="font-bold text-stone-900 text-sm">
                        ${(it.unitPrice * it.quantity).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Past / Other Orders Drawer List (4 cols) */}
          <div className="lg:col-span-4 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-stone-600">
              Your Orders ({orders.length})
            </h3>

            <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
              {orders.map((ord) => {
                const isSelected = selectedOrder?.id === ord.id;

                return (
                  <div
                    key={ord.id}
                    id={`card-order-list-${ord.orderNumber}`}
                    onClick={() => {
                      sound.playClick();
                      setSelectedOrder(ord);
                    }}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-amber-50/80 border-amber-500 shadow-xs ring-1 ring-amber-400'
                        : 'bg-white hover:bg-stone-50 border-stone-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-stone-900 text-sm">
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
                            : 'bg-stone-100 text-stone-700'
                        }`}
                      >
                        {ord.status.replace(/_/g, ' ')}
                      </span>
                    </div>

                    <div className="mt-2 text-xs text-stone-600">
                      <p>{ord.items.map((i) => `${i.name} (x${i.quantity})`).join(', ')}</p>
                      <div className="flex justify-between items-center mt-2 pt-2 border-t border-stone-100 text-[11px]">
                        <span>{new Date(ord.createdAt).toLocaleDateString()}</span>
                        <span className="font-bold text-amber-700">${ord.totalAmount.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Real-Time Courier Dispatch Chat Drawer */}
      {isCourierChatOpen && selectedOrder && (
        <CourierChatDrawer
          isOpen={isCourierChatOpen}
          onClose={() => setIsCourierChatOpen(false)}
          order={selectedOrder}
        />
      )}
    </div>
  );
};
