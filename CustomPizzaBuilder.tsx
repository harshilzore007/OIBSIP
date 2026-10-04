import React, { useState, useEffect } from 'react';
import {
  Check,
  Sparkles,
  ShoppingBag,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  Lock,
  Dices,
  RotateCcw,
  ChefHat,
  Flame,
  Wand2,
  GlassWater,
  Activity,
  Layers,
} from 'lucide-react';
import type { InventoryItem, CustomPizzaConfig, OrderItem, User, AiFlavorAnalysis } from '../types';
import { PizzaVisualizer } from './PizzaVisualizer';
import { AiPizzaCrafterModal } from './AiPizzaCrafterModal';
import { sound } from '../utils/audio';
import { api } from '../api';

interface CustomPizzaBuilderProps {
  inventory: {
    bases: InventoryItem[];
    sauces: InventoryItem[];
    cheeses: InventoryItem[];
    vegetables: InventoryItem[];
  };
  initialConfig?: CustomPizzaConfig;
  onAddToCart: (item: OrderItem) => void;
  user: User | null;
  onRequireAuth?: (item?: OrderItem, customNotice?: string) => void;
}

export const CustomPizzaBuilder: React.FC<CustomPizzaBuilderProps> = ({
  inventory,
  initialConfig,
  onAddToCart,
  user,
  onRequireAuth,
}) => {
  const [currentStep, setCurrentStep] = useState<number>(1);

  // Configuration state with smart fallbacks
  const defaultBase = inventory.bases[0]?.id || 'base-classic';
  const defaultSauce = inventory.sauces[0]?.id || 'sauce-san-marzano';
  const defaultCheese = inventory.cheeses[0]?.id || 'cheese-mozzarella';

  const [selectedBaseId, setSelectedBaseId] = useState<string>(
    initialConfig?.baseId || defaultBase
  );
  const [selectedSauceId, setSelectedSauceId] = useState<string>(
    initialConfig?.sauceId || defaultSauce
  );
  const [selectedCheeseId, setSelectedCheeseId] = useState<string>(
    initialConfig?.cheeseId || defaultCheese
  );
  const [cheeseTier, setCheeseTier] = useState<'standard' | 'double'>('standard');
  const [selectedVegIds, setSelectedVegIds] = useState<string[]>(
    initialConfig?.vegetableIds || []
  );
  const [vegLimitWarning, setVegLimitWarning] = useState<boolean>(false);
  const [pizzaSize, setPizzaSize] = useState<'Regular (10")' | 'Medium (12")' | 'Large (14")'>(
    initialConfig?.size || 'Medium (12")'
  );

  const [pizzaName, setPizzaName] = useState<string>('My Custom Artisan Creation');

  // AI Crafter Modal State
  const [isAiCrafterOpen, setIsAiCrafterOpen] = useState(false);

  // AI Flavor Sommelier State
  const [flavorAnalysis, setFlavorAnalysis] = useState<AiFlavorAnalysis | null>(null);
  const [isAnalyzingFlavor, setIsAnalyzingFlavor] = useState(false);

  // Selected item references
  const currentBase = inventory.bases.find((b) => b.id === selectedBaseId) || inventory.bases[0];
  const currentSauce = inventory.sauces.find((s) => s.id === selectedSauceId) || inventory.sauces[0];
  const currentCheese = inventory.cheeses.find((c) => c.id === selectedCheeseId) || inventory.cheeses[0];
  const currentVegs = inventory.vegetables.filter((v) => selectedVegIds.includes(v.id));

  // Run live flavor analysis when combination changes
  const runFlavorAnalysis = async () => {
    if (!currentBase || !currentSauce || !currentCheese) return;
    setIsAnalyzingFlavor(true);
    try {
      const res = await api.aiAnalyzeFlavor({
        baseName: currentBase.name,
        sauceName: currentSauce.name,
        cheeseName: currentCheese.name,
        vegetableNames: currentVegs.map((v) => v.name),
      });
      if (res.success && res.analysis) {
        setFlavorAnalysis(res.analysis);
      }
    } catch (err) {
      console.error('Failed flavor analysis:', err);
    } finally {
      setIsAnalyzingFlavor(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      runFlavorAnalysis();
    }, 400);
    return () => clearTimeout(timer);
  }, [selectedBaseId, selectedSauceId, selectedCheeseId, selectedVegIds]);

  // Pricing calculation
  const sizeMultiplier = pizzaSize === 'Regular (10")' ? 0.85 : pizzaSize === 'Large (14")' ? 1.3 : 1.0;
  const basePrice = (currentBase?.price || 8.0) * sizeMultiplier;
  const saucePrice = currentSauce?.price || 1.5;
  const cheesePrice = currentCheese?.price || 2.5;
  const doubleCheeseSurcharge = cheeseTier === 'double' ? 2.0 : 0.0;
  const vegPrice = currentVegs.reduce((sum, v) => sum + v.price, 0);

  const totalCalculatedPrice = Math.round((basePrice + saucePrice + cheesePrice + doubleCheeseSurcharge + vegPrice) * 100) / 100;

  // Toggle vegetable selection with 8 item maximum limit
  const MAX_VEGGIES = 8;
  const handleToggleVeg = (vegId: string) => {
    sound.playClick();
    setSelectedVegIds((prev) => {
      if (prev.includes(vegId)) {
        setVegLimitWarning(false);
        return prev.filter((id) => id !== vegId);
      }
      if (prev.length >= MAX_VEGGIES) {
        sound.playAlert();
        setVegLimitWarning(true);
        return prev;
      }
      setVegLimitWarning(false);
      return [...prev, vegId];
    });
  };

  const handleSelectBase = (id: string) => {
    sound.playClick();
    setSelectedBaseId(id);
  };

  const handleSelectSauce = (id: string) => {
    sound.playClick();
    setSelectedSauceId(id);
  };

  const handleSelectCheese = (id: string) => {
    sound.playClick();
    setSelectedCheeseId(id);
  };

  // Chef's preset templates
  const chefPresets = [
    {
      id: 'margherita',
      name: '👑 Margherita D.O.P.',
      desc: 'Classic Neapolitan perfection',
      baseId: inventory.bases[0]?.id || 'base-classic',
      sauceId: inventory.sauces[0]?.id || 'sauce-san-marzano',
      cheeseId: inventory.cheeses[0]?.id || 'cheese-mozzarella',
      vegIds: ['veg-cherry-tomatoes', 'veg-black-olives'],
    },
    {
      id: 'truffle',
      name: '🍄 Truffle & Porcini',
      desc: 'Earthy rich white gourmet base',
      baseId: inventory.bases.find((b) => b.id.includes('sourdough'))?.id || inventory.bases[0]?.id || 'base-sourdough',
      sauceId: inventory.sauces.find((s) => s.id.includes('garlic'))?.id || inventory.sauces[1]?.id || 'sauce-garlic-herb',
      cheeseId: inventory.cheeses.find((c) => c.id.includes('scamorza') || c.id.includes('parmigiano'))?.id || inventory.cheeses[1]?.id || 'cheese-smoked-scamorza',
      vegIds: ['veg-mushrooms', 'veg-red-onion'],
    },
    {
      id: 'primavera',
      name: '🌿 Garden Primavera',
      desc: 'Vibrant farm-fresh harvest',
      baseId: inventory.bases.find((b) => b.id.includes('wheat'))?.id || inventory.bases[0]?.id || 'base-wheat',
      sauceId: inventory.sauces.find((s) => s.id.includes('pesto'))?.id || inventory.sauces[2]?.id || 'sauce-pesto',
      cheeseId: inventory.cheeses.find((c) => c.id.includes('vegan'))?.id || inventory.cheeses[0]?.id || 'cheese-vegan',
      vegIds: ['veg-bell-peppers', 'veg-spinach', 'veg-cherry-tomatoes'],
    },
    {
      id: 'diavola',
      name: '🔥 Spicy Diavola Veg',
      desc: 'Zesty kick with hot peppers',
      baseId: inventory.bases.find((b) => b.id.includes('thin'))?.id || inventory.bases[0]?.id || 'base-thin',
      sauceId: inventory.sauces.find((s) => s.id.includes('arrabbiata'))?.id || inventory.sauces[0]?.id || 'sauce-spicy-arrabbiata',
      cheeseId: inventory.cheeses.find((c) => c.id.includes('pepper-jack'))?.id || inventory.cheeses[0]?.id || 'cheese-pepper-jack',
      vegIds: ['veg-jalapenos', 'veg-red-onion'],
    },
  ];

  const handleApplyPreset = (preset: typeof chefPresets[0]) => {
    sound.playSuccess();
    setSelectedBaseId(preset.baseId);
    setSelectedSauceId(preset.sauceId);
    setSelectedCheeseId(preset.cheeseId);
    setSelectedVegIds(preset.vegIds);
    setPizzaName(preset.name);
  };

  const handleRandomize = () => {
    sound.playSuccess();
    if (inventory.bases.length > 0) {
      const b = inventory.bases[Math.floor(Math.random() * inventory.bases.length)].id;
      setSelectedBaseId(b);
    }
    if (inventory.sauces.length > 0) {
      const s = inventory.sauces[Math.floor(Math.random() * inventory.sauces.length)].id;
      setSelectedSauceId(s);
    }
    if (inventory.cheeses.length > 0) {
      const c = inventory.cheeses[Math.floor(Math.random() * inventory.cheeses.length)].id;
      setSelectedCheeseId(c);
    }
    if (inventory.vegetables.length > 0) {
      const shuffled = [...inventory.vegetables].sort(() => 0.5 - Math.random());
      const count = 2 + Math.floor(Math.random() * 2);
      setSelectedVegIds(shuffled.slice(0, count).map((v) => v.id));
    }
    setPizzaName('Pizzaiolo Roulette Surprise');
  };

  const handleResetToppings = () => {
    sound.playClick();
    setSelectedVegIds([]);
  };

  // Add to cart with strict authentication requirement
  const handleCompleteAndAdd = () => {
    const orderItem: OrderItem = {
      id: `custom-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      type: 'custom',
      name: pizzaName.trim() || 'Custom Artisan Pizza',
      quantity: 1,
      unitPrice: totalCalculatedPrice,
      totalPrice: totalCalculatedPrice,
      config: {
        baseId: selectedBaseId,
        sauceId: selectedSauceId,
        cheeseId: selectedCheeseId,
        vegetableIds: selectedVegIds,
        size: pizzaSize,
      },
      customizationDetails: {
        baseName: currentBase?.name || 'Classic Crust',
        sauceName: currentSauce?.name || 'San Marzano Sauce',
        cheeseName: `${currentCheese?.name || 'Mozzarella'}${cheeseTier === 'double' ? ' (Double Cheese)' : ''}`,
        vegetableNames: currentVegs.map((v) => v.name),
      },
    };

    // If user is not logged in, block adding to cart and prompt for authentication
    if (!user) {
      sound.playClick();
      if (onRequireAuth) {
        onRequireAuth(
          orderItem,
          `Please sign in or create an account to add your custom "${orderItem.name}" to your cart.`
        );
      } else {
        onAddToCart(orderItem);
      }
      return;
    }

    sound.playSuccess();
    onAddToCart(orderItem);
  };

  const steps = [
    { num: 1, title: 'Choose Base', subtitle: '5 Artisan Doughs' },
    { num: 2, title: 'Choose Sauce', subtitle: '5 Simmered Sauces' },
    { num: 3, title: 'Choose Cheese', subtitle: 'Artisanal Cheeses' },
    { num: 4, title: 'Add Veggies', subtitle: 'Fresh Farm Produce' },
  ];

  const getSpiceBadge = (sauceName: string) => {
    const n = sauceName.toLowerCase();
    if (n.includes('arrabbiata') || n.includes('spicy') || n.includes('diavola') || n.includes('chili') || n.includes('fire')) {
      return { level: 'Hot', color: 'bg-red-100 text-red-800 border-red-200' };
    }
    if (n.includes('chipotle') || n.includes('pepper') || n.includes('smoky')) {
      return { level: 'Medium', color: 'bg-amber-100 text-amber-900 border-amber-300' };
    }
    return { level: 'Mild', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' };
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-stone-200 pb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold uppercase tracking-wider mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Interactive Pizza Studio</span>
          </div>
          <h2 className="font-serif text-3xl font-bold text-stone-900">
            Design Your Custom Pizza
          </h2>
          <p className="text-stone-600 text-sm mt-1">
            Pick your favorite crust, sauce swirl, cheese melt, and fresh vegetable toppings.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 self-start md:self-auto">
          {/* AI Crafter Button */}
          <button
            onClick={() => {
              sound.playClick();
              setIsAiCrafterOpen(true);
            }}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-stone-950 text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-xs transition active:scale-95 border border-amber-400"
          >
            <Sparkles className="w-4 h-4 fill-stone-950" />
            <span>AI Maestro Crafter</span>
          </button>

          {/* Size Selector */}
          <div className="flex items-center gap-1 bg-stone-100 p-1.5 rounded-xl border border-stone-200">
            {(['Regular (10")', 'Medium (12")', 'Large (14")'] as const).map((s) => (
              <button
                key={s}
                id={`btn-size-${s.slice(0, 3)}`}
                onClick={() => {
                  sound.playClick();
                  setPizzaSize(s);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  pizzaSize === s
                    ? 'bg-white text-stone-950 shadow-xs border border-stone-200/80'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/50'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* PRD Page 2 & 4 Requirement: Real-Time Total Price & Visual Progress Bar Sticky Header */}
      <div className="sticky top-16 z-30 bg-white/95 backdrop-blur-md p-3.5 sm:p-4 rounded-2xl border border-stone-200 shadow-md flex flex-wrap items-center justify-between gap-4 transition-all">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-800 font-bold font-mono text-sm shrink-0">
            {currentStep}/4
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-stone-900 uppercase tracking-wider">
                Step {currentStep}: {steps[currentStep - 1]?.title}
              </span>
              <span className="text-[11px] font-semibold text-amber-700 font-mono">
                ({currentStep * 25}% Complete)
              </span>
            </div>
            {/* Visual Progress Bar */}
            <div className="w-36 sm:w-56 h-2 rounded-full bg-stone-100 overflow-hidden mt-1.5 border border-stone-200">
              <div
                className="h-full bg-gradient-to-r from-amber-500 to-amber-600 transition-all duration-300 rounded-full"
                style={{ width: `${(currentStep / 4) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* Selected Summary Chips & Real-time Live Price */}
        <div className="flex items-center gap-4 ml-auto">
          <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-stone-600 max-w-xs truncate">
            <span className="px-2 py-0.5 rounded-md bg-stone-100 border border-stone-200 truncate">
              {currentBase?.name}
            </span>
            <span>+</span>
            <span className="px-2 py-0.5 rounded-md bg-stone-100 border border-stone-200 truncate">
              {currentCheese?.name} {cheeseTier === 'double' && '(2x)'}
            </span>
            {selectedVegIds.length > 0 && (
              <>
                <span>+</span>
                <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-200 font-semibold">
                  {selectedVegIds.length} Veggies
                </span>
              </>
            )}
          </div>

          <div className="text-right">
            <span className="text-[10px] text-stone-500 uppercase font-bold tracking-wider block">
              Real-Time Total
            </span>
            <span className="font-serif text-xl sm:text-2xl font-extrabold text-amber-800">
              ${totalCalculatedPrice.toFixed(2)}
            </span>
          </div>

          {currentStep < 4 ? (
            <button
              onClick={() => {
                sound.playClick();
                setCurrentStep((prev) => Math.min(4, prev + 1));
              }}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-bold flex items-center gap-1.5 shadow-xs transition active:scale-95"
            >
              <span>Next</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              onClick={handleCompleteAndAdd}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold flex items-center gap-1.5 shadow-xs transition active:scale-95"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>{user ? 'Add to Cart' : 'Sign In & Add'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Guest Authentication Advisory Banner in Pizza Studio */}
      {!user && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-amber-50/90 border border-amber-200/90 shadow-xs">
          <div className="flex items-center gap-3 text-left">
            <div className="w-9 h-9 rounded-xl bg-amber-200/60 border border-amber-300 flex items-center justify-center text-amber-800 shrink-0">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs sm:text-sm font-bold text-stone-900 flex items-center gap-2">
                <span>Sign In Required to Save & Add Custom Pizzas</span>
                <span className="px-1.5 py-0.5 rounded bg-amber-200 text-amber-900 text-[10px] font-bold uppercase tracking-wider">
                  Guest Studio Mode
                </span>
              </p>
              <p className="text-xs text-stone-600 mt-0.5">
                Feel free to preview toppings and doughs! You will be prompted to sign in when adding your finished masterpiece to your cart.
              </p>
            </div>
          </div>
          <button
            onClick={() => onRequireAuth?.(undefined, 'Sign in or create an account to add custom pizzas to your cart.')}
            className="w-full sm:w-auto px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-bold whitespace-nowrap shadow-xs transition active:scale-95"
          >
            Sign In / Register
          </button>
        </div>
      )}

      {/* Main Studio Workspace: 2-Column (Visualizer + Step Controls) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Interactive Live Pizza Canvas & Recipe Card (5 cols) */}
        <div className="lg:col-span-5 bg-white border border-stone-200 rounded-3xl p-6 lg:sticky lg:top-24 shadow-xs">
          <div className="text-center">
            <input
              id="input-custom-pizza-name"
              type="text"
              value={pizzaName}
              onChange={(e) => setPizzaName(e.target.value)}
              className="bg-transparent text-center font-serif text-xl font-bold text-stone-900 border-b border-dashed border-stone-300 hover:border-amber-500 focus:border-amber-600 focus:outline-none px-2 py-1 w-full"
              placeholder="Name your custom pizza..."
            />
            <p className="text-xs text-amber-700 font-semibold mt-1">Live 2D Hearth Preview</p>
          </div>

          {/* Layered Visualizer */}
          <PizzaVisualizer
            baseId={selectedBaseId}
            sauceId={selectedSauceId}
            cheeseId={selectedCheeseId}
            vegetableIds={selectedVegIds}
            size={pizzaSize}
          />

          {/* Current Recipe Summary Card */}
          <div className="mt-4 p-4 rounded-2xl bg-stone-50 border border-stone-200 text-xs space-y-2">
            <div className="flex justify-between text-stone-700">
              <span className="text-stone-500">Base Crust:</span>
              <span className="font-semibold text-stone-900">{currentBase?.name}</span>
            </div>
            <div className="flex justify-between text-stone-700">
              <span className="text-stone-500">Sauce:</span>
              <span className="font-semibold text-stone-900">{currentSauce?.name}</span>
            </div>
            <div className="flex justify-between text-stone-700">
              <span className="text-stone-500">Cheese:</span>
              <span className="font-semibold text-stone-900">{currentCheese?.name}</span>
            </div>
            <div className="flex justify-between text-stone-700">
              <span className="text-stone-500">Veggies ({selectedVegIds.length}):</span>
              <span className="font-semibold text-stone-900 text-right">
                {currentVegs.length > 0 ? currentVegs.map((v) => v.name).join(', ') : 'None selected'}
              </span>
            </div>

            <div className="border-t border-stone-200 pt-2.5 flex items-center justify-between">
              <span className="font-bold text-stone-800">Total Craft Price:</span>
              <span className="font-serif text-xl font-extrabold text-amber-700">
                ${totalCalculatedPrice.toFixed(2)}
              </span>
            </div>
          </div>

          {/* AI Live Sommelier & Nutritional Harmony Card */}
          <div className="mt-4 p-4 rounded-2xl bg-gradient-to-br from-amber-50/80 to-orange-50/50 border border-amber-200/80 text-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-600 fill-amber-500" />
                <span className="font-bold text-stone-900 uppercase tracking-wider text-[11px]">
                  AI Flavor Sommelier & Harmony
                </span>
              </div>
              <button
                onClick={runFlavorAnalysis}
                disabled={isAnalyzingFlavor}
                title="Re-analyze flavor synergy with Gemini"
                className="p-1 rounded-lg text-amber-800 hover:bg-amber-100 transition"
              >
                <Activity className={`w-3.5 h-3.5 ${isAnalyzingFlavor ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {/* Harmony Score Progress */}
            <div>
              <div className="flex justify-between items-center mb-1 text-[11px]">
                <span className="text-stone-600">Flavor Harmony Synergy:</span>
                <span className="font-extrabold text-amber-900 font-mono">
                  {flavorAnalysis ? `${flavorAnalysis.harmonyScore}%` : '92%'} (
                  {flavorAnalysis?.harmonyGrade || 'Exemplary Balance'})
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-amber-200/60 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full transition-all duration-500"
                  style={{ width: `${flavorAnalysis?.harmonyScore || 92}%` }}
                />
              </div>
            </div>

            {/* Sommelier Tasting Note */}
            {flavorAnalysis?.sommelierNote && (
              <p className="text-[11px] text-stone-700 italic leading-relaxed bg-white/70 p-2.5 rounded-xl border border-amber-100">
                "{flavorAnalysis.sommelierNote}"
              </p>
            )}

            {/* Beverage Pairing */}
            {flavorAnalysis?.pairingRecommendation && (
              <div className="flex items-start gap-2 text-[11px] text-stone-800">
                <GlassWater className="w-3.5 h-3.5 text-emerald-700 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-emerald-900">Pairing: </strong>
                  <span>{flavorAnalysis.pairingRecommendation}</span>
                </div>
              </div>
            )}

            {/* Dynamic Macro Estimates */}
            <div className="pt-2 border-t border-amber-200/60 flex items-center justify-between text-[10px] text-stone-600 font-mono">
              <span>
                Cal: <strong>{flavorAnalysis?.estimatedPerSliceCalories || 260} kcal</strong>/slice
              </span>
              <span>
                P: <strong>{flavorAnalysis?.macros?.proteinGrams || 14}g</strong>
              </span>
              <span>
                C: <strong>{flavorAnalysis?.macros?.carbsGrams || 32}g</strong>
              </span>
              <span>
                F: <strong>{flavorAnalysis?.macros?.fatsGrams || 11}g</strong>
              </span>
            </div>
          </div>

          {/* Bottom Call-to-action button */}
          {user ? (
            <button
              id="btn-add-custom-pizza-cart"
              onClick={handleCompleteAndAdd}
              className="w-full mt-4 py-3.5 px-6 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-stone-950 font-extrabold text-sm sm:text-base flex items-center justify-center gap-2 shadow-xs transition active:scale-[0.99]"
            >
              <ShoppingBag className="w-5 h-5" />
              <span>Add Custom Pizza (${totalCalculatedPrice.toFixed(2)})</span>
            </button>
          ) : (
            <button
              id="btn-add-custom-pizza-cart"
              onClick={handleCompleteAndAdd}
              className="w-full mt-4 py-3.5 px-6 rounded-2xl bg-stone-100 hover:bg-amber-500 text-stone-800 hover:text-stone-950 border border-stone-300 hover:border-amber-400 font-bold text-sm sm:text-base flex items-center justify-center gap-2 shadow-xs transition active:scale-[0.99] group/cbtn"
            >
              <Lock className="w-5 h-5 text-amber-600 group-hover/cbtn:text-stone-950 transition-colors" />
              <span>Sign In to Add to Cart (${totalCalculatedPrice.toFixed(2)})</span>
            </button>
          )}
        </div>

        {/* Right Column: 4 Steps Flow (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Chef's Inspiration Starters & Roulette Bar */}
          <div className="p-4 rounded-2xl bg-white border border-stone-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <ChefHat className="w-4 h-4 text-amber-600" />
                <span className="text-xs font-bold text-stone-900 uppercase tracking-wider">
                  Pizzaiolo Chef Starter Presets
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  id="btn-pizza-randomize"
                  onClick={handleRandomize}
                  title="Randomize ingredients for a unique chef surprise"
                  className="px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 text-xs font-bold flex items-center gap-1.5 transition active:scale-95"
                >
                  <Dices className="w-3.5 h-3.5 text-amber-600" />
                  <span>Surprise Me</span>
                </button>
                <button
                  id="btn-pizza-reset-veggies"
                  onClick={handleResetToppings}
                  title="Clear all selected vegetable toppings"
                  className="px-2 py-1 rounded-lg text-stone-500 hover:text-stone-800 hover:bg-stone-100 text-xs font-medium flex items-center gap-1 transition"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Clear Toppings</span>
                </button>
              </div>
            </div>

            {/* Preset Buttons Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {chefPresets.map((preset) => {
                const isSelected = pizzaName === preset.name;
                return (
                  <button
                    key={preset.id}
                    id={`btn-preset-${preset.id}`}
                    onClick={() => handleApplyPreset(preset)}
                    className={`p-2 rounded-xl text-left transition border ${
                      isSelected
                        ? 'bg-amber-500 text-stone-950 font-bold border-amber-500 shadow-2xs'
                        : 'bg-stone-50 hover:bg-amber-50/60 border-stone-200 text-stone-800 hover:border-amber-300'
                    }`}
                  >
                    <p className="text-xs font-bold truncate">{preset.name}</p>
                    <p className={`text-[10px] truncate mt-0.5 ${isSelected ? 'text-stone-900' : 'text-stone-500'}`}>
                      {preset.desc}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step Navigation Tabs */}
          <div className="grid grid-cols-4 gap-2 bg-stone-100 p-2 rounded-2xl border border-stone-200">
            {steps.map((step) => {
              const isActive = currentStep === step.num;
              const isCompleted = currentStep > step.num;

              return (
                <button
                  key={step.num}
                  id={`btn-step-tab-${step.num}`}
                  onClick={() => {
                    sound.playClick();
                    setCurrentStep(step.num);
                  }}
                  className={`p-2 sm:p-3 rounded-xl text-left transition flex flex-col justify-between ${
                    isActive
                      ? 'bg-white text-stone-950 shadow-xs border border-stone-200/80 font-bold'
                      : 'hover:bg-stone-200/60 text-stone-600'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-extrabold ${
                        isActive
                          ? 'bg-amber-500 text-stone-950'
                          : isCompleted
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : 'bg-stone-200 text-stone-600'
                      }`}
                    >
                      {isCompleted ? <Check className="w-3 h-3 stroke-[3]" /> : step.num}
                    </span>
                  </div>
                  <div className="mt-1">
                    <p className={`text-xs font-bold leading-tight ${isActive ? 'text-stone-950' : 'text-stone-700'}`}>
                      {step.title}
                    </p>
                    <p className={`text-[10px] hidden sm:block ${isActive ? 'text-amber-800' : 'text-stone-500'}`}>
                      {step.subtitle}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* STEP 1: CHOOSE PIZZA BASE */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-stone-900 flex items-center gap-2">
                    <span>Step 1: Choose Your Pizza Base</span>
                    <span className="text-xs font-semibold text-amber-700">({inventory.bases.length} Options)</span>
                  </h3>
                  <p className="text-xs text-stone-600">Hand-kneaded crust with 48h fermentation</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {inventory.bases.map((base) => {
                  const isSelected = selectedBaseId === base.id;
                  const isOutOfStock = base.stock <= 0;

                  return (
                    <div
                      key={base.id}
                      id={`opt-base-${base.id}`}
                      onClick={() => !isOutOfStock && handleSelectBase(base.id)}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer relative flex flex-col justify-between ${
                        isOutOfStock
                          ? 'opacity-50 border-stone-200 bg-stone-100 cursor-not-allowed'
                          : isSelected
                          ? 'border-amber-500 bg-amber-50/70 shadow-xs ring-1 ring-amber-400'
                          : 'border-stone-200 bg-white hover:border-amber-300 hover:bg-stone-50/50'
                      }`}
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="text-2xl">{base.imageEmoji || '🍕'}</span>
                            <div>
                              <h4 className="font-bold text-stone-900 text-sm">{base.name}</h4>
                              {base.badge && (
                                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-100 text-amber-900 border border-amber-200">
                                  {base.badge}
                                </span>
                              )}
                            </div>
                          </div>
                          <span className="text-sm font-bold text-amber-700">
                            +${base.price.toFixed(2)}
                          </span>
                        </div>
                        <p className="text-xs text-stone-600 mt-2 leading-relaxed">{base.description}</p>
                      </div>

                      <div className="mt-3 pt-2 border-t border-stone-100 flex items-center justify-between text-[11px]">
                        <span
                          className={`font-semibold ${
                            base.stock < base.threshold ? 'text-amber-700' : 'text-emerald-700'
                          }`}
                        >
                          {isOutOfStock
                            ? 'Out of Stock'
                            : base.stock < base.threshold
                            ? `Only ${base.stock} left`
                            : 'In Stock'}
                        </span>
                        {isSelected && (
                          <span className="flex items-center gap-1 font-bold text-amber-800">
                            <Check className="w-3.5 h-3.5 stroke-[3]" /> Selected
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 2: CHOOSE SAUCE */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-bold text-stone-900 flex items-center gap-2">
                  <span>Step 2: Choose Your Sauce</span>
                  <span className="text-xs font-semibold text-amber-700">({inventory.sauces.length} Options)</span>
                </h3>
                <p className="text-xs text-stone-600">
                  Select exactly 1 artisan sauce with authentic simmered Italian herbs & spice levels (deducts 1 unit).
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {inventory.sauces.map((sauce) => {
                  const isSelected = selectedSauceId === sauce.id;
                  const isOutOfStock = sauce.stock <= 0;
                  const spice = getSpiceBadge(sauce.name);

                  return (
                    <div
                      key={sauce.id}
                      id={`opt-sauce-${sauce.id}`}
                      onClick={() => !isOutOfStock && handleSelectSauce(sauce.id)}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer relative flex flex-col justify-between ${
                        isOutOfStock
                          ? 'opacity-50 border-stone-200 bg-stone-100 cursor-not-allowed'
                          : isSelected
                          ? 'border-amber-500 bg-amber-50/70 shadow-xs ring-1 ring-amber-400'
                          : 'border-stone-200 bg-white hover:border-amber-300 hover:bg-stone-50/50'
                      }`}
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2">
                            {/* Radio Circle Indicator */}
                            <div
                              className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition ${
                                isSelected ? 'border-amber-600 bg-amber-500' : 'border-stone-300 bg-white'
                              }`}
                            >
                              {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-stone-950" />}
                            </div>
                            <span className="text-2xl">{sauce.imageEmoji || '🍅'}</span>
                            <div>
                              <h4 className="font-bold text-stone-900 text-sm">{sauce.name}</h4>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${spice.color}`}>
                                  {spice.level} Spice
                                </span>
                                {sauce.badge && (
                                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-200">
                                    {sauce.badge}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <span className="text-sm font-bold text-amber-700">
                            +${sauce.price.toFixed(2)}
                          </span>
                        </div>
                        <p className="text-xs text-stone-600 mt-2 leading-relaxed">{sauce.description}</p>
                      </div>

                      <div className="mt-3 pt-2 border-t border-stone-100 flex items-center justify-between text-[11px]">
                        <span
                          className={`font-semibold ${
                            sauce.stock < sauce.threshold ? 'text-amber-700' : 'text-emerald-700'
                          }`}
                        >
                          {isOutOfStock
                            ? 'Out of Stock'
                            : sauce.stock < sauce.threshold
                            ? `Only ${sauce.stock} left`
                            : 'In Stock'}
                        </span>
                        {isSelected && (
                          <span className="flex items-center gap-1 font-bold text-amber-800">
                            <Check className="w-3.5 h-3.5 stroke-[3]" /> Selected
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 3: CHOOSE CHEESE & CHEESE TIER */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-bold text-stone-900 flex items-center gap-2">
                  <span>Step 3: Choose Cheese & Melt Tier</span>
                  <span className="text-xs font-semibold text-amber-700">({inventory.cheeses.length} Artisan Varieties)</span>
                </h3>
                <p className="text-xs text-stone-600">
                  Select your artisan curd base and choose standard or double cheese tier pricing (checks stock sufficiency).
                </p>
              </div>

              {/* Cheese Variety Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {inventory.cheeses.map((cheese) => {
                  const isSelected = selectedCheeseId === cheese.id;
                  const isOutOfStock = cheese.stock <= 0;

                  return (
                    <div
                      key={cheese.id}
                      id={`opt-cheese-${cheese.id}`}
                      onClick={() => !isOutOfStock && handleSelectCheese(cheese.id)}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer relative flex flex-col justify-between ${
                        isOutOfStock
                          ? 'opacity-50 border-stone-200 bg-stone-100 cursor-not-allowed'
                          : isSelected
                          ? 'border-amber-500 bg-amber-50/70 shadow-xs ring-1 ring-amber-400'
                          : 'border-stone-200 bg-white hover:border-amber-300 hover:bg-stone-50/50'
                      }`}
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2">
                            {/* Radio Circle Indicator */}
                            <div
                              className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition ${
                                isSelected ? 'border-amber-600 bg-amber-500' : 'border-stone-300 bg-white'
                              }`}
                            >
                              {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-stone-950" />}
                            </div>
                            <span className="text-2xl">{cheese.imageEmoji || '🧀'}</span>
                            <div>
                              <h4 className="font-bold text-stone-900 text-sm">{cheese.name}</h4>
                              {cheese.badge && (
                                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-100 text-amber-900 border border-amber-200">
                                  {cheese.badge}
                                </span>
                              )}
                            </div>
                          </div>
                          <span className="text-sm font-bold text-amber-700">
                            +${cheese.price.toFixed(2)}
                          </span>
                        </div>
                        <p className="text-xs text-stone-600 mt-2 leading-relaxed">{cheese.description}</p>
                      </div>

                      <div className="mt-3 pt-2 border-t border-stone-100 flex items-center justify-between text-[11px]">
                        <span
                          className={`font-semibold ${
                            cheese.stock < cheese.threshold ? 'text-amber-700' : 'text-emerald-700'
                          }`}
                        >
                          {isOutOfStock
                            ? 'Out of Stock'
                            : cheese.stock < cheese.threshold
                            ? `Only ${cheese.stock} left`
                            : 'In Stock'}
                        </span>
                        {isSelected && (
                          <span className="flex items-center gap-1 font-bold text-amber-800">
                            <Check className="w-3.5 h-3.5 stroke-[3]" /> Selected
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* PRD Page 3: Cheese Tier Selection (Standard vs Double Cheese) */}
              <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-stone-900">
                      Select Cheese Melt Tier
                    </h4>
                    <p className="text-xs text-stone-500">
                      Double cheese requires at least 2 units in stock ({currentCheese?.name}: {currentCheese?.stock ?? 0} available).
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Standard Tier */}
                  <div
                    onClick={() => {
                      sound.playClick();
                      setCheeseTier('standard');
                    }}
                    className={`p-3.5 rounded-xl border cursor-pointer transition flex items-center justify-between ${
                      cheeseTier === 'standard'
                        ? 'bg-white border-amber-500 ring-2 ring-amber-400 shadow-xs'
                        : 'bg-stone-100/60 border-stone-200 hover:bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                          cheeseTier === 'standard' ? 'border-amber-600 bg-amber-500' : 'border-stone-300'
                        }`}
                      >
                        {cheeseTier === 'standard' && <div className="w-1.5 h-1.5 rounded-full bg-stone-950" />}
                      </div>
                      <div>
                        <span className="text-xs font-bold text-stone-900 block">Standard Cheese Portion</span>
                        <span className="text-[11px] text-stone-500">1x Curd Melt (Included)</span>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-stone-600">$0.00</span>
                  </div>

                  {/* Double Cheese Tier */}
                  {(() => {
                    const hasStockForDouble = (currentCheese?.stock ?? 0) >= 2;
                    return (
                      <div
                        onClick={() => {
                          if (hasStockForDouble) {
                            sound.playClick();
                            setCheeseTier('double');
                          } else {
                            sound.playAlert();
                          }
                        }}
                        className={`p-3.5 rounded-xl border transition flex items-center justify-between ${
                          !hasStockForDouble
                            ? 'opacity-50 bg-stone-100 border-stone-200 cursor-not-allowed'
                            : cheeseTier === 'double'
                            ? 'bg-white border-amber-500 ring-2 ring-amber-400 shadow-xs cursor-pointer'
                            : 'bg-stone-100/60 border-stone-200 hover:bg-white cursor-pointer'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                              cheeseTier === 'double' ? 'border-amber-600 bg-amber-500' : 'border-stone-300'
                            }`}
                          >
                            {cheeseTier === 'double' && <div className="w-1.5 h-1.5 rounded-full bg-stone-950" />}
                          </div>
                          <div>
                            <span className="text-xs font-bold text-stone-900 block flex items-center gap-1.5">
                              <span>Double Cheese Feast</span>
                              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-100 text-amber-900 border border-amber-200">
                                2x Melt
                              </span>
                            </span>
                            <span className="text-[11px] text-stone-500">
                              {hasStockForDouble ? 'Extra stretch & golden blister' : 'Insufficient stock for double'}
                            </span>
                          </div>
                        </div>
                        <span className="text-xs font-bold text-amber-700">+$2.00</span>
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: CHOOSE VEGETABLES (MULTIPLE SELECT - 0 TO 8 OPTIONS) */}
          {currentStep === 4 && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-lg font-bold text-stone-900 flex items-center gap-2">
                    <span>Step 4: Choose Fresh Vegetables</span>
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-200">
                      {selectedVegIds.length} / {MAX_VEGGIES} Selected
                    </span>
                  </h3>
                  <p className="text-xs text-stone-600">
                    Multi-select farm-fresh crisp vegetables (0 to 8 toppings maximum).
                  </p>
                </div>

                {selectedVegIds.length > 0 && (
                  <button
                    onClick={() => setSelectedVegIds([])}
                    className="text-xs text-stone-500 hover:text-stone-800 underline self-start sm:self-auto"
                  >
                    Clear All Veggies
                  </button>
                )}
              </div>

              {/* Quantity Limit Warning Banner */}
              {(vegLimitWarning || selectedVegIds.length >= MAX_VEGGIES) && (
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 flex items-center gap-2.5 text-xs text-amber-900 font-medium">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>
                    <strong>Maximum limit reached:</strong> You have selected {MAX_VEGGIES} fresh toppings. To pick another vegetable, uncheck an existing one.
                  </span>
                </div>
              )}

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {inventory.vegetables.map((veg) => {
                  const isSelected = selectedVegIds.includes(veg.id);
                  const isOutOfStock = veg.stock <= 0;
                  const isAtLimit = !isSelected && selectedVegIds.length >= MAX_VEGGIES;

                  return (
                    <div
                      key={veg.id}
                      id={`opt-veg-${veg.id}`}
                      onClick={() => !isOutOfStock && !isAtLimit && handleToggleVeg(veg.id)}
                      className={`p-3.5 rounded-2xl border transition-all cursor-pointer relative flex flex-col justify-between ${
                        isOutOfStock || isAtLimit
                          ? 'opacity-40 border-stone-200 bg-stone-100 cursor-not-allowed'
                          : isSelected
                          ? 'border-amber-500 bg-amber-50/70 shadow-xs ring-1 ring-amber-400'
                          : 'border-stone-200 bg-white hover:border-amber-300 hover:bg-stone-50/50'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <span className="text-2xl">{veg.imageEmoji || '🫑'}</span>
                        <div
                          className={`w-5 h-5 rounded-lg flex items-center justify-center transition ${
                            isSelected
                              ? 'bg-amber-500 text-stone-950 font-bold'
                              : 'border border-stone-300 bg-white'
                          }`}
                        >
                          {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </div>
                      </div>

                      <div className="mt-2">
                        <h4 className="font-bold text-stone-900 text-xs leading-snug">{veg.name}</h4>
                        <p className="text-[11px] font-semibold text-amber-700 mt-0.5">
                          +${veg.price.toFixed(2)}
                        </p>
                      </div>

                      <div className="mt-2 pt-1 border-t border-stone-100 text-[10px] text-stone-500 flex items-center justify-between">
                        <span>{isOutOfStock ? 'Out of Stock' : `${veg.stock} in stock`}</span>
                        {isSelected && <span className="font-bold text-amber-700 text-[10px]">Added</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Stepper Footer Controls */}
          <div className="flex items-center justify-between pt-4 border-t border-stone-200">
            <button
              id="btn-prev-step"
              disabled={currentStep === 1}
              onClick={() => {
                sound.playClick();
                setCurrentStep((prev) => Math.max(1, prev - 1));
              }}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition ${
                currentStep === 1
                  ? 'opacity-30 cursor-not-allowed text-stone-400'
                  : 'bg-stone-100 hover:bg-stone-200 text-stone-700 border border-stone-200'
              }`}
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Previous</span>
            </button>

            {currentStep < 4 ? (
              <button
                id="btn-next-step"
                onClick={() => {
                  sound.playClick();
                  setCurrentStep((prev) => Math.min(4, prev + 1));
                }}
                className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs sm:text-sm font-bold flex items-center gap-1.5 shadow-xs transition"
              >
                <span>Continue to Step {currentStep + 1}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : user ? (
              <button
                id="btn-finish-builder"
                onClick={handleCompleteAndAdd}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs sm:text-sm font-extrabold flex items-center gap-2 shadow-xs transition active:scale-95"
              >
                <Check className="w-4 h-4 stroke-[3]" />
                <span>Complete & Add to Cart</span>
              </button>
            ) : (
              <button
                id="btn-finish-builder"
                onClick={handleCompleteAndAdd}
                className="px-6 py-2.5 rounded-xl bg-stone-100 hover:bg-amber-500 text-stone-800 hover:text-stone-950 border border-stone-300 hover:border-amber-400 text-xs sm:text-sm font-bold flex items-center gap-2 shadow-xs transition group/fbtn active:scale-95"
              >
                <Lock className="w-4 h-4 text-amber-600 group-hover/fbtn:text-stone-950 transition-colors" />
                <span>Sign In & Add to Cart</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* AI Pizza Crafter Modal */}
      {isAiCrafterOpen && (
        <AiPizzaCrafterModal
          isOpen={isAiCrafterOpen}
          onClose={() => setIsAiCrafterOpen(false)}
          inventory={inventory}
          onLoadIntoBuilder={(cfg, name) => {
            setSelectedBaseId(cfg.baseId);
            setSelectedSauceId(cfg.sauceId);
            setSelectedCheeseId(cfg.cheeseId);
            setSelectedVegIds(cfg.vegetableIds);
            if (cfg.size) setPizzaSize(cfg.size);
            if (name) setPizzaName(name);
            setCurrentStep(4);
          }}
          onAddToCart={onAddToCart}
        />
      )}
    </div>
  );
};
