import React, { useMemo, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';

const rand = (a, b) => Math.random() * (b - a) + a;

/* ═══ Detect mobile / low-performance device ═══ */
const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768 || 'ontouchstart' in window);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);
  return isMobile;
};

/* ═══ BIRD SVG ═══ */
const Bird = ({ x, y, size, delay, duration, color }) => (
  <motion.svg
    width={size} height={size * 0.4} viewBox="0 0 50 20"
    className="absolute"
    style={{ left: `${x}%`, top: `${y}%` }}
    animate={{
      x: [0, rand(200, 600), rand(400, 900)],
      y: [0, rand(-30, -80), rand(-20, -60)],
    }}
    transition={{ duration, delay, repeat: Infinity, repeatType: 'loop', ease: 'easeInOut' }}
  >
    {/* Left wing */}
    <motion.path
      d="M25 12 Q18 2, 5 6"
      stroke={color} strokeWidth="1.8" fill="none" strokeLinecap="round"
      animate={{ d: ['M25 12 Q18 2, 5 6', 'M25 12 Q18 14, 5 10', 'M25 12 Q18 2, 5 6'] }}
      transition={{ duration: rand(0.4, 0.7), repeat: Infinity, ease: 'easeInOut' }}
    />
    {/* Right wing */}
    <motion.path
      d="M25 12 Q32 2, 45 6"
      stroke={color} strokeWidth="1.8" fill="none" strokeLinecap="round"
      animate={{ d: ['M25 12 Q32 2, 45 6', 'M25 12 Q32 14, 45 10', 'M25 12 Q32 2, 45 6'] }}
      transition={{ duration: rand(0.4, 0.7), repeat: Infinity, ease: 'easeInOut' }}
    />
  </motion.svg>
);

/* ═══ LOTUS SVG ═══ */
const Lotus = ({ x, delay, size }) => (
  <motion.div
    className="absolute"
    style={{ bottom: '3%', left: `${x}%` }}
    animate={{ y: [0, -4, 0, 3, 0], rotate: [0, 2, 0, -2, 0] }}
    transition={{ duration: rand(4, 7), delay, repeat: Infinity, ease: 'easeInOut' }}
  >
    <svg width={size} height={size * 0.7} viewBox="0 0 80 56" fill="none">
      {/* Center petal */}
      <ellipse cx="40" cy="28" rx="8" ry="22" fill="#e88ca0" opacity={0.8} />
      {/* Left petals */}
      <ellipse cx="28" cy="32" rx="7" ry="18" fill="#f0a0b0" opacity={0.65} transform="rotate(-20 28 32)" />
      <ellipse cx="18" cy="38" rx="6" ry="14" fill="#f5b8c4" opacity={0.5} transform="rotate(-40 18 38)" />
      {/* Right petals */}
      <ellipse cx="52" cy="32" rx="7" ry="18" fill="#f0a0b0" opacity={0.65} transform="rotate(20 52 32)" />
      <ellipse cx="62" cy="38" rx="6" ry="14" fill="#f5b8c4" opacity={0.5} transform="rotate(40 62 38)" />
      {/* Green leaf base */}
      <ellipse cx="40" cy="50" rx="22" ry="5" fill="#6b8e5a" opacity={0.5} />
    </svg>
  </motion.div>
);

/* ═══ WATER WAVE ═══ */
const WaterWave = ({ yOffset, opacity, delay, duration }) => (
  <motion.div
    className="absolute left-0 right-0"
    style={{ bottom: `${yOffset}%`, height: '60px', opacity }}
  >
    <svg width="100%" height="60" viewBox="0 0 1440 60" preserveAspectRatio="none">
      <motion.path
        fill="rgba(100,160,210,0.25)"
        animate={{
          d: [
            'M0,30 C240,10 480,50 720,30 C960,10 1200,50 1440,30 L1440,60 L0,60Z',
            'M0,30 C240,50 480,10 720,30 C960,50 1200,10 1440,30 L1440,60 L0,60Z',
            'M0,30 C240,10 480,50 720,30 C960,10 1200,50 1440,30 L1440,60 L0,60Z',
          ]
        }}
        transition={{ duration, delay, repeat: Infinity, ease: 'easeInOut' }}
      />
    </svg>
  </motion.div>
);

/* ═══ MAIN COMPONENT ═══ */
export default function FloatingButterflies() {
  const { theme } = useTheme();
  const isMobile = useIsMobile();

  if (theme !== 'light') return null;

  /* On mobile: render static-ish version, no heavy Framer animations */
  if (isMobile) {
    return (
      <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 2 }}>
        {/* Static water gradient at bottom */}
        <div className="absolute bottom-0 left-0 right-0 h-24" style={{
          background: 'linear-gradient(to top, rgba(100,160,210,0.2), transparent)'
        }} />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 2 }}>
      
      {/* ── SKY BIRDS (top area) ── */}
      <Bird x={5}  y={8}  size={28} delay={0}   duration={22} color="rgba(90,60,30,0.45)" />
      <Bird x={15} y={5}  size={22} delay={2}   duration={26} color="rgba(80,50,25,0.4)" />
      <Bird x={30} y={12} size={32} delay={4}   duration={20} color="rgba(100,65,30,0.5)" />
      <Bird x={55} y={6}  size={25} delay={1}   duration={24} color="rgba(85,55,28,0.42)" />
      <Bird x={70} y={10} size={30} delay={3}   duration={18} color="rgba(95,60,30,0.48)" />
      <Bird x={85} y={4}  size={20} delay={5}   duration={28} color="rgba(75,45,22,0.38)" />

      {/* ── WATER WAVES (bottom area) ── */}
      <WaterWave yOffset={0}  opacity={0.6} delay={0}   duration={6} />
      <WaterWave yOffset={2}  opacity={0.4} delay={1}   duration={8} />
      <WaterWave yOffset={4}  opacity={0.3} delay={0.5} duration={7} />

      {/* ── LOTUS FLOWERS on water ── */}
      <Lotus x={15} delay={0}   size={45} />
      <Lotus x={55} delay={1.5} size={38} />
      <Lotus x={82} delay={0.8} size={50} />
    </div>
  );
}
