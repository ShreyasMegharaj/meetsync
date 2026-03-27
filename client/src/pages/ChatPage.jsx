import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence, useMotionValue, useSpring } from "framer-motion";
import { Link, useParams, useNavigate } from "react-router-dom";
import EmojiPicker from "emoji-picker-react";
import api from "../utils/api";
import NotificationBell from "../components/NotificationBell";
import socket from "../utils/socket";

const DEFAULT_AVATAR = null; // will fall back to initials

/* ─── helpers ─── */
const rand = (a, b) => Math.random() * (b - a) + a;

/* ═══════════════════════════════════════════════════════════════
   BACKGROUND
   ═══════════════════════════════════════════════════════════════ */
const Background = () => (
  <div className="fixed inset-0 overflow-hidden bg-[#030108]" style={{ zIndex: 0 }}>
    <div className="absolute inset-0" style={{ background: "linear-gradient(145deg, #050208 0%, #0a0618 30%, #0d0a1a 50%, #06050f 70%, #020104 100%)" }} />
    <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 25% 15%, rgba(109,40,217,0.07) 0%, transparent 55%)" }} />
    <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 75% 85%, rgba(59,130,246,0.05) 0%, transparent 55%)" }} />
    <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 50% 50%, rgba(236,72,153,0.03) 0%, transparent 50%)" }} />
  </div>
);

/* ─── Magnetic Cursor (glow only — default OS cursor is always visible) ─── */
const MagneticCursor = () => {
  const mx = useMotionValue(-400);
  const my = useMotionValue(-400);
  const slowX = useSpring(mx, { stiffness: 20, damping: 25, mass: 1.8 });
  const slowY = useSpring(my, { stiffness: 20, damping: 25, mass: 1.8 });
  const [isPointer, setIsPointer] = useState(false);
  useEffect(() => {
    // Only render on fine-pointer (mouse/trackpad) devices
    const mq = window.matchMedia("(pointer: fine)");
    setIsPointer(mq.matches);
    const move = (e) => { mx.set(e.clientX); my.set(e.clientY); };
    window.addEventListener("mousemove", move);
    return () => window.removeEventListener("mousemove", move);
  }, [mx, my]);
  if (!isPointer) return null;
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
  back: (<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" /></svg>),
};

/* ─── Sidebar ─── */
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
        <motion.aside className="fixed top-0 left-0 h-full z-40 flex flex-col w-[260px] py-6 px-4"
          style={{ ...glassStyle, borderRight: "1px solid rgba(255,255,255,0.06)", borderRadius: 0 }}
          initial={{ x: -280, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -280, opacity: 0 }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}>
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
                  transition={{ delay: 0.1 + i * 0.08, duration: 0.2, ease: [0.16, 1, 0.3, 1] }}>
                  <Link to={item.to} onClick={onClose}
                    className={`group relative flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 ${isActive ? "text-white/90" : "text-white/30 hover:text-white/65"}`}>
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
      className={`group relative flex items-center gap-3 rounded-xl px-3 py-3 cursor-pointer transition-all duration-200 ${isActive ? "bg-white/[0.06]" : "hover:bg-white/[0.03]"}`}
      style={isActive ? { border: "1px solid rgba(255,255,255,0.08)", boxShadow: "0 0 20px rgba(139,92,246,0.06)" } : { border: "1px solid transparent" }}
      onClick={onClick}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.15 + index * 0.06, duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
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
            animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 0.2,  }} />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <p className={`text-sm font-semibold truncate ${isActive ? "text-white/90" : "text-white/60 group-hover:text-white/80"} transition-colors duration-200`}>{convo.name}</p>
          <span className="text-[10px] text-white/20 shrink-0 ml-2">{convo.time}</span>
        </div>
        <p className="text-[12px] text-white/25 truncate mt-0.5">{convo.lastMessage}</p>
      </div>
      {convo.unread > 0 && (
        <motion.div className="shrink-0 flex items-center justify-center h-5 min-w-[20px] rounded-full px-1.5 text-[10px] font-bold text-white/90"
          style={{ background: "linear-gradient(135deg, rgba(139,92,246,0.7), rgba(59,130,246,0.6))", boxShadow: "0 0 12px rgba(139,92,246,0.3)" }}
          animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 0.2,  }}>
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
      transition={{ delay: index * 0.05, duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
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
      transition={{ delay: index * 0.05, duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
    >
      <motion.div
        className="w-full max-w-[400px] rounded-2xl p-5 relative overflow-hidden group cursor-default"
        style={{ ...glassStyle, background: "linear-gradient(165deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.03) 50%, rgba(255,255,255,0.05) 100%)" }}
        whileHover={{ boxShadow: `0 20px 60px rgba(0,0,0,0.45), 0 0 30px ${st.glow}, inset 0 1px 0 rgba(255,255,255,0.1)` }}
        transition={{ duration: 0.2 }}
      >
        <motion.div className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none" style={{ zIndex: 0 }}>
          <motion.div style={{ position: "absolute", top: 0, left: "-100%", width: "40%", height: "100%", background: "linear-gradient(90deg,transparent,rgba(255,255,255,0.04),transparent)", transform: "skewX(-12deg)" }}
            animate={{ left: ["-100%", "300%"] }}
            transition={{ duration: 0.2,  repeatDelay: 5, ease: "easeInOut" }} />
        </motion.div>
        <AnimatePresence>
          {isFinalized && (
            <motion.div className="absolute inset-0 rounded-2xl pointer-events-none"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              style={{ background: `radial-gradient(ellipse at 50% 0%, ${st.glow} 0%, transparent 70%)` }}
              transition={{ duration: 0.2 }} />
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
              transition={{ scale: { duration: 0.2, ease: "easeOut" }, opacity: { duration: 0.2 } }}
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
              transition={{ delay: 0.15, duration: 0.2 }}>
              {isHost ? (
                <motion.button
                  onClick={() => onCancel(appointment.id || appointment._id)}
                  className="flex-1 flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-[12px] font-semibold text-white/40 hover:text-white/70 transition-all duration-200"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
                  whileHover={{ scale: 1.03, borderColor: "rgba(255,255,255,0.15)", boxShadow: "0 0 15px rgba(255,255,255,0.04)" }}
                  whileTap={{ scale: 0.96 }}>
                  {icons.xMark} Cancel Request
                </motion.button>
              ) : (
                <>
                  <motion.button
                    onClick={() => onAccept(appointment.id || appointment._id)}
                    className="flex-1 flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-[12px] font-semibold text-emerald-400/80 transition-all duration-200"
                    style={{ background: "rgba(52,211,153,0.08)", border: "1px solid rgba(52,211,153,0.15)" }}
                    whileHover={{ scale: 1.04, boxShadow: "0 0 25px rgba(52,211,153,0.15)", borderColor: "rgba(52,211,153,0.3)" }}
                    whileTap={{ scale: 0.95 }}>
                    {icons.check} Accept
                  </motion.button>
                  <motion.button
                    onClick={() => onReject(appointment.id || appointment._id)}
                    className="flex-1 flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-[12px] font-semibold text-red-400/80 transition-all duration-200"
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
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              onClick={(e) => e.stopPropagation()}
            >
              <motion.div className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none">
                <motion.div style={{ position: "absolute", top: 0, left: "-100%", width: "50%", height: "100%", background: "linear-gradient(90deg,transparent,rgba(255,255,255,0.04),transparent)", transform: "skewX(-12deg)" }}
                  animate={{ left: ["-100%", "300%"] }}
                  transition={{ duration: 0.2,  repeatDelay: 4, ease: "easeInOut" }} />
              </motion.div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <motion.div className="flex h-10 w-10 items-center justify-center rounded-xl"
                      style={{ background: "linear-gradient(135deg, rgba(139,92,246,0.25), rgba(59,130,246,0.2))", border: "1px solid rgba(255,255,255,0.1)" }}
                      animate={{ borderColor: ["rgba(255,255,255,0.1)", "rgba(167,139,250,0.25)", "rgba(255,255,255,0.1)"] }}
                      transition={{ duration: 0.2,  ease: "easeInOut" }}>
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
                      className="w-full rounded-xl px-4 py-2.5 text-sm placeholder-white/15 outline-none transition-all duration-200 focus:border-violet-500/30"
                      style={inputStyle} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-medium text-white/35 mb-1.5 uppercase tracking-wider">Date</label>
                      <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
                        className="w-full rounded-xl px-4 py-2.5 text-sm outline-none transition-all duration-200 focus:border-violet-500/30 [color-scheme:dark]"
                        style={inputStyle} />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-white/35 mb-1.5 uppercase tracking-wider">Time</label>
                      <input type="time" value={time} onChange={(e) => setTime(e.target.value)}
                        className="w-full rounded-xl px-4 py-2.5 text-sm outline-none transition-all duration-200 focus:border-violet-500/30 [color-scheme:dark]"
                        style={inputStyle} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-white/35 mb-1.5 uppercase tracking-wider">Duration</label>
                    <select value={duration} onChange={(e) => setDuration(e.target.value)}
                      className="w-full rounded-xl px-4 py-2.5 text-sm outline-none transition-all duration-200 focus:border-violet-500/30 [color-scheme:dark]"
                      style={inputStyle}>
                      {DURATION_OPTIONS.map((d) => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-white/35 mb-1.5 uppercase tracking-wider">Note / Instructions</label>
                    <textarea value={note} onChange={(e) => setNote(e.target.value)}
                      placeholder="Optional meeting notes..."
                      rows={3}
                      className="w-full rounded-xl px-4 py-2.5 text-sm placeholder-white/15 outline-none resize-none transition-all duration-200 focus:border-violet-500/30"
                      style={inputStyle} />
                  </div>
                </div>
                <div className="flex items-center gap-3 mt-6">
                  <motion.button onClick={onClose}
                    className="flex-1 rounded-xl py-2.5 text-[13px] font-semibold text-white/40 hover:text-white/60 transition-all duration-200"
                    style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}
                    whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    Cancel
                  </motion.button>
                  <motion.button onClick={handleSubmit} disabled={isLoading || !title.trim() || !date || !time}
                    className="flex-1 rounded-xl py-2.5 text-[13px] font-semibold text-white/90 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
                    style={{ background: "linear-gradient(135deg, rgba(139,92,246,0.5), rgba(59,130,246,0.4))", border: "1px solid rgba(139,92,246,0.3)", boxShadow: "0 0 25px rgba(139,92,246,0.15)" }}
                    whileHover={{ scale: 1.02, boxShadow: "0 0 35px rgba(139,92,246,0.25)" }}
                    whileTap={{ scale: 0.98 }}>
                    {isLoading
                      ? <motion.span animate={{ rotate: 360 }} transition={{ duration: 0.2,  ease: "linear" }}>⏳</motion.span>
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
  const [conversationsLoading, setConversationsLoading] = useState(true);
  const [activeConvo, setActiveConvo] = useState(conversationId || null);
  const [localMessages, setLocalMessages] = useState({});
  const [messageInput, setMessageInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const emojiPickerRef = useRef(null);
  const pollingRef = useRef(null);
  const isFetchingRef = useRef(false);
  const lastMsgCountRef = useRef({});
  
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

  // Authenticate socket on mount + re-join rooms on reconnect + visibility reconnect
  useEffect(() => {
    // Ensure connection
    if (!socket.connected) socket.connect();

    if (currentUserId && currentUserId !== "me") {
      socket.emit('authenticate', currentUserId);
    }

    const handleReconnect = () => {
      if (currentUserId && currentUserId !== "me") {
        socket.emit('authenticate', currentUserId);
      }
      if (activeConvo) {
        socket.emit('joinConversation', activeConvo);
      }
    };

    // Reconnect when tab becomes visible again (phone switching apps etc.)
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        if (!socket.connected) socket.connect();
        handleReconnect();
      }
    };

    socket.on('connect', handleReconnect);
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      socket.off('connect', handleReconnect);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [currentUserId, activeConvo]);

  // Close emoji picker when clicking outside
  useEffect(() => {
    const handler = (e) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(e.target)) {
        setShowEmojiPicker(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Load Conversations on Mount (run ONCE — no activeConvo in deps)
  useEffect(() => {
    const loadConversations = async () => {
      setConversationsLoading(true);
      try {
        const res = await api.get('/conversations');
        
        const mapped = res.data.map(convo => {
          const name = convo.otherUser?.name || convo.otherUser?.username || "Unknown";
          const init = name.split(" ").map(w=>w[0]).join("").toUpperCase().slice(0,2);
          
          return {
            id: convo._id,
            name: name,
            avatar: convo.otherUser?.profile_picture ? (
              <img src={convo.otherUser.profile_picture} alt={name} className="w-full h-full object-cover rounded-full" onError={(e) => { e.target.style.display = 'none'; }} />
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
        if (!conversationId && Array.isArray(mapped) && mapped.length > 0) {
          if (window.innerWidth >= 768) {
            setActiveConvo(mapped[0].id);
            navigate(`/chat/${mapped[0].id}`, { replace: true });
          }
        }
      } catch (_err) {
        // handled by api interceptor
      } finally {
        setConversationsLoading(false);
      }
    };
    loadConversations();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
        const res = await api.get(`/messages/${activeConvo}`);
        
        const mappedMsgs = res.data.map(msg => {
          const senderIdStr = msg.sender_id ? (msg.sender_id._id || msg.sender_id).toString() : null;
          const isMe = senderIdStr === String(currentUserId);
          
          // Map appointment fields from backend model to frontend display fields
          let appointmentData = undefined;
          if (msg.appointment_id) {
            const apt = msg.appointment_id;
            const scheduledDate = apt.scheduled_for ? new Date(apt.scheduled_for) : null;
            appointmentData = {
              ...apt,
              id: apt._id,
              title: apt.note || 'Meeting Request',
              date: scheduledDate ? scheduledDate.toLocaleDateString() : 'TBD',
              time: scheduledDate ? scheduledDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'TBD',
              duration: '30 minutes',
              host_id: apt.host_id?._id || apt.host_id,
            };
          }
          
          return {
            ...msg,
            id: msg._id || String(Math.random()),
            sender: isMe ? "me" : "other",
            text: msg.message_text,
            time: new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            appointment: appointmentData
          };
        });
        
        setLocalMessages(prev => ({
          ...prev,
          [activeConvo]: Array.isArray(mappedMsgs) ? mappedMsgs : []
        }));
      } catch (_err) {
        // handled by api interceptor
      }
    };
    loadMessages();
  }, [activeConvo, conversationId, currentUserId, navigate]);

  // ── 1-second polling fallback for missed socket messages ──
  useEffect(() => {
    if (!activeConvo) return;

    const poll = async () => {
      if (isFetchingRef.current) return;
      isFetchingRef.current = true;
      try {
        const res = await api.get(`/messages/${activeConvo}`);
        const rawMsgs = res.data || [];
        const prevCount = lastMsgCountRef.current[activeConvo] || 0;

        if (rawMsgs.length !== prevCount) {
          lastMsgCountRef.current[activeConvo] = rawMsgs.length;
          const mappedMsgs = rawMsgs.map(msg => {
            const senderIdStr = msg.sender_id ? (msg.sender_id._id || msg.sender_id).toString() : null;
            const isMe = senderIdStr === String(currentUserId);
            let appointmentData = undefined;
            if (msg.appointment_id) {
              const apt = msg.appointment_id;
              const scheduledDate = apt.scheduled_for ? new Date(apt.scheduled_for) : null;
              appointmentData = {
                ...apt, id: apt._id,
                title: apt.note || 'Meeting Request',
                date: scheduledDate ? scheduledDate.toLocaleDateString() : 'TBD',
                time: scheduledDate ? scheduledDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'TBD',
                duration: '30 minutes',
                host_id: apt.host_id?._id || apt.host_id,
              };
            }
            return {
              ...msg,
              id: msg._id || String(Math.random()),
              sender: isMe ? "me" : "other",
              text: msg.message_text,
              time: new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
              appointment: appointmentData
            };
          });
          setLocalMessages(prev => ({ ...prev, [activeConvo]: mappedMsgs }));
        }
      } catch (_) {}
      finally { isFetchingRef.current = false; }
    };

    pollingRef.current = setInterval(poll, 1000);
    return () => clearInterval(pollingRef.current);
  }, [activeConvo, currentUserId]);

  // Handle incoming live socket messages
  useEffect(() => {
    const handleReceive = (msg) => {
      // Normalize sender ID to string (sender_id may be a populated object after server populate())
      const senderIdStr = msg.sender_id
        ? ((msg.sender_id._id ?? msg.sender_id).toString())
        : null;
      const isMe = senderIdStr === String(currentUserId);

      // Normalize message _id to string so comparisons are always string === string
      const msgId = msg._id ? msg._id.toString() : String(Math.random());

      // Handle appointment message type from socket
      let appointmentData = undefined;
      if (msg.message_type === 'appointment' && msg.appointment_id) {
        const apt = msg.appointment_id;
        const scheduledDate = apt.scheduled_for ? new Date(apt.scheduled_for) : null;
        appointmentData = {
          ...apt,
          id: apt._id,
          title: apt.note || 'Meeting Request',
          date: scheduledDate ? scheduledDate.toLocaleDateString() : 'TBD',
          time: scheduledDate ? scheduledDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'TBD',
          duration: '30 minutes',
          host_id: apt.host_id?._id || apt.host_id,
        };
      }

      const mappedMsg = {
        ...msg,
        id: msgId,
        sender: isMe ? "me" : "other",
        text: msg.message_text,
        message_type: msg.message_type || 'text',
        appointment: appointmentData,
        time: msg.createdAt
          ? new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
          : new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      setLocalMessages(prev => {
        // Normalize convoId to string so it matches the key used when loading messages
        const rawConvoId = msg.conversation_id ?? msg.conversationId;
        const convoId = rawConvoId ? rawConvoId.toString() : null;
        if (!convoId) return prev;

        const currentMsgs = prev[convoId] || [];

        // If the sender receives their own message back from the server,
        // replace the optimistic placeholder (id is a Date.now() 13-digit string)
        if (isMe) {
          const optimisticIndex = currentMsgs.findIndex(
            m => m.sender === "me" && m.text === mappedMsg.text && m.id.length <= 13
          );
          if (optimisticIndex !== -1) {
            const newArray = [...currentMsgs];
            newArray[optimisticIndex] = mappedMsg;
            return { ...prev, [convoId]: newArray };
          }
        }

        // Prevent duplicates (normalize both sides to string)
        if (currentMsgs.some(m => m.id.toString() === msgId)) return prev;

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

  // Update conversation list last-message preview when a new message arrives
  useEffect(() => {
    const handleConvoUpdate = (msg) => {
      const rawConvoId = msg.conversation_id ?? msg.conversationId;
      const convoId = rawConvoId ? rawConvoId.toString() : null;
      if (!convoId) return;
      setConversations(prev => prev.map(c => {
        if (c.id === convoId) {
          return {
            ...c,
            lastMessage: msg.message_text || "New message",
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          };
        }
        return c;
      }));
    };
    socket.on("receiveMessage", handleConvoUpdate);
    return () => socket.off("receiveMessage", handleConvoUpdate);
  }, []);

  /* ─── Socket listener for incoming appointments ─── */
  useEffect(() => {
    const handleNewAppointment = (apt) => {
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
    setMessageInput("");
    setShowEmojiPicker(false);

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

    // Update convo list preview immediately
    setConversations(prev => prev.map(c =>
      c.id === activeConvo ? { ...c, lastMessage: text, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) } : c
    ));

    // Ensure socket is connected before sending
    if (!socket.connected) socket.connect();
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

  const handleEmojiClick = (emojiData) => {
    setMessageInput(prev => prev + emojiData.emoji);
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
      const res = await api.post('/appointments', payload);
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
    } catch (_err) {
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
      await api.put(`/appointments/${appointmentId}/${action}`);
    } catch (_err) {
      // Rollback on failure
      updateAppointmentStatus(appointmentId, "pending");
      
      // Safety fetch
      try {
        const res = await api.get(`/messages/${activeConvo}`);
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
      } catch (_safeguardErr) {
        // handled by api interceptor
      }
    }
  };

  /* ─── Cancel Appointment (host only) ─── */
  const handleCancelAppointment = async (appointmentId) => {
    // Optimistic UI Update
    updateAppointmentStatus(appointmentId, "cancelled");

    try {
      await api.delete(`/appointments/${appointmentId}`);
    } catch (_err) {
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
    <div className="fixed top-0 left-0 right-0 bottom-0 flex flex-col overflow-hidden" style={{ background: "#030108", height: "100dvh" }}>
      <Background />
      
      <Sidebar active="messages" isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} currentUsername={user?.username || ""} />

      <div className="relative z-10 flex flex-col flex-1 overflow-hidden">
        {/* ══════ TOP NAVBAR ══════ */}
        <motion.header
          className="shrink-0 flex items-center justify-between px-6 py-3 sm:px-8"
          style={{ ...glassStyle, borderRadius: 0, borderTop: "none", borderLeft: "none", borderRight: "none", borderBottom: "1px solid rgba(255,255,255,0.06)" }}
          initial={{ opacity: 0, y: -30 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="flex items-center gap-4">
            <motion.button
              className="flex items-center justify-center h-10 w-10 rounded-xl text-white/40 hover:text-white/70 transition-colors duration-200"
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
            <NotificationBell />
            <div className="flex items-center gap-3">
              <div className="hidden sm:block text-right">
                <p className="text-sm font-medium text-white/60">{username}</p>
              </div>
              <motion.div
                className="relative flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold text-white/80 overflow-hidden"
                style={{ background: "linear-gradient(135deg, rgba(139,92,246,0.35), rgba(59,130,246,0.3))", border: "1px solid rgba(255,255,255,0.12)" }}
                whileHover={{ scale: 1.1 }}>
                {user?.profile_picture ? (
                  <img src={user.profile_picture} alt={username} className="w-full h-full object-cover" onError={(e) => { e.target.style.display = 'none'; }} />
                ) : (
                  initials
                )}
              </motion.div>
            </div>
            <motion.button onClick={logout}
              className="group flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium text-white/30 hover:text-red-400/70 transition-all duration-200"
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
            className={`flex flex-col w-full md:w-[320px] lg:w-[340px] shrink-0 overflow-hidden ${activeConvo ? 'hidden md:flex' : 'flex'}`}
            style={{ ...glassStyle, borderRadius: 0, borderTop: "none", borderLeft: "none", borderBottom: "none", borderRight: "1px solid rgba(255,255,255,0.06)" }}
            initial={{ opacity: 0, x: -40 }} animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1, duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="p-4 pb-2">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20">{icons.search}</span>
                <input
                  type="text"
                  placeholder="Search conversations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm text-white/70 placeholder-white/20 outline-none transition-all duration-200 focus:border-violet-500/30"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto px-3 pb-4 space-y-1" style={{ scrollbarWidth: "thin", scrollbarColor: "rgba(255,255,255,0.08) transparent" }}>
              {conversationsLoading ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <motion.div className="h-8 w-8 rounded-full border-2 border-white/10 border-t-violet-500/60"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }} />
                  <p className="text-xs text-white/20 mt-3">Loading conversations…</p>
                </div>
              ) : Array.isArray(filteredConversations) && filteredConversations.length > 0 ? (
                filteredConversations.map((convo, i) => (
                  <ConversationItem key={convo.id} convo={convo} isActive={activeConvo === convo.id}
                    onClick={() => setActiveConvo(convo.id)} index={i} />
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl mb-3"
                    style={{ background: "rgba(139,92,246,0.08)", border: "1px solid rgba(139,92,246,0.12)" }}>
                    {icons.messages}
                  </div>
                  <p className="text-xs text-white/20">No conversations yet</p>
                </div>
              )}
            </div>
          </motion.div>

          {/* ─── RIGHT: Chat Window ─── */}
          <motion.div className={`flex-1 flex-col overflow-hidden ${!activeConvo ? 'hidden md:flex' : 'flex'}`}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.2 }}>

            {/* Chat Top Bar */}
            {activeConversation && (
              <motion.div className="shrink-0 flex items-center justify-between px-6 py-3"
                style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)" }}
                initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.2 }}>
                <div className="flex items-center gap-3">
                  <button onClick={() => { setActiveConvo(null); navigate('/messages'); }} className="md:hidden p-1 mr-1 text-white/60 hover:text-white transition-colors" aria-label="Back">
                    {icons.back}
                  </button>
                  <div className="flex relative shrink-0">
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
                  <div className="block">
                    <p className="text-sm font-semibold text-white/80 truncate max-w-[120px] sm:max-w-none">{activeConversation.name}</p>
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
                    className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-[11px] font-semibold text-white/30 hover:text-white/70 transition-all duration-200"
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
            <div className="flex-1 overflow-y-auto overflow-x-hidden px-6 py-4" style={{ paddingBottom: "80px", scrollbarWidth: "thin", scrollbarColor: "rgba(255,255,255,0.08) transparent" }}>
              <AnimatePresence mode="wait">
                <motion.div key={activeConvo} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
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
            <motion.div className="relative shrink-0 sticky bottom-0 w-full z-10"
              style={{ padding: "12px", borderTop: "1px solid rgba(255,255,255,0.06)", background: "#030108" }}
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.2 }}>
              {/* Emoji Picker */}
              <AnimatePresence>
                {showEmojiPicker && (
                  <motion.div
                    ref={emojiPickerRef}
                    className="absolute bottom-[70px] left-2 right-2 sm:left-auto sm:right-4 z-50"
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                  >
                    <EmojiPicker
                      onEmojiClick={handleEmojiClick}
                      theme="dark"
                      searchDisabled={false}
                      skinTonesDisabled
                      width="100%"
                      height={350}
                      previewConfig={{ showPreview: false }}
                      style={{ background: "rgba(12,8,28,0.97)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "16px" }}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
              <div className="flex items-center gap-2 rounded-xl px-3 py-2"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <motion.button
                  onClick={() => setShowEmojiPicker(v => !v)}
                  className={`shrink-0 transition-colors ${showEmojiPicker ? 'text-violet-400' : 'text-white/20 hover:text-white/50'}`}
                  whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }}
                  title="Emoji"
                >
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
                  autoComplete="off"
                  className="flex-1 bg-transparent text-sm text-white/80 placeholder-white/20 outline-none px-2 py-1"
                />
                <motion.button
                  onClick={handleSend}
                  className="shrink-0 flex items-center justify-center h-9 w-9 rounded-xl transition-all duration-200"
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

      {/* ══════ MOBILE BOTTOM NAV BAR ══════ */}
      <motion.nav
        className={`fixed bottom-0 left-0 right-0 z-50 md:hidden items-center justify-around py-2 px-2 ${activeConvo ? 'hidden' : 'flex'}`}
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
        transition={{ delay: 0.5, duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
      >
        {[
          { key: "dashboard", label: "Home", icon: icons.dashboard, to: "/dashboard" },
          { key: "messages", label: "Chat", icon: icons.messages, to: "/messages" },
          { key: "profile", label: "Profile", icon: icons.profile, to: user?.username ? `/profile/${user.username}` : "/dashboard" },
        ].map((item) => {
          const isActive = item.key === "messages";
          return (
            <Link key={item.key} to={item.to}
              className={`flex flex-col items-center gap-1 px-4 py-1.5 rounded-xl transition-all duration-200 ${isActive ? "text-violet-400" : "text-white/30 hover:text-white/60"}`}
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
    </div>
  );
}
