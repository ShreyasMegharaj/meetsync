import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, useMotionValue, useSpring } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import NotificationBell from "../components/NotificationBell";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

/* ─── helpers ─── */
const rand = (a, b) => Math.random() * (b - a) + a;

/* ═══════════════════════════════════════════════════════════════
   AMBIENT BACKGROUND — rich immersive depth
   ═══════════════════════════════════════════════════════════════ */
const BLOBS = [
  { gradient: "radial-gradient(circle,rgba(109,40,217,0.35),rgba(59,130,246,0.12),transparent 70%)", size: 600, blur: 110, dur: 30, opacity: 0.4, path: { x: [-250, 600, 150, -150, 450, -250], y: [-150, 350, -80, 550, 100, -150], s: [1, 1.2, 0.88, 1.12, 0.92, 1] } },
  { gradient: "radial-gradient(circle,rgba(219,39,119,0.25),rgba(168,85,247,0.14),transparent 70%)", size: 480, blur: 125, dur: 36, opacity: 0.32, path: { x: [750, -80, 380, 80, 650, 750], y: [450, 20, 380, -120, 280, 450], s: [0.92, 1.25, 0.95, 1.18, 0.86, 0.92] } },
  { gradient: "radial-gradient(circle,rgba(6,182,212,0.22),rgba(59,130,246,0.14),transparent 70%)", size: 520, blur: 105, dur: 34, opacity: 0.33, path: { x: [250, -180, 550, 80, -120, 250], y: [650, 120, -120, 480, 220, 650], s: [1.08, 0.82, 1.25, 0.88, 1.12, 1.08] } },
  { gradient: "radial-gradient(circle,rgba(139,92,246,0.3),rgba(236,72,153,0.1),transparent 70%)", size: 400, blur: 130, dur: 42, opacity: 0.25, path: { x: [-150, 450, 750, 180, 550, -150], y: [280, -180, 450, 80, 650, 280], s: [1, 1.35, 0.78, 1.18, 0.95, 1] } },
];

const MOTES = Array.from({ length: 40 }, (_, i) => ({
  id: i, size: rand(1.2, 3.5),
  color: [`rgba(167,139,250,`, `rgba(96,165,250,`, `rgba(244,114,182,`, `rgba(34,211,238,`, `rgba(129,140,248,`][i % 5] + `${rand(0.25, 0.6)})`,
  dur: rand(18, 38), delay: rand(0, 10),
  path: { x: Array.from({ length: 7 }, () => rand(-50, 1800)), y: Array.from({ length: 7 }, () => rand(-50, 1000)) },
}));

const STREAKS = Array.from({ length: 4 }, (_, i) => ({
  id: i, delay: rand(2, 16), dur: rand(2.5, 4), top: rand(8, 85), angle: rand(-18, -4),
}));

const RINGS = [
  { sz: 200, x: 80, y: 12, dur: 30, c: "rgba(139,92,246,0.05)" },
  { sz: 280, x: 10, y: 70, dur: 36, c: "rgba(59,130,246,0.04)" },
  { sz: 160, x: 60, y: 60, dur: 26, c: "rgba(236,72,153,0.04)" },
];

const Background = () => (
  <div className="fixed inset-0 overflow-hidden" style={{ zIndex: 0 }}>
    <div className="absolute inset-0" style={{ background: "linear-gradient(145deg, #050208 0%, #0a0618 30%, #0d0a1a 50%, #06050f 70%, #020104 100%)" }} />
    <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 25% 15%, rgba(109,40,217,0.07) 0%, transparent 55%)" }} />
    <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 75% 85%, rgba(59,130,246,0.05) 0%, transparent 55%)" }} />
    <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 50% 50%, rgba(236,72,153,0.03) 0%, transparent 50%)" }} />
    <div className="absolute inset-0 opacity-[0.015]" style={{ backgroundImage: "linear-gradient(rgba(139,92,246,0.5) 1px,transparent 1px),linear-gradient(90deg,rgba(139,92,246,0.5) 1px,transparent 1px)", backgroundSize: "80px 80px" }} />
    {BLOBS.map((b, i) => (
      <motion.div key={i} className="absolute rounded-full pointer-events-none will-change-transform"
        style={{ width: b.size, height: b.size, background: b.gradient, filter: `blur(${b.blur}px)`, opacity: b.opacity }}
        animate={{ x: b.path.x, y: b.path.y, scale: b.path.s }}
        transition={{ duration: b.dur, repeat: Infinity, repeatType: "loop", ease: "linear" }} />
    ))}
    {RINGS.map((r, i) => (
      <motion.div key={`r${i}`} className="absolute rounded-full pointer-events-none"
        style={{ width: r.sz, height: r.sz, border: `1px solid ${r.c}`, left: `${r.x}%`, top: `${r.y}%` }}
        animate={{ rotate: 360, scale: [1, 1.1, 0.93, 1.08, 1] }}
        transition={{ rotate: { duration: r.dur, repeat: Infinity, ease: "linear" }, scale: { duration: r.dur * 0.7, repeat: Infinity, repeatType: "mirror", ease: "easeInOut" } }} />
    ))}
    {MOTES.map((m) => (
      <motion.div key={m.id} className="absolute rounded-full pointer-events-none"
        style={{ width: m.size, height: m.size, background: m.color, boxShadow: `0 0 ${m.size * 3}px ${m.color}` }}
        animate={{ x: m.path.x, y: m.path.y, opacity: [0.4, 1, 0.4] }}
        transition={{ duration: m.dur, delay: m.delay, repeat: Infinity, repeatType: "loop", ease: "linear" }} />
    ))}
    {STREAKS.map((s) => (
      <motion.div key={`s${s.id}`} className="absolute pointer-events-none"
        style={{ top: `${s.top}%`, left: "-12%", width: 140, height: 1.5, background: "linear-gradient(90deg,transparent,rgba(167,139,250,0.5),rgba(96,165,250,0.3),transparent)", borderRadius: 999, transform: `rotate(${s.angle}deg)`, boxShadow: "0 0 10px rgba(139,92,246,0.2)" }}
        animate={{ x: ["-12vw", "115vw"], opacity: [0, 1, 1, 0] }}
        transition={{ duration: s.dur, delay: s.delay, repeat: Infinity, repeatDelay: rand(10, 22), ease: "easeInOut" }} />
    ))}
  </div>
);

/* ═══════════════════════════════════════════════════════════════
   MAGNETIC CURSOR — premium cursor tracking
   ═══════════════════════════════════════════════════════════════ */
const MagneticCursor = () => {
  const mx = useMotionValue(-400);
  const my = useMotionValue(-400);
  const slowX = useSpring(mx, { stiffness: 20, damping: 25, mass: 1.8 });
  const slowY = useSpring(my, { stiffness: 20, damping: 25, mass: 1.8 });

  useEffect(() => {
    const move = (e) => { mx.set(e.clientX); my.set(e.clientY); };
    window.addEventListener("mousemove", move);
    return () => window.removeEventListener("mousemove", move);
  }, [mx, my]);

  return (
    <motion.div className="fixed rounded-full pointer-events-none" style={{ x: slowX, y: slowY, width: 350, height: 350, marginLeft: -175, marginTop: -175, background: "radial-gradient(circle,rgba(139,92,246,0.06),rgba(59,130,246,0.04),rgba(236,72,153,0.02),transparent 70%)", filter: "blur(50px)", zIndex: 9997 }} />
  );
};

/* ═══════════════════════════════════════════════════════════════
   GLASS CARD — reusable style
   ═══════════════════════════════════════════════════════════════ */
const glassStyle = {
  background: "linear-gradient(165deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.03) 50%, rgba(255,255,255,0.05) 100%)",
  backdropFilter: "blur(40px) saturate(130%)",
  WebkitBackdropFilter: "blur(40px) saturate(130%)",
  border: "1px solid rgba(255,255,255,0.08)",
  boxShadow: "0 20px 60px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.08)",
};

/* ═══════════════════════════════════════════════════════════════
   ICONS
   ═══════════════════════════════════════════════════════════════ */
const icons = {
  dashboard: (<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1h-2z" /></svg>),
  messages: (<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>),
  appointments: (<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>),
  profile: (<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>),
  settings: (<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>),
  logout: (<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>),
  chat: (<svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a2 2 0 01-2-2v-1m0 0V6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H9z" /></svg>),
  search: (<svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>),
  calendar: (<svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>),
  bell: (<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>),
};

/* ═══════════════════════════════════════════════════════════════
   SIDEBAR
   ═══════════════════════════════════════════════════════════════ */
const getSidebarItems = (currentUsername) => [
  { key: "dashboard", label: "Dashboard", icon: icons.dashboard, to: "/dashboard" },
  { key: "messages", label: "Messages", icon: icons.messages, to: "/messages" },

  { key: "profile", label: "Profile", icon: icons.profile, to: currentUsername ? `/profile/${currentUsername}` : "/dashboard" },
];

const Sidebar = ({ active, isOpen, onClose, currentUsername }) => {
  const SIDEBAR_ITEMS = getSidebarItems(currentUsername);
  return (
  <>
    <AnimatePresence>
      {isOpen && (
        <motion.div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
      )}
    </AnimatePresence>

    <AnimatePresence>
      {isOpen && (
        <motion.aside
          className="fixed top-0 left-0 h-full z-40 flex flex-col w-[260px] py-6 px-4"
          style={{ ...glassStyle, borderRight: "1px solid rgba(255,255,255,0.06)", borderRadius: 0 }}
          initial={{ x: -280, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -280, opacity: 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        >
      {/* Logo */}
      <Link to="/dashboard" className="flex items-center gap-3 px-3 mb-10">
        <motion.div className="relative flex h-10 w-10 items-center justify-center rounded-xl overflow-hidden"
          style={{ background: "linear-gradient(135deg, rgba(139,92,246,0.25), rgba(59,130,246,0.2))", border: "1px solid rgba(255,255,255,0.1)" }}
          whileHover={{ scale: 1.1, borderColor: "rgba(167,139,250,0.4)" }}
          animate={{ borderColor: ["rgba(255,255,255,0.1)", "rgba(167,139,250,0.2)", "rgba(96,165,250,0.2)", "rgba(255,255,255,0.1)"] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        >
          {/* Logo shimmer */}
          <motion.div className="absolute inset-0 pointer-events-none"
            style={{ background: "linear-gradient(90deg,transparent,rgba(255,255,255,0.1),transparent)", transform: "skewX(-20deg)" }}
            animate={{ left: ["-150%", "250%"] }}
            transition={{ duration: 3.5, repeat: Infinity, repeatDelay: 4, ease: "easeInOut" }} />
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.85)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
        </motion.div>
        <motion.span className="text-xl font-bold"
          style={{ background: "linear-gradient(135deg, #ffffff 0%, #c4b5fd 70%, #818cf8 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}
          animate={{ opacity: [0.85, 1, 0.85] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}>
          MeetSync
        </motion.span>
      </Link>

      {/* Nav */}
      <nav className="flex-1 space-y-1.5">
        {SIDEBAR_ITEMS.map((item, i) => {
          const isActive = active === item.key;
          return (
            <motion.div key={item.key}
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 + i * 0.08, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            >
              <Link to={item.to} onClick={onClose}
                className={`group relative flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-300 ${isActive ? "text-white/90" : "text-white/30 hover:text-white/65"}`}>
                {isActive && (
                  <motion.div className="absolute inset-0 rounded-xl"
                    layoutId="sidebarActive"
                    style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)", boxShadow: "0 0 25px rgba(139,92,246,0.08), inset 0 1px 0 rgba(255,255,255,0.05)" }}
                    transition={{ type: "spring", stiffness: 200, damping: 25 }} />
                )}
                <motion.span className="relative z-10"
                  whileHover={{ scale: 1.15 }}
                  transition={{ type: "spring", stiffness: 300, damping: 15 }}>
                  {item.icon}
                </motion.span>
                <span className="relative z-10">{item.label}</span>
                {isActive && (
                  <motion.div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-full"
                    style={{ background: "linear-gradient(180deg, rgba(139,92,246,0.9), rgba(59,130,246,0.7))", boxShadow: "0 0 12px rgba(139,92,246,0.5)" }}
                    layoutId="sidebarIndicator"
                    animate={{ opacity: [0.7, 1, 0.7], height: [18, 22, 18] }}
                    transition={{ opacity: { duration: 2, repeat: Infinity }, height: { duration: 2, repeat: Infinity } }} />
                )}
                {/* Hover glow for inactive */}
                {!isActive && (
                  <motion.div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)" }} />
                )}
              </Link>
            </motion.div>
          );
        })}
      </nav>

      {/* Bottom */}
      <motion.div className="px-4 pt-4 border-t border-white/5"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}>
        <p className="text-[11px] text-white/15 font-light">MeetSync v1.0</p>
      </motion.div>
        </motion.aside>
      )}
    </AnimatePresence>
  </>
  );
};



/* ═══════════════════════════════════════════════════════════════
   QUICK ACTION CARD — enhanced with rotating border + icon pulse
   ═══════════════════════════════════════════════════════════════ */
const QuickActionCard = ({ icon, title, description, gradient, delay }) => (
  <motion.div
    className="group relative cursor-pointer overflow-hidden rounded-2xl p-6"
    style={glassStyle}
    initial={{ opacity: 0, y: 35, scale: 0.94 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    transition={{ delay, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
    whileHover={{ scale: 1.04, y: -6 }}
    whileTap={{ scale: 0.97 }}
  >
    {/* Rotating conic border on hover */}
    <motion.div className="absolute -inset-[1px] rounded-2xl overflow-hidden opacity-0 group-hover:opacity-100 transition-opacity duration-500">
      <motion.div className="absolute inset-0"
        style={{ background: "conic-gradient(from 0deg, transparent 30%, rgba(167,139,250,0.15), rgba(96,165,250,0.12), transparent 70%, rgba(244,114,182,0.08), transparent 100%)" }}
        animate={{ rotate: 360 }}
        transition={{ duration: 8, repeat: Infinity, ease: "linear" }} />
    </motion.div>

    {/* Hover glow */}
    <motion.div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-600"
      style={{ background: gradient, filter: "blur(45px)" }} />

    {/* Shimmer sweep */}
    <motion.div className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none">
      <motion.div
        style={{ position: "absolute", top: 0, left: "-100%", width: "50%", height: "100%", background: "linear-gradient(90deg,transparent,rgba(255,255,255,0.05),transparent)", transform: "skewX(-15deg)" }}
        animate={{ left: ["-100%", "280%"] }}
        transition={{ duration: 4.5, repeat: Infinity, repeatDelay: 2.5, ease: "easeInOut" }} />
    </motion.div>

    {/* Icon container with pulse */}
    <motion.div className="relative z-10 mb-4 flex h-13 w-13 items-center justify-center rounded-xl"
      style={{ background: gradient, border: "1px solid rgba(255,255,255,0.1)", boxShadow: "0 4px 20px rgba(0,0,0,0.3)", width: 52, height: 52 }}
      animate={{ boxShadow: ["0 4px 20px rgba(0,0,0,0.3)", `0 4px 30px ${gradient.includes("139,92,246") ? "rgba(139,92,246,0.15)" : gradient.includes("59,130,246") ? "rgba(59,130,246,0.15)" : "rgba(236,72,153,0.15)"}`, "0 4px 20px rgba(0,0,0,0.3)"] }}
      transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      whileHover={{ scale: 1.15, rotate: 5 }}>
      <span className="text-white/80 group-hover:text-white transition-colors duration-300">{icon}</span>
    </motion.div>

    <h3 className="relative z-10 text-[15px] font-semibold text-white/85 group-hover:text-white transition-colors duration-300">{title}</h3>
    <p className="relative z-10 mt-1.5 text-[13px] text-white/25 group-hover:text-white/45 transition-colors duration-300 leading-relaxed">{description}</p>

    {/* Arrow */}
    <div className="relative z-10 mt-5 flex items-center text-white/15 group-hover:text-white/50 transition-all duration-400">
      <span className="text-[12px] font-medium mr-2 tracking-wide">Get started</span>
      <motion.svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
        animate={{ x: [0, 0] }}
        whileHover={{ x: 4 }}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
      </motion.svg>
    </div>
  </motion.div>
);

/* ═══════════════════════════════════════════════════════════════
   LIVE CLOCK WIDGET
   ═══════════════════════════════════════════════════════════════ */
const LiveClockWidget = ({ delay }) => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const hours = time.getHours();
  let greeting = "Good Evening";
  if (hours >= 5 && hours < 12) greeting = "Good Morning";
  else if (hours >= 12 && hours < 17) greeting = "Good Afternoon";

  const dateStr = time.toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  const timeStr = time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  return (
    <motion.div
      className="group relative cursor-default overflow-hidden rounded-2xl p-6 flex flex-col justify-center items-center h-full min-h-[160px]"
      style={glassStyle}
      initial={{ opacity: 0, y: 35, scale: 0.94 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
    >
      <motion.div className="absolute -inset-[1px] rounded-2xl overflow-hidden opacity-[0.5] transition-opacity duration-500">
        <motion.div className="absolute inset-0"
          style={{ background: "conic-gradient(from 0deg, transparent 30%, rgba(167,139,250,0.15), rgba(96,165,250,0.12), transparent 70%, rgba(244,114,182,0.08), transparent 100%)" }}
          animate={{ rotate: 360 }}
          transition={{ duration: 8, repeat: Infinity, ease: "linear" }} />
      </motion.div>

      <motion.div className="absolute inset-0 rounded-2xl opacity-[0.6]"
        style={{ background: "linear-gradient(135deg, rgba(139,92,246,0.2), rgba(109,40,217,0.15))", filter: "blur(45px)" }} />

      <div className="relative z-10 text-center flex flex-col items-center justify-center p-2 mb-1">
        <h3 className="text-[13px] font-medium text-white/50 tracking-[0.2em] uppercase mb-3">{greeting}</h3>
        <div className="text-4xl sm:text-5xl font-bold tracking-tight pb-2"
          style={{
            background: "linear-gradient(135deg, #ffffff 0%, #c4b5fd 70%, #818cf8 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            textShadow: "0 0 25px rgba(139,92,246,0.4)"
          }}>
          {timeStr}
        </div>
        <p className="text-[15px] text-white/40 font-medium pt-1">{dateStr}</p>
      </div>
    </motion.div>
  );
};

/* ═══════════════════════════════════════════════════════════════
   MODAL COMPONENT
   ═══════════════════════════════════════════════════════════════ */
const Modal = ({ isOpen, onClose, title, children }) => (
  <AnimatePresence>
    {isOpen && (
      <>
        <motion.div
          className="fixed inset-0 bg-black/60 backdrop-blur-md z-40 flex items-center justify-center p-4"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="w-full max-w-md rounded-2xl p-6 relative overflow-hidden"
            style={glassStyle}
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6 relative z-10">
              <h3 className="text-xl font-bold text-white/90">{title}</h3>
              <button onClick={onClose} className="text-white/40 hover:text-white transition-colors p-1">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="relative z-10">
              {children}
            </div>
          </motion.div>
        </motion.div>
      </>
    )}
  </AnimatePresence>
);

/* ═══════════════════════════════════════════════════════════════
   RECENT ACTIVITY & UPCOMING MEETINGS WIDGETS
   ═══════════════════════════════════════════════════════════════ */
const RecentActivity = ({ conversations, currentUsername }) => {
  const getInitials = (name) => name ? name.split(" ").map(w=>w[0]).join("").toUpperCase().slice(0,2) : "??";
  
  return (
    <motion.div className="relative rounded-2xl p-6 overflow-hidden h-full flex flex-col"
      style={glassStyle}
      initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.75, duration: 0.7 }}
    >
      <div className="relative z-10 flex items-center justify-between mb-5">
        <h3 className="text-[15px] font-semibold text-white/80">Recent Activity</h3>
      </div>
      <div className="relative z-10 flex-1 space-y-2">
        {!Array.isArray(conversations) || conversations.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-sm text-white/30 italic">No recent conversations.</p>
          </div>
        ) : (
          conversations.slice(0, 5).map((conv, i) => {
            const otherUser = conv.otherUser || (conv.participants && Array.isArray(conv.participants) ? conv.participants.find(p => typeof p === 'object' && p.username !== currentUsername) : null);
            const name = otherUser?.name || otherUser?.username || "Unknown User";
            const initials = getInitials(name);
            const timeAgo = conv.updatedAt 
              ? new Date(conv.updatedAt).toLocaleDateString() === new Date().toLocaleDateString() 
                ? new Date(conv.updatedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
                : new Date(conv.updatedAt).toLocaleDateString()
              : "A while ago";
            const color = `rgba(${100 + (i*30)%155}, ${100 + (i*50)%155}, 250, 0.5)`;
            
            return (
              <motion.div key={conv._id || i}
                className="group relative flex items-center gap-4 rounded-xl px-4 py-3.5 cursor-pointer overflow-hidden bg-white/5 hover:bg-white/10 transition-colors"
                whileHover={{ x: 4 }}
              >
                <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-all duration-300 group-hover:scale-105"
                  style={{ background: color.replace("0.5", "0.08"), border: `1px solid ${color.replace("0.5", "0.1")}` }}>
                  {otherUser?.profile_picture ? (
                    <img src={otherUser.profile_picture} alt={name} className="w-full h-full rounded-xl object-cover" />
                  ) : (
                    <span className="text-xs font-bold text-white/80">{initials}</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white/85 truncate font-medium">{conv.lastMessage?.text || `Started a chat with ${name}`}</p>
                  <p className="text-[11px] text-white/40 mt-0.5">{name} • {timeAgo}</p>
                </div>
                <Link to={`/chat/${conv._id}`} className="absolute inset-0" />
              </motion.div>
            );
          })
        )}
      </div>
    </motion.div>
  );
};

const UpcomingMeetings = ({ appointments, currentUsername }) => {
  const getInitials = (name) => name ? name.split(" ").map(w=>w[0]).join("").toUpperCase().slice(0,2) : "??";
  
  return (
    <motion.div className="relative rounded-2xl p-6 overflow-hidden h-full flex flex-col"
      style={glassStyle}
      initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.85, duration: 0.7 }}
    >
      <div className="relative z-10 flex items-center justify-between mb-5">
        <h3 className="text-[15px] font-semibold text-white/80">Upcoming Meetings</h3>
      </div>
      <div className="relative z-10 flex-1 space-y-2">
        {!Array.isArray(appointments) || appointments.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-sm text-white/30 italic">No upcoming meetings.</p>
          </div>
        ) : (
          appointments.slice(0, 5).map((apt) => {
            const partner = apt.host_id?.username === currentUsername ? apt.client_id : apt.host_id;
            const name = partner?.name || partner?.username || "Someone";
            
            return (
              <motion.div key={apt._id}
                className="group relative flex flex-col gap-1 rounded-xl px-4 py-3.5 cursor-default overflow-hidden bg-white/5"
              >
                <div className="absolute left-0 top-[15%] bottom-[15%] w-[3px] rounded-full bg-pink-500/80 shadow-[0_0_8px_rgba(236,72,153,0.5)]" />
                <p className="text-sm text-white/85 font-medium flex items-center gap-2">
                  <svg className="w-4 h-4 text-pink-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                  Meeting with {name}
                </p>
                <div className="flex gap-4 text-[12px] text-white/50 mt-1 pl-6">
                  <span>{apt.scheduled_for ? new Date(apt.scheduled_for).toLocaleDateString() : 'TBD'} at {apt.scheduled_for ? new Date(apt.scheduled_for).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}) : 'TBD'}</span>
                </div>
                {apt.note && <p className="text-[12px] text-white/40 italic mt-2 ml-6 bg-black/20 p-2.5 rounded-lg">"{apt.note}"</p>}
              </motion.div>
            );
          })
        )}
      </div>
    </motion.div>
  );
};

/* ═══════════════════════════════════════════════════════════════
   DASHBOARD PAGE
   ═══════════════════════════════════════════════════════════════ */
export default function DashboardPage() {
  const [user, setUser] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();

  // Data states
  const [conversations, setConversations] = useState([]);
  const [appointments, setAppointments] = useState([]);

  // Modal states
  const [activeModal, setActiveModal] = useState(null); // 'chat' | 'search' | null
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem("user"));
      if (stored) setUser(stored);
    } catch { /* ignore */ }
  }, []);

  // Fetch Dashboard Data
  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;

      try {
        const [convRes, apptRes] = await Promise.all([
          axios.get(`${API_BASE}/conversations`, { headers: { Authorization: `Bearer ${token}` } }),
          axios.get(`${API_BASE}/appointments`, { headers: { Authorization: `Bearer ${token}` } }).catch(() => ({ data: [] }))
        ]);

        setConversations(Array.isArray(convRes.data) ? convRes.data : []);
        
        // Ensure appointments API has been returning properly
        if (Array.isArray(apptRes.data)) {
          const accepted = apptRes.data.filter(a => a.status === 'accepted');
          // Sort nearest date first
          accepted.sort((a,b) => new Date(a.date) - new Date(b.date));
          setAppointments(accepted);
        } else {
          setAppointments([]);
        }
      } catch (err) {
        console.error("Dashboard fetch error:", err);
      }
    };
    fetchData();
  }, []);

  // Handle Search Modal Debounce
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (searchQuery.trim().length >= 1) {
        setIsSearching(true);
        try {
          const token = localStorage.getItem("token");
          const res = await axios.get(`${API_BASE}/users/search?q=${searchQuery}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          // Filter out self
          if (Array.isArray(res.data)) {
            setSearchResults(res.data.filter(u => u.username !== user?.username));
          } else {
            setSearchResults([]);
          }
        } catch (err) {
          console.error(err);
        } finally {
          setIsSearching(false);
        }
      } else {
        setSearchResults([]);
      }
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, user]);

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/";
  };

  const handleStartChat = async (targetUsername) => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(`${API_BASE}/conversations`, { username: targetUsername }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const convId = res.data._id || res.data.id || res.data.conversationId;
      navigate(`/chat/${convId}`);
    } catch (err) {
      console.error(err);
    }
  };

  const username = user?.name || user?.username || "User";
  const initials = username.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);

  return (
    <div className="relative min-h-screen overflow-hidden" style={{ background: "#030108" }}>
      <Background />
      <MagneticCursor />
      <Sidebar active="dashboard" isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} currentUsername={user?.username || ""} />

      <div className="relative z-10 flex flex-col min-h-screen">
        {/* ══════ TOP NAVBAR ══════ */}
        <motion.header
          className="sticky top-0 z-20 flex items-center justify-between px-6 py-4 sm:px-8"
          style={{ ...glassStyle, borderRadius: 0, borderTop: "none", borderLeft: "none", borderRight: "none", borderBottom: "1px solid rgba(255,255,255,0.06)" }}
          initial={{ opacity: 0, y: -30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}
        >
          <motion.button className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 border border-white/5 text-white/40 hover:text-white/70"
            onClick={() => setSidebarOpen(!sidebarOpen)} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" /></svg>
          </motion.button>

          <h2 className="hidden lg:block text-lg font-semibold text-white/70">Dashboard</h2>

          <div className="flex items-center gap-3">
            <NotificationBell />
            <div className="flex items-center gap-3">
              <div className="hidden sm:block text-right">
                <p className="text-sm font-medium text-white/60">{username}</p>
                <div className="flex items-center justify-end gap-1.5 mt-0.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]" />
                  <p className="text-[11px] text-white/20">Online</p>
                </div>
              </div>
              <div className="relative flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-violet-500/30 to-blue-500/30 border border-white/10 text-sm font-bold text-white/80 overflow-hidden">
                {user?.profile_picture ? (
                  <img src={user.profile_picture} alt={username} className="w-full h-full object-cover" />
                ) : (
                  initials
                )}
              </div>
            </div>
            <motion.button onClick={logout} className="group flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium text-white/30 bg-white/5 border border-white/5 hover:text-red-400/70 hover:border-red-500/20"
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.96 }}>
              {icons.logout}
              <span className="hidden sm:inline">Logout</span>
            </motion.button>
          </div>
        </motion.header>

        {/* ══════ MAIN CONTENT ══════ */}
        <main className="flex-1 px-6 py-8 sm:px-8 max-w-[1200px] w-full mx-auto pb-28">
          {/* Welcome */}
          <motion.div className="mb-8" initial={{ opacity: 0, y: 25 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15, duration: 0.7 }}>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
              <span className="text-white/35">Welcome back, </span>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-violet-200 to-indigo-400">{username}</span>
            </h1>
            <p className="mt-2 text-[14px] text-white/18">Here's what's happening with your network today.</p>
          </motion.div>

          {/* Quick actions row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-8">
            <div>
              <LiveClockWidget delay={0.3} />
            </div>
            <div onClick={() => { setActiveModal('search'); setSearchQuery(''); }}>
              <QuickActionCard icon={icons.search} title="Find Users" description="Search and connect with people across the platform to expand your network." gradient="linear-gradient(135deg, rgba(59,130,246,0.2), rgba(6,182,212,0.15))" delay={0.4} />
            </div>
          </div>

          {/* Widgets Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-[300px]">
            <RecentActivity conversations={conversations} currentUsername={user?.username} />
            <UpcomingMeetings appointments={appointments} currentUsername={user?.username} />
          </div>
        </main>
      </div>

      {/* ══════ MOBILE BOTTOM NAV BAR ══════ */}
      <motion.nav
        className="fixed bottom-0 left-0 right-0 z-50 flex md:hidden items-center justify-around py-2 px-2"
        style={{
          ...glassStyle,
          borderRadius: 0,
          borderBottom: "none",
          borderLeft: "none",
          borderRight: "none",
          borderTop: "1px solid rgba(255,255,255,0.08)",
          background: "linear-gradient(165deg, rgba(10,6,24,0.95) 0%, rgba(5,2,8,0.98) 100%)",
          backdropFilter: "blur(30px) saturate(150%)",
          WebkitBackdropFilter: "blur(30px) saturate(150%)",
        }}
        initial={{ y: 80 }}
        animate={{ y: 0 }}
        transition={{ delay: 0.5, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      >
        {[
          { key: "dashboard", label: "Home", icon: icons.dashboard, to: "/dashboard" },
          { key: "messages", label: "Chat", icon: icons.messages, to: "/messages" },
          { key: "profile", label: "Profile", icon: icons.profile, to: user?.username ? `/profile/${user.username}` : "/dashboard" },
        ].map((item) => {
          const isActive = item.key === "dashboard";
          return (
            <Link key={item.key} to={item.to}
              className={`flex flex-col items-center gap-1 px-4 py-1.5 rounded-xl transition-all duration-300 ${isActive ? "text-violet-400" : "text-white/30 hover:text-white/60"}`}
            >
              <motion.span whileTap={{ scale: 0.85 }}>
                {item.icon}
              </motion.span>
              <span className="text-[10px] font-medium">{item.label}</span>
              {isActive && (
                <motion.div
                  className="absolute -bottom-0.5 h-[2px] w-6 rounded-full"
                  style={{ background: "linear-gradient(90deg, rgba(139,92,246,0.8), rgba(59,130,246,0.6))", boxShadow: "0 0 8px rgba(139,92,246,0.4)" }}
                  layoutId="mobileNavIndicator"
                />
              )}
            </Link>
          );
        })}
      </motion.nav>

      {/* ══════ SEARCH MODAL ══════ */}
      <Modal isOpen={!!activeModal} onClose={() => setActiveModal(null)} title={activeModal === 'chat' ? "Start Conversation" : "Find Users"}>
        <input
          type="text"
          placeholder="Search by username or name..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-violet-500/50 mb-4 transition-colors"
          autoFocus
        />
        
        <div className="max-h-60 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
          {isSearching ? (
            <div className="text-center text-white/40 py-4 italic">Searching users...</div>
          ) : Array.isArray(searchResults) && searchResults.length > 0 ? (
            searchResults.map(u => (
              <div key={u._id || u.username} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                  {u.profile_picture ? (
                    <img src={u.profile_picture} alt={u.username} className="w-10 h-10 rounded-full object-cover shrink-0" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-violet-500/20 text-violet-300 flex items-center justify-center font-bold shrink-0">
                      {u.name ? u.name[0].toUpperCase() : u.username[0].toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-white/90 font-medium text-sm truncate">{u.name}</p>
                    <p className="text-white/40 text-[11px] truncate">@{u.username}</p>
                  </div>
                </div>
                
                {activeModal === 'chat' ? (
                  <button onClick={() => handleStartChat(u.username)} className="px-3.5 py-1.5 bg-violet-500/20 hover:bg-violet-500/40 text-violet-300 rounded-lg text-sm font-medium transition-colors shrink-0">Chat</button>
                ) : (
                  <button onClick={() => navigate(`/profile/${u.username}`)} className="px-3.5 py-1.5 bg-blue-500/20 hover:bg-blue-500/40 text-blue-300 rounded-lg text-sm font-medium transition-colors shrink-0">Profile</button>
                )}
              </div>
            ))
          ) : searchQuery.length > 0 ? (
            <div className="text-center text-white/40 py-4 italic">No users found for "{searchQuery}".</div>
          ) : (
            <div className="text-center text-white/40 py-4 italic">Type a username to start searching.</div>
          )}
        </div>
      </Modal>
    </div>
  );
}
