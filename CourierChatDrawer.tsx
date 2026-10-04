import React, { useState, useEffect, useRef } from 'react';
import { Bike, X, Send, PhoneCall, Check, Sparkles } from 'lucide-react';
import { realtime } from '../utils/realtime';
import { sound } from '../utils/audio';
import type { CourierChatMessage, Order } from '../types';

interface CourierChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order;
}

export const CourierChatDrawer: React.FC<CourierChatDrawerProps> = ({ isOpen, onClose, order }) => {
  const [messages, setMessages] = useState<CourierChatMessage[]>([
    {
      id: 'init-1',
      orderId: order.id,
      sender: 'courier',
      senderName: 'Courier Marco Rossi (Vespa #12)',
      message: `Ciao ${order.customerName}! I have your order #${order.orderNumber} safely packed in the 165°F insulated thermal vault. Feel free to send gate codes or drop-off preferences!`,
      timestamp: new Date().toISOString(),
    },
  ]);
  const [input, setInput] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    // Subscribe to realtime courier message broadcast
    const unsub = realtime.on('courier:message_received', (data: { chat: CourierChatMessage }) => {
      if (data?.chat && data.chat.orderId === order.id) {
        sound.playSuccess();
        setMessages((prev) => {
          // Avoid duplicate messages
          if (prev.some((m) => m.id === data.chat.id)) return prev;
          return [...prev, data.chat];
        });
      }
    });

    return () => unsub();
  }, [isOpen, order.id]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen]);

  const handleSendMessage = (msgToSend?: string) => {
    const text = (msgToSend || input).trim();
    if (!text) return;

    sound.playClick();
    realtime.sendCourierMessage(order.id, text, order.customerName || 'Customer');
    setInput('');
  };

  const quickReplies = [
    'Please leave at doorstep',
    'Ring doorbell when you arrive',
    'Call my phone if gate is locked',
    'Thank you so much!',
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl border border-stone-200 shadow-2xl max-w-lg w-full h-[580px] flex flex-col overflow-hidden relative">
        {/* Header */}
        <div className="bg-stone-900 text-white px-6 py-4 flex items-center justify-between shrink-0 border-b border-stone-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500 text-stone-950 flex items-center justify-center shadow-md">
              <Bike className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-bold text-sm text-stone-100">Courier Marco Rossi</h4>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              </div>
              <p className="text-xs text-stone-400 font-mono">
                Order #{order.orderNumber} • Vespa #12
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-stone-300 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Message Log */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3 bg-[#faf8f5]">
          {messages.map((m) => {
            const isMe = m.sender === 'customer';
            return (
              <div
                key={m.id}
                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
              >
                <span className="text-[10px] text-stone-500 mb-1 px-1 font-mono">
                  {m.senderName} • {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
                <div
                  className={`p-3.5 rounded-2xl text-xs sm:text-sm max-w-[85%] leading-relaxed shadow-xs ${
                    isMe
                      ? 'bg-amber-500 text-stone-950 font-bold rounded-tr-none'
                      : 'bg-white border border-stone-200 text-stone-800 font-medium rounded-tl-none'
                  }`}
                >
                  {m.message}
                </div>
              </div>
            );
          })}
          <div ref={chatEndRef} />
        </div>

        {/* Quick Suggestion Pills */}
        <div className="px-4 py-2 bg-stone-50 border-t border-stone-200 flex gap-2 overflow-x-auto no-scrollbar shrink-0">
          {quickReplies.map((r, i) => (
            <button
              key={i}
              onClick={() => handleSendMessage(r)}
              className="text-[11px] whitespace-nowrap px-3 py-1 rounded-xl bg-white border border-stone-200 hover:border-amber-400 hover:bg-amber-50 text-stone-700 transition shrink-0"
            >
              {r}
            </button>
          ))}
        </div>

        {/* Message Input */}
        <div className="p-4 bg-white border-t border-stone-200 flex items-center gap-2 shrink-0">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="Type a message to Courier Marco..."
            className="flex-1 px-4 py-2.5 rounded-xl border border-stone-200 bg-stone-50 text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-500 text-stone-900"
          />
          <button
            onClick={() => handleSendMessage()}
            disabled={!input.trim()}
            className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-bold transition disabled:opacity-50 flex items-center gap-1.5 shadow-xs"
          >
            <span>Send</span>
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
