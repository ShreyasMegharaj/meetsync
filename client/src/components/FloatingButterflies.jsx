import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';

/* 🦋 SVG butterfly path */
const ButterflyShape = ({ color, size }) => (
  <svg width={size} height={size * 0.7} viewBox="0 0 60 42" fill="none" style={{ filter: `drop-shadow(0 2px 6px ${color}44)` }}>
    {/* Left wing */}
    <path d="M30 21 C25 8, 8 2, 4 14 C0 26, 14 36, 30 21Z" fill={color} opacity={0.85} />
    <path d="M30 21 C26 28, 12 38, 8 30 C4 22, 18 18, 30 21Z" fill={color} opacity={0.6} />
    {/* Right wing */}
    <path d="M30 21 C35 8, 52 2, 56 14 C60 26, 46 36, 30 21Z" fill={color} opacity={0.85} />
    <path d="M30 21 C34 28, 48 38, 52 30 C56 22, 42 18, 30 21Z" fill={color} opacity={0.6} />
    {/* Body */}
    <ellipse cx="30" cy="21" rx="1.5" ry="8" fill={color} opacity={0.9} />
    {/* Antennae */}
    <path d="M29 13 C27 8, 24 5, 22 4" stroke={color} strokeWidth="0.7" fill="none" opacity={0.5} />
    <path d="M31 13 C33 8, 36 5, 38 4" stroke={color} strokeWidth="0.7" fill="none" opacity={0.5} />
  </svg>
);

const BUTTERFLY_COLORS = [
  '#e68a3c',  // warm orange
  '#d4763a',  // burnt sienna
  '#c98b4e',  // golden
  '#b8652a',  // deep orange
  '#daa055',  // honey
  '#cc7733',  // amber
];

const rand = (a, b) => Math.random() * (b - a) + a;

export default function FloatingButterflies() {
  const { theme } = useTheme();
  
  // Only render in light mode
  if (theme !== 'light') return null;

  const butterflies = useMemo(() => 
    Array.from({ length: 6 }, (_, i) => ({
      id: i,
      color: BUTTERFLY_COLORS[i % BUTTERFLY_COLORS.length],
      size: rand(22, 38),
      duration: rand(18, 30),
      delay: rand(0, 8),
      pathX: Array.from({ length: 6 }, () => rand(-5, 105)),
      pathY: Array.from({ length: 6 }, () => rand(-5, 95)),
      rotate: Array.from({ length: 6 }, () => rand(-25, 25)),
    }))
  , []);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 2 }}>
      {butterflies.map((b) => (
        <motion.div
          key={b.id}
          className="absolute"
          style={{ left: `${b.pathX[0]}%`, top: `${b.pathY[0]}%` }}
          animate={{
            left: b.pathX.map(x => `${x}%`),
            top: b.pathY.map(y => `${y}%`),
            rotate: b.rotate,
          }}
          transition={{
            duration: b.duration,
            delay: b.delay,
            repeat: Infinity,
            repeatType: 'loop',
            ease: 'easeInOut',
          }}
        >
          {/* Wing flap animation */}
          <motion.div
            animate={{ scaleX: [1, 0.3, 1, 0.4, 1] }}
            transition={{
              duration: rand(0.5, 0.9),
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            style={{ opacity: 0.7 }}
          >
            <ButterflyShape color={b.color} size={b.size} />
          </motion.div>
        </motion.div>
      ))}
    </div>
  );
}
