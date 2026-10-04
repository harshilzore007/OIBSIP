import React, { useState, useEffect, useRef } from 'react';
import { ChefHat, X, Send, Sparkles, MessageSquare, Flame, CheckCircle, ArrowRight, RefreshCw } from 'lucide-react';
import { api } from '../api';
import { sound } from '../utils/audio';
import type { CustomPizzaConfig } from '../types';

interface ChefLuigiModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyRecipe?: (config: CustomPizzaConfig, name: string) => void;
  onOpenBuilder?: () => void;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export const ChefLuigiModal: React.FC<ChefLuigiModalProps> = ({
  isOpen,
  onClose,
  onApplyRecipe,
  onOpenBuilder,
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content:
        'Ciao! I am Maestro Luigi, your 3rd-generation Neapolitan Pizzaiolo at PizzaCraft! Ask me for pairing advice, dietary suggestions, allergen details, or tell me what flavor profile you are craving today! Mamma Mia, let us craft something magnificent! 🍕✨',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const suggestedPrompts = [
    'What is your healthiest high-protein pizza?',
    'I want a spicy pizza with lots of crunch!',
    'What pairs best with San Marzano & Burrata?',
    'Do you have vegan and gluten-free options?',
    'What wine goes with smoky chipotle BBQ?',
  ];

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || input).trim();
    if (!query || loading) return;

    sound.playClick();
    const updatedMessages: Message[] = [...messages, { role: 'user', content: query }];
    setMessages(updatedMessages);
    setInput('');
    setLoading(true);

    try {
      const res = await api.aiChatLuigi(updatedMessages);
      sound.playSuccess();
      setMessages([...updatedMessages, { role: 'assistant', content: res.reply }]);
    } catch (err) {
      console.error(err);
      setMessages([
        ...updatedMessages,
        {
          role: 'assistant',
          content: 'Mamma mia! My stone hearth is sizzling hot right now. Try our Classic Hand Tossed with San Marzano tomatoes and Fior di Latte—you can never go wrong with Italian royalty!',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl border border-stone-200 shadow-2xl max-w-xl w-full h-[620px] flex flex-col overflow-hidden relative">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 text-stone-950 px-6 py-4 flex items-center justify-between shrink-0 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-stone-950 text-amber-400 flex items-center justify-center shadow-md">
              <ChefHat className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-serif font-black text-lg text-stone-950">Maestro Luigi AI</h3>
                <span className="px-2 py-0.5 rounded-full bg-stone-950/15 text-stone-950 text-[10px] font-extrabold uppercase tracking-wider">
                  Gemini Powered
                </span>
              </div>
              <p className="text-xs text-stone-900/80 font-medium">
                Executive Neapolitan Pizzaiolo & Sommelier
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="p-2 rounded-xl bg-black/10 hover:bg-black/20 text-stone-950 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Chat message history */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-[#fcfbf9]">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex items-start gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.role === 'assistant' && (
                <div className="w-8 h-8 rounded-xl bg-amber-500 text-stone-950 flex items-center justify-center shrink-0 shadow-xs mt-1">
                  <ChefHat className="w-4 h-4" />
                </div>
              )}
              <div
                className={`max-w-[85%] rounded-2xl p-4 text-xs sm:text-sm leading-relaxed shadow-xs ${
                  msg.role === 'user'
                    ? 'bg-stone-900 text-white rounded-tr-none'
                    : 'bg-white border border-stone-200 text-stone-800 rounded-tl-none font-medium'
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-amber-500 text-stone-950 flex items-center justify-center shrink-0 shadow-xs">
                <ChefHat className="w-4 h-4 animate-bounce" />
              </div>
              <div className="bg-white border border-stone-200 rounded-2xl rounded-tl-none p-4 text-xs text-stone-500 flex items-center gap-2 shadow-xs">
                <div className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                <span>Chef Luigi is consulting the Neapolitan archives...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Suggested Quick Prompts */}
        <div className="px-4 py-2 bg-stone-50 border-t border-stone-200 overflow-x-auto flex items-center gap-2 no-scrollbar">
          <span className="text-[10px] uppercase font-bold text-stone-500 shrink-0">Ask Luigi:</span>
          {suggestedPrompts.map((prompt, idx) => (
            <button
              key={idx}
              disabled={loading}
              onClick={() => handleSendMessage(prompt)}
              className="text-[11px] whitespace-nowrap px-3 py-1 rounded-xl bg-white border border-stone-200 hover:border-amber-400 hover:bg-amber-50 text-stone-700 transition shrink-0 font-medium"
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="p-4 bg-white border-t border-stone-200 flex items-center gap-2 shrink-0">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="Ask Chef Luigi about pizza combos, wine, calories..."
            disabled={loading}
            className="flex-1 px-4 py-2.5 rounded-xl border border-stone-200 bg-stone-50 text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-500 text-stone-900 placeholder:text-stone-400"
          />
          <button
            onClick={() => handleSendMessage()}
            disabled={!input.trim() || loading}
            className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-bold transition disabled:opacity-50 flex items-center gap-1.5 shadow-xs"
          >
            <span>Ask</span>
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
