import React, { useState, useEffect } from "react";
import { motion, AnimatePresence, useMotionValue, useSpring } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import api from "../utils/api";
import { useAuth } from "../context/AuthContext";
import NotificationBell from "../components/NotificationBell";
import ThemeToggle from "../components/ThemeToggle";

/* ─── helpers ─── */
const rand = (a, b) => Math.random() * (b - a) + a;

/* ═══════════════════════════════════════════════════════════════
   ANIMATED BACKGROUND
   ═══════════════════════════════════════════════════════════════ */
const Background = () => (
  <div className="fixed inset-0 -z-10 overflow-hidden" style={{ background: "var(--theme-bg-main)" }}>
    {[...Array(3)].map((_, i) => (
      <motion.div key={i} className="absolute rounded-full pointer-events-none"
        style={{ width: rand(300, 500), height: rand(300, 500), left: `${rand(10, 80)}%`, top: `${rand(10, 80)}%`,
          background: i === 0 ? "radial-gradient(circle,rgba(139,92,246,0.08),transparent 70%)"
            : i === 1 ? "radial-gradient(circle,rgba(59,130,246,0.06),transparent 70%)"
            : "radial-gradient(circle,rgba(236,72,153,0.05),transparent 70%)",
          filter: "blur(60px)" }}
        animate={{ x: [0, rand(-60, 60), 0], y: [0, rand(-60, 60), 0], scale: [1, rand(1.1, 1.3), 1] }}
        transition={{ duration: rand(15, 25), repeat: Infinity, ease: "easeInOut" }} />
    ))}
  </div>
);

/* ═══════════════════════════════════════════════════════════════
   GLASS STYLE
   ═══════════════════════════════════════════════════════════════ */
const glassStyle = {
  background: "linear-gradient(165deg, rgba(var(--theme-white),0.07) 0%, rgba(var(--theme-white),0.03) 50%, rgba(var(--theme-white),0.05) 100%)",
  backdropFilter: "blur(40px) saturate(130%)",
  WebkitBackdropFilter: "blur(40px) saturate(130%)",
  border: "1px solid rgba(var(--theme-white),0.08)",
  boxShadow: "0 20px 60px rgba(var(--theme-black),0.4), inset 0 1px 0 rgba(var(--theme-white),0.08)",
};

/* ═══════════════════════════════════════════════════════════════
   ICONS
   ═══════════════════════════════════════════════════════════════ */
const icons = {
  dashboard: (<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1h-2z" /></svg>),
  messages: (<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>),
  appointments: (<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>),
  profile: (<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>),
  logout: (<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>),
  clock: (<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>),
  calendar: (<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>),
  user: (<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>),
  note: (<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>),
};

/* ═══════════════════════════════════════════════════════════════
   SIDEBAR
   ═══════════════════════════════════════════════════════════════ */
const getSidebarItems = (currentUsername) => [
  { key: "dashboard", label: "Dashboard", icon: icons.dashboard, to: "/dashboard" },
  { key: "messages", label: "Messages", icon: icons.messages, to: "/messages" },
  { key: "appointments", label: "Appointments", icon: icons.appointments, to: "/appointments" },
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
          style={{ ...glassStyle, borderRight: "1px solid rgba(var(--theme-white),0.06)", borderRadius: 0 }}
          initial={{ x: -280, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -280, opacity: 0 }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
        >
          <Link to="/dashboard" className="flex items-center gap-3 px-3 mb-10">
            <motion.div className="relative flex h-10 w-10 items-center justify-center rounded-xl overflow-hidden"
              style={{ background: "linear-gradient(135deg, rgba(139,92,246,0.25), rgba(59,130,246,0.2))", border: "1px solid rgba(var(--theme-white),0.1)" }}
              whileHover={{ scale: 1.1 }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(var(--theme-white),0.85)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </motion.div>
            <span className="text-xl font-bold"
              style={{ background: "linear-gradient(135deg, #ffffff 0%, #c4b5fd 70%, #818cf8 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
              MeetSync
            </span>
          </Link>

          <nav className="flex-1 space-y-1.5">
            {SIDEBAR_ITEMS.map((item, i) => {
              const isActive = active === item.key;
              return (
                <motion.div key={item.key}
                  initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 + i * 0.08, duration: 0.2, ease: [0.16, 1, 0.3, 1] }}>
                  <Link to={item.to} onClick={onClose}
                    className={`group relative flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 ${isActive ? "text-white/90" : "text-white/30 hover:text-white/65"}`}>
                    {isActive && (
                      <motion.div className="absolute inset-0 rounded-xl" layoutId="sidebarActive"
                        style={{ background: "rgba(var(--theme-white),0.06)", border: "1px solid rgba(var(--theme-white),0.08)", boxShadow: "0 0 25px rgba(139,92,246,0.08), inset 0 1px 0 rgba(var(--theme-white),0.05)" }}
                        transition={{ type: "spring", stiffness: 200, damping: 25 }} />
                    )}
                    <span className="relative z-10">{item.icon}</span>
                    <span className="relative z-10">{item.label}</span>
                    {isActive && (
                      <motion.div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-full"
                        style={{ background: "linear-gradient(180deg, rgba(139,92,246,0.9), rgba(59,130,246,0.7))", boxShadow: "0 0 12px rgba(139,92,246,0.5)" }}
                        layoutId="sidebarIndicator" />
                    )}
                    {!isActive && (
                      <motion.div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                        style={{ background: "rgba(var(--theme-white),0.02)", border: "1px solid rgba(var(--theme-white),0.04)" }} />
                    )}
                  </Link>
                </motion.div>
              );
            })}
          </nav>

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
   STATUS BADGE
   ═══════════════════════════════════════════════════════════════ */
const StatusBadge = ({ status }) => {
  const config = {
    pending:   { bg: "rgba(250,204,21,0.12)", border: "rgba(250,204,21,0.25)", text: "text-yellow-400", label: "Pending" },
    accepted:  { bg: "rgba(52,211,153,0.12)",  border: "rgba(52,211,153,0.25)",  text: "text-emerald-400", label: "Accepted" },
    rejected:  { bg: "rgba(239,68,68,0.12)",   border: "rgba(239,68,68,0.25)",   text: "text-red-400", label: "Rejected" },
    cancelled: { bg: "rgba(148,163,184,0.12)", border: "rgba(148,163,184,0.25)", text: "text-slate-400", label: "Cancelled" },
  };
  const c = config[status] || config.pending;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold tracking-wide uppercase ${c.text}`}
      style={{ background: c.bg, border: `1px solid ${c.border}` }}>
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: "currentColor" }} />
      {c.label}
    </span>
  );
};

/* ═══════════════════════════════════════════════════════════════
   APPOINTMENT CARD
   ═══════════════════════════════════════════════════════════════ */
const AppointmentCard = ({ appointment, currentUserId, delay }) => {
  const isHost = appointment.host_id?._id === currentUserId || appointment.host_id?.id === currentUserId;
  const partner = isHost ? appointment.client_id : appointment.host_id;
  const partnerName = partner?.name || partner?.username || "Unknown";
  const partnerInitials = partnerName.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);

  const scheduledDate = appointment.scheduled_for ? new Date(appointment.scheduled_for) : null;
  const dateStr = scheduledDate ? scheduledDate.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric" }) : "TBD";
  const timeStr = scheduledDate ? scheduledDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "TBD";

  const isPast = scheduledDate && scheduledDate < new Date();

  return (
    <motion.div
      className="group relative rounded-2xl p-5 overflow-hidden"
      style={{ ...glassStyle, opacity: isPast ? 0.6 : 1 }}
      initial={{ opacity: 0, y: 25, scale: 0.97 }}
      animate={{ opacity: isPast ? 0.6 : 1, y: 0, scale: 1 }}
      transition={{ delay, duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ scale: 1.02, y: -2 }}
    >
      {/* Top accent bar */}
      <div className="absolute top-0 left-6 right-6 h-[2px] rounded-b-full"
        style={{
          background: appointment.status === "accepted"
            ? "linear-gradient(90deg, transparent, rgba(52,211,153,0.6), transparent)"
            : appointment.status === "pending"
            ? "linear-gradient(90deg, transparent, rgba(250,204,21,0.6), transparent)"
            : appointment.status === "rejected"
            ? "linear-gradient(90deg, transparent, rgba(239,68,68,0.4), transparent)"
            : "linear-gradient(90deg, transparent, rgba(148,163,184,0.3), transparent)"
        }} />

      <div className="relative z-10">
        {/* Header row: partner + status */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full overflow-hidden border border-white/10"
              style={{ background: "linear-gradient(135deg, rgba(139,92,246,0.3), rgba(59,130,246,0.25))" }}>
              {partner?.profile_picture ? (
                <img src={partner.profile_picture} alt={partnerName} className="w-full h-full object-cover" />
              ) : (
                <span className="text-xs font-bold text-white/80">{partnerInitials}</span>
              )}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-white/85 truncate">{partnerName}</p>
              <p className="text-[11px] text-white/30 font-medium">
                {isHost ? "You're hosting" : "You're invited"}
              </p>
            </div>
          </div>
          <StatusBadge status={appointment.status} />
        </div>

        {/* Details */}
        <div className="flex flex-wrap gap-4 text-[13px] text-white/50 mb-3">
          <span className="flex items-center gap-1.5">
            {icons.calendar}
            {dateStr}
          </span>
          <span className="flex items-center gap-1.5">
            {icons.clock}
            {timeStr}
          </span>
        </div>

        {/* Note */}
        {appointment.note && (
          <div className="mt-2 rounded-xl px-3.5 py-2.5"
            style={{ background: "rgba(var(--theme-white),0.02)", border: "1px solid rgba(var(--theme-white),0.04)" }}>
            <p className="text-[12px] text-white/35 italic leading-relaxed flex items-start gap-2">
              {icons.note}
              <span>"{appointment.note}"</span>
            </p>
          </div>
        )}

        {/* Past indicator */}
        {isPast && (
          <p className="text-[11px] text-white/20 mt-3 font-medium tracking-wide uppercase">Past appointment</p>
        )}
      </div>
    </motion.div>
  );
};

/* ═══════════════════════════════════════════════════════════════
   EMPTY STATE
   ═══════════════════════════════════════════════════════════════ */
const EmptyState = ({ title, description }) => (
  <motion.div
    className="flex flex-col items-center justify-center py-16 text-center"
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 0.3, duration: 0.3 }}
  >
    <motion.div className="flex h-20 w-20 items-center justify-center rounded-2xl mb-6"
      style={{ background: "rgba(139,92,246,0.08)", border: "1px solid rgba(139,92,246,0.12)" }}
      animate={{ scale: [1, 1.05, 1] }}
      transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}>
      <svg className="w-10 h-10 text-violet-400/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    </motion.div>
    <h3 className="text-lg font-semibold text-white/50 mb-2">{title}</h3>
    <p className="text-sm text-white/20 max-w-xs leading-relaxed">{description}</p>
  </motion.div>
);

/* ═══════════════════════════════════════════════════════════════
   APPOINTMENTS PAGE
   ═══════════════════════════════════════════════════════════════ */
export default function AppointmentsPage() {
  const { user, logout: authLogout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("upcoming");

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        const res = await api.get("/appointments");
        console.log("[Appointments] raw API response:", res.data);
        const data = Array.isArray(res.data) ? res.data : (res.data?.appointments || []);
        console.log("[Appointments] parsed array length:", data.length);
        if (data.length > 0) {
          console.log("[Appointments] first item:", JSON.stringify(data[0], null, 2));
        }
        setAppointments(data);
      } catch (err) {
        console.error("Fetch appointments error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAppointments();
  }, []);

  /* Helper: safely get the scheduled date from an appointment */
  const getScheduledDate = (a) => {
    const raw = a.scheduled_for || a.scheduledFor;
    if (!raw) return null;
    const d = new Date(raw);
    return isNaN(d.getTime()) ? null : d;
  };

  const now = new Date();

  const upcoming = appointments.filter(a => {
    const d = getScheduledDate(a);
    return (a.status === "accepted" || a.status === "pending") && d && d >= now;
  });

  const pending = appointments.filter(a => a.status === "pending");

  const past = appointments.filter(a => {
    const d = getScheduledDate(a);
    return a.status === "rejected" || a.status === "cancelled" ||
      (d && d < now);
  });

  const tabs = [
    { key: "upcoming", label: "Upcoming", count: upcoming.length },
    { key: "pending", label: "Pending", count: pending.length },
    { key: "past", label: "Past", count: past.length },
    { key: "all", label: "All", count: appointments.length },
  ];

  const filteredAppointments = activeTab === "upcoming" ? upcoming
    : activeTab === "pending" ? pending
    : activeTab === "past" ? past
    : appointments;

  const username = user?.name || user?.username || "User";
  const initials = username.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);

  const logout = () => {
    authLogout();
    window.location.href = "/";
  };

  return (
    <div className="relative min-h-screen overflow-hidden" style={{ background: "var(--theme-bg-main)" }}>
      <Background />
      
      <Sidebar active="appointments" isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} currentUsername={user?.username || ""} />

      <div className="relative z-10 flex flex-col min-h-screen">
        {/* ══════ TOP NAVBAR ══════ */}
        <motion.header
          className="sticky top-0 z-20 flex items-center justify-between px-6 py-4 sm:px-8"
          style={{ ...glassStyle, borderRadius: 0, borderTop: "none", borderLeft: "none", borderRight: "none", borderBottom: "1px solid rgba(var(--theme-white),0.06)" }}
          initial={{ opacity: 0, y: -30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}
        >
          <motion.button className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 border border-white/5 text-white/40 hover:text-white/70"
            onClick={() => setSidebarOpen(!sidebarOpen)} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" /></svg>
          </motion.button>

          <h2 className="hidden lg:block text-lg font-semibold text-white/70">Appointments</h2>

          <div className="flex items-center gap-3">
            <ThemeToggle />
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
        <main className="flex-1 px-6 py-8 sm:px-8 max-w-[900px] w-full mx-auto pb-28">
          {/* Page heading */}
          <motion.div className="mb-8"
            initial={{ opacity: 0, y: 25 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15, duration: 0.3 }}>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
              <span className="text-white/35">Your </span>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-violet-200 to-indigo-400">Appointments</span>
            </h1>
            <p className="mt-2 text-[14px] text-white/18">View and manage all your scheduled meetings.</p>
          </motion.div>

          {/* Tabs */}
          <motion.div className="flex gap-2 mb-8 flex-wrap"
            initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25, duration: 0.2 }}>
            {tabs.map((tab) => (
              <motion.button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`relative flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${activeTab === tab.key ? "text-white/90" : "text-white/30 hover:text-white/55"}`}
                style={activeTab === tab.key ? {
                  background: "rgba(139,92,246,0.15)",
                  border: "1px solid rgba(139,92,246,0.25)",
                  boxShadow: "0 0 20px rgba(139,92,246,0.08)"
                } : {
                  background: "rgba(var(--theme-white),0.03)",
                  border: "1px solid rgba(var(--theme-white),0.06)"
                }}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
              >
                {tab.label}
                {tab.count > 0 && (
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${activeTab === tab.key ? "bg-violet-500/30 text-violet-300" : "bg-white/5 text-white/25"}`}>
                    {tab.count}
                  </span>
                )}
              </motion.button>
            ))}
          </motion.div>

          {/* Appointments grid */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {[...Array(4)].map((_, i) => (
                <motion.div key={i} className="rounded-2xl p-6 h-40"
                  style={{ ...glassStyle }}
                  animate={{ opacity: [0.3, 0.6, 0.3] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut", delay: i * 0.15 }} />
              ))}
            </div>
          ) : filteredAppointments.length === 0 ? (
            <EmptyState
              title={activeTab === "upcoming" ? "No upcoming appointments" : activeTab === "pending" ? "No pending appointments" : activeTab === "past" ? "No past appointments" : "No appointments yet"}
              description="Schedule appointments through the chat page by clicking the calendar icon in any conversation."
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {filteredAppointments.map((apt, i) => (
                <AppointmentCard key={apt._id} appointment={apt} currentUserId={user?.id} delay={0.3 + i * 0.08} />
              ))}
            </div>
          )}
        </main>
      </div>

      {/* ══════ MOBILE BOTTOM NAV BAR ══════ */}
      <motion.nav
        className="fixed bottom-0 left-0 right-0 z-50 flex md:hidden items-center justify-around py-2 px-2"
        style={{
          ...glassStyle,
          borderRadius: 0, borderBottom: "none", borderLeft: "none", borderRight: "none",
          borderTop: "1px solid rgba(var(--theme-white),0.08)",
          background: "linear-gradient(165deg, var(--theme-bg-nav) 0%, var(--theme-bg-nav-dark) 100%)",
          backdropFilter: "blur(30px) saturate(150%)",
          WebkitBackdropFilter: "blur(30px) saturate(150%)",
        }}
        initial={{ y: 80 }} animate={{ y: 0 }}
        transition={{ delay: 0.5, duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
      >
        {[
          { key: "dashboard", label: "Home", icon: icons.dashboard, to: "/dashboard" },
          { key: "messages", label: "Chat", icon: icons.messages, to: "/messages" },
          { key: "appointments", label: "Appts", icon: icons.appointments, to: "/appointments" },
          { key: "profile", label: "Profile", icon: icons.profile, to: user?.username ? `/profile/${user.username}` : "/dashboard" },
        ].map((item) => {
          const isActive = item.key === "appointments";
          return (
            <Link key={item.key} to={item.to}
              className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-all duration-200 ${isActive ? "text-violet-400" : "text-white/30 hover:text-white/60"}`}>
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
