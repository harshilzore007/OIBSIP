import React from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface PizzaVisualizerProps {
  baseId: string;
  sauceId: string;
  cheeseId: string;
  vegetableIds: string[];
  size?: string;
  interactive?: boolean;
}

export const PizzaVisualizer: React.FC<PizzaVisualizerProps> = ({
  baseId,
  sauceId,
  cheeseId,
  vegetableIds,
  size = 'Medium (12")',
}) => {
  // Base crust styling
  const getCrustConfig = () => {
    switch (baseId) {
      case 'base-thin':
        return {
          rimColor: '#b45309',
          innerColor: '#d97706',
          borderWidth: 12,
          texture: 'crispy',
        };
      case 'base-cheese-burst':
        return {
          rimColor: '#f59e0b',
          innerColor: '#fde047',
          borderWidth: 22,
          texture: 'molten',
        };
      case 'base-multigrain':
        return {
          rimColor: '#78350f',
          innerColor: '#92400e',
          borderWidth: 18,
          texture: 'grainy',
        };
      case 'base-gluten-free':
        return {
          rimColor: '#d97706',
          innerColor: '#fef3c7',
          borderWidth: 14,
          texture: 'herb',
        };
      case 'base-classic':
      default:
        return {
          rimColor: '#d97706',
          innerColor: '#fbbf24',
          borderWidth: 16,
          texture: 'woodfired',
        };
    }
  };

  // Sauce styling
  const getSauceColor = () => {
    switch (sauceId) {
      case 'sauce-spicy-marinara':
        return '#dc2626'; // deep fiery red
      case 'sauce-alfredo':
        return '#fef9c3'; // creamy garlic white-gold
      case 'sauce-bbq':
        return '#7f1d1d'; // dark smoky mahogany
      case 'sauce-pesto':
        return '#15803d'; // genovese emerald green
      case 'sauce-san-marzano':
      default:
        return '#ea580c'; // vibrant italian tomato red
    }
  };

  // Cheese styling
  const getCheeseConfig = () => {
    switch (cheeseId) {
      case 'cheese-cheddar':
        return { color: '#f59e0b', opacity: 0.88, pattern: 'cheddar' };
      case 'cheese-gouda':
        return { color: '#fef08a', opacity: 0.82, pattern: 'gouda' };
      case 'cheese-vegan':
        return { color: '#fef3c7', opacity: 0.78, pattern: 'vegan' };
      case 'cheese-burrata':
        return { color: '#ffffff', opacity: 0.92, pattern: 'burrata' };
      case 'cheese-mozzarella':
      default:
        return { color: '#fef3c7', opacity: 0.85, pattern: 'mozzarella' };
    }
  };

  const crust = getCrustConfig();
  const sauceColor = getSauceColor();
  const cheese = getCheeseConfig();

  // Pre-calculated organic positions for vegetables around the pizza (radial angles & distances)
  const vegPositions: Record<string, Array<{ x: number; y: number; r: number; scale: number }>> = {
    'veg-bell-peppers': [
      { x: 130, y: 110, r: 15, scale: 1 },
      { x: 190, y: 140, r: -35, scale: 0.95 },
      { x: 110, y: 190, r: 45, scale: 1.05 },
      { x: 170, y: 210, r: -10, scale: 0.9 },
      { x: 150, y: 160, r: 75, scale: 1 },
    ],
    'veg-onions': [
      { x: 105, y: 140, r: -20, scale: 1 },
      { x: 180, y: 110, r: 40, scale: 1 },
      { x: 135, y: 220, r: -60, scale: 0.9 },
      { x: 195, y: 180, r: 25, scale: 1.05 },
      { x: 120, y: 165, r: 85, scale: 0.95 },
    ],
    'veg-olives': [
      { x: 120, y: 120, r: 0, scale: 1 },
      { x: 175, y: 125, r: 0, scale: 1.1 },
      { x: 110, y: 175, r: 0, scale: 0.95 },
      { x: 185, y: 170, r: 0, scale: 1.05 },
      { x: 148, y: 195, r: 0, scale: 1 },
      { x: 150, y: 135, r: 0, scale: 0.9 },
    ],
    'veg-jalapenos': [
      { x: 140, y: 105, r: 10, scale: 1 },
      { x: 195, y: 130, r: -25, scale: 0.95 },
      { x: 125, y: 180, r: 40, scale: 1.05 },
      { x: 165, y: 185, r: -15, scale: 1 },
      { x: 160, y: 145, r: 60, scale: 0.9 },
    ],
    'veg-mushrooms': [
      { x: 125, y: 135, r: -15, scale: 1 },
      { x: 165, y: 115, r: 30, scale: 1.05 },
      { x: 140, y: 170, r: -45, scale: 0.95 },
      { x: 180, y: 195, r: 15, scale: 1 },
      { x: 105, y: 160, r: 50, scale: 0.9 },
    ],
    'veg-corn': [
      { x: 135, y: 125, r: 0, scale: 1 },
      { x: 170, y: 135, r: 0, scale: 1 },
      { x: 115, y: 145, r: 0, scale: 1 },
      { x: 150, y: 150, r: 0, scale: 1 },
      { x: 130, y: 185, r: 0, scale: 1 },
      { x: 180, y: 160, r: 0, scale: 1 },
      { x: 160, y: 180, r: 0, scale: 1 },
    ],
    'veg-tomatoes': [
      { x: 115, y: 130, r: -10, scale: 1 },
      { x: 185, y: 120, r: 20, scale: 1.1 },
      { x: 120, y: 170, r: -30, scale: 0.95 },
      { x: 170, y: 175, r: 40, scale: 1.05 },
      { x: 145, y: 140, r: 15, scale: 1 },
    ],
    'veg-spinach': [
      { x: 130, y: 145, r: 25, scale: 1.1 },
      { x: 165, y: 125, r: -45, scale: 1 },
      { x: 120, y: 185, r: 60, scale: 1.05 },
      { x: 175, y: 180, r: -15, scale: 0.95 },
      { x: 150, y: 165, r: 80, scale: 1 },
    ],
  };

  const renderVegSvg = (vegId: string, pos: { x: number; y: number; r: number; scale: number }, idx: number) => {
    switch (vegId) {
      case 'veg-bell-peppers':
        return (
          <motion.g
            key={`${vegId}-${idx}`}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: pos.scale, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transform={`translate(${pos.x}, ${pos.y}) rotate(${pos.r})`}
          >
            <path
              d="M -12,-6 C -6,-12 6,-12 12,-6 C 14,-1 12,5 6,6 C -2,7 -8,2 -12,-6 Z"
              fill={idx % 2 === 0 ? '#22c55e' : '#eab308'}
              stroke="#15803d"
              strokeWidth="1.2"
            />
          </motion.g>
        );
      case 'veg-onions':
        return (
          <motion.g
            key={`${vegId}-${idx}`}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: pos.scale, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transform={`translate(${pos.x}, ${pos.y}) rotate(${pos.r})`}
          >
            <path
              d="M -14,-2 C -8,-10 8,-10 14,-2 C 10,4 -6,4 -14,-2 Z"
              fill="none"
              stroke="#a855f7"
              strokeWidth="3"
              strokeLinecap="round"
            />
          </motion.g>
        );
      case 'veg-olives':
        return (
          <motion.g
            key={`${vegId}-${idx}`}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: pos.scale, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transform={`translate(${pos.x}, ${pos.y})`}
          >
            <circle cx="0" cy="0" r="7" fill="#1c1917" stroke="#292524" strokeWidth="1.5" />
            <circle cx="0" cy="0" r="3" fill="#ea580c" />
          </motion.g>
        );
      case 'veg-jalapenos':
        return (
          <motion.g
            key={`${vegId}-${idx}`}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: pos.scale, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transform={`translate(${pos.x}, ${pos.y}) rotate(${pos.r})`}
          >
            <circle cx="0" cy="0" r="8" fill="#16a34a" stroke="#14532d" strokeWidth="1.5" />
            <circle cx="0" cy="0" r="4" fill="#86efac" />
            <circle cx="-1" cy="0" r="1.5" fill="#fef08a" />
          </motion.g>
        );
      case 'veg-mushrooms':
        return (
          <motion.g
            key={`${vegId}-${idx}`}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: pos.scale, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transform={`translate(${pos.x}, ${pos.y}) rotate(${pos.r})`}
          >
            <path
              d="M -9,0 C -9,-8 9,-8 9,0 Z"
              fill="#d6d3d1"
              stroke="#78716c"
              strokeWidth="1.2"
            />
            <rect x="-2.5" y="0" width="5" height="7" rx="1.5" fill="#a8a29e" />
          </motion.g>
        );
      case 'veg-corn':
        return (
          <motion.g
            key={`${vegId}-${idx}`}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: pos.scale, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transform={`translate(${pos.x}, ${pos.y})`}
          >
            <circle cx="0" cy="0" r="4.5" fill="#facc15" stroke="#ca8a04" strokeWidth="0.8" />
          </motion.g>
        );
      case 'veg-tomatoes':
        return (
          <motion.g
            key={`${vegId}-${idx}`}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: pos.scale, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transform={`translate(${pos.x}, ${pos.y}) rotate(${pos.r})`}
          >
            <ellipse cx="0" cy="0" rx="9" ry="6" fill="#b91c1c" stroke="#991b1b" strokeWidth="1.2" />
            <circle cx="2" cy="-1" r="1.5" fill="#fca5a5" />
          </motion.g>
        );
      case 'veg-spinach':
        return (
          <motion.g
            key={`${vegId}-${idx}`}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: pos.scale, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transform={`translate(${pos.x}, ${pos.y}) rotate(${pos.r})`}
          >
            <path
              d="M 0,-11 C 7,-4 7,4 0,10 C -7,4 -7,-4 0,-11 Z"
              fill="#15803d"
              stroke="#166534"
              strokeWidth="1"
            />
            <line x1="0" y1="-8" x2="0" y2="8" stroke="#86efac" strokeWidth="0.7" />
          </motion.g>
        );
      default:
        return null;
    }
  };

  return (
    <div className="relative flex flex-col items-center justify-center p-4">
      {/* Visual Canvas */}
      <div className="relative w-64 h-64 sm:w-72 sm:h-72 md:w-80 md:h-80 select-none">
        {/* Glow ambient layer */}
        <div className="absolute inset-0 rounded-full bg-amber-500/10 blur-xl -z-10" />

        <svg viewBox="0 0 300 300" className="w-full h-full drop-shadow-2xl">
          {/* Artisan Wooden Serving Board Base */}
          <g>
            {/* Outer wooden board rim */}
            <circle cx="150" cy="150" r="148" fill="#e6ccb2" stroke="#b08968" strokeWidth="3" />
            {/* Concentric natural wood grain accent rings */}
            <circle cx="150" cy="150" r="144" fill="none" stroke="#ddb892" strokeWidth="1.2" strokeDasharray="8 6" opacity="0.75" />
            <circle cx="150" cy="150" r="140" fill="#ede0d4" opacity="0.35" />
          </g>

          {/* Base Rim / Outer Crust */}
          <circle
            cx="150"
            cy="150"
            r="134"
            fill={crust.innerColor}
            stroke={crust.rimColor}
            strokeWidth={crust.borderWidth}
            className="transition-all duration-500"
          />

          {/* Crust Char Marks & Texture */}
          <g opacity="0.25">
            <circle cx="45" cy="110" r="5" fill="#451a03" />
            <circle cx="255" cy="130" r="6" fill="#451a03" />
            <circle cx="160" cy="285" r="5.5" fill="#451a03" />
            <circle cx="130" cy="18" r="4" fill="#451a03" />
            <circle cx="230" cy="220" r="7" fill="#451a03" />
            <circle cx="70" cy="225" r="6" fill="#451a03" />
          </g>

          {/* Sauce Layer */}
          <motion.circle
            cx="150"
            cy="150"
            r="118"
            fill={sauceColor}
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.3 }}
            className="transition-colors duration-400"
          />

          {/* Sauce Swirl Accent */}
          <path
            d="M 90,150 Q 120,90 180,100 T 210,180 T 130,200"
            fill="none"
            stroke={sauceColor}
            strokeWidth="8"
            strokeLinecap="round"
            opacity="0.4"
          />

          {/* Cheese Layer */}
          <motion.circle
            cx="150"
            cy="150"
            r="115"
            fill={cheese.color}
            opacity={cheese.opacity}
            initial={{ opacity: 0.4 }}
            animate={{ opacity: cheese.opacity }}
            transition={{ duration: 0.4 }}
            className="transition-colors duration-400"
          />

          {/* Melt bubbles & browning spots */}
          <g opacity="0.35">
            <circle cx="130" cy="120" r="9" fill="#ca8a04" />
            <circle cx="170" cy="130" r="11" fill="#ea580c" />
            <circle cx="140" cy="175" r="13" fill="#ca8a04" />
            <circle cx="185" cy="165" r="8" fill="#ca8a04" />
            <circle cx="110" cy="160" r="10" fill="#ea580c" />
            <circle cx="160" cy="100" r="7" fill="#ca8a04" />
          </g>

          {/* Burrata silk dollops special treatment */}
          {cheeseId === 'cheese-burrata' && (
            <g>
              <circle cx="120" cy="140" r="14" fill="#ffffff" stroke="#fef08a" strokeWidth="2" opacity="0.95" />
              <circle cx="175" cy="150" r="16" fill="#ffffff" stroke="#fef08a" strokeWidth="2" opacity="0.95" />
              <circle cx="150" cy="180" r="13" fill="#ffffff" stroke="#fef08a" strokeWidth="2" opacity="0.95" />
            </g>
          )}

          {/* Vegetables Toppings Layer */}
          <AnimatePresence>
            {vegetableIds.map((vegId) => {
              const positions = vegPositions[vegId] || [];
              return positions.map((pos, idx) => renderVegSvg(vegId, pos, idx));
            })}
          </AnimatePresence>

          {/* Center Seasoning Speckles (Oregano & Chili Flakes) */}
          <g opacity="0.6">
            <circle cx="148" cy="152" r="1.5" fill="#15803d" />
            <circle cx="154" cy="146" r="1.2" fill="#dc2626" />
            <circle cx="145" cy="142" r="1.3" fill="#15803d" />
            <circle cx="158" cy="156" r="1.5" fill="#dc2626" />
            <circle cx="142" cy="158" r="1.4" fill="#15803d" />
            <circle cx="155" cy="150" r="1.2" fill="#15803d" />
          </g>
        </svg>

        {/* Floating Size Tag */}
        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-3 py-1 bg-white/95 backdrop-blur-md border border-stone-200 text-stone-900 text-xs font-bold rounded-full shadow-md whitespace-nowrap">
          {size}
        </div>
      </div>
    </div>
  );
};
