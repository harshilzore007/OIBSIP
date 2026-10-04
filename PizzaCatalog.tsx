import React, { useState, useMemo } from 'react';
import {
  Plus,
  SlidersHorizontal,
  Flame,
  Sparkles,
  Clock,
  Check,
  Lock,
  Search,
  X,
  Star,
  ShieldCheck,
  Utensils,
  Award,
} from 'lucide-react';
import type { PizzaCatalogItem, OrderItem, CustomPizzaConfig, User } from '../types';
import { sound } from '../utils/audio';

interface PizzaCatalogProps {
  pizzas: PizzaCatalogItem[];
  onAddToCart: (item: OrderItem) => void;
  onCustomizeInBuilder: (config: CustomPizzaConfig) => void;
  user: User | null;
  onRequireAuth?: (item?: OrderItem, customNotice?: string) => void;
}

export const PizzaCatalog: React.FC<PizzaCatalogProps> = ({
  pizzas,
  onAddToCart,
  onCustomizeInBuilder,
  user,
  onRequireAuth,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [dietaryFilter, setDietaryFilter] = useState<'all' | 'veg' | 'spicy'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [addedIds, setAddedIds] = useState<Record<string, boolean>>({});
  const [selectedModalPizza, setSelectedModalPizza] = useState<PizzaCatalogItem | null>(null);

  const categories = [
    { id: 'all', label: 'All Pizzas' },
    { id: 'classic', label: 'Neapolitan Classics' },
    { id: 'specialty', label: 'Chef Specials' },
    { id: 'veggie', label: 'Garden Veggie' },
  ];

  const filteredPizzas = useMemo(() => {
    return pizzas.filter((p) => {
      // Category match
      const matchCat = selectedCategory === 'all' || p.category === selectedCategory;
      // Dietary filter match
      const matchDietary =
        dietaryFilter === 'all'
          ? true
          : dietaryFilter === 'veg'
          ? p.isVegetarian
          : p.spiciness > 0;
      // Search match
      const query = searchQuery.trim().toLowerCase();
      const matchSearch =
        !query ||
        p.name.toLowerCase().includes(query) ||
        p.description.toLowerCase().includes(query);

      return matchCat && matchDietary && matchSearch;
    });
  }, [pizzas, selectedCategory, dietaryFilter, searchQuery]);

  const handleAddDirect = (pizza: PizzaCatalogItem) => {
    sound.playClick();
    const orderItem: OrderItem = {
      id: `item-${pizza.id}-${Date.now()}`,
      type: 'catalog',
      name: pizza.name,
      quantity: 1,
      unitPrice: pizza.price,
      totalPrice: pizza.price,
      config: {
        baseId: pizza.baseId,
        sauceId: pizza.sauceId,
        cheeseId: pizza.cheeseId,
        vegetableIds: pizza.vegetableIds,
        size: 'Medium (12")',
      },
    };

    // Strict authentication guard: guest users cannot add to cart without logging in
    if (!user) {
      if (onRequireAuth) {
        onRequireAuth(orderItem, `Please sign in or create an account to add "${pizza.name}" to your cart.`);
      } else {
        onAddToCart(orderItem);
      }
      return;
    }

    onAddToCart(orderItem);

    // Visual feedback
    setAddedIds((prev) => ({ ...prev, [pizza.id]: true }));
    setTimeout(() => {
      setAddedIds((prev) => ({ ...prev, [pizza.id]: false }));
    }, 1200);
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Hero Welcome Banner with Artisan Trattoria Atmosphere */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-amber-100/70 via-orange-50/60 to-stone-100/80 border border-amber-200/90 p-6 sm:p-10 shadow-sm">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-96 h-96 bg-amber-400/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-10 w-72 h-72 bg-orange-500/10 rounded-full blur-2xl pointer-events-none" />
        
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/90 border border-amber-300 text-amber-900 text-xs font-bold tracking-wider uppercase mb-4 shadow-2xs">
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span>800°F Volcanic Stone Hearth • Est. Napoli 1984</span>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold text-stone-900 tracking-tight leading-[1.15]">
            Handcrafted Italian Pizzas,{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-800 via-orange-600 to-amber-700 italic">
              Fresh to Your Door.
            </span>
          </h1>
          <p className="mt-3.5 text-stone-700 text-sm sm:text-base leading-relaxed font-normal max-w-2xl">
            Baked in our wood-fired volcanic stone oven using 48-hour fermented dough, authentic San Marzano D.O.P. tomatoes, fresh fior di latte mozzarella, and cold-pressed extra virgin olive oil.
          </p>

          {/* Quick Pizzeria Badges Row */}
          <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-4 border-t border-amber-200/60">
            <div className="flex items-center gap-2 bg-white/70 backdrop-blur-xs px-3 py-2 rounded-xl border border-amber-200/70 text-xs font-medium text-stone-800">
              <span className="text-amber-600 font-bold">🍕</span>
              <span>48h Slow Dough</span>
            </div>
            <div className="flex items-center gap-2 bg-white/70 backdrop-blur-xs px-3 py-2 rounded-xl border border-amber-200/70 text-xs font-medium text-stone-800">
              <span className="text-red-600 font-bold">🍅</span>
              <span>San Marzano D.O.P.</span>
            </div>
            <div className="flex items-center gap-2 bg-white/70 backdrop-blur-xs px-3 py-2 rounded-xl border border-amber-200/70 text-xs font-medium text-stone-800">
              <span className="text-amber-500 font-bold">🔥</span>
              <span>800°F Stone Oven</span>
            </div>
            <div className="flex items-center gap-2 bg-white/70 backdrop-blur-xs px-3 py-2 rounded-xl border border-amber-200/70 text-xs font-medium text-stone-800">
              <span className="text-emerald-600 font-bold">⚡</span>
              <span>30-Min Fast Dispatch</span>
            </div>
          </div>
        </div>
      </div>

      {/* Guest Authentication Advisory Banner (if unauthenticated) */}
      {!user && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 sm:p-5 rounded-2xl bg-amber-50 border border-amber-200 shadow-2xs">
          <div className="flex items-center gap-3.5 text-left">
            <div className="w-10 h-10 rounded-xl bg-amber-200/60 border border-amber-300 flex items-center justify-center text-amber-800 shrink-0 shadow-inner">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs sm:text-sm font-bold text-stone-900 flex items-center gap-2">
                <span>Account Required to Add Items to Cart</span>
                <span className="px-1.5 py-0.5 rounded bg-amber-200 text-amber-900 text-[10px] font-bold uppercase tracking-wider">
                  Guest Mode
                </span>
              </p>
              <p className="text-xs text-stone-600 mt-0.5">
                Sign in or register an account to select artisan pizzas, customize recipes, and place your delivery order.
              </p>
            </div>
          </div>
          <button
            onClick={() => onRequireAuth?.(undefined, 'Sign in or create an account to start adding artisan pizzas to your cart.')}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-stone-950 text-xs font-bold whitespace-nowrap shadow-xs transition active:scale-95"
          >
            Sign In / Register
          </button>
        </div>
      )}

      {/* Search & Category Filter Toolbar */}
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Category Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            {categories.map((cat) => (
              <button
                key={cat.id}
                id={`filter-cat-${cat.id}`}
                onClick={() => {
                  sound.playClick();
                  setSelectedCategory(cat.id);
                }}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition whitespace-nowrap ${
                  selectedCategory === cat.id
                    ? 'bg-stone-900 text-amber-400 shadow-xs'
                    : 'bg-white text-stone-700 hover:text-stone-900 hover:bg-stone-100 border border-stone-200'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Search Bar */}
          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name or flavor..."
              className="w-full pl-9 pr-8 py-2 rounded-xl bg-white border border-stone-200 text-xs text-stone-900 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 shadow-2xs"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2.5 text-stone-400 hover:text-stone-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Dietary Filters & Counter */}
        <div className="flex items-center justify-between flex-wrap gap-2 pt-1 border-b border-stone-200 pb-3">
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-stone-500 font-medium mr-1">Dietary:</span>
            <button
              onClick={() => setDietaryFilter('all')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                dietaryFilter === 'all'
                  ? 'bg-amber-100 text-amber-900 border border-amber-300'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              All Types
            </button>
            <button
              onClick={() => setDietaryFilter('veg')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition flex items-center gap-1 ${
                dietaryFilter === 'veg'
                  ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              <span>🌱 Pure Veg</span>
            </button>
            <button
              onClick={() => setDietaryFilter('spicy')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition flex items-center gap-1 ${
                dietaryFilter === 'spicy'
                  ? 'bg-red-100 text-red-900 border border-red-300'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              <Flame className="w-3 h-3 text-red-600 fill-red-600" />
              <span>Spicy</span>
            </button>
          </div>

          <span className="text-xs text-stone-500 font-medium">
            Showing <strong className="text-stone-900">{filteredPizzas.length}</strong> pizzas
          </span>
        </div>
      </div>

      {/* Pizza Grid */}
      {filteredPizzas.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-stone-200 p-8 shadow-xs">
          <Utensils className="w-10 h-10 text-stone-400 mx-auto mb-3" />
          <h3 className="font-serif text-lg font-bold text-stone-900">No matching pizzas found</h3>
          <p className="text-xs text-stone-500 mt-1 max-w-sm mx-auto">
            Try adjusting your search keywords or category filters, or craft a pizza with your custom toppings!
          </p>
          <button
            onClick={() => {
              setSelectedCategory('all');
              setDietaryFilter('all');
              setSearchQuery('');
            }}
            className="mt-4 px-4 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-xs font-bold text-stone-800 transition"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPizzas.map((pizza) => {
            const isAdded = addedIds[pizza.id];

            return (
              <div
                key={pizza.id}
                id={`card-pizza-${pizza.id}`}
                className="group bg-white hover:bg-stone-50/40 border border-stone-200 hover:border-amber-400/90 rounded-2xl overflow-hidden transition-all duration-300 flex flex-col justify-between shadow-xs hover:shadow-lg hover:-translate-y-0.5"
              >
                <div>
                  {/* Photo with badging & click to preview */}
                  <div
                    onClick={() => {
                      sound.playClick();
                      setSelectedModalPizza(pizza);
                    }}
                    className="relative aspect-[16/10] overflow-hidden bg-stone-100 cursor-pointer"
                    title="Click to view artisan recipe notes and ingredients"
                  >
                    <img
                      src={pizza.image}
                      alt={pizza.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-80" />

                    {/* Top tags */}
                    <div className="absolute top-3 left-3 flex items-center gap-1.5">
                      {pizza.isVegetarian && (
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-700/90 backdrop-blur-md border border-emerald-500 text-white text-[11px] font-bold shadow-xs">
                          🌱 Pure Veg
                        </span>
                      )}
                      {pizza.spiciness > 0 && (
                        <span className="px-2.5 py-0.5 rounded-full bg-red-700/90 backdrop-blur-md border border-red-500 text-white text-[11px] font-bold flex items-center gap-1 shadow-xs">
                          <Flame className="w-3 h-3 fill-red-200 text-red-200" />
                          {pizza.spiciness === 1 ? 'Mild' : pizza.spiciness === 2 ? 'Hot' : 'Fiery'}
                        </span>
                      )}
                    </div>

                    {/* Prep time badge */}
                    <div className="absolute bottom-3 right-3 px-2.5 py-0.5 rounded-full bg-white/95 backdrop-blur-md border border-stone-200 text-stone-800 text-[11px] font-bold flex items-center gap-1.5 shadow-xs">
                      <Clock className="w-3 h-3 text-amber-600" />
                      <span>{pizza.prepTimeMinutes} mins</span>
                    </div>

                    {/* Rating badge */}
                    <div className="absolute bottom-3 left-3 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md text-amber-300 text-[10px] font-bold flex items-center gap-1">
                      <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                      <span>4.9</span>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-5">
                    <div className="flex items-baseline justify-between gap-2">
                      <h3
                        onClick={() => {
                          sound.playClick();
                          setSelectedModalPizza(pizza);
                        }}
                        className="font-serif text-lg font-bold text-stone-900 group-hover:text-amber-800 transition-colors cursor-pointer hover:underline underline-offset-2"
                        title="Click to view recipe details"
                      >
                        {pizza.name}
                      </h3>
                      <span className="font-serif text-lg font-bold text-amber-800 tracking-tight">
                        ${pizza.price.toFixed(2)}
                      </span>
                    </div>

                    <p className="mt-2 text-xs text-stone-600 leading-relaxed line-clamp-2">
                      {pizza.description}
                    </p>
                  </div>
                </div>

                {/* Actions Footer */}
                <div className="p-5 pt-0 flex items-center gap-2">
                  <button
                    id={`btn-customize-${pizza.id}`}
                    onClick={() => {
                      sound.playClick();
                      onCustomizeInBuilder({
                        baseId: pizza.baseId,
                        sauceId: pizza.sauceId,
                        cheeseId: pizza.cheeseId,
                        vegetableIds: pizza.vegetableIds,
                        size: 'Medium (12")',
                      });
                    }}
                    title="Modify crust, sauce, cheese, or toppings in builder"
                    className="px-3 py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 hover:text-stone-900 text-xs font-semibold border border-stone-200 transition flex items-center gap-1.5 active:scale-95"
                  >
                    <SlidersHorizontal className="w-3.5 h-3.5 text-amber-600" />
                    <span className="hidden sm:inline">Customize</span>
                  </button>

                  {user ? (
                    <button
                      id={`btn-add-cart-${pizza.id}`}
                      onClick={() => handleAddDirect(pizza)}
                      className={`flex-1 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold transition flex items-center justify-center gap-1.5 shadow-xs active:scale-95 ${
                        isAdded
                          ? 'bg-emerald-600 text-white scale-95'
                          : 'bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-stone-950 font-extrabold'
                      }`}
                    >
                      {isAdded ? (
                        <>
                          <Check className="w-4 h-4 stroke-[3]" />
                          <span>Added to Cart!</span>
                        </>
                      ) : (
                        <>
                          <Plus className="w-4 h-4 stroke-[2.5]" />
                          <span>Add to Order</span>
                        </>
                      )}
                    </button>
                  ) : (
                    <button
                      id={`btn-add-cart-${pizza.id}`}
                      onClick={() => handleAddDirect(pizza)}
                      title="Sign in required to add this pizza to your cart"
                      className="flex-1 py-2.5 px-3.5 rounded-xl text-xs sm:text-sm font-bold transition flex items-center justify-center gap-1.5 bg-stone-100 hover:bg-amber-500 text-stone-800 hover:text-stone-950 border border-stone-300 hover:border-amber-500 shadow-xs group/btn active:scale-95"
                    >
                      <Lock className="w-3.5 h-3.5 text-amber-600 group-hover/btn:text-stone-950 transition-colors" />
                      <span>Sign In to Order</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* PIZZA ARTISAN RECIPE & CRAFT PROFILE MODAL */}
      {selectedModalPizza && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div
            id="modal-pizza-recipe-details"
            className="w-full max-w-lg bg-white rounded-3xl overflow-hidden shadow-2xl border border-stone-200 relative animate-in zoom-in-95 duration-200"
          >
            {/* Header image with gradient */}
            <div className="relative aspect-[16/9] w-full bg-stone-900 overflow-hidden">
              <img
                src={selectedModalPizza.image}
                alt={selectedModalPizza.name}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-stone-950/90 via-stone-950/40 to-transparent" />
              
              {/* Close Button */}
              <button
                id="btn-close-recipe-modal"
                onClick={() => {
                  sound.playClick();
                  setSelectedModalPizza(null);
                }}
                className="absolute top-3 right-3 w-8 h-8 rounded-full bg-stone-900/70 hover:bg-stone-900 text-white flex items-center justify-center backdrop-blur-xs transition"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Badges on hero */}
              <div className="absolute bottom-4 left-5 right-5 flex items-end justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    {selectedModalPizza.isVegetarian && (
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-bold">
                        🌱 Pure Veg
                      </span>
                    )}
                    {selectedModalPizza.spiciness > 0 && (
                      <span className="px-2.5 py-0.5 rounded-full bg-red-600 text-white text-[10px] font-bold flex items-center gap-1">
                        <Flame className="w-3 h-3 fill-white" />
                        <span>{selectedModalPizza.spiciness === 1 ? 'Mild' : selectedModalPizza.spiciness === 2 ? 'Hot' : 'Fiery'}</span>
                      </span>
                    )}
                    <span className="px-2 py-0.5 rounded-full bg-amber-500/90 text-stone-950 text-[10px] font-bold">
                      ⭐ 4.9 Pizzeria Rating
                    </span>
                  </div>
                  <h3 className="font-serif text-2xl font-bold text-white tracking-tight">
                    {selectedModalPizza.name}
                  </h3>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-xs text-stone-300 block font-medium">Artisan Price</span>
                  <span className="font-serif text-2xl font-black text-amber-400">
                    ${selectedModalPizza.price.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* Recipe Insights & Story */}
            <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
              <p className="text-stone-700 text-xs sm:text-sm leading-relaxed">
                {selectedModalPizza.description}
              </p>

              {/* Craft Specifications Grid */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="p-3 rounded-2xl bg-amber-50/70 border border-amber-200/80">
                  <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider block">
                    Dough Fermentation
                  </span>
                  <p className="text-xs font-bold text-stone-900 mt-0.5">48-Hour Cold Biga</p>
                  <p className="text-[11px] text-stone-600">Light, airy cornicione with leopard char</p>
                </div>

                <div className="p-3 rounded-2xl bg-orange-50/70 border border-orange-200/80">
                  <span className="text-[10px] font-bold text-orange-800 uppercase tracking-wider block">
                    Stone Hearth Baking
                  </span>
                  <p className="text-xs font-bold text-stone-900 mt-0.5">800°F Volcanic Stone</p>
                  <p className="text-[11px] text-stone-600">Flash-baked in 90 seconds flat</p>
                </div>

                <div className="p-3 rounded-2xl bg-emerald-50/70 border border-emerald-200/80">
                  <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">
                    Sauce & Produce
                  </span>
                  <p className="text-xs font-bold text-stone-900 mt-0.5">D.O.P. Certified</p>
                  <p className="text-[11px] text-stone-600">San Marzano tomatoes & fresh basil</p>
                </div>

                <div className="p-3 rounded-2xl bg-stone-100 border border-stone-200">
                  <span className="text-[10px] font-bold text-stone-600 uppercase tracking-wider block">
                    Prep & Dispatch Time
                  </span>
                  <p className="text-xs font-bold text-stone-900 mt-0.5">{selectedModalPizza.prepTimeMinutes} Mins In-Oven</p>
                  <p className="text-[11px] text-stone-600">Thermal insulated express delivery</p>
                </div>
              </div>

              {/* Flavor Profile Callout */}
              <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200 flex items-start gap-3">
                <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-xs">
                  <strong className="text-stone-900">Pizzaiolo Tasting Notes:</strong>
                  <p className="text-stone-600 mt-0.5 leading-relaxed">
                    A harmonious balance between tangy volcanic tomato umami, velvety melted cheese stretch, and a fragrant blistered crust finish.
                  </p>
                </div>
              </div>
            </div>

            {/* Modal Actions Footer */}
            <div className="p-5 border-t border-stone-200 bg-stone-50 flex items-center gap-3">
              <button
                onClick={() => {
                  sound.playClick();
                  const target = selectedModalPizza;
                  setSelectedModalPizza(null);
                  onCustomizeInBuilder({
                    baseId: target.baseId,
                    sauceId: target.sauceId,
                    cheeseId: target.cheeseId,
                    vegetableIds: target.vegetableIds,
                    size: 'Medium (12")',
                  });
                }}
                className="py-3 px-4 rounded-xl bg-white hover:bg-stone-100 text-stone-800 font-bold text-xs border border-stone-200 flex items-center justify-center gap-1.5 transition active:scale-95 shadow-2xs"
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-amber-600" />
                <span>Customize in Studio</span>
              </button>

              <button
                id="btn-recipe-modal-add"
                onClick={() => {
                  const target = selectedModalPizza;
                  setSelectedModalPizza(null);
                  handleAddDirect(target);
                }}
                className="flex-1 py-3 px-5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-stone-950 font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md shadow-amber-500/20 transition active:scale-95"
              >
                {user ? (
                  <>
                    <Plus className="w-4 h-4 stroke-[3]" />
                    <span>Add to Order • ${selectedModalPizza.price.toFixed(2)}</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    <span>Sign In to Order</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

