import React, { useState } from 'react';
import { Shield, CreditCard, Smartphone, Building2, CheckCircle2, X } from 'lucide-react';
import confetti from 'canvas-confetti';
import { sound } from '../utils/audio';

interface RazorpayModalProps {
  isOpen: boolean;
  onClose: () => void;
  amount: number;
  currency?: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  onPaymentSuccess: (paymentDetails: {
    razorpayPaymentId: string;
    razorpayOrderId: string;
    razorpaySignature: string;
  }) => void;
}

export const RazorpayModal: React.FC<RazorpayModalProps> = ({
  isOpen,
  onClose,
  amount,
  currency = 'INR',
  orderNumber,
  customerName,
  customerEmail,
  onPaymentSuccess,
}) => {
  const [activeTab, setActiveTab] = useState<'card' | 'upi' | 'netbanking'>('card');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  if (!isOpen) return null;

  // In standard test mode, conversion for INR representation:
  // e.g. if amount is $16.50, INR equivalent approx ₹1,350 or display direct
  const displayInr = Math.round(amount * 83);

  const handleSimulateSuccess = () => {
    sound.playClick();
    setIsProcessing(true);

    setTimeout(() => {
      sound.playSuccess();
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch {}

      const simulatedPaymentId = `pay_test_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const simulatedOrderId = `order_rzp_${Date.now()}`;
      const simulatedSignature = `sig_${Math.random().toString(36).substring(2, 12)}`;

      setIsProcessing(false);
      onPaymentSuccess({
        razorpayPaymentId: simulatedPaymentId,
        razorpayOrderId: simulatedOrderId,
        razorpaySignature: simulatedSignature,
      });
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        id="modal-razorpay-checkout"
        className="w-full max-w-md bg-white border border-stone-200 rounded-3xl overflow-hidden shadow-2xl relative"
      >
        {/* Razorpay Gateway Header */}
        <div className="bg-[#0c2340] text-white p-5 border-b border-blue-900/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#0b72e7] flex items-center justify-center font-bold text-white shadow-xs">
              ₹
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base tracking-wide text-white">RAZORPAY</span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  TEST MODE
                </span>
              </div>
              <p className="text-xs text-blue-200/70">PizzaCraft Artisan Kitchen</p>
            </div>
          </div>

          <button
            onClick={onClose}
            disabled={isProcessing}
            className="p-1.5 rounded-lg text-blue-300 hover:text-white hover:bg-blue-900/60 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Order Price Header */}
        <div className="bg-stone-50 px-6 py-4 border-b border-stone-200 flex items-center justify-between">
          <div>
            <p className="text-xs text-stone-500">Order Reference</p>
            <p className="text-sm font-mono font-bold text-stone-900">{orderNumber}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-stone-500">Total Payable</p>
            <p className="text-xl font-extrabold text-amber-800">
              ${amount.toFixed(2)}{' '}
              <span className="text-xs font-normal text-stone-500">(≈ ₹{displayInr.toLocaleString()})</span>
            </p>
          </div>
        </div>

        {/* Payment Method Selector Tabs */}
        <div className="p-6 space-y-5">
          <div className="grid grid-cols-3 gap-2 p-1 bg-stone-100 rounded-xl border border-stone-200 text-xs font-bold">
            <button
              onClick={() => setActiveTab('card')}
              className={`py-2 rounded-lg transition flex items-center justify-center gap-1.5 ${
                activeTab === 'card' ? 'bg-white text-stone-900 shadow-xs border border-stone-200' : 'text-stone-500'
              }`}
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>Card</span>
            </button>
            <button
              onClick={() => setActiveTab('upi')}
              className={`py-2 rounded-lg transition flex items-center justify-center gap-1.5 ${
                activeTab === 'upi' ? 'bg-white text-stone-900 shadow-xs border border-stone-200' : 'text-stone-500'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>UPI / QR</span>
            </button>
            <button
              onClick={() => setActiveTab('netbanking')}
              className={`py-2 rounded-lg transition flex items-center justify-center gap-1.5 ${
                activeTab === 'netbanking' ? 'bg-white text-stone-900 shadow-xs border border-stone-200' : 'text-stone-500'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>NetBanking</span>
            </button>
          </div>

          {/* Test Card View */}
          {activeTab === 'card' && (
            <div className="space-y-3 bg-stone-50 p-4 rounded-2xl border border-stone-200">
              <div className="flex items-center justify-between text-xs text-stone-600">
                <span>Test Card Number</span>
                <span className="font-mono text-amber-800 font-bold">4111 •••• •••• 1111</span>
              </div>
              <div className="p-2.5 rounded-lg bg-white border border-stone-200 text-xs font-mono text-stone-800 shadow-2xs">
                4111 2222 3333 1111 (Visa Sandbox)
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-stone-500">Expiry</span>
                  <div className="p-2 rounded bg-white border border-stone-200 font-mono text-stone-800 shadow-2xs">
                    12 / 28
                  </div>
                </div>
                <div>
                  <span className="text-stone-500">CVV</span>
                  <div className="p-2 rounded bg-white border border-stone-200 font-mono text-stone-800 shadow-2xs">
                    789
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Test UPI View */}
          {activeTab === 'upi' && (
            <div className="space-y-3 text-center bg-stone-50 p-4 rounded-2xl border border-stone-200">
              <div className="inline-block p-3 bg-white rounded-xl shadow-xs border border-stone-200">
                <div className="w-32 h-32 border-2 border-dashed border-stone-300 rounded-lg flex items-center justify-center text-stone-600 font-mono text-xs font-bold">
                  [RAZORPAY TEST QR]
                </div>
              </div>
              <p className="text-xs text-stone-500">Scan using any test UPI app or confirm below</p>
            </div>
          )}

          {/* Test Netbanking View */}
          {activeTab === 'netbanking' && (
            <div className="grid grid-cols-2 gap-2 text-xs font-medium">
              {['HDFC Bank (Test)', 'ICICI Bank (Test)', 'SBI (Test)', 'Axis Bank (Test)'].map((b) => (
                <div
                  key={b}
                  className="p-3 rounded-xl border border-stone-200 bg-white hover:border-blue-400 hover:bg-blue-50/50 text-stone-700 cursor-pointer text-center transition"
                >
                  {b}
                </div>
              ))}
            </div>
          )}

          {/* Requirement explicit test confirmation button */}
          <div className="pt-2 space-y-2">
            <button
              id="btn-razorpay-success"
              onClick={handleSimulateSuccess}
              disabled={isProcessing}
              className="w-full py-3.5 px-4 rounded-2xl bg-[#0b72e7] hover:bg-[#0960c4] text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-md shadow-blue-500/25 transition active:scale-[0.99] disabled:opacity-50"
            >
              {isProcessing ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Processing Test Payment...</span>
                </div>
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5" />
                  <span>Pay & Confirm Order (Success)</span>
                </>
              )}
            </button>

            <div className="flex items-center justify-center gap-1.5 text-[11px] text-stone-500 text-center">
              <Shield className="w-3.5 h-3.5 text-emerald-600" />
              <span>Razorpay Standard Test Environment • Safe Sandbox</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
