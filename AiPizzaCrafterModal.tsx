import React, { useState } from 'react';
import { Sparkles, X, Flame, ChefHat, GlassWater, Heart, Check, ArrowRight, ShoppingBag, Wand2 } from 'lucide-react';
import { api } from '../api';
import { sound } from '../utils/audio';
import type { AiPizzaRecipe, CustomPizzaConfig, OrderItem, InventoryItem } from '../types';

interface AiPizzaCrafterModalProps {
  isOpen: boolean;
  onClose: () => void;
  inventory: {
    bases: InventoryItem[];
    sauces: InventoryItem[];
    cheeses: InventoryItem[];
    vegetables: InventoryItem[];
  };
  onLoadIntoBuilder: (config: CustomPizzaConfig, name: string) => void;
  onAddToCart: (item: OrderItem) => void;
}

export const AiPizzaCrafterModal: React.FC<AiPizzaCrafterModalProps> = ({
  isOpen,
  onClose,
  inventory,
  onLoadIntoBuilder,
  onAddToCart,
}) => {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [recipe, setRecipe] = useState<AiPizzaRecipe | null>(null);

  const presets = [
    { label: '🔥 Fiery Umami Bomb', prompt: 'Intensely spicy with chili crunch and aged sharp cheese' },
    { label: '🍷 Romantic Date Night', prompt: 'Earthy white sauce with decadent cheese and subtle garlic' },
    { label: '💪 High Protein Fitness', prompt: 'High protein pizza with lots of vegetables and wholesome crust' },
    { label: '🌿 Mediterranean Harvest', prompt: 'Fresh basil pesto with kalamata olives and sun-dried tomatoes' },
    { label: '🧀 Supreme Cheese Overload', prompt: 'Triple cheese melt with crispy crust and rich sauce' },
  ];

  const handleGenerate = async (queryText?: string) => {
    const text = (queryText || prompt).trim();
    if (!text || loading) return;

    sound.playClick();
    setLoading(true);
    try {
      const res = await api.aiCraftPizza(text);
      if (res.success && res.data) {
        sound.playSuccess();
        setRecipe(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getIngredientName = (id: string, category: 'bases' | 'sauces' | 'cheeses' | 'vegetables') => {
    return inventory[category].find((i) => i.id === id)?.name || id;
  };

  const handleApplyToBuilder = () => {
    if (!recipe) return;
    sound.playClick();
    onLoadIntoBuilder(
      {
        baseId: recipe.baseId,
        sauceId: recipe.sauceId,
        cheeseId: recipe.cheeseId,
        vegetableIds: recipe.vegetableIds,
        size: 'Medium (12")',
      },
      recipe.name
    );
    onClose();
  };

  const handleDirectAddToCart = () => {
    if (!recipe) return;
    sound.playSuccess();
    const baseItem = inventory.bases.find((b) => b.id === recipe.baseId);
    const sauceItem = inventory.sauces.find((s) => s.id === recipe.sauceId);
    const cheeseItem = inventory.cheeses.find((c) => c.id === recipe.cheeseId);
    const vegItems = inventory.vegetables.filter((v) => recipe.vegetableIds.includes(v.id));

    const price =
      (baseItem?.price || 8) +
      (sauceItem?.price || 1.5) +
      (cheeseItem?.price || 2.5) +
      vegItems.reduce((acc, v) => acc + v.price, 0);

    const orderItem: OrderItem = {
      id: `ai-order-${Date.now()}`,
      type: 'custom',
      name: recipe.name,
      quantity: 1,
      unitPrice: Math.round(price * 100) / 100,
      totalPrice: Math.round(price * 100) / 100,
      config: {
        baseId: recipe.baseId,
        sauceId: recipe.sauceId,
        cheeseId: recipe.cheeseId,
        vegetableIds: recipe.vegetableIds,
        size: 'Medium (12")',
      },
      customizationDetails: {
        baseName: baseItem?.name || 'Artisan Base',
        sauceName: sauceItem?.name || 'Gourmet Sauce',
        cheeseName: cheeseItem?.name || 'Fresh Cheese',
        vegetableNames: vegItems.map((v) => v.name),
      },
    };

    onAddToCart(orderItem);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl border border-stone-200 shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden relative">
        {/* Header */}
        <div className="bg-gradient-to-r from-stone-900 via-stone-850 to-stone-900 text-white px-6 py-5 flex items-center justify-between shrink-0 border-b border-stone-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500 text-stone-950 flex items-center justify-center shadow-md">
              <Sparkles className="w-5 h-5 fill-stone-950" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-serif font-bold text-lg text-white">AI Maestro Pizza Crafter</h3>
                <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-bold uppercase tracking-wider border border-amber-500/30">
                  Gemini Flash 3.8
                </span>
              </div>
              <p className="text-xs text-stone-300">
                Describe your mood or craving, and AI will configure the ideal culinary recipe from our pantry.
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

        {/* Content body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-[#faf8f5]">
          {/* Prompt Input Box */}
          <div className="bg-white rounded-2xl p-4 border border-stone-200 shadow-2xs space-y-3">
            <label className="text-xs font-bold uppercase tracking-wider text-stone-600 block">
              What are you craving today?
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
                placeholder="e.g. Crispy spicy with caramelized onions and double cheese..."
                disabled={loading}
                className="flex-1 px-4 py-2.5 rounded-xl border border-stone-200 bg-stone-50 text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-500 text-stone-900"
              />
              <button
                onClick={() => handleGenerate()}
                disabled={!prompt.trim() || loading}
                className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs transition disabled:opacity-50 flex items-center gap-2 shadow-xs shrink-0"
              >
                {loading ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-stone-950 border-t-transparent rounded-full animate-spin" />
                    <span>Crafting...</span>
                  </>
                ) : (
                  <>
                    <Wand2 className="w-4 h-4" />
                    <span>Generate</span>
                  </>
                )}
              </button>
            </div>

            {/* Quick Inspiration Chips */}
            <div className="pt-2 border-t border-stone-100 flex flex-wrap gap-2">
              <span className="text-[10px] uppercase font-bold text-stone-400 self-center">Try:</span>
              {presets.map((p, idx) => (
                <button
                  key={idx}
                  disabled={loading}
                  onClick={() => {
                    setPrompt(p.prompt);
                    handleGenerate(p.prompt);
                  }}
                  className="text-[11px] px-3 py-1 rounded-xl bg-stone-100 hover:bg-amber-100 hover:text-amber-950 text-stone-700 transition font-medium"
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* AI Recipe Card Output */}
          {recipe && (
            <div className="bg-white border-2 border-amber-400/80 rounded-3xl p-6 shadow-md space-y-5 animate-in slide-in-from-bottom-3 duration-300">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xl">🍕</span>
                    <h4 className="font-serif font-bold text-xl text-stone-900">{recipe.name}</h4>
                  </div>
                  <p className="text-xs text-amber-700 font-semibold mt-0.5">{recipe.tagline}</p>
                </div>

                <div className="flex items-center gap-2">
                  <div className="px-3 py-1.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-center">
                    <span className="text-[10px] uppercase font-bold text-amber-600 block leading-tight">
                      Flavor Harmony
                    </span>
                    <span className="text-sm font-extrabold">{recipe.flavorHarmonyScore}%</span>
                  </div>
                  <div className="px-3 py-1.5 rounded-2xl bg-stone-100 border border-stone-200 text-stone-800 text-center">
                    <span className="text-[10px] uppercase font-bold text-stone-500 block leading-tight">
                      Calories / Slice
                    </span>
                    <span className="text-sm font-extrabold">{recipe.estimatedCalories} kcal</span>
                  </div>
                </div>
              </div>

              <p className="text-xs text-stone-600 leading-relaxed italic">{recipe.description}</p>

              {/* Recipe Ingredients Breakdown */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-stone-50 rounded-2xl p-4 border border-stone-200 text-xs">
                <div>
                  <span className="text-[10px] uppercase font-bold text-stone-500 block">Crust Base</span>
                  <span className="font-bold text-stone-900">
                    {getIngredientName(recipe.baseId, 'bases')}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-stone-500 block">Artisan Sauce</span>
                  <span className="font-bold text-stone-900">
                    {getIngredientName(recipe.sauceId, 'sauces')}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-stone-500 block">Melted Cheese</span>
                  <span className="font-bold text-stone-900">
                    {getIngredientName(recipe.cheeseId, 'cheeses')}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-stone-500 block">Toppings</span>
                  <span className="font-bold text-stone-900">
                    {recipe.vegetableIds
                      .map((id) => getIngredientName(id, 'vegetables'))
                      .join(', ') || 'Classic Pure'}
                  </span>
                </div>
              </div>

              {/* Tasting & Sommelier Notes */}
              <div className="space-y-3 pt-1">
                <div className="flex items-start gap-2.5 text-xs text-stone-700 bg-amber-50/60 p-3 rounded-xl border border-amber-200">
                  <ChefHat className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-stone-900">Pizzaiolo Tasting Notes: </strong>
                    <span>{recipe.tastingNotes}</span>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 text-xs text-stone-700 bg-emerald-50/60 p-3 rounded-xl border border-emerald-200">
                  <GlassWater className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-stone-900">Sommelier Pairing: </strong>
                    <span>{recipe.beveragePairing}</span>
                  </div>
                </div>
              </div>

              {/* Macros pills */}
              <div className="flex items-center gap-4 text-xs font-mono text-stone-600 pt-1 border-t border-stone-100">
                <span>Protein: <strong className="text-stone-900">{recipe.macros.proteinGrams}g</strong></span>
                <span>•</span>
                <span>Carbs: <strong className="text-stone-900">{recipe.macros.carbsGrams}g</strong></span>
                <span>•</span>
                <span>Fats: <strong className="text-stone-900">{recipe.macros.fatsGrams}g</strong></span>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                <button
                  onClick={handleApplyToBuilder}
                  className="w-full sm:flex-1 py-3 px-4 rounded-xl border-2 border-stone-900 text-stone-900 hover:bg-stone-900 hover:text-white font-bold text-xs transition flex items-center justify-center gap-2"
                >
                  <span>Customize in Builder</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  onClick={handleDirectAddToCart}
                  className="w-full sm:flex-1 py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs transition flex items-center justify-center gap-2 shadow-xs"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>Add Directly to Cart</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
