import React, { useState } from 'react';
import {
  X,
  Trash2,
  Plus,
  Minus,
  MapPin,
  Tag,
  CreditCard,
  Banknote,
  ShieldCheck,
  ArrowRight,
  AlertCircle,
  ShoppingBag,
  Lock,
} from 'lucide-react';
import type { OrderItem, User, DeliveryAddress, PaymentMethod, Order } from '../types';
import { api } from '../api';
import { RazorpayModal } from './RazorpayModal';
import { sound } from '../utils/audio';

interface OrderSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: OrderItem[];
  onUpdateQuantity: (id: string, delta: number) => void;
  onRemoveItem: (id: string) => void;
  user: User | null;
  onOrderCompleted: (order: Order) => void;
  onOpenAuth: () => void;
}

export const OrderSummaryModal: React.FC<OrderSummaryModalProps> = ({
  isOpen,
  onClose,
  items,
  onUpdateQuantity,
  onRemoveItem,
  user,
  onOrderCompleted,
  onOpenAuth,
}) => {
  // Delivery address state
  const [address, setAddress] = useState<DeliveryAddress>({
    fullName: user?.name || '',
    phone: user?.phone || '',
    streetAddress: user?.address || '428 Mulberry Street, Apt 3B',
    apartment: 'Apt 3B',
    city: 'New York',
    state: 'NY',
    postalCode: '10012',
    deliveryNotes: 'Please ring bell upon doorstep arrival.',
  });

  // Payment method
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('razorpay');

  // Promo code
  const [discountCodeInput, setDiscountCodeInput] = useState<string>('');
  const [appliedCode, setAppliedCode] = useState<string>('');
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [promoMessage, setPromoMessage] = useState<string>('');

  // Processing state & Razorpay modal
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [showRazorpayModal, setShowRazorpayModal] = useState<boolean>(false);
  const [tempOrderNumber, setTempOrderNumber] = useState<string>('');

  if (!isOpen) return null;

  // Subtotal calculation
  const subtotal = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const deliveryFee = subtotal >= 30 || items.length === 0 ? 0 : 2.99;
  const tax = Math.round(subtotal * 0.05 * 100) / 100; // 5% tax
  const totalPayable = Math.max(0, Math.round((subtotal + deliveryFee + tax - discountAmount) * 100) / 100);

  // Apply promo discount
  const handleApplyPromo = () => {
    sound.playClick();
    const code = discountCodeInput.trim().toUpperCase();
    if (!code) return;

    if (code === 'PIZZA20') {
      const discount = Math.round(subtotal * 0.2 * 100) / 100;
      setDiscountAmount(discount);
      setAppliedCode('PIZZA20');
      setPromoMessage('🎉 20% Artisan discount applied!');
    } else if (code === 'FIRSTBITE') {
      const discount = Math.min(subtotal, 5.0);
      setDiscountAmount(discount);
      setAppliedCode('FIRSTBITE');
      setPromoMessage('🎉 $5.00 First Bite discount applied!');
    } else {
      setDiscountAmount(0);
      setAppliedCode('');
      setPromoMessage('❌ Invalid coupon code. Try PIZZA20 or FIRSTBITE.');
    }
  };

  const applyCouponDirect = (code: 'PIZZA20' | 'FIRSTBITE') => {
    sound.playSuccess();
    setDiscountCodeInput(code);
    if (code === 'PIZZA20') {
      const discount = Math.round(subtotal * 0.2 * 100) / 100;
      setDiscountAmount(discount);
      setAppliedCode('PIZZA20');
      setPromoMessage('🎉 20% Artisan discount applied!');
    } else if (code === 'FIRSTBITE') {
      const discount = Math.min(subtotal, 5.0);
      setDiscountAmount(discount);
      setAppliedCode('FIRSTBITE');
      setPromoMessage('🎉 $5.00 First Bite discount applied!');
    }
  };

  // Trigger Checkout
  const handleInitiateCheckout = async () => {
    sound.playClick();
    setErrorMessage('');

    if (!user) {
      onClose();
      onOpenAuth();
      return;
    }

    if (items.length === 0) {
      setErrorMessage('Your pizza cart is empty. Please add an artisan pizza first.');
      return;
    }

    if (!address.fullName.trim() || !address.streetAddress.trim() || !address.phone.trim()) {
      setErrorMessage('Please fill in your full delivery name, street address, and contact phone.');
      return;
    }

    if (paymentMethod === 'razorpay') {
      // Launch Razorpay test gateway
      const genNum = `PZ-${Math.floor(1000 + Math.random() * 9000)}`;
      setTempOrderNumber(genNum);
      setShowRazorpayModal(true);
    } else {
      // Cash on delivery direct placement
      await executePlaceOrder('cod');
    }
  };

  // Final Order Placement Execution
  const executePlaceOrder = async (
    method: PaymentMethod,
    razorpayDetails?: { razorpayPaymentId: string; razorpayOrderId: string }
  ) => {
    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const payload = {
        items,
        deliveryAddress: address,
        paymentMethod: method,
        razorpayOrderId: razorpayDetails?.razorpayOrderId,
        razorpayPaymentId: razorpayDetails?.razorpayPaymentId,
        discountCode: appliedCode,
        notes: address.deliveryNotes,
        email: user?.email || 'customer@example.com',
      };

      const response = await api.placeOrder(payload);
      sound.playSuccess();
      setShowRazorpayModal(false);
      onClose();
      onOrderCompleted(response.order);
    } catch (err: any) {
      console.error('Order placement failed:', err);
      setErrorMessage(
        err.data?.message || err.message || 'Failed to place order. Please check ingredient availability.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-900/50 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
        <div
          id="modal-order-summary"
          className="w-full max-w-2xl bg-white border border-stone-200 rounded-3xl overflow-hidden shadow-2xl my-6"
        >
          {/* Header */}
          <div className="p-5 sm:p-6 border-b border-stone-200 flex items-center justify-between bg-stone-50/80">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-700 shadow-xs">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-serif text-xl font-bold text-stone-900">Order Summary & Checkout</h3>
                <p className="text-xs text-stone-500">Review your pizzas and select delivery payment</p>
              </div>
            </div>

            <button
              id="btn-close-summary-modal"
              onClick={onClose}
              className="p-2 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-xl transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Guest Sign In Warning Banner if unauthenticated */}
          {!user && (
            <div className="mx-5 sm:mx-6 mt-4 p-3.5 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2.5 text-stone-800">
                <Lock className="w-4 h-4 text-amber-600 shrink-0" />
                <span>You must be signed in to place and track this order.</span>
              </div>
              <button
                onClick={() => {
                  onClose();
                  onOpenAuth();
                }}
                className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold whitespace-nowrap shadow-xs transition active:scale-95"
              >
                Sign In Now
              </button>
            </div>
          )}

          <div className="p-5 sm:p-6 space-y-6 max-h-[75vh] overflow-y-auto">
            {/* Error banner if any */}
            {errorMessage && (
              <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Free Thermal Delivery Progress Meter */}
            <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 shadow-2xs">
              <div className="flex items-center justify-between text-xs font-bold mb-1.5">
                <span className="text-stone-800 flex items-center gap-1.5">
                  <span>🚀</span>
                  <span>Thermal Wood-Fired Delivery</span>
                </span>
                <span className={subtotal >= 30 ? 'text-emerald-700 font-extrabold' : 'text-amber-800'}>
                  {subtotal >= 30 ? 'Unlocked Free Delivery!' : `$${Math.max(0, 30 - subtotal).toFixed(2)} away from FREE`}
                </span>
              </div>
              <div className="w-full bg-stone-200 h-2 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 rounded-full ${
                    subtotal >= 30 ? 'bg-emerald-500' : 'bg-gradient-to-r from-amber-500 to-orange-500'
                  }`}
                  style={{ width: `${Math.min(100, (subtotal / 30) * 100)}%` }}
                />
              </div>
              <p className="text-[11px] text-stone-500 mt-1">
                {subtotal >= 30
                  ? '🎉 Qualified for complimentary $2.99 thermal box courier delivery.'
                  : 'Orders over $30.00 qualify for free express thermal courier dispatch.'}
              </p>
            </div>

            {/* Items List */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500">
                Selected Pizzas ({items.length})
              </h4>

              {items.length === 0 ? (
                <div className="text-center py-8 bg-stone-50 rounded-2xl border border-stone-200">
                  <p className="text-sm text-stone-500">Your basket is currently empty.</p>
                </div>
              ) : (
                items.map((item) => (
                  <div
                    key={item.id}
                    className="p-4 rounded-2xl bg-stone-50 border border-stone-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-stone-900 text-sm">{item.name}</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-white text-amber-800 border border-stone-200 shadow-2xs">
                          {item.config.size || 'Medium (12")'}
                        </span>
                      </div>

                      {/* Customization ingredients breakdown */}
                      {item.customizationDetails && (
                        <p className="text-[11px] text-stone-600 mt-1 leading-snug">
                          <span className="text-stone-800 font-medium">Crust:</span> {item.customizationDetails.baseName} •{' '}
                          <span className="text-stone-800 font-medium">Sauce:</span> {item.customizationDetails.sauceName} •{' '}
                          <span className="text-stone-800 font-medium">Cheese:</span> {item.customizationDetails.cheeseName}
                          {item.customizationDetails.vegetableNames.length > 0 && (
                            <>
                              {' '}• <span className="text-stone-800 font-medium">Veggies:</span>{' '}
                              {item.customizationDetails.vegetableNames.join(', ')}
                            </>
                          )}
                        </p>
                      )}

                      <span className="text-xs font-bold text-amber-800 mt-1 block">
                        ${(item.unitPrice * item.quantity).toFixed(2)}{' '}
                        <span className="text-[11px] font-normal text-stone-500">
                          (${item.unitPrice.toFixed(2)} ea)
                        </span>
                      </span>
                    </div>

                    {/* Quantity Stepper */}
                    <div className="flex items-center gap-2 self-end sm:self-auto">
                      <div className="flex items-center bg-white border border-stone-200 rounded-xl p-0.5 shadow-2xs">
                        <button
                          onClick={() => {
                            sound.playClick();
                            onUpdateQuantity(item.id, -1);
                          }}
                          className="p-1.5 text-stone-500 hover:text-stone-900 hover:bg-stone-100 rounded-lg transition"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-7 text-center text-xs font-bold text-stone-800">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => {
                            sound.playClick();
                            onUpdateQuantity(item.id, 1);
                          }}
                          className="p-1.5 text-stone-500 hover:text-stone-900 hover:bg-stone-100 rounded-lg transition"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <button
                        onClick={() => {
                          sound.playClick();
                          onRemoveItem(item.id);
                        }}
                        className="p-2 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Delivery Address Form */}
            <div className="space-y-3 bg-stone-50/70 p-4 sm:p-5 rounded-2xl border border-stone-200">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-stone-700 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-amber-600" />
                  <span>Doorstep Delivery Address</span>
                </h4>
                {!user && (
                  <button
                    onClick={onOpenAuth}
                    className="text-[11px] font-bold text-amber-700 hover:underline"
                  >
                    Sign in to prefill
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="text-stone-600 block mb-1">Full Name</label>
                  <input
                    id="input-address-name"
                    type="text"
                    value={address.fullName}
                    onChange={(e) => setAddress({ ...address, fullName: e.target.value })}
                    placeholder="e.g. Alex Johnson"
                    className="w-full px-3 py-2 rounded-xl bg-white border border-stone-200 text-stone-900 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="text-stone-600 block mb-1">Contact Phone</label>
                  <input
                    id="input-address-phone"
                    type="text"
                    value={address.phone}
                    onChange={(e) => setAddress({ ...address, phone: e.target.value })}
                    placeholder="e.g. +1 (555) 345-6789"
                    className="w-full px-3 py-2 rounded-xl bg-white border border-stone-200 text-stone-900 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-stone-600 block mb-1">Street Address</label>
                  <input
                    id="input-address-street"
                    type="text"
                    value={address.streetAddress}
                    onChange={(e) => setAddress({ ...address, streetAddress: e.target.value })}
                    placeholder="e.g. 428 Mulberry Street, Apt 3B"
                    className="w-full px-3 py-2 rounded-xl bg-white border border-stone-200 text-stone-900 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="text-stone-600 block mb-1">City</label>
                  <input
                    id="input-address-city"
                    type="text"
                    value={address.city}
                    onChange={(e) => setAddress({ ...address, city: e.target.value })}
                    placeholder="e.g. New York"
                    className="w-full px-3 py-2 rounded-xl bg-white border border-stone-200 text-stone-900 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="text-stone-600 block mb-1">Delivery Instructions (Optional)</label>
                  <input
                    id="input-address-notes"
                    type="text"
                    value={address.deliveryNotes}
                    onChange={(e) => setAddress({ ...address, deliveryNotes: e.target.value })}
                    placeholder="e.g. Ring bell, leave on doorstep"
                    className="w-full px-3 py-2 rounded-xl bg-white border border-stone-200 text-stone-900 focus:outline-none focus:border-amber-500"
                  />
                  {/* Quick Instruction Pills */}
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {[
                      { label: 'Ring Doorbell 🔔', note: 'Please ring the doorbell upon arrival.' },
                      { label: 'Leave on Doorstep 🚪', note: 'Leave package gently on front doorstep.' },
                      { label: 'Call Upon Arrival 📞', note: 'Please call when arriving at the gate/door.' },
                      { label: 'Contactless 🛡️', note: 'Contactless drop-off requested.' },
                    ].map((pill) => (
                      <button
                        key={pill.label}
                        type="button"
                        onClick={() => {
                          sound.playClick();
                          const current = address.deliveryNotes ? `${address.deliveryNotes} ` : '';
                          setAddress({ ...address, deliveryNotes: `${current}${pill.note}`.trim() });
                        }}
                        className="text-[10px] font-semibold px-2 py-1 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 transition"
                      >
                        + {pill.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Promo Code Input */}
            <div className="p-4 rounded-2xl bg-stone-50/70 border border-stone-200 space-y-2">
              <div className="flex items-center gap-2">
                <Tag className="w-4 h-4 text-amber-600 shrink-0" />
                <input
                  id="input-promo-code"
                  type="text"
                  value={discountCodeInput}
                  onChange={(e) => setDiscountCodeInput(e.target.value)}
                  placeholder="Enter coupon (e.g. PIZZA20 or FIRSTBITE)"
                  className="flex-1 uppercase bg-white border border-stone-200 rounded-xl px-3 py-2 text-xs font-mono text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-amber-500"
                />
                <button
                  id="btn-apply-promo"
                  onClick={handleApplyPromo}
                  className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold rounded-xl border border-stone-200 transition"
                >
                  Apply
                </button>
              </div>

              {/* 1-Click Available Coupon Chips */}
              <div className="flex items-center gap-2 pt-1">
                <span className="text-[10px] text-stone-500 font-bold uppercase tracking-wider">Quick Promo:</span>
                <button
                  type="button"
                  id="chip-promo-pizza20"
                  onClick={() => applyCouponDirect('PIZZA20')}
                  className="px-2 py-0.5 rounded-lg bg-amber-100 hover:bg-amber-200 border border-amber-300 text-amber-900 text-[10px] font-bold transition flex items-center gap-1"
                >
                  <span>🏷️ PIZZA20 (20% Off)</span>
                </button>
                <button
                  type="button"
                  id="chip-promo-firstbite"
                  onClick={() => applyCouponDirect('FIRSTBITE')}
                  className="px-2 py-0.5 rounded-lg bg-emerald-100 hover:bg-emerald-200 border border-emerald-300 text-emerald-900 text-[10px] font-bold transition flex items-center gap-1"
                >
                  <span>🎁 FIRSTBITE ($5 Off)</span>
                </button>
              </div>

              {promoMessage && (
                <p className="text-[11px] text-amber-700 font-medium">{promoMessage}</p>
              )}
            </div>

            {/* Payment Method Selector */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500">
                Payment Option
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Razorpay Test Gateway */}
                <div
                  id="opt-payment-razorpay"
                  onClick={() => {
                    sound.playClick();
                    setPaymentMethod('razorpay');
                  }}
                  className={`p-4 rounded-2xl border cursor-pointer transition flex items-start gap-3 ${
                    paymentMethod === 'razorpay'
                      ? 'border-blue-500 bg-blue-50/70 shadow-xs ring-1 ring-blue-400'
                      : 'border-stone-200 bg-white hover:border-stone-300'
                  }`}
                >
                  <div className="w-8 h-8 rounded-lg bg-[#0b72e7] flex items-center justify-center text-white shrink-0 font-bold shadow-xs">
                    ₹
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-stone-900 text-xs">Razorpay Test Gateway</span>
                      <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-blue-100 text-blue-800 border border-blue-200">
                        Cards/UPI
                      </span>
                    </div>
                    <p className="text-[11px] text-stone-600 mt-0.5">
                      Test Cards, Netbanking & UPI simulation with instant success confirmation.
                    </p>
                  </div>
                </div>

                {/* Cash on Delivery (COD) */}
                <div
                  id="opt-payment-cod"
                  onClick={() => {
                    sound.playClick();
                    setPaymentMethod('cod');
                  }}
                  className={`p-4 rounded-2xl border cursor-pointer transition flex items-start gap-3 ${
                    paymentMethod === 'cod'
                      ? 'border-amber-500 bg-amber-50/70 shadow-xs ring-1 ring-amber-400'
                      : 'border-stone-200 bg-white hover:border-stone-300'
                  }`}
                >
                  <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center text-stone-950 shrink-0 shadow-xs">
                    <Banknote className="w-5 h-5 text-stone-950" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-stone-900 text-xs">Cash on Delivery (COD)</span>
                      <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 border border-emerald-200">
                        Doorstep
                      </span>
                    </div>
                    <p className="text-[11px] text-stone-600 mt-0.5">
                      Pay via cash or doorstep QR code upon fresh pizza delivery.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Cost Breakdown */}
            <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-2 text-xs">
              <div className="flex justify-between text-stone-600">
                <span>Pizzas Subtotal:</span>
                <span className="text-stone-900 font-semibold">${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-stone-600">
                <span>Thermal Delivery:</span>
                <span className="text-stone-900 font-semibold">
                  {deliveryFee === 0 ? <span className="text-emerald-700 font-bold">FREE ($30+ Order)</span> : `$${deliveryFee.toFixed(2)}`}
                </span>
              </div>
              <div className="flex justify-between text-stone-600">
                <span>State Food Tax (5%):</span>
                <span className="text-stone-900 font-semibold">${tax.toFixed(2)}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-emerald-700 font-semibold">
                  <span>Coupon Discount ({appliedCode}):</span>
                  <span>-${discountAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="border-t border-stone-200 pt-2 flex justify-between items-baseline">
                <span className="text-sm font-bold text-stone-900">Total Payable:</span>
                <span className="font-serif text-2xl font-black text-amber-800">
                  ${totalPayable.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Footer Checkout Action */}
          <div className="p-5 sm:p-6 border-t border-stone-200 bg-stone-50/80 flex items-center justify-between">
            <div>
              <p className="text-[11px] text-stone-500">Estimated Delivery</p>
              <p className="text-xs font-bold text-emerald-700">~30-35 Mins (Wood-Fired)</p>
            </div>

            {!user ? (
              <button
                id="btn-confirm-place-order"
                onClick={() => {
                  onClose();
                  onOpenAuth();
                }}
                className="py-3 px-6 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-extrabold text-sm flex items-center gap-2 shadow-md shadow-amber-500/20 transition active:scale-[0.99]"
              >
                <Lock className="w-4 h-4" />
                <span>Sign In to Complete Order (${totalPayable.toFixed(2)})</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                id="btn-confirm-place-order"
                disabled={isSubmitting || items.length === 0}
                onClick={handleInitiateCheckout}
                className="py-3 px-6 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-stone-950 font-extrabold text-sm flex items-center gap-2 shadow-md shadow-amber-500/20 transition active:scale-[0.99] disabled:opacity-50"
              >
                {isSubmitting ? (
                  <span>Confirming Order...</span>
                ) : paymentMethod === 'razorpay' ? (
                  <>
                    <CreditCard className="w-4 h-4" />
                    <span>Proceed to Razorpay (${totalPayable.toFixed(2)})</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                ) : (
                  <>
                    <Banknote className="w-4 h-4" />
                    <span>Place Cash on Delivery Order (${totalPayable.toFixed(2)})</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Razorpay Test Modal */}
      {showRazorpayModal && (
        <RazorpayModal
          isOpen={showRazorpayModal}
          onClose={() => setShowRazorpayModal(false)}
          amount={totalPayable}
          orderNumber={tempOrderNumber}
          customerName={address.fullName}
          customerEmail={user?.email || 'customer@example.com'}
          onPaymentSuccess={(details) => executePlaceOrder('razorpay', details)}
        />
      )}
    </>
  );
};
