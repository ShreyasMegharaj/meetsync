import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, useMotionValue, useSpring } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import API from "../utils/api";

/* ─── helpers ─── */
const rand = (a, b) => Math.random() * (b - a) + a;

/* ═══════════════════════════════════════════════════════════════
   BACKGROUND — rich mixed dark gradient with living depth
   ═══════════════════════════════════════════════════════════════ */

/* Large ambient blobs that drift continuously */
const AmbientBlob = ({ gradient, size, blur, dur, path, opacity }) => (
  <motion.div
    className="absolute rounded-full pointer-events-none will-change-transform"
    style={{ width: size, height: size, background: gradient, filter: `blur(${blur}px)`, opacity }}
    animate={{ x: path.x, y: path.y, scale: path.s }}
    transition={{ duration: dur,  repeatType: "loop", ease: "linear" }}
  />
);

const BLOBS = [
  { gradient: "radial-gradient(circle,rgba(109,40,217,0.45),rgba(59,130,246,0.15),transparent 70%)", size: 600, blur: 100, dur: 28, opacity: 0.5, path: { x: [-300, 700, 200, -200, 500, -300], y: [-200, 400, -100, 600, 100, -200], s: [1, 1.2, 0.85, 1.15, 0.9, 1] } },
  { gradient: "radial-gradient(circle,rgba(219,39,119,0.35),rgba(168,85,247,0.2),transparent 70%)", size: 500, blur: 110, dur: 35, opacity: 0.4, path: { x: [800, -100, 400, 100, 700, 800], y: [500, 0, 400, -200, 300, 500], s: [0.9, 1.3, 0.95, 1.25, 0.85, 0.9] } },
  { gradient: "radial-gradient(circle,rgba(6,182,212,0.3),rgba(59,130,246,0.18),transparent 70%)", size: 550, blur: 90, dur: 32, opacity: 0.4, path: { x: [300, -250, 600, 50, -100, 300], y: [700, 150, -200, 550, 250, 700], s: [1.1, 0.8, 1.3, 0.9, 1.15, 1.1] } },
  { gradient: "radial-gradient(circle,rgba(139,92,246,0.4),rgba(236,72,153,0.15),transparent 70%)", size: 420, blur: 120, dur: 40, opacity: 0.3, path: { x: [-200, 500, 800, 200, 600, -200], y: [300, -200, 500, 100, 700, 300], s: [1, 1.4, 0.75, 1.2, 1, 1] } },
  { gradient: "radial-gradient(circle,rgba(79,70,229,0.35),rgba(34,211,238,0.1),transparent 70%)", size: 480, blur: 95, dur: 30, opacity: 0.35, path: { x: [600, -150, 350, 900, 100, 600], y: [-100, 450, 200, 600, -200, -100], s: [0.85, 1.25, 1, 1.35, 0.9, 0.85] } },
];

/* Tiny floating motes */
const MOTES = Array.from({ length: 50 }, (_, i) => ({
  id: i, size: rand(1.5, 4),
  color: [`rgba(167,139,250,`, `rgba(96,165,250,`, `rgba(244,114,182,`, `rgba(34,211,238,`, `rgba(129,140,248,`][i % 5] + `${rand(0.3, 0.8)})`,
  dur: rand(16, 35), delay: rand(0, 10),
  path: { x: Array.from({ length: 7 }, () => rand(-60, 1700)), y: Array.from({ length: 7 }, () => rand(-60, 1000)) },
}));

const Mote = ({ size, color, dur, delay, path }) => (
  <motion.div
    className="absolute rounded-full pointer-events-none"
    style={{ width: size, height: size, background: color, boxShadow: `0 0 ${size * 3}px ${color}` }}
    animate={{ x: path.x, y: path.y }}
    transition={{ duration: dur, delay,  repeatType: "loop", ease: "linear" }}
  />
);

/* Shooting streaks */
const STREAKS = Array.from({ length: 5 }, (_, i) => ({
  id: i, delay: rand(1, 14), dur: rand(2.5, 4), top: rand(5, 90), angle: rand(-20, -3),
}));

const Streak = ({ delay, dur, top, angle }) => (
  <motion.div
    className="absolute pointer-events-none"
    style={{ top: `${top}%`, left: "-12%", width: 160, height: 1.5, background: "linear-gradient(90deg,transparent,rgba(167,139,250,0.6),rgba(96,165,250,0.4),transparent)", borderRadius: 999, transform: `rotate(${angle}deg)`, boxShadow: "0 0 12px rgba(139,92,246,0.3)" }}
    animate={{ x: ["-12vw", "115vw"], opacity: [0, 1, 1, 0] }}
    transition={{ duration: dur, delay,  repeatDelay: rand(8, 20), ease: "easeInOut" }}
  />
);

/* Soft rotating rings */
const RINGS = [
  { sz: 240, x: 7, y: 15, dur: 28, c: "rgba(139,92,246,0.07)" },
  { sz: 340, x: 75, y: 55, dur: 38, c: "rgba(59,130,246,0.06)" },
  { sz: 180, x: 85, y: 10, dur: 24, c: "rgba(236,72,153,0.05)" },
  { sz: 290, x: 15, y: 75, dur: 34, c: "rgba(6,182,212,0.06)" },
];

const Ring = ({ sz, x, y, dur, c }) => (
  <motion.div
    className="absolute rounded-full pointer-events-none"
    style={{ width: sz, height: sz, border: `1px solid ${c}`, left: `${x}%`, top: `${y}%` }}
    animate={{ rotate: 360, scale: [1, 1.12, 0.92, 1.08, 1], x: [0, 40, -35, 25, 0], y: [0, -35, 25, -15, 0] }}
    transition={{
      rotate: { duration: dur,  ease: "linear" },
      scale: { duration: dur * 0.7,  repeatType: "mirror", ease: "easeInOut" },
      x: { duration: dur * 0.85,  repeatType: "mirror", ease: "easeInOut" },
      y: { duration: dur * 0.65,  repeatType: "mirror", ease: "easeInOut" },
    }}
  />
);

const Background = () => (
  <div className="fixed inset-0 overflow-hidden" style={{ zIndex: 0 }}>
    <div className="absolute inset-0" style={{ background: "linear-gradient(145deg, #050208 0%, #0a0618 30%, #0d0a1a 50%, #06050f 70%, #020104 100%)" }} />
    <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 30% 20%, rgba(109,40,217,0.08) 0%, transparent 60%)" }} />
    <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 70% 80%, rgba(59,130,246,0.06) 0%, transparent 60%)" }} />
    <div className="absolute inset-0 opacity-[0.018]" style={{ backgroundImage: "linear-gradient(rgba(139,92,246,0.5) 1px,transparent 1px),linear-gradient(90deg,rgba(139,92,246,0.5) 1px,transparent 1px)", backgroundSize: "80px 80px" }} />
    {BLOBS.map((b, i) => <AmbientBlob key={i} {...b} />)}
    {RINGS.map((r, i) => <Ring key={`r${i}`} {...r} />)}
    {MOTES.map((m) => <Mote key={m.id} {...m} />)}
    {STREAKS.map((s) => <Streak key={s.id} {...s} />)}
  </div>
);

/* ═══════════════════════════════════════════════════════════════
   MAGNETIC CURSOR — multi-layer with energy sparkle trail
   ═══════════════════════════════════════════════════════════════ */
const MagneticCursor = () => {
  const mx = useMotionValue(-400);
  const my = useMotionValue(-400);
  const fastX = useSpring(mx, { stiffness: 150, damping: 18, mass: 0.4 });
  const fastY = useSpring(my, { stiffness: 150, damping: 18, mass: 0.4 });
  const midX = useSpring(mx, { stiffness: 50, damping: 28, mass: 1 });
  const midY = useSpring(my, { stiffness: 50, damping: 28, mass: 1 });
  const slowX = useSpring(mx, { stiffness: 18, damping: 22, mass: 2 });
  const slowY = useSpring(mx, { stiffness: 18, damping: 22, mass: 2 });

  const [sparks, setSparks] = useState([]);
  const last = useRef(0);

  useEffect(() => {
    const move = (e) => {
      mx.set(e.clientX);
      my.set(e.clientY);
      const now = Date.now();
      if (now - last.current > 40) {
        last.current = now;
        setSparks((p) => [...p.slice(-16), { id: now, x: e.clientX + rand(-25, 25), y: e.clientY + rand(-25, 25), s: rand(2, 5), h: rand(230, 320) }]);
      }
    };
    window.addEventListener("mousemove", move);
    return () => window.removeEventListener("mousemove", move);
  }, [mx, my]);

  useEffect(() => {
    const iv = setInterval(() => setSparks((p) => p.slice(-12)), 180);
    return () => clearInterval(iv);
  }, []);

  return (
    <>
      {sparks.map((s) => (
        <motion.div key={s.id} className="fixed rounded-full pointer-events-none" style={{ left: s.x - s.s / 2, top: s.y - s.s / 2, width: s.s, height: s.s, background: `hsla(${s.h},80%,72%,0.9)`, boxShadow: `0 0 ${s.s * 4}px hsla(${s.h},80%,60%,0.5)`, zIndex: 10001 }}
          initial={{ scale: 1, opacity: 1 }} animate={{ scale: 0, opacity: 0, y: rand(-35, 35), x: rand(-35, 35) }} transition={{ duration: 0.2, ease: "easeOut" }} />
      ))}
      {/* Outer aurora */}
      <motion.div className="fixed rounded-full pointer-events-none" style={{ x: slowX, y: slowY, width: 420, height: 420, marginLeft: -210, marginTop: -210, background: "radial-gradient(circle,rgba(139,92,246,0.08),rgba(59,130,246,0.05),rgba(236,72,153,0.03),transparent 70%)", filter: "blur(65px)", zIndex: 9997 }} />
      {/* Pulsing ring */}
      <motion.div className="fixed pointer-events-none" style={{ x: midX, y: midY, width: 48, height: 48, marginLeft: -24, marginTop: -24, borderRadius: "50%", border: "1.5px solid rgba(var(--theme-white),0.2)", boxShadow: "0 0 18px rgba(139,92,246,0.12), inset 0 0 18px rgba(139,92,246,0.06)", zIndex: 10000 }}
        animate={{ scale: [1, 1.35, 1], opacity: [0.5, 1, 0.5], borderColor: ["rgba(var(--theme-white),0.2)", "rgba(167,139,250,0.45)", "rgba(96,165,250,0.35)", "rgba(var(--theme-white),0.2)"] }}
        transition={{ duration: 0.2,  ease: "easeInOut" }} />
      {/* Bright core */}
      <motion.div className="fixed rounded-full pointer-events-none" style={{ x: fastX, y: fastY, width: 7, height: 7, marginLeft: -3.5, marginTop: -3.5, background: "rgba(var(--theme-white),0.95)", boxShadow: "0 0 12px rgba(var(--theme-white),0.6), 0 0 25px rgba(139,92,246,0.5)", zIndex: 10002 }}
        animate={{ boxShadow: ["0 0 12px rgba(var(--theme-white),0.6),0 0 25px rgba(139,92,246,0.5)", "0 0 18px rgba(var(--theme-white),0.8),0 0 35px rgba(59,130,246,0.6)", "0 0 12px rgba(var(--theme-white),0.6),0 0 25px rgba(236,72,153,0.5)", "0 0 12px rgba(var(--theme-white),0.6),0 0 25px rgba(139,92,246,0.5)"] }}
        transition={{ duration: 0.2,  ease: "easeInOut" }} />
    </>
  );
};

/* ═══════════════════════════════════════════════════════════════
   ANIMATED LOGO — continuous breathing, morphing, glowing
   ═══════════════════════════════════════════════════════════════ */
const AnimatedLogo = () => (
  <motion.div
    className="relative mx-auto mb-4 flex h-[72px] w-[72px] items-center justify-center"
    initial={{ scale: 0, opacity: 0 }}
    animate={{ scale: 1, opacity: 1 }}
    transition={{ type: "spring", stiffness: 160, damping: 12, delay: 0.15 }}
  >
    {/* Outer pulsing glow rings */}
    <motion.div className="absolute inset-0 rounded-[22px]"
      style={{ background: "linear-gradient(135deg, rgba(139,92,246,0.2), rgba(59,130,246,0.15))", filter: "blur(20px)" }}
      animate={{ scale: [1, 1.5, 1], opacity: [0.4, 0.1, 0.4] }}
      transition={{ duration: 0.2,  ease: "easeInOut" }} />
    <motion.div className="absolute inset-0 rounded-[22px]"
      style={{ background: "linear-gradient(135deg, rgba(236,72,153,0.15), rgba(139,92,246,0.1))", filter: "blur(15px)" }}
      animate={{ scale: [1.2, 0.9, 1.2], opacity: [0.2, 0.5, 0.2] }}
      transition={{ duration: 0.2,  ease: "easeInOut", delay: 0.5 }} />

    {/* Rotating border gradient */}
    <motion.div className="absolute -inset-px rounded-[22px] overflow-hidden">
      <motion.div className="absolute inset-0"
        style={{ background: "conic-gradient(from 0deg, transparent 30%, rgba(167,139,250,0.5), rgba(96,165,250,0.4), transparent 70%, rgba(244,114,182,0.3), transparent 100%)" }}
        animate={{ rotate: 360 }}
        transition={{ duration: 0.2,  ease: "linear" }} />
    </motion.div>

    {/* Glass body */}
    <motion.div
      className="relative flex h-full w-full items-center justify-center rounded-[20px]"
      style={{
        background: "rgba(var(--theme-white),0.08)",
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        border: "1px solid rgba(var(--theme-white),0.12)",
        boxShadow: "inset 0 1px 0 rgba(var(--theme-white),0.15), 0 8px 32px rgba(var(--theme-black),0.4)",
      }}
      animate={{
        scale: [1, 1.04, 1],
        borderColor: ["rgba(var(--theme-white),0.12)", "rgba(167,139,250,0.25)", "rgba(var(--theme-white),0.12)"],
      }}
      transition={{ duration: 0.2,  ease: "easeInOut" }}
      whileHover={{ scale: 1.1, borderColor: "rgba(167,139,250,0.4)" }}
    >
      {/* Liquid refraction inside logo */}
      <motion.div className="absolute inset-0 rounded-[20px] overflow-hidden pointer-events-none">
        <motion.div
          style={{ position: "absolute", top: 0, left: "-120%", width: "80%", height: "100%", background: "linear-gradient(90deg,transparent,rgba(var(--theme-white),0.08),transparent)", transform: "skewX(-20deg)" }}
          animate={{ left: ["-120%", "220%"] }}
          transition={{ duration: 0.2,  repeatDelay: 2, ease: "easeInOut" }} />
      </motion.div>

      {/* Register icon — user-plus */}
      <motion.svg
        width="30" height="30" viewBox="0 0 24 24" fill="none"
        stroke="rgba(var(--theme-white),0.9)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
        animate={{ strokeOpacity: [0.9, 1, 0.9], scale: [1, 1.05, 1] }}
        transition={{ duration: 0.2,  ease: "easeInOut" }}
      >
        <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="8.5" cy="7" r="4" />
        <line x1="20" y1="8" x2="20" y2="14" />
        <line x1="23" y1="11" x2="17" y2="11" />
      </motion.svg>
    </motion.div>
  </motion.div>
);

/* ═══════════════════════════════════════════════════════════════
   GLASS INPUT — liquid glass style
   ═══════════════════════════════════════════════════════════════ */
const GlassInput = ({ id, label, type, value, onChange, placeholder, icon, d, extra }) => (
  <motion.div
    initial={{ opacity: 0, x: -25 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ delay: d, duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
  >
    <label htmlFor={id} className="mb-1.5 block text-[11px] font-medium uppercase tracking-[0.18em] text-white/30">
      {label}
    </label>
    <div className="group relative">
      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-white/20 transition-colors duration-200 group-focus-within:text-white/50">
        {icon}
      </div>
      <input id={id} type={type} value={value} onChange={onChange} placeholder={placeholder}
        autoComplete={id === "email" ? "email" : id === "name" ? "name" : id === "username" ? "username" : "new-password"}
        className="w-full rounded-2xl border py-3.5 pl-12 pr-12 text-sm text-white/90 outline-none placeholder:text-white/15 transition-all duration-200"
        style={{ cursor: "none", background: "rgba(var(--theme-white),0.04)", backdropFilter: "blur(30px)", WebkitBackdropFilter: "blur(30px)", borderColor: "rgba(var(--theme-white),0.07)", boxShadow: "inset 0 1px 0 rgba(var(--theme-white),0.05), 0 2px 12px rgba(var(--theme-black),0.25)" }}
        onFocus={(e) => { e.target.style.borderColor = "rgba(var(--theme-white),0.18)"; e.target.style.background = "rgba(var(--theme-white),0.08)"; e.target.style.boxShadow = "inset 0 1px 0 rgba(var(--theme-white),0.08), 0 0 30px rgba(139,92,246,0.08), 0 0 60px rgba(99,102,241,0.04)"; }}
        onBlur={(e) => { e.target.style.borderColor = "rgba(var(--theme-white),0.07)"; e.target.style.background = "rgba(var(--theme-white),0.04)"; e.target.style.boxShadow = "inset 0 1px 0 rgba(var(--theme-white),0.05), 0 2px 12px rgba(var(--theme-black),0.25)"; }}
      />
      {extra}
    </div>
  </motion.div>
);

/* ═══════════════════════════════════════════════════════════════
   SPINNER
   ═══════════════════════════════════════════════════════════════ */
const Spinner = () => (
  <svg className="animate-spin h-5 w-5 text-black/60" viewBox="0 0 24 24" fill="none">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
  </svg>
);

/* ═══════════════════════════════════════════════════════════════
   SVG ICONS — reusable inline icons
   ═══════════════════════════════════════════════════════════════ */
const UserIcon = () => (
  <svg className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.4}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const AtSignIcon = () => (
  <svg className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.4}>
    <circle cx="12" cy="12" r="4" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M16 8v5a3 3 0 006 0v-1a10 10 0 10-3.92 7.94" />
  </svg>
);

const EmailIcon = () => (
  <svg className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.4}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
);

const LockIcon = () => (
  <svg className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.4}>
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0110 0v4" />
  </svg>
);

const ShieldIcon = () => (
  <svg className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.4}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);

const EyeIcon = () => (
  <svg className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.4}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M1 12s4-7.5 11-7.5S23 12 23 12s-4 7.5-11 7.5S1 12 1 12z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const EyeOffIcon = () => (
  <svg className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.4}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-5 0-9.27-3.11-11-7.5a11.7 11.7 0 013.168-4.477M6.343 6.343A9.97 9.97 0 0112 5c5 0 9.27 3.11 11 7.5a11.7 11.7 0 01-4.168 4.477M6.343 6.343L3 3m3.343 3.343l3.364 3.364m5.586 5.586L18.657 18.657M18.657 18.657L21 21m-5.293-2.293a4 4 0 01-5.414-5.414" />
  </svg>
);

/* ═══════════════════════════════════════════════════════════════
   REGISTER PAGE
   ═══════════════════════════════════════════════════════════════ */
export default function RegisterPage() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [showCpw, setShowCpw] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");

    /* ── Validation ── */
    if (!name || !username || !email || !password || !confirmPassword) {
      setError("Please fill in all fields.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const res = await API.post("/auth/register", { name, username, email, password });
      const token = res.data?.token;
      if (token) localStorage.setItem("token", token);
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  /* Password-visibility toggle button */
  const pwToggle = (show, toggle) => (
    <button type="button" onClick={toggle}
      className="absolute inset-y-0 right-0 flex items-center pr-4 text-white/15 hover:text-white/40 transition-colors duration-200"
      tabIndex={-1} style={{ cursor: "none" }}>
      {show ? <EyeOffIcon /> : <EyeIcon />}
    </button>
  );

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10" style={{ background: "var(--theme-bg-main)", cursor: "none" }}>
      <Background />
      

      {/* ══════ LIQUID GLASS CARD ══════ */}
      <motion.div className="relative w-full max-w-[440px]" style={{ zIndex: 10 }}
        initial={{ opacity: 0, y: 70, scale: 0.88 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}>

        {/* Breathing outer glow */}
        

        {/* CARD BODY — frosted white liquid glass */}
        <motion.div
          className="relative rounded-[28px] px-8 py-10 sm:px-11 sm:py-13"
          style={{
            background: "linear-gradient(165deg, rgba(var(--theme-white),0.10) 0%, rgba(var(--theme-white),0.05) 50%, rgba(var(--theme-white),0.08) 100%)",
            backdropFilter: "blur(60px) saturate(140%)",
            WebkitBackdropFilter: "blur(60px) saturate(140%)",
            border: "1px solid rgba(var(--theme-white),0.10)",
            boxShadow: `
              0 40px 100px rgba(var(--theme-black),0.5),
              inset 0 1px 0 rgba(var(--theme-white),0.12),
              inset 0 -1px 0 rgba(var(--theme-white),0.03),
              inset 1px 0 0 rgba(var(--theme-white),0.05),
              inset -1px 0 0 rgba(var(--theme-white),0.05)
            `,
          }}
          animate={{ y: [0, -7, 0] }}
          transition={{ duration: 0.2,  repeatType: "mirror", ease: "easeInOut" }}
        >
          {/* Continuous liquid light sweep 1 */}
          

          {/* Continuous liquid light sweep 2 — opposite direction */}
          

          {/* Top refraction edge — breathing */}
          <motion.div className="absolute top-0 left-[8%] right-[8%] h-px pointer-events-none" style={{ background: "linear-gradient(90deg,transparent,rgba(var(--theme-white),0.2),transparent)", zIndex: 2 }}
            animate={{ opacity: [0.3, 0.9, 0.3], scaleX: [0.8, 1, 0.8] }}
            transition={{ duration: 0.2,  ease: "easeInOut" }} />

          {/* Bottom refraction edge */}
          <motion.div className="absolute bottom-0 left-[15%] right-[15%] h-px pointer-events-none" style={{ background: "linear-gradient(90deg,transparent,rgba(var(--theme-white),0.08),transparent)", zIndex: 2 }}
            animate={{ opacity: [0.2, 0.5, 0.2] }}
            transition={{ duration: 0.2,  ease: "easeInOut", delay: 1 }} />

          {/* Content */}
          <div className="relative" style={{ zIndex: 3 }}>
            <AnimatedLogo />

            <motion.h1 className="mt-3 text-center text-[30px] font-bold tracking-tight"
              initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.2 }}>
              <motion.span
                style={{ background: "linear-gradient(135deg, #ffffff 0%, #e8e4f0 40%, #c4b5fd 70%, #818cf8 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}
                animate={{ backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"] }}
                transition={{ duration: 0.2,  ease: "easeInOut" }}
              >
                MeetSync
              </motion.span>
            </motion.h1>

            <motion.p className="mt-1 text-center text-[13px] text-white/25 font-light"
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.42, duration: 0.2 }}>
              Create your account
            </motion.p>

            {/* Error */}
            <AnimatePresence mode="wait">
              {error && (
                <motion.div key="err" initial={{ opacity: 0, y: -10, height: 0, marginTop: 0 }} animate={{ opacity: 1, y: 0, height: "auto", marginTop: 20 }} exit={{ opacity: 0, y: -10, height: 0, marginTop: 0 }} transition={{ duration: 0.2, ease: "easeOut" }} className="overflow-hidden">
                  <div className="flex items-center gap-2.5 rounded-2xl px-4 py-3 text-sm text-red-400/90"
                    style={{ background: "rgba(239,68,68,0.06)", backdropFilter: "blur(12px)", border: "1px solid rgba(239,68,68,0.08)", boxShadow: "0 0 20px rgba(239,68,68,0.04)" }}>
                    <svg className="h-4 w-4 shrink-0" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 00-2 0v4a1 1 0 002 0V6zm-1 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" /></svg>
                    {error}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Form */}
            <form onSubmit={submit} className="mt-8 space-y-5">
              {/* Name */}
              <GlassInput id="name" label="Full Name" type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="John Doe" d={0.45}
                icon={<UserIcon />} />

              {/* Username */}
              <GlassInput id="username" label="Username" type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="johndoe" d={0.5}
                icon={<AtSignIcon />} />

              {/* Email */}
              <GlassInput id="email" label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" d={0.55}
                icon={<EmailIcon />} />

              {/* Password */}
              <GlassInput id="password" label="Password" type={showPw ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" d={0.6}
                icon={<LockIcon />}
                extra={pwToggle(showPw, () => setShowPw(!showPw))} />

              {/* Confirm Password */}
              <GlassInput id="confirmPassword" label="Confirm Password" type={showCpw ? "text" : "password"} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="••••••••" d={0.65}
                icon={<ShieldIcon />}
                extra={pwToggle(showCpw, () => setShowCpw(!showCpw))} />

              {/* WHITE REGISTER BUTTON */}
              <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7, duration: 0.2 }}>
                <motion.button type="submit" disabled={loading}
                  whileHover={{ scale: loading ? 1 : 1.025 }}
                  whileTap={{ scale: loading ? 1 : 0.975 }}
                  className="group relative flex w-full items-center justify-center gap-2.5 overflow-hidden rounded-2xl px-6 py-4 text-[14px] font-semibold text-black/80 disabled:opacity-50 disabled:cursor-not-allowed transition-shadow duration-200"
                  style={{
                    background: "linear-gradient(135deg, rgba(var(--theme-white),0.95) 0%, rgba(241,245,249,0.92) 50%, rgba(226,232,240,0.9) 100%)",
                    boxShadow: "0 0 35px rgba(var(--theme-white),0.08), 0 8px 35px rgba(var(--theme-black),0.35), inset 0 1px 0 rgba(var(--theme-white),0.9)",
                    cursor: "none",
                  }}>
                  {/* Button shimmer */}
                  <motion.span className="absolute inset-0 pointer-events-none"
                    style={{ background: "linear-gradient(90deg,transparent,rgba(139,92,246,0.08),transparent)" }}
                    animate={{ x: ["-100%", "100%"] }}
                    transition={{ duration: 0.2,  repeatDelay: 2.5, ease: "easeInOut" }} />
                  <span className="absolute -inset-1 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                    style={{ background: "radial-gradient(circle,rgba(var(--theme-white),0.12),transparent 70%)", filter: "blur(20px)" }} />
                  {loading ? (
                    <><Spinner /><span className="relative">Creating account…</span></>
                  ) : (
                    <><span className="relative">Create Account</span>
                      <svg className="relative h-4 w-4 transition-transform duration-200 group-hover:translate-x-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" /></svg></>
                  )}
                </motion.button>
              </motion.div>
            </form>

            {/* Divider */}
            <div className="mt-8 flex items-center">
              <motion.span className="h-px flex-1" style={{ background: "linear-gradient(90deg,transparent,rgba(var(--theme-white),0.07),transparent)" }}
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 0.2,  ease: "easeInOut" }} />
            </div>

            {/* Login link */}
            <motion.p className="mt-6 text-center text-sm text-white/20"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.85, duration: 0.2 }}>
              Already have an account?{" "}
              <Link to="/login" className="font-semibold text-white/40 transition-all duration-200 hover:text-white/70"
                style={{ cursor: "none" }}
                onMouseEnter={(e) => (e.target.style.textShadow = "0 0 25px rgba(var(--theme-white),0.25)")}
                onMouseLeave={(e) => (e.target.style.textShadow = "none")}>
                Sign in
              </Link>
            </motion.p>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}


