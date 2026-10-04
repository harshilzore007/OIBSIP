import React, { useState, useEffect } from 'react';
import { Bike, Navigation, MapPin, Compass, Thermometer, ShieldCheck, Zap } from 'lucide-react';
import type { Order } from '../types';

interface DeliveryRadarMapProps {
  order: Order;
  onOpenChat: () => void;
}

export const DeliveryRadarMap: React.FC<DeliveryRadarMapProps> = ({ order, onOpenChat }) => {
  const [progress, setProgress] = useState(35); // 0 to 100 percent
  const [speed, setSpeed] = useState(32);
  const [distKm, setDistKm] = useState(1.4);

  useEffect(() => {
    const isOutForDelivery = order.status === 'sent_to_delivery';
    if (!isOutForDelivery) return;

    // Simulate incremental movement along the courier route
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 95) return 95;
        const next = prev + 1.2;
        setDistKm(Math.max(0.2, Math.round((2.4 * (1 - next / 100)) * 10) / 10));
        setSpeed(28 + Math.floor(Math.sin(next) * 8));
        return next;
      });
    }, 1500);

    return () => clearInterval(interval);
  }, [order.status]);

  const isDelivered = order.status === 'delivered';
  const isOut = order.status === 'sent_to_delivery';

  // Calculate coordinates on SVG path
  // Path goes from (40, 160) -> (140, 90) -> (240, 140) -> (360, 60) -> (460, 100)
  const currentProgress = isDelivered ? 100 : isOut ? progress : 10;

  return (
    <div className="bg-stone-950 text-white rounded-3xl p-5 border border-stone-800 shadow-xl space-y-4 overflow-hidden relative">
      {/* Top Telemetry Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Navigation className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h5 className="font-bold text-xs sm:text-sm text-stone-100">Live GPS Courier Telemetry</h5>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-mono font-bold tracking-wider uppercase border border-emerald-500/30 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                Live Satellite Lock
              </span>
            </div>
            <p className="text-[11px] text-stone-400">
              Vespa Courier Marco Rossi • Route: Corso Umberto I
            </p>
          </div>
        </div>

        <button
          onClick={onOpenChat}
          className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
        >
          <span>Live Dispatch Chat</span>
          <span className="w-2 h-2 rounded-full bg-stone-950 animate-pulse" />
        </button>
      </div>

      {/* Interactive Map Visual Simulation */}
      <div className="relative h-48 w-full bg-[#111317] rounded-2xl border border-stone-800/80 overflow-hidden flex items-center justify-center">
        {/* Subtle Map Grid lines */}
        <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#f59e0b_1px,transparent_1px)] [background-size:16px_16px]" />

        {/* SVG Road Network and Animated Trajectory */}
        <svg viewBox="0 0 500 200" className="w-full h-full absolute inset-0">
          {/* Secondary streets */}
          <line x1="50" y1="30" x2="450" y2="30" stroke="#262626" strokeWidth="3" strokeDasharray="4 4" />
          <line x1="120" y1="20" x2="120" y2="180" stroke="#262626" strokeWidth="3" strokeDasharray="4 4" />
          <line x1="320" y1="20" x2="320" y2="180" stroke="#262626" strokeWidth="3" strokeDasharray="4 4" />
          <line x1="50" y1="170" x2="450" y2="170" stroke="#262626" strokeWidth="3" strokeDasharray="4 4" />

          {/* Primary Route Path */}
          <path
            d="M 50 150 Q 140 70 240 120 T 450 70"
            fill="none"
            stroke="#3f3f46"
            strokeWidth="8"
            strokeLinecap="round"
          />

          {/* Traveled Highway Highlight */}
          <path
            d="M 50 150 Q 140 70 240 120 T 450 70"
            fill="none"
            stroke="#f59e0b"
            strokeWidth="6"
            strokeDasharray="500"
            strokeDashoffset={`${500 - (500 * currentProgress) / 100}`}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
          />

          {/* Pizzeria Origin Hub Marker */}
          <g transform="translate(50, 150)">
            <circle r="14" fill="#1c1917" stroke="#f59e0b" strokeWidth="2.5" />
            <text x="0" y="4" textAnchor="middle" fontSize="11" fill="#fff">🍕</text>
          </g>

          {/* Destination Customer Marker */}
          <g transform="translate(450, 70)">
            <circle r="14" fill="#1c1917" stroke="#10b981" strokeWidth="2.5" />
            <text x="0" y="4" textAnchor="middle" fontSize="11" fill="#fff">🏠</text>
          </g>
        </svg>

        {/* Courier Moving Marker */}
        <div
          className="absolute z-20 transition-all duration-1000 ease-out"
          style={{
            left: `${Math.min(88, Math.max(8, currentProgress * 0.8 + 8))}%`,
            top: `${Math.min(75, Math.max(30, 65 - Math.sin((currentProgress / 100) * Math.PI) * 35))}%`,
            transform: 'translate(-50%, -50%)',
          }}
        >
          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-amber-500 text-stone-950 flex items-center justify-center shadow-lg border-2 border-white ring-4 ring-amber-500/30 animate-pulse">
              <Bike className="w-5 h-5" />
            </div>
            {/* Courier Tooltip label */}
            <div className="absolute -top-7 left-1/2 -translate-x-1/2 whitespace-nowrap bg-stone-900 border border-stone-700 px-2 py-0.5 rounded-md text-[10px] font-mono font-bold text-amber-400 shadow-md">
              Marco ({speed} km/h)
            </div>
          </div>
        </div>

        {/* Live Traffic Badge */}
        <div className="absolute bottom-2.5 left-3 z-10 px-2.5 py-1 rounded-lg bg-stone-900/90 border border-stone-700/80 text-[10px] text-stone-300 font-mono flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span>Traffic: Optimal Green Wave</span>
        </div>

        {/* GPS Coordinates readout */}
        <div className="absolute bottom-2.5 right-3 z-10 text-[10px] font-mono text-stone-500">
          40.8518° N, 14.2681° E
        </div>
      </div>

      {/* Telemetry Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-stone-900/70 p-3.5 rounded-2xl border border-stone-800 text-xs">
        <div>
          <span className="text-[10px] uppercase font-bold text-stone-400 block">Distance Remaining</span>
          <span className="font-mono font-extrabold text-sm text-stone-100">
            {isDelivered ? '0.0 km (Arrived)' : `${distKm} km`}
          </span>
        </div>
        <div>
          <span className="text-[10px] uppercase font-bold text-stone-400 block">Current Velocity</span>
          <span className="font-mono font-extrabold text-sm text-amber-400">
            {isDelivered ? '0 km/h' : `${speed} km/h`}
          </span>
        </div>
        <div>
          <span className="text-[10px] uppercase font-bold text-stone-400 block">Thermal Vault Temp</span>
          <span className="font-mono font-extrabold text-sm text-emerald-400 flex items-center gap-1">
            <Thermometer className="w-3.5 h-3.5" />
            <span>165°F (Fresh)</span>
          </span>
        </div>
        <div>
          <span className="text-[10px] uppercase font-bold text-stone-400 block">Estimated Arrival</span>
          <span className="font-mono font-extrabold text-sm text-stone-100">
            {isDelivered ? 'Delivered' : `~${Math.max(2, Math.round(distKm * 3.5))} mins`}
          </span>
        </div>
      </div>
    </div>
  );
};
