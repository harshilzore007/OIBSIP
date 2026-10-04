import React from 'react';
import {
  Pizza,
  ShoppingBag,
  ShieldCheck,
  User as UserIcon,
  LogOut,
  Clock,
} from 'lucide-react';
import type { User } from '../types';

interface NavbarProps {
  activeTab: 'catalog' | 'builder' | 'orders' | 'admin';
  setActiveTab: (tab: 'catalog' | 'builder' | 'orders' | 'admin') => void;
  cartCount: number;
  openCart: () => void;
  user: User | null;
  adminUser: User | null;
  openAuthModal: () => void;
  onLogout: () => void;
  onAdminLogout: () => void;
  openEmailSandbox?: () => void;
  activeOrdersCount: number;
  openChefLuigiModal?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  cartCount,
  openCart,
  user,
  openAuthModal,
  onLogout,
  activeOrdersCount,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-stone-200/90 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <button
          id="btn-brand-home"
          onClick={() => setActiveTab('catalog')}
          className="flex items-center gap-2.5 text-left group transition"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-md shadow-orange-500/20 group-hover:scale-105 transition-transform">
            <Pizza className="w-6 h-6 text-stone-950 stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-serif text-xl font-bold tracking-tight text-stone-900">
                Pizza<span className="text-amber-600">Craft</span>
              </span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 uppercase tracking-wider">
                Artisan
              </span>
            </div>
            <p className="text-[11px] text-stone-500 font-medium">Wood-Fired & Handcrafted</p>
          </div>
        </button>

        {/* Center Nav Links */}
        <nav className="hidden md:flex items-center gap-1 bg-stone-100/90 p-1.5 rounded-xl border border-stone-200/80">
          <button
            id="nav-tab-catalog"
            onClick={() => setActiveTab('catalog')}
            className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition ${
              activeTab === 'catalog'
                ? 'bg-white text-stone-900 shadow-xs border border-stone-200/60 font-bold'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/50'
            }`}
          >
            Menu Catalog
          </button>
          <button
            id="nav-tab-builder"
            onClick={() => setActiveTab('builder')}
            className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition ${
              activeTab === 'builder'
                ? 'bg-white text-stone-900 shadow-xs border border-stone-200/60 font-bold'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/50'
            }`}
          >
            Custom Pizza Builder
          </button>
          <button
            id="nav-tab-orders"
            onClick={() => setActiveTab('orders')}
            className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition flex items-center gap-1.5 ${
              activeTab === 'orders'
                ? 'bg-white text-stone-900 shadow-xs border border-stone-200/60 font-bold'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/50'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Live Tracking</span>
            {activeOrdersCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-emerald-600 text-white text-[10px] font-bold">
                {activeOrdersCount}
              </span>
            )}
          </button>
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* Admin Switcher Button */}
          <button
            id="btn-nav-admin"
            onClick={() => setActiveTab('admin')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition border ${
              activeTab === 'admin'
                ? 'bg-stone-900 text-amber-400 border-stone-900 shadow-xs'
                : 'bg-stone-100 text-stone-700 border-stone-200 hover:border-amber-400 hover:text-amber-800'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-amber-600" />
            <span className="hidden sm:inline">Kitchen Admin</span>
          </button>

          {/* User Sign In / Profile */}
          {user ? (
            <div className="flex items-center gap-2 pl-1 border-l border-stone-200">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-bold text-stone-900 leading-none">{user.name.split(' ')[0]}</p>
                <p className="text-[10px] text-amber-700 font-semibold">Verified Foodie</p>
              </div>
              <button
                id="btn-user-logout"
                onClick={onLogout}
                title="Log Out"
                className="p-2 text-stone-400 hover:text-red-600 hover:bg-stone-100 rounded-lg transition"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              id="btn-nav-login"
              onClick={openAuthModal}
              className="px-3.5 py-1.5 bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold rounded-lg transition flex items-center gap-1.5 shadow-xs"
            >
              <UserIcon className="w-3.5 h-3.5 text-amber-400" />
              <span>Sign In</span>
            </button>
          )}

          {/* Cart Trigger */}
          <button
            id="btn-nav-cart"
            onClick={openCart}
            className="relative p-2.5 bg-amber-500 hover:bg-amber-400 text-stone-950 rounded-xl font-bold transition shadow-xs flex items-center justify-center group"
          >
            <ShoppingBag className="w-5 h-5 group-hover:scale-105 transition-transform" />
            {cartCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 min-w-5 h-5 px-1 rounded-full bg-stone-950 text-amber-400 text-[11px] font-extrabold flex items-center justify-center border border-amber-500 shadow-xs animate-bounce">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Bottom Tab Bar */}
      <div className="md:hidden flex items-center justify-around py-2 border-t border-stone-200 bg-white/95">
        <button
          onClick={() => setActiveTab('catalog')}
          className={`text-xs font-semibold px-3 py-1 rounded-md ${
            activeTab === 'catalog' ? 'text-amber-800 bg-amber-50 font-bold' : 'text-stone-600'
          }`}
        >
          Menu
        </button>
        <button
          onClick={() => setActiveTab('builder')}
          className={`text-xs font-semibold px-3 py-1 rounded-md ${
            activeTab === 'builder' ? 'text-amber-800 bg-amber-50 font-bold' : 'text-stone-600'
          }`}
        >
          Custom Builder
        </button>
        <button
          onClick={() => setActiveTab('orders')}
          className={`text-xs font-semibold px-3 py-1 rounded-md flex items-center gap-1 ${
            activeTab === 'orders' ? 'text-amber-800 bg-amber-50 font-bold' : 'text-stone-600'
          }`}
        >
          <span>Tracking</span>
          {activeOrdersCount > 0 && (
            <span className="w-4 h-4 rounded-full bg-emerald-600 text-white text-[10px] font-bold flex items-center justify-center">
              {activeOrdersCount}
            </span>
          )}
        </button>
      </div>
    </header>
  );
};
