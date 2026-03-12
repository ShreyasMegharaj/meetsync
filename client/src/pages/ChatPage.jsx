import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, useMotionValue, useSpring } from "framer-motion";
import { Link, useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import socket from "../utils/socket";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

/* ─── helpers ─── */
const rand = (a, b) => Math.random() * (b - a) + a;

/* ═══════════════════════════════════════════════════════════════
   AMBIENT BACKGROUND
   ═══════════════════════════════════════════════════════════════ */
const BLOBS = [
  { gradient: "radial-gradient(circle,rgba(109,40,217,0.35),rgba(59,130,246,0.12),transparent 70%)", size: 600, blur: 110, dur: 30, opacity: 0.4, path: { x: [-250, 600, 150, -150, 450, -250], y: [-150, 350, -80, 550, 100, -150], s: [1, 1.2, 0.88, 1.12, 0.92, 1] } },
  { gradient: "radial-gradient(circle,rgba(219,39,119,0.25),rgba(168,85,247,0.14),transparent 70%)", size: 480, blur: 125, dur: 36, opacity: 0.32, path: { x: [750, -80, 380, 80, 650, 750], y: [450, 20, 380, -120, 280, 450], s: [0.92, 1.25, 0.95, 1.18, 0.86, 0.92] } },
  { gradient: "radial-gradient(circle,rgba(6,182,212,0.22),rgba(59,130,246,0.14),transparent 70%)", size: 520, blur: 105, dur: 34, opacity: 0.33, path: { x: [250, -180, 550, 80, -120, 250], y: [650, 120, -120, 480, 220, 650], s: [1.08, 0.82, 1.25, 0.88, 1.12, 1.08] } },
  { gradient: "radial-gradient(circle,rgba(139,92,246,0.3),rgba(236,72,153,0.1),transparent 70%)", size: 400, blur: 130, dur: 42, opacity: 0.25, path: { x: [-150, 450, 750, 180, 550, -150], y: [280, -180, 450, 80, 650, 280], s: [1, 1.35, 0.78, 1.18, 0.95, 1] } },
];

const MOTES = Array.from({ length: 45 }, (_, i) => ({
  id: i, size: rand(1.2, 3.8),
  color: [`rgba(167,139,250,`, `rgba(96,165,250,`, `rgba(244,114,182,`, `rgba(34,211,238,`, `rgba(129,140,248,`][i % 5] + `${rand(0.25, 0.65)})`,
  dur: rand(16, 40), delay: rand(0, 12),
  path: { x: Array.from({ length: 7 }, () => rand(-50, 1800)), y: Array.from({ length: 7 }, () => rand(-50, 1000)) },
}));

const MSG_BIRDS = Array.from({ length: 8 }, (_, i) => ({
  id: i,
  size: rand(14, 26),
  color: [`rgba(167,139,250,`, `rgba(96,165,250,`, `rgba(244,114,182,`, `rgba(34,211,238,`, `rgba(129,140,248,`, `rgba(192,132,252,`, `rgba(251,146,60,`, `rgba(74,222,128,`][i % 8] + `${rand(0.12, 0.3)})`,
  top: rand(5, 90),
  dur: rand(18, 35),
  delay: rand(0, 15),
  yDrift: rand(-60, 60),
  direction: i % 2 === 0 ? 1 : -1,
}));

const STREAKS = Array.from({ length: 5 }, (_, i) => ({
  id: i, delay: rand(2, 18), dur: rand(2.5, 4.5), top: rand(8, 88), angle: rand(-18, -4),
}));

const RINGS = [
  { sz: 220, x: 82, y: 10, dur: 30, c: "rgba(139,92,246,0.04)" },
  { sz: 300, x: 8, y: 72, dur: 38, c: "rgba(59,130,246,0.035)" },
  { sz: 170, x: 55, y: 58, dur: 26, c: "rgba(236,72,153,0.035)" },
];

const FLOAT_BUBBLES = Array.from({ length: 6 }, (_, i) => ({
  id: i,
  size: rand(20, 36),
  color: [`rgba(167,139,250,`, `rgba(96,165,250,`, `rgba(244,114,182,`, `rgba(34,211,238,`, `rgba(129,140,248,`, `rgba(192,132,252,`][i % 6] + `${rand(0.06, 0.15)})`,
  strokeColor: [`rgba(167,139,250,`, `rgba(96,165,250,`, `rgba(244,114,182,`, `rgba(34,211,238,`, `rgba(129,140,248,`, `rgba(192,132,252,`][i % 6] + `${rand(0.15, 0.35)})`,
  dur: rand(20, 40),
  delay: rand(0, 12),
  path: { x: Array.from({ length: 5 }, () => rand(50, 1400)), y: Array.from({ length: 5 }, () => rand(50, 800)) },
}));

const Background = () => (
  <div className="fixed inset-0 overflow-hidden" style={{ zIndex: 0 }}>
    <div className="absolute inset-0" style={{ background: "linear-gradient(145deg, #050208 0%, #0a0618 30%, #0d0a1a 50%, #06050f 70%, #020104 100%)" }} />
    <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 25% 15%, rgba(109,40,217,0.07) 0%, transparent 55%)" }} />
    <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 75% 85%, rgba(59,130,246,0.05) 0%, transparent 55%)" }} />
    <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 50% 50%, rgba(236,72,153,0.03) 0%, transparent 50%)" }} />
    <div className="absolute inset-0 opacity-[0.015]" style={{ backgroundImage: "linear-gradient(rgba(139,92,246,0.5) 1px,transparent 1px),linear-gradient(90deg,rgba(139,92,246,0.5) 1px,transparent 1px)", backgroundSize: "80px 80px" }} />
    {BLOBS.map((b, i) => (
      <motion.div key={`b${i}`} className="absolute rounded-full pointer-events-none will-change-transform"
        style={{ width: b.size, height: b.size, background: b.gradient, filter: `blur(${b.blur}px)`, opacity: b.opacity }}
        animate={{ x: b.path.x, y: b.path.y, scale: b.path.s }}
        transition={{ duration: b.dur, repeat: Infinity, repeatType: "loop", ease: "linear" }} />
    ))}
    {RINGS.map((r, i) => (
      <motion.div key={`ring${i}`} className="absolute rounded-full pointer-events-none"
        style={{ width: r.sz, height: r.sz, border: `1px solid ${r.c}`, left: `${r.x}%`, top: `${r.y}%` }}
        animate={{ rotate: 360, scale: [1, 1.1, 0.93, 1.08, 1] }}
        transition={{ rotate: { duration: r.dur, repeat: Infinity, ease: "linear" }, scale: { duration: r.dur * 0.7, repeat: Infinity, repeatType: "mirror", ease: "easeInOut" } }} />
    ))}
    {MOTES.map((m) => (
      <motion.div key={`m${m.id}`} className="absolute rounded-full pointer-events-none"
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
    {MSG_BIRDS.map((bird) => (
      <motion.div key={`bird${bird.id}`} className="absolute pointer-events-none"
        style={{ top: `${bird.top}%` }}
        animate={{
          x: bird.direction === 1 ? ["-8vw", "110vw"] : ["110vw", "-8vw"],
          y: [0, bird.yDrift, -bird.yDrift * 0.6, bird.yDrift * 0.4, 0],
          rotate: bird.direction === 1 ? [0, -3, 5, -2, 0] : [0, 3, -5, 2, 0],
        }}
        transition={{ duration: bird.dur, delay: bird.delay, repeat: Infinity, repeatDelay: rand(5, 18), ease: "easeInOut" }}>
        <svg width={bird.size} height={bird.size} viewBox="0 0 24 24" fill="none" style={{ filter: `drop-shadow(0 0 6px ${bird.color})`, transform: bird.direction === -1 ? "scaleX(-1)" : "none" }}>
          <path d="M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            stroke={bird.color} strokeWidth="1" fill={bird.color.replace(/[\d.]+\)$/, "0.05)")} />
          <circle cx="8" cy="12" r="0.8" fill={bird.color} />
          <circle cx="12" cy="12" r="0.8" fill={bird.color} />
          <circle cx="16" cy="12" r="0.8" fill={bird.color} />
        </svg>
      </motion.div>
    ))}
    {FLOAT_BUBBLES.map((fb) => (
      <motion.div key={`fb${fb.id}`} className="absolute pointer-events-none"
        animate={{ x: fb.path.x, y: fb.path.y, rotate: [0, 15, -10, 8, 0], scale: [1, 1.1, 0.92, 1.05, 1] }}
        transition={{ duration: fb.dur, delay: fb.delay, repeat: Infinity, repeatType: "loop", ease: "easeInOut" }}>
        <svg width={fb.size} height={fb.size} viewBox="0 0 24 24" fill="none" style={{ opacity: 0.6, filter: `drop-shadow(0 0 8px ${fb.strokeColor})` }}>
          <path d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a2 2 0 01-2-2v-1m0 0V6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H9z"
            stroke={fb.strokeColor} strokeWidth="0.8" fill={fb.color} />
        </svg>
      </motion.div>
    ))}
  </div>
);

/* ─── Magnetic Cursor ─── */
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
    <motion.div className="fixed rounded-full pointer-events-none"
      style={{ x: slowX, y: slowY, width: 350, height: 350, marginLeft: -175, marginTop: -175, background: "radial-gradient(circle,rgba(139,92,246,0.06),rgba(59,130,246,0.04),rgba(236,72,153,0.02),transparent 70%)", filter: "blur(50px)", zIndex: 9997 }} />
  );
};

/* ─── Glass Style ─── */
const glassStyle = {
  background: "linear-gradient(165deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.03) 50%, rgba(255,255,255,0.05) 100%)",
  backdropFilter: "blur(40px) saturate(130%)",
  WebkitBackdropFilter: "blur(40px) saturate(130%)",
  border: "1px solid rgba(255,255,255,0.08)",
  boxShadow: "0 20px 60px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.08)",
};

/* ─── Icons ─── */
const icons = {
  dashboard: (<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1h-2z" /></svg>),
  messages: (<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>),
  appointments: (<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>),
  profile: (<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>),
  settings: (<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>),
  logout: (<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>),
  send: (<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" /></svg>),
  emoji: (<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>),
  attach: (<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.372L8.552 18.32m.009-.01l-.01.01m5.699-9.941l-7.81 7.81a1.5 1.5 0 002.112 2.13" /></svg>),
  phone: (<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" /></svg>),
  video: (<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9.75a2.25 2.25 0 002.25-2.25V7.5a2.25 2.25 0 00-2.25-2.25H4.5A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" /></svg>),
  search: (<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>),
  bell: (<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>),
  calendarPlus: (<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /><path strokeLinecap="round" strokeLinejoin="round" d="M12 11v6m3-3H9" /></svg>),
  clock: (<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>),
  check: (<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>),
  xMark: (<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>),
};

/* ─── Sidebar ─── */
const getSidebarItems = (currentUsername) => [
  { key: "dashboard", label: "Dashboard", icon: icons.dashboard, to: "/dashboard" },
  { key: "messages", label: "Messages", icon: icons.messages, to: "/messages" },
  { key: "profile", label: "Profile", icon: icons.profile, to: currentUsername ? `/profile/${currentUsername}` : "/dashboard" },
  { key: "settings", label: "Settings", icon: icons.settings, to: "/settings" },
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
        <motion.aside className="fixed top-0 left-0 h-full z-40 flex flex-col w-[260px] py-6 px-4"
          style={{ ...glassStyle, borderRight: "1px solid rgba(255,255,255,0.06)", borderRadius: 0 }}
          initial={{ x: -280, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -280, opacity: 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}>
          <Link to="/dashboard" className="flex items-center gap-3 px-3 mb-10">
            <motion.div className="relative flex h-10 w-10 items-center justify-center rounded-xl overflow-hidden"
              style={{ background: "linear-gradient(135deg, rgba(139,92,246,0.25), rgba(59,130,246,0.2))", border: "1px solid rgba(255,255,255,0.1)" }}
              whileHover={{ scale: 1.1 }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.85)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </motion.div>
            <motion.span className="text-xl font-bold"
              style={{ background: "linear-gradient(135deg, #ffffff 0%, #c4b5fd 70%, #818cf8 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
              MeetSync
            </motion.span>
          </Link>
          <nav className="flex-1 space-y-1.5">
            {SIDEBAR_ITEMS.map((item, i) => {
              const isActive = active === item.key;
              return (
                <motion.div key={item.key} initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 + i * 0.08, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}>
                  <Link to={item.to} onClick={onClose}
                    className={`group relative flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-300 ${isActive ? "text-white/90" : "text-white/30 hover:text-white/65"}`}>
                    {isActive && (
                      <motion.div className="absolute inset-0 rounded-xl" layoutId="sidebarActive"
                        style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)", boxShadow: "0 0 25px rgba(139,92,246,0.08)" }}
                        transition={{ type: "spring", stiffness: 200, damping: 25 }} />
                    )}
                    <span className="relative z-10">{item.icon}</span>
                    <span className="relative z-10">{item.label}</span>
                    {isActive && (
                      <motion.div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-full"
                        style={{ background: "linear-gradient(180deg, rgba(139,92,246,0.9), rgba(59,130,246,0.7))", boxShadow: "0 0 12px rgba(139,92,246,0.5)" }}
                        layoutId="sidebarIndicator" />
                    )}
                  </Link>
                </motion.div>
              );
            })}
          </nav>
          <motion.div className="px-4 pt-4 border-t border-white/5" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}>
            <p className="text-[11px] text-white/15 font-light">MeetSync v1.0</p>
          </motion.div>
        </motion.aside>
      )}
    </AnimatePresence>
  </>
  );
};

/* ─── Conversation List Item ─── */
const ConversationItem = ({ convo, isActive, onClick, index }) => {
  const colors = [
    "rgba(139,92,246,0.35)", "rgba(59,130,246,0.35)", "rgba(236,72,153,0.35)",
    "rgba(6,182,212,0.35)", "rgba(129,140,248,0.35)", "rgba(217,70,239,0.35)", "rgba(52,211,153,0.35)",
  ];
  return (
    <motion.div
      className={`group relative flex items-center gap-3 rounded-xl px-3 py-3 cursor-pointer transition-all duration-300 ${isActive ? "bg-white/[0.06]" : "hover:bg-white/[0.03]"}`}
      style={isActive ? { border: "1px solid rgba(255,255,255,0.08)", boxShadow: "0 0 20px rgba(139,92,246,0.06)" } : { border: "1px solid transparent" }}
      onClick={onClick}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.15 + index * 0.06, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ x: 4 }}
    >
      {isActive && (
        <motion.div className="absolute left-0 top-[20%] bottom-[20%] w-[3px] rounded-full"
          style={{ background: "linear-gradient(180deg, rgba(139,92,246,0.9), rgba(59,130,246,0.7))", boxShadow: "0 0 12px rgba(139,92,246,0.5)" }}
          layoutId="activeConvo" transition={{ type: "spring", stiffness: 200, damping: 25 }} />
      )}
      <div className="relative shrink-0">
        <div className="flex h-10 w-10 items-center justify-center rounded-full text-xs font-bold text-white/80"
          style={{ background: `linear-gradient(135deg, ${colors[convo.id % colors.length]}, ${colors[(convo.id + 2) % colors.length]})`, border: "1px solid rgba(255,255,255,0.1)" }}>
          {convo.avatar}
        </div>
        {convo.online && (
          <motion.div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full"
            style={{ background: "rgba(52,211,153,0.9)", border: "2px solid rgba(10,6,24,0.9)", boxShadow: "0 0 8px rgba(52,211,153,0.4)" }}
            animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 2, repeat: Infinity }} />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <p className={`text-sm font-semibold truncate ${isActive ? "text-white/90" : "text-white/60 group-hover:text-white/80"} transition-colors duration-300`}>{convo.name}</p>
          <span className="text-[10px] text-white/20 shrink-0 ml-2">{convo.time}</span>
        </div>
        <p className="text-[12px] text-white/25 truncate mt-0.5">{convo.lastMessage}</p>
      </div>
      {convo.unread > 0 && (
        <motion.div className="shrink-0 flex items-center justify-center h-5 min-w-[20px] rounded-full px-1.5 text-[10px] font-bold text-white/90"
          style={{ background: "linear-gradient(135deg, rgba(139,92,246,0.7), rgba(59,130,246,0.6))", boxShadow: "0 0 12px rgba(139,92,246,0.3)" }}
          animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 2, repeat: Infinity }}>
          {convo.unread}
        </motion.div>
      )}
    </motion.div>
  );
};

/* ─── Chat Bubble ─── */
const ChatBubble = ({ message, index }) => {
  const isMe = message.sender === "me";
  return (
    <motion.div
      className={`flex ${isMe ? "justify-end" : "justify-start"} mb-3`}
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: index * 0.05, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className={`relative max-w-[70%] px-4 py-2.5 rounded-2xl ${isMe ? "rounded-br-md" : "rounded-bl-md"}`}
        style={isMe ? {
          background: "linear-gradient(135deg, rgba(139,92,246,0.25), rgba(59,130,246,0.2))",
          border: "1px solid rgba(139,92,246,0.15)",
          boxShadow: "0 4px 20px rgba(139,92,246,0.08)",
        } : {
          background: "linear-gradient(165deg, rgba(255,255,255,0.07), rgba(255,255,255,0.03))",
          border: "1px solid rgba(255,255,255,0.06)",
          boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
        }}>
        <p className="text-[13px] text-white/80 leading-relaxed">{message.text}</p>
        <p className={`text-[10px] mt-1 ${isMe ? "text-white/25 text-right" : "text-white/20"}`}>{message.time}</p>
      </div>
    </motion.div>
  );
};

/* ─── Appointment Card ─── */
const statusColors = {
  pending:   { bg: "rgba(251,191,36,0.1)",  border: "rgba(251,191,36,0.2)",  text: "text-amber-400/80",   label: "Pending",   glow: "rgba(251,191,36,0.06)"  },
  accepted:  { bg: "rgba(52,211,153,0.1)",  border: "rgba(52,211,153,0.2)",  text: "text-emerald-400/80", label: "Accepted",  glow: "rgba(52,211,153,0.08)"  },
  rejected:  { bg: "rgba(239,68,68,0.1)",   border: "rgba(239,68,68,0.2)",   text: "text-red-400/80",     label: "Rejected",  glow: "rgba(239,68,68,0.06)"   },
  cancelled: { bg: "rgba(156,163,175,0.1)", border: "rgba(156,163,175,0.2)", text: "text-gray-400/80",    label: "Cancelled", glow: "rgba(156,163,175,0.04)" },
};

const AppointmentCard = ({ appointment, index, onAccept, onReject, onCancel, currentUserId }) => {
  const st = statusColors[appointment.status] || statusColors.pending;
  // ── Safe: currentUserId is already resolved before this component is called ──
  const isHost = appointment.host_id === currentUserId || appointment.sender === "me";
  const isFinalized = ["accepted", "rejected", "cancelled"].includes(appointment.status);

  return (
    <motion.div
      className="flex justify-center mb-4"
      initial={{ opacity: 0, y: 30, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: index * 0.05, duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
    >
      <motion.div
        className="w-full max-w-[400px] rounded-2xl p-5 relative overflow-hidden group cursor-default"
        style={{ ...glassStyle, background: "linear-gradient(165deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.03) 50%, rgba(255,255,255,0.05) 100%)" }}
        whileHover={{ boxShadow: `0 20px 60px rgba(0,0,0,0.45), 0 0 30px ${st.glow}, inset 0 1px 0 rgba(255,255,255,0.1)` }}
        transition={{ duration: 0.3 }}
      >
        <motion.div className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none" style={{ zIndex: 0 }}>
          <motion.div style={{ position: "absolute", top: 0, left: "-100%", width: "40%", height: "100%", background: "linear-gradient(90deg,transparent,rgba(255,255,255,0.04),transparent)", transform: "skewX(-12deg)" }}
            animate={{ left: ["-100%", "300%"] }}
            transition={{ duration: 6, repeat: Infinity, repeatDelay: 5, ease: "easeInOut" }} />
        </motion.div>
        <AnimatePresence>
          {isFinalized && (
            <motion.div className="absolute inset-0 rounded-2xl pointer-events-none"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              style={{ background: `radial-gradient(ellipse at 50% 0%, ${st.glow} 0%, transparent 70%)` }}
              transition={{ duration: 0.6 }} />
          )}
        </AnimatePresence>
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <motion.div className="flex h-8 w-8 items-center justify-center rounded-lg"
                style={{ background: "linear-gradient(135deg, rgba(139,92,246,0.25), rgba(59,130,246,0.2))", border: "1px solid rgba(255,255,255,0.08)" }}
                whileHover={{ scale: 1.1 }} transition={{ type: "spring", stiffness: 300, damping: 15 }}>
                <svg className="w-4 h-4 text-white/70" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </motion.div>
              <span className="text-[13px] font-semibold text-white/70">Meeting Request</span>
            </div>
            <motion.span
              className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${st.text}`}
              style={{ background: st.bg, border: `1px solid ${st.border}` }}
              key={appointment.status}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: [1, 1.08, 1], opacity: 1 }}
              transition={{ scale: { duration: 0.6, ease: "easeOut" }, opacity: { duration: 0.3 } }}
            >
              {isHost && appointment.status === "pending" ? "Waiting for response" : st.label}
            </motion.span>
          </div>
          <div className="space-y-2.5 mb-4">
            <p className="text-[15px] font-semibold text-white/85">{appointment.title}</p>
            <div className="flex items-center gap-4 text-[12px] text-white/40">
              <span className="flex items-center gap-1.5">{icons.calendarPlus} {appointment.date}</span>
              <span className="flex items-center gap-1.5">{icons.clock} {appointment.time}</span>
            </div>
            <div className="flex items-center gap-1.5 text-[12px] text-white/35">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {appointment.duration}
            </div>
            {appointment.note && (
              <p className="text-[12px] text-white/30 leading-relaxed italic border-l-2 border-white/10 pl-3">
                {appointment.note}
              </p>
            )}
          </div>
          {appointment.status === "pending" && (
            <motion.div className="flex items-center gap-2"
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.4 }}>
              {isHost ? (
                <motion.button
                  onClick={() => onCancel(appointment.id)}
                  className="flex-1 flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-[12px] font-semibold text-white/40 hover:text-white/70 transition-all duration-300"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
                  whileHover={{ scale: 1.03, borderColor: "rgba(255,255,255,0.15)", boxShadow: "0 0 15px rgba(255,255,255,0.04)" }}
                  whileTap={{ scale: 0.96 }}>
                  {icons.xMark} Cancel Request
                </motion.button>
              ) : (
                <>
                  <motion.button
                    onClick={() => onAccept(appointment.id)}
                    className="flex-1 flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-[12px] font-semibold text-emerald-400/80 transition-all duration-300"
                    style={{ background: "rgba(52,211,153,0.08)", border: "1px solid rgba(52,211,153,0.15)" }}
                    whileHover={{ scale: 1.04, boxShadow: "0 0 25px rgba(52,211,153,0.15)", borderColor: "rgba(52,211,153,0.3)" }}
                    whileTap={{ scale: 0.95 }}>
                    {icons.check} Accept
                  </motion.button>
                  <motion.button
                    onClick={() => onReject(appointment.id)}
                    className="flex-1 flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-[12px] font-semibold text-red-400/80 transition-all duration-300"
                    style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.15)" }}
                    whileHover={{ scale: 1.04, boxShadow: "0 0 25px rgba(239,68,68,0.15)", borderColor: "rgba(239,68,68,0.3)" }}
                    whileTap={{ scale: 0.95 }}>
                    {icons.xMark} Reject
                  </motion.button>
                </>
              )}
            </motion.div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

/* ─── Appointment Modal ─── */
const DURATION_OPTIONS = ["15 minutes", "30 minutes", "45 minutes", "60 minutes"];

const inputStyle = {
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.08)",
  color: "rgba(255,255,255,0.8)",
};

const AppointmentModal = ({ isOpen, onClose, onSubmit, isLoading }) => {
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [duration, setDuration] = useState(DURATION_OPTIONS[1]);
  const [note, setNote] = useState("");

  const handleSubmit = () => {
    if (!title.trim() || !date || !time) return;
    onSubmit({ title: title.trim(), date, time, duration, note: note.trim() });
  };

  const resetForm = () => { setTitle(""); setDate(""); setTime(""); setDuration(DURATION_OPTIONS[1]); setNote(""); };
  useEffect(() => { if (!isOpen) resetForm(); }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose} />
          <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div
              className="w-full max-w-[440px] rounded-2xl p-6 relative overflow-hidden"
              style={{ ...glassStyle, background: "linear-gradient(165deg, rgba(255,255,255,0.09) 0%, rgba(255,255,255,0.04) 50%, rgba(255,255,255,0.06) 100%)", boxShadow: "0 30px 80px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.1)" }}
              initial={{ scale: 0.9, y: 30, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.9, y: 30, opacity: 0 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              onClick={(e) => e.stopPropagation()}
            >
              <motion.div className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none">
                <motion.div style={{ position: "absolute", top: 0, left: "-100%", width: "50%", height: "100%", background: "linear-gradient(90deg,transparent,rgba(255,255,255,0.04),transparent)", transform: "skewX(-12deg)" }}
                  animate={{ left: ["-100%", "300%"] }}
                  transition={{ duration: 5, repeat: Infinity, repeatDelay: 4, ease: "easeInOut" }} />
              </motion.div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <motion.div className="flex h-10 w-10 items-center justify-center rounded-xl"
                      style={{ background: "linear-gradient(135deg, rgba(139,92,246,0.25), rgba(59,130,246,0.2))", border: "1px solid rgba(255,255,255,0.1)" }}
                      animate={{ borderColor: ["rgba(255,255,255,0.1)", "rgba(167,139,250,0.25)", "rgba(255,255,255,0.1)"] }}
                      transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}>
                      <svg className="w-5 h-5 text-white/70" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </motion.div>
                    <div>
                      <h3 className="text-[16px] font-bold text-white/85">Schedule Appointment</h3>
                      <p className="text-[11px] text-white/25">Send a meeting request</p>
                    </div>
                  </div>
                  <motion.button onClick={onClose}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-white/30 hover:text-white/60 transition-colors"
                    style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}
                    whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                    {icons.xMark}
                  </motion.button>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-[11px] font-medium text-white/35 mb-1.5 uppercase tracking-wider">Meeting Title</label>
                    <input type="text" value={title} onChange={(e) => setTitle(e.target.value)}
                      placeholder="e.g. Project Review"
                      className="w-full rounded-xl px-4 py-2.5 text-sm placeholder-white/15 outline-none transition-all duration-300 focus:border-violet-500/30"
                      style={inputStyle} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-medium text-white/35 mb-1.5 uppercase tracking-wider">Date</label>
                      <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
                        className="w-full rounded-xl px-4 py-2.5 text-sm outline-none transition-all duration-300 focus:border-violet-500/30 [color-scheme:dark]"
                        style={inputStyle} />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-white/35 mb-1.5 uppercase tracking-wider">Time</label>
                      <input type="time" value={time} onChange={(e) => setTime(e.target.value)}
                        className="w-full rounded-xl px-4 py-2.5 text-sm outline-none transition-all duration-300 focus:border-violet-500/30 [color-scheme:dark]"
                        style={inputStyle} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-white/35 mb-1.5 uppercase tracking-wider">Duration</label>
                    <select value={duration} onChange={(e) => setDuration(e.target.value)}
                      className="w-full rounded-xl px-4 py-2.5 text-sm outline-none transition-all duration-300 focus:border-violet-500/30 [color-scheme:dark]"
                      style={inputStyle}>
                      {DURATION_OPTIONS.map((d) => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-white/35 mb-1.5 uppercase tracking-wider">Note / Instructions</label>
                    <textarea value={note} onChange={(e) => setNote(e.target.value)}
                      placeholder="Optional meeting notes..."
                      rows={3}
                      className="w-full rounded-xl px-4 py-2.5 text-sm placeholder-white/15 outline-none resize-none transition-all duration-300 focus:border-violet-500/30"
                      style={inputStyle} />
                  </div>
                </div>
                <div className="flex items-center gap-3 mt-6">
                  <motion.button onClick={onClose}
                    className="flex-1 rounded-xl py-2.5 text-[13px] font-semibold text-white/40 hover:text-white/60 transition-all duration-300"
                    style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}
                    whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    Cancel
                  </motion.button>
                  <motion.button onClick={handleSubmit} disabled={isLoading || !title.trim() || !date || !time}
                    className="flex-1 rounded-xl py-2.5 text-[13px] font-semibold text-white/90 transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed"
                    style={{ background: "linear-gradient(135deg, rgba(139,92,246,0.5), rgba(59,130,246,0.4))", border: "1px solid rgba(139,92,246,0.3)", boxShadow: "0 0 25px rgba(139,92,246,0.15)" }}
                    whileHover={{ scale: 1.02, boxShadow: "0 0 35px rgba(139,92,246,0.25)" }}
                    whileTap={{ scale: 0.98 }}>
                    {isLoading
                      ? <motion.span animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>⏳</motion.span>
                      : "📅 Send Appointment Request"
                    }
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

/* ═══════════════════════════════════════════════════════════════
   MESSAGES PAGE
   ═══════════════════════════════════════════════════════════════ */
export default function MessagesPage() {
  const storedUser = localStorage.getItem("user");
  const user = storedUser ? JSON.parse(storedUser) : null;

  // Derived display values
  const username = user?.name || user?.username || "User";
  const initials = username.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
  const currentUserId = user?._id || user?.id || "me";

  const { conversationId } = useParams();
  const navigate = useNavigate();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [activeConvo, setActiveConvo] = useState(conversationId || null);
  const [localMessages, setLocalMessages] = useState({});
  const [messageInput, setMessageInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const [appointmentLoading, setAppointmentLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const activeConversation = conversations.find((c) => c.id === activeConvo);
  const currentMessages = localMessages[activeConvo] || [];

  const filteredConversations = conversations.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.lastMessage?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [currentMessages]);

  // Load Conversations on Mount
  useEffect(() => {
    const loadConversations = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;
        const res = await axios.get(`${API_BASE}/conversations`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        const mapped = res.data.map(convo => {
          const name = convo.otherUser?.name || convo.otherUser?.username || "Unknown";
          const init = name.split(" ").map(w=>w[0]).join("").toUpperCase().slice(0,2);
          
          return {
            id: convo._id,
            name: name,
            avatar: convo.otherUser?.profile_picture ? (
              <img src={convo.otherUser.profile_picture} alt={name} className="w-full h-full object-cover rounded-full" />
            ) : init,
            time: new Date(convo.last_message_at).toLocaleDateString() === new Date().toLocaleDateString() 
                ? new Date(convo.last_message_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
                : new Date(convo.last_message_at).toLocaleDateString(),
            lastMessage: "Tap to view conversation",
            online: true, 
            unread: 0 
          };
        });

        setConversations(Array.isArray(mapped) ? mapped : []);
        
        // Auto select first if none passed in URL
        if (!activeConvo && Array.isArray(mapped) && mapped.length > 0) {
          setActiveConvo(mapped[0].id);
          navigate(`/chat/${mapped[0].id}`, { replace: true });
        }
      } catch (err) {
        console.error("Failed to fetch conversations", err);
      }
    };
    loadConversations();
  }, [activeConvo, navigate]);

  // Load Messages & Join Socket Room
  useEffect(() => {
    if (!activeConvo) return;
    socket.emit("joinConversation", activeConvo);
    
    // Switch URL silently 
    if (conversationId !== activeConvo) {
      navigate(`/chat/${activeConvo}`, { replace: true });
    }

    const loadMessages = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(`${API_BASE}/messages/${activeConvo}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        const mappedMsgs = res.data.map(msg => {
          const senderIdStr = msg.sender_id ? (msg.sender_id._id || msg.sender_id).toString() : null;
          const isMe = senderIdStr === String(currentUserId);
          
          return {
            ...msg,
            id: msg._id || String(Math.random()),
            sender: isMe ? "me" : "other",
            text: msg.message_text,
            time: new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            appointment: msg.appointment_id ? { ...msg.appointment_id, id: msg.appointment_id._id } : undefined
          };
        });
        
        setLocalMessages(prev => ({
          ...prev,
          [activeConvo]: Array.isArray(mappedMsgs) ? mappedMsgs : []
        }));
      } catch (err) {
        console.error("Failed to load messages", err);
      }
    };
    loadMessages();
  }, [activeConvo, currentUserId, navigate, conversationId]);

  // Handle incoming live socket messages
  useEffect(() => {
    const handleReceive = (msg) => {
      console.log("Received message:", msg);
      
      const senderIdStr = msg.sender_id ? (msg.sender_id._id || msg.sender_id).toString() : null;
      const isMe = senderIdStr === String(currentUserId);

      const mappedMsg = {
        ...msg,
        id: msg._id || String(Math.random()),
        sender: isMe ? "me" : "other",
        text: msg.message_text,
        time: msg.createdAt 
          ? new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) 
          : new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      setLocalMessages(prev => {
        const convoId = msg.conversation_id || msg.conversationId;
        const currentMsgs = prev[convoId] || [];
        
        // WhatsApp Sender sees own message instantly, so deduplicate based on time or strict ID
        // If sender is me, match exactly optimistic ID generated locally or just textual duplicates closely timed
        if (mappedMsg.sender === "me") {
          const optimisticIndex = currentMsgs.findIndex(m => 
            m.sender === "me" && m.text === mappedMsg.text && m.id.toString().length < 20 // Date.now()
          );
          if (optimisticIndex !== -1) {
            const newArray = [...currentMsgs];
            newArray[optimisticIndex] = mappedMsg;
            return { ...prev, [convoId]: newArray };
          }
        }

        // Prevent duplicates
        if (currentMsgs.some(m => m.id === mappedMsg.id)) return prev;

        return {
          ...prev,
          [convoId]: [...currentMsgs, mappedMsg]
        };
      });
    };
    
    socket.on("receiveMessage", handleReceive);
    
    return () => {
      socket.off("receiveMessage", handleReceive);
    };
  }, [currentUserId]);

  /* ─── Socket listener for incoming appointments ─── */
  useEffect(() => {
    const handleNewAppointment = (apt) => {
      console.log("Received new appointment event:", apt);
      const convoId = apt.conversation_id || apt.conversationId;
      const hostIdStr = apt.host_id ? (apt.host_id._id || apt.host_id).toString() : null;
      const isMe = hostIdStr === String(currentUserId);

      const aptMsg = {
        id: apt._id || Date.now(),
        sender: isMe ? "me" : "other",
        message_type: "appointment",
        appointment: { ...apt, status: apt.status || "pending" },
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      setLocalMessages(prev => {
        const currentMsgs = prev[convoId] || [];
        if (currentMsgs.some(m => m.id === aptMsg.id)) return prev;
        return { ...prev, [convoId]: [...currentMsgs, aptMsg] };
      });
    };
    
    const handleAppointmentUpdated = (updatedAppointment) => {
      console.log("Appointment update:", updatedAppointment);
      setLocalMessages(prev => {
        const updated = { ...prev };
        Object.keys(updated).forEach(convId => {
          updated[convId] = updated[convId].map(msg => {
            const currentAptId = msg.appointment?.id || msg.appointment?._id || msg.appointment_id;
            if (msg.message_type === "appointment" && String(currentAptId) === String(updatedAppointment._id)) {
              return { 
                ...msg, 
                appointment: { 
                  ...msg.appointment, 
                  ...updatedAppointment, 
                  id: updatedAppointment._id 
                } 
              };
            }
            return msg;
          });
        });
        return updated;
      });
    };

    socket.on("newAppointment", handleNewAppointment);
    socket.on("appointmentUpdated", handleAppointmentUpdated);
    
    return () => {
      socket.off("newAppointment", handleNewAppointment);
      socket.off("appointmentUpdated", handleAppointmentUpdated);
    };
  }, [currentUserId]);

  const handleSend = async () => {
    if (!messageInput.trim() || !activeConvo) return;
    const text = messageInput.trim();
    setMessageInput(""); // Clear visually immediately

    // WhatsApp-style optimistic UI Append (User explicitly see own message instantly)
    const optimisticMsg = {
      id: Date.now().toString(),
      sender: "me",
      text: text,
      message_type: "text",
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setLocalMessages(prev => ({
      ...prev,
      [activeConvo]: [...(prev[activeConvo] || []), optimisticMsg]
    }));

    // WhatsApp-style: emit to server and let it handle broadcast mapping
    socket.emit("sendMessage", {
      conversationId: activeConvo,
      senderId: currentUserId,
      text: text
    });
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  /* ─── Create Appointment ─── */
  const handleCreateAppointment = async (formData) => {
    setAppointmentLoading(true);
    const payload = {
      conversationId: activeConvo,
      title: formData.title,
      date: formData.date,
      time: formData.time,
      duration: formData.duration,
      note: formData.note,
    };
    try {
      const res = await axios.post(`${API_BASE}/appointments`, payload, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      const created = res.data || { ...payload, id: Date.now().toString(), status: "pending", host_id: currentUserId };
      const aptMsg = {
        id: created._id || Date.now().toString(),
        sender: "me",
        message_type: "appointment",
        appointment: { ...created, status: created.status || "pending" },
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      
      setLocalMessages((prev) => ({
        ...prev,
        [activeConvo]: [...(prev[activeConvo] || []), aptMsg],
      }));
      
      setShowAppointmentModal(false);
    } catch (err) {
      console.error("Failed to create appointment:", err);
      setShowAppointmentModal(false);
    } finally {
      setAppointmentLoading(false);
    }
  };

  /* ─── Accept / Reject Appointment ─── */
  const handleAppointmentAction = async (appointmentId, action) => {
    // Optimistic UI Update
    const expectedStatus = action === "accept" ? "accepted" : "rejected";
    updateAppointmentStatus(appointmentId, expectedStatus);

    try {
      await axios.put(`${API_BASE}/appointments/${appointmentId}/${action}`, {}, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
    } catch (err) {
      console.error(`Failed to ${action} appointment:`, err);
      // Rollback on failure (simplified)
      updateAppointmentStatus(appointmentId, "pending");
      
      // Safety fetch
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(`${API_BASE}/messages/${activeConvo}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const mappedMsgs = res.data.map(msg => {
          const senderIdStr = msg.sender_id ? (msg.sender_id._id || msg.sender_id).toString() : null;
          const isMe = senderIdStr === String(currentUserId);
          return {
            ...msg,
            id: msg._id || String(Math.random()),
            sender: isMe ? "me" : "other",
            text: msg.message_text,
            time: new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            appointment: msg.appointment_id ? { ...msg.appointment_id, id: msg.appointment_id._id } : undefined
          };
        });
        setLocalMessages(prev => ({
          ...prev,
          [activeConvo]: Array.isArray(mappedMsgs) ? mappedMsgs : []
        }));
      } catch (safeguardErr) {
        console.error("Safeguard refetch failed", safeguardErr);
      }
    }
  };

  /* ─── Cancel Appointment (host only) ─── */
  const handleCancelAppointment = async (appointmentId) => {
    // Optimistic UI Update
    updateAppointmentStatus(appointmentId, "cancelled");

    try {
      await axios.delete(`${API_BASE}/appointments/${appointmentId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
    } catch (err) {
      console.error("Failed to cancel appointment:", err);
      updateAppointmentStatus(appointmentId, "pending");
    }
  };

  /* ─── Shared status updater ─── */
  const updateAppointmentStatus = (appointmentId, newStatus) => {
    setLocalMessages((prev) => {
      const updated = { ...prev };
      Object.keys(updated).forEach((convId) => {
        updated[convId] = updated[convId].map((msg) => {
          const currentAptId = msg.appointment?.id || msg.appointment?._id || msg.appointment_id;
          if (msg.message_type === "appointment" && String(currentAptId) === String(appointmentId)) {
            return { ...msg, appointment: { ...msg.appointment, status: newStatus } };
          }
          return msg;
        });
      });
      return updated;
    });
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/";
  };

  return (
    <div className="relative h-screen overflow-hidden" style={{ background: "#030108" }}>
      <Background />
      <MagneticCursor />
      <Sidebar active="messages" isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} currentUsername={user?.username || ""} />

      <div className="relative z-10 flex flex-col h-screen">
        {/* ══════ TOP NAVBAR ══════ */}
        <motion.header
          className="shrink-0 flex items-center justify-between px-6 py-3 sm:px-8"
          style={{ ...glassStyle, borderRadius: 0, borderTop: "none", borderLeft: "none", borderRight: "none", borderBottom: "1px solid rgba(255,255,255,0.06)" }}
          initial={{ opacity: 0, y: -30 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="flex items-center gap-4">
            <motion.button
              className="flex items-center justify-center h-10 w-10 rounded-xl text-white/40 hover:text-white/70 transition-colors duration-300"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}
              onClick={() => setSidebarOpen(!sidebarOpen)}
              whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.95 }}>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </motion.button>
            <motion.h2 className="text-lg font-semibold text-white/70 hidden lg:block"
              initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
              Messages
            </motion.h2>
          </div>
          <div className="flex items-center gap-3">
            <motion.button
              className="relative flex items-center justify-center h-10 w-10 rounded-xl text-white/30 hover:text-white/60 transition-colors"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
              whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.95 }}>
              {icons.bell}
              <motion.div className="absolute top-2 right-2 h-2 w-2 rounded-full"
                style={{ background: "rgba(239,68,68,0.8)", boxShadow: "0 0 8px rgba(239,68,68,0.4)" }}
                animate={{ scale: [1, 1.4, 1] }} transition={{ duration: 2, repeat: Infinity }} />
            </motion.button>
            <div className="flex items-center gap-3">
              <div className="hidden sm:block text-right">
                <p className="text-sm font-medium text-white/60">{username}</p>
              </div>
              <motion.div
                className="relative flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold text-white/80 overflow-hidden"
                style={{ background: "linear-gradient(135deg, rgba(139,92,246,0.35), rgba(59,130,246,0.3))", border: "1px solid rgba(255,255,255,0.12)" }}
                whileHover={{ scale: 1.1 }}>
                {initials}
              </motion.div>
            </div>
            <motion.button onClick={logout}
              className="group flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium text-white/30 hover:text-red-400/70 transition-all duration-300"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
              whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}>
              {icons.logout}
              <span className="hidden sm:inline">Logout</span>
            </motion.button>
          </div>
        </motion.header>

        {/* ══════ MAIN CHAT AREA ══════ */}
        <div className="flex flex-1 overflow-hidden">
          {/* ─── LEFT: Conversation List ─── */}
          <motion.div
            className="hidden md:flex flex-col w-[320px] lg:w-[340px] shrink-0 overflow-hidden"
            style={{ ...glassStyle, borderRadius: 0, borderTop: "none", borderLeft: "none", borderBottom: "none", borderRight: "1px solid rgba(255,255,255,0.06)" }}
            initial={{ opacity: 0, x: -40 }} animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="p-4 pb-2">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20">{icons.search}</span>
                <input
                  type="text"
                  placeholder="Search conversations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm text-white/70 placeholder-white/20 outline-none transition-all duration-300 focus:border-violet-500/30"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto px-3 pb-4 space-y-1" style={{ scrollbarWidth: "thin", scrollbarColor: "rgba(255,255,255,0.08) transparent" }}>
              {Array.isArray(filteredConversations) ? filteredConversations.map((convo, i) => (
                <ConversationItem key={convo.id} convo={convo} isActive={activeConvo === convo.id}
                  onClick={() => setActiveConvo(convo.id)} index={i} />
              )) : null}
            </div>
          </motion.div>

          {/* ─── RIGHT: Chat Window ─── */}
          <motion.div className="flex-1 flex flex-col overflow-hidden"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.6 }}>

            {/* Chat Top Bar */}
            {activeConversation && (
              <motion.div className="shrink-0 flex items-center justify-between px-6 py-3"
                style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)" }}
                initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.4 }}>
                <div className="flex items-center gap-3">
                  <select className="md:hidden rounded-lg px-2 py-1 text-xs text-white/60 bg-white/5 border border-white/10 outline-none"
                    value={activeConvo} onChange={(e) => setActiveConvo(Number(e.target.value))}>
                    {conversations.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                  <div className="hidden md:flex relative">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full text-xs font-bold text-white/80"
                      style={{ background: "linear-gradient(135deg, rgba(139,92,246,0.35), rgba(59,130,246,0.3))", border: "1px solid rgba(255,255,255,0.1)" }}>
                      {activeConversation.avatar}
                    </div>
                    {activeConversation.online && (
                      <motion.div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full"
                        style={{ background: "rgba(52,211,153,0.9)", border: "2px solid rgba(10,6,24,0.9)", boxShadow: "0 0 8px rgba(52,211,153,0.4)" }}
                        animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 2, repeat: Infinity }} />
                    )}
                  </div>
                  <div className="hidden md:block">
                    <p className="text-sm font-semibold text-white/80">{activeConversation.name}</p>
                    <div className="flex items-center gap-1.5">
                      {activeConversation.online ? (
                        <>
                          <motion.div className="h-1.5 w-1.5 rounded-full" style={{ background: "rgba(52,211,153,0.8)" }}
                            animate={{ opacity: [0.6, 1, 0.6] }} transition={{ duration: 2, repeat: Infinity }} />
                          <span className="text-[11px] text-emerald-400/50">Online</span>
                        </>
                      ) : (
                        <span className="text-[11px] text-white/20">Offline</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <motion.button
                    onClick={() => setShowAppointmentModal(true)}
                    className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-[11px] font-semibold text-white/30 hover:text-white/70 transition-all duration-300"
                    style={{ background: "rgba(139,92,246,0.08)", border: "1px solid rgba(139,92,246,0.12)" }}
                    whileHover={{ scale: 1.05, boxShadow: "0 0 18px rgba(139,92,246,0.12)", borderColor: "rgba(139,92,246,0.25)" }}
                    whileTap={{ scale: 0.95 }}>
                    {icons.calendarPlus}
                    <span className="hidden sm:inline">Schedule</span>
                  </motion.button>
                </div>
              </motion.div>
            )}

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto px-6 py-4" style={{ scrollbarWidth: "thin", scrollbarColor: "rgba(255,255,255,0.08) transparent" }}>
              <AnimatePresence mode="wait">
                <motion.div key={activeConvo} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
                  {currentMessages.length === 0 ? (
                    <motion.div className="flex flex-col items-center justify-center h-full text-center py-20"
                      initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
                      <div className="flex h-16 w-16 items-center justify-center rounded-2xl mb-4"
                        style={{ background: "rgba(139,92,246,0.1)", border: "1px solid rgba(139,92,246,0.15)" }}>
                        <svg className="w-8 h-8 text-white/20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                      </div>
                      <p className="text-sm text-white/25">No messages yet. Start the conversation!</p>
                    </motion.div>
                  ) : Array.isArray(currentMessages) ? (
                    currentMessages.map((msg, i) =>
                      msg.message_type === "appointment" ? (
                        <AppointmentCard
                          key={msg.id}
                          appointment={{ ...msg.appointment, sender: msg.sender }}
                          index={i}
                          currentUserId={currentUserId}
                          onAccept={(id) => handleAppointmentAction(id, "accept")}
                          onReject={(id) => handleAppointmentAction(id, "reject")}
                          onCancel={(id) => handleCancelAppointment(id)}
                        />
                      ) : (
                        <ChatBubble key={msg.id} message={msg} index={i} />
                      )
                    )
                  ) : null}
                  <div ref={messagesEndRef} />
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Input Area */}
            <motion.div className="shrink-0 px-4 py-3 sm:px-6"
              style={{ borderTop: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)" }}
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.5 }}>
              <div className="flex items-center gap-2 rounded-xl px-3 py-2"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <motion.button className="shrink-0 text-white/20 hover:text-white/50 transition-colors" whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }}>
                  {icons.emoji}
                </motion.button>
                <motion.button className="shrink-0 text-white/20 hover:text-white/50 transition-colors" whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }}>
                  {icons.attach}
                </motion.button>
                <input
                  type="text"
                  placeholder="Type a message..."
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="flex-1 bg-transparent text-sm text-white/80 placeholder-white/20 outline-none px-2 py-1"
                />
                <motion.button
                  onClick={handleSend}
                  className="shrink-0 flex items-center justify-center h-9 w-9 rounded-xl transition-all duration-300"
                  style={{
                    background: messageInput.trim() ? "linear-gradient(135deg, rgba(139,92,246,0.5), rgba(59,130,246,0.4))" : "rgba(255,255,255,0.04)",
                    border: messageInput.trim() ? "1px solid rgba(139,92,246,0.3)" : "1px solid rgba(255,255,255,0.06)",
                    color: messageInput.trim() ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.2)",
                    boxShadow: messageInput.trim() ? "0 0 20px rgba(139,92,246,0.15)" : "none",
                  }}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}>
                  {icons.send}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>

      <AppointmentModal
        isOpen={showAppointmentModal}
        onClose={() => setShowAppointmentModal(false)}
        onSubmit={handleCreateAppointment}
        isLoading={appointmentLoading}
      />
    </div>
  );
}
