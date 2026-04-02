import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, useMotionValue, useSpring } from "framer-motion";
import { Link, useParams, useNavigate } from "react-router-dom";
import api from "../utils/api";
import { useAuth } from "../context/AuthContext";
import NotificationBell from "../components/NotificationBell";
import ThemeToggle from "../components/ThemeToggle";

/* ─── helpers ─── */
const rand = (a, b) => Math.random() * (b - a) + a;

/* ═══════════════════════════════════════════════════════════════
   BACKGROUND
   ═══════════════════════════════════════════════════════════════ */
const Background = () => (
  <div className="fixed inset-0 overflow-hidden bg-[var(--theme-bg-main)]" style={{ zIndex: 0 }}>
    <div className="absolute inset-0" style={{ background: "linear-gradient(145deg, #050208 0%, #0a0618 30%, #0d0a1a 50%, #06050f 70%, #020104 100%)" }} />
    <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 25% 15%, rgba(109,40,217,0.07) 0%, transparent 55%)" }} />
    <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 75% 85%, rgba(59,130,246,0.05) 0%, transparent 55%)" }} />
    <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 50% 50%, rgba(236,72,153,0.03) 0%, transparent 50%)" }} />
  </div>
);

/* ═══════════════════════════════════════════════════════════════
   MAGNETIC CURSOR
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
  settings: (<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>),
  logout: (<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>),
  edit: (<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" /></svg>),
  chat: (<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>),
  camera: (<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" /><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" /></svg>),
  check: (<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>),
  xMark: (<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>),
  back: (<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" /></svg>),
  bell: (<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>),
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
              whileHover={{ scale: 1.1 }}
              animate={{ borderColor: ["rgba(var(--theme-white),0.1)", "rgba(167,139,250,0.2)", "rgba(96,165,250,0.2)", "rgba(var(--theme-white),0.1)"] }}
              transition={{ duration: 0.2,  ease: "easeInOut" }}
            >
              <motion.div className="absolute inset-0 pointer-events-none"
                style={{ background: "linear-gradient(90deg,transparent,rgba(var(--theme-white),0.1),transparent)", transform: "skewX(-20deg)" }}
                animate={{ left: ["-150%", "250%"] }}
                transition={{ duration: 0.2,  repeatDelay: 4, ease: "easeInOut" }} />
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(var(--theme-white),0.85)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </motion.div>
            <motion.span className="text-xl font-bold"
              style={{ background: "linear-gradient(135deg, #ffffff 0%, #c4b5fd 70%, #818cf8 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}
              animate={{ opacity: [0.85, 1, 0.85] }}
              transition={{ duration: 0.2,  ease: "easeInOut" }}>
              MeetSync
            </motion.span>
          </Link>

          <nav className="flex-1 space-y-1.5">
            {SIDEBAR_ITEMS.map((item, i) => {
              const isActive = active === item.key;
              return (
                <motion.div key={item.key}
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 + i * 0.08, duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                >
                  <Link to={item.to} onClick={onClose}
                    className={`group relative flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 ${isActive ? "text-white/90" : "text-white/30 hover:text-white/65"}`}>
                    {isActive && (
                      <motion.div className="absolute inset-0 rounded-xl"
                        layoutId="sidebarActive"
                        style={{ background: "rgba(var(--theme-white),0.06)", border: "1px solid rgba(var(--theme-white),0.08)", boxShadow: "0 0 25px rgba(139,92,246,0.08), inset 0 1px 0 rgba(var(--theme-white),0.05)" }}
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
                        transition={{ opacity: { duration: 0.2,  }, height: { duration: 0.2,  } }} />
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
   LOADING SKELETON
   ═══════════════════════════════════════════════════════════════ */
const ProfileSkeleton = () => (
  <motion.div
    className="w-full max-w-[480px] mx-auto rounded-2xl p-8 overflow-hidden"
    style={glassStyle}
    initial={{ opacity: 0, y: 30 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
  >
    <div className="flex flex-col items-center">
      {/* Avatar skeleton */}
      <motion.div className="w-28 h-28 rounded-full mb-6"
        style={{ background: "linear-gradient(135deg, rgba(139,92,246,0.12), rgba(59,130,246,0.08))", border: "1px solid rgba(var(--theme-white),0.06)" }}
        animate={{ opacity: [0.3, 0.6, 0.3] }}
        transition={{ duration: 0.2,  ease: "easeInOut" }} />
      {/* Name skeleton */}
      <motion.div className="w-40 h-5 rounded-lg mb-3"
        style={{ background: "rgba(var(--theme-white),0.06)" }}
        animate={{ opacity: [0.3, 0.6, 0.3] }}
        transition={{ duration: 0.2,  ease: "easeInOut", delay: 0.15 }} />
      {/* Username skeleton */}
      <motion.div className="w-28 h-4 rounded-lg mb-4"
        style={{ background: "rgba(var(--theme-white),0.04)" }}
        animate={{ opacity: [0.3, 0.6, 0.3] }}
        transition={{ duration: 0.2,  ease: "easeInOut", delay: 0.3 }} />
      {/* Bio skeleton */}
      <motion.div className="w-full h-16 rounded-xl mb-6"
        style={{ background: "rgba(var(--theme-white),0.04)" }}
        animate={{ opacity: [0.3, 0.6, 0.3] }}
        transition={{ duration: 0.2,  ease: "easeInOut", delay: 0.45 }} />
      {/* Button skeleton */}
      <motion.div className="w-44 h-11 rounded-xl"
        style={{ background: "rgba(139,92,246,0.08)" }}
        animate={{ opacity: [0.3, 0.6, 0.3] }}
        transition={{ duration: 0.2,  ease: "easeInOut", delay: 0.6 }} />
    </div>
  </motion.div>
);

/* ═══════════════════════════════════════════════════════════════
   ERROR STATE
   ═══════════════════════════════════════════════════════════════ */
const ErrorCard = ({ message, onGoBack }) => (
  <motion.div
    className="w-full max-w-[480px] mx-auto rounded-2xl p-8 overflow-hidden relative"
    style={glassStyle}
    initial={{ opacity: 0, y: 30, scale: 0.95 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
  >
    {/* Top glow */}
    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-1 rounded-b-full"
      style={{ background: "linear-gradient(90deg, transparent, rgba(239,68,68,0.5), transparent)" }} />

    <div className="flex flex-col items-center text-center">
      <motion.div className="flex h-16 w-16 items-center justify-center rounded-full mb-5"
        style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.15)" }}
        animate={{ scale: [1, 1.05, 1], borderColor: ["rgba(239,68,68,0.15)", "rgba(239,68,68,0.3)", "rgba(239,68,68,0.15)"] }}
        transition={{ duration: 0.2,  ease: "easeInOut" }}
      >
        <svg className="w-8 h-8 text-red-400/70" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.182 16.318A4.486 4.486 0 0012.016 15a4.486 4.486 0 00-3.198 1.318M21 12a9 9 0 11-18 0 9 9 0 0118 0zM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75zm-.375 0h.008v.015h-.008V9.75zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75zm-.375 0h.008v.015h-.008V9.75z" />
        </svg>
      </motion.div>

      <h3 className="text-lg font-semibold text-white/80 mb-2">User Not Found</h3>
      <p className="text-sm text-white/30 mb-6 leading-relaxed">{message || "The user you're looking for doesn't exist or may have been removed."}</p>

      <motion.button onClick={onGoBack}
        className="flex items-center gap-2 rounded-xl px-6 py-2.5 text-sm font-semibold text-white/60 hover:text-white/90 transition-all duration-200"
        style={{ background: "rgba(var(--theme-white),0.05)", border: "1px solid rgba(var(--theme-white),0.08)" }}
        whileHover={{ scale: 1.04, borderColor: "rgba(var(--theme-white),0.15)", boxShadow: "0 0 20px rgba(139,92,246,0.1)" }}
        whileTap={{ scale: 0.96 }}
      >
        {icons.back}
        Go Back
      </motion.button>
    </div>
  </motion.div>
);

/* ═══════════════════════════════════════════════════════════════
   PROFILE PAGE
   ═══════════════════════════════════════════════════════════════ */
export default function ProfilePage() {
  const { username } = useParams();
  const navigate = useNavigate();
  const { updateUser } = useAuth();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);

  /* Connection state */
  const [connectionStatus, setConnectionStatus] = useState("none");
  const [connectionLoading, setConnectionLoading] = useState(false);
  const [requestId, setRequestId] = useState(null);

  /* Edit state */
  const [isEditing, setIsEditing] = useState(false);
  const [editBio, setEditBio] = useState("");
  const [editProfilePic, setEditProfilePic] = useState("");
  const [editLoading, setEditLoading] = useState(false);
  const [editSuccess, setEditSuccess] = useState(false);

  /* Incoming friend requests (own profile only) */
  const [incomingRequests, setIncomingRequests] = useState([]);
  const [requestActionLoading, setRequestActionLoading] = useState(null);

  const fileInputRef = useRef(null);

  /* ─── Get current logged-in user from localStorage ─── */
  const getCurrentUser = () => {
    try {
      return JSON.parse(localStorage.getItem("user"));
    } catch {
      return null;
    }
  };

  const getToken = () => localStorage.getItem("token");

  /* ─── Fetch profile data ─── */
  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      setError(null);
      setIsEditing(false);
      setEditSuccess(false);

      try {
        const res = await api.get(`/users/${username}`);

        const data = res.data?.user || res.data;
        setProfileData(data);

        /* Determine if viewing own profile */
        const currentUser = getCurrentUser();
        const ownProfile =
          currentUser &&
          (currentUser.username === username ||
            currentUser.name === username ||
            currentUser._id === data._id ||
            currentUser.id === data.id);
        setIsOwnProfile(ownProfile);

        if (ownProfile) {
          setEditBio(data.bio || "");
          setEditProfilePic(data.profile_picture || data.avatar || "");
        } else if (currentUser) {
          try {
            const statusRes = await api.get(`/requests/status/${data._id || data.id}`);
            setConnectionStatus(statusRes.data.status);
            setRequestId(statusRes.data.requestId);
          } catch (_err) {
            // handled by api interceptor
          }
        }
      } catch (err) {
        if (err.response?.status === 404) {
          setError("User not found");
        } else {
          setError(err.response?.data?.message || "Something went wrong");
        }
      } finally {
        setLoading(false);
      }
    };

    if (username) fetchProfile();
  }, [username]);

  /* ─── Fetch incoming requests (own profile) ─── */
  useEffect(() => {
    if (!isOwnProfile) return;
    const fetchRequests = async () => {
      try {
        const res = await api.get('/requests/incoming');
        setIncomingRequests(res.data || []);
      } catch (_) {}
    };
    fetchRequests();
  }, [isOwnProfile]);

  /* ─── Handle accept/reject from profile page ─── */
  const handleProfileRequestAction = async (reqId, action) => {
    setRequestActionLoading(reqId);
    try {
      await api.put(`/requests/${reqId}/${action}`);
      setIncomingRequests(prev => prev.filter(r => r._id !== reqId));
    } catch (_) {}
    finally { setRequestActionLoading(null); }
  };

  const handleStartChat = async () => {
    setChatLoading(true);
    try {
      const res = await api.post('/conversations', { username });
      const conversationId = res.data?.conversationId || res.data?._id || res.data?.id;
      if (conversationId) {
        navigate(`/chat/${conversationId}`);
      }
    } catch (_err) {
      // handled by api interceptor
    } finally {
      setChatLoading(false);
    }
  };

  const handleSendRequest = async () => {
    setConnectionLoading(true);
    try {
      const res = await api.post('/requests/send', 
        { to_user: profileData._id || profileData.id }
      );
      setConnectionStatus("pending_sent");
      setRequestId(res.data._id);
    } catch (_err) {
      // handled by api interceptor
    } finally {
      setConnectionLoading(false);
    }
  };

  const handleRequestAction = async (action) => {
    if (!requestId) return;
    setConnectionLoading(true);
    try {
      await api.put(`/requests/${requestId}/${action}`);
      if (action === 'accept') {
        setConnectionStatus("connected");
      } else {
        setConnectionStatus("none");
      }
    } catch (_err) {
      // handled by api interceptor
    } finally {
      setConnectionLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    setEditLoading(true);
    setEditSuccess(false);
    try {
      const payload = {
        bio: editBio,
        profile_picture: editProfilePic,
      };
      const res = await api.put('/users/profile', payload);

      const updatedUser = res.data?.user || res.data;
      setProfileData((prev) => ({ ...prev, ...updatedUser, bio: editBio, profile_picture: editProfilePic }));

      /* Update AuthContext + localStorage so photo/bio propagates everywhere */
      updateUser({ bio: editBio, profile_picture: editProfilePic });

      setEditSuccess(true);
      setTimeout(() => {
        setIsEditing(false);
        setEditSuccess(false);
      }, 1200);
    } catch (_err) {
      // handled by api interceptor
    } finally {
      setEditLoading(false);
    }
  };

  /* ─── File upload for profile picture ─── */
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setEditProfilePic(reader.result);
    };
    reader.readAsDataURL(file);
  };

  /* ─── Derived values ─── */
  const displayName = profileData?.name || profileData?.username || username;
  const displayUsername = profileData?.username || username;
  const bio = profileData?.bio || "";
  const profilePicture = profileData?.profile_picture || profileData?.avatar || "";
  const initials = displayName
    ? displayName.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2)
    : "??";

  const currentUser = getCurrentUser();
  const currentUserName = currentUser?.name || currentUser?.username || "User";
  const currentInitials = currentUserName.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);

  return (
    <div className="relative min-h-screen overflow-hidden" style={{ background: "var(--theme-bg-main)" }}>
      <Background />
      
      <Sidebar active="profile" isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} currentUsername={currentUser?.username || ""} />

      <div className="relative z-10">
        {/* ══════ TOP NAVBAR ══════ */}
        <motion.header
          className="sticky top-0 z-20 flex items-center justify-between px-6 py-4 sm:px-8"
          style={{ ...glassStyle, borderRadius: 0, borderTop: "none", borderLeft: "none", borderRight: "none", borderBottom: "1px solid rgba(var(--theme-white),0.06)" }}
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="flex items-center gap-3">
            <motion.button
              className="flex items-center justify-center h-10 w-10 rounded-xl text-white/40 hover:text-white/70 transition-colors duration-200"
              style={{ background: "rgba(var(--theme-white),0.04)", border: "1px solid rgba(var(--theme-white),0.06)" }}
              onClick={() => setSidebarOpen(!sidebarOpen)}
              whileHover={{ scale: 1.08, borderColor: "rgba(var(--theme-white),0.12)" }}
              whileTap={{ scale: 0.95 }}>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </motion.button>

            <div className="hidden lg:block">
              <motion.h2 className="text-lg font-semibold text-white/70"
                initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2, duration: 0.2 }}>
                Profile
              </motion.h2>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            <NotificationBell />

            {/* Avatar + name */}
            <div className="flex items-center gap-3">
              <div className="hidden sm:block text-right">
                <p className="text-sm font-medium text-white/60">{currentUserName}</p>
                <div className="flex items-center justify-end gap-1.5 mt-0.5">
                  <motion.div className="h-1.5 w-1.5 rounded-full"
                    style={{ background: "rgba(52,211,153,0.8)", boxShadow: "0 0 6px rgba(52,211,153,0.4)" }}
                    animate={{ opacity: [0.6, 1, 0.6] }}
                    transition={{ duration: 0.2,  }} />
                  <p className="text-[11px] text-white/20">Online</p>
                </div>
              </div>
              <motion.div className="relative flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold text-white/80 overflow-hidden"
                style={{ background: "linear-gradient(135deg, rgba(139,92,246,0.35), rgba(59,130,246,0.3))", border: "1px solid rgba(var(--theme-white),0.12)", boxShadow: "0 4px 15px rgba(var(--theme-black),0.3)" }}
                whileHover={{ scale: 1.1, borderColor: "rgba(167,139,250,0.4)" }}
                animate={{ borderColor: ["rgba(var(--theme-white),0.12)", "rgba(167,139,250,0.2)", "rgba(var(--theme-white),0.12)"] }}
                transition={{ duration: 0.2,  ease: "easeInOut" }}
              >
                {currentUser?.profile_picture ? (
                  <img src={currentUser.profile_picture} alt={currentUserName} className="w-full h-full object-cover" onError={(e) => { e.target.style.display = 'none'; }} />
                ) : (
                  currentInitials
                )}
                <motion.div className="absolute inset-0 pointer-events-none"
                  style={{ background: "linear-gradient(90deg,transparent,rgba(var(--theme-white),0.12),transparent)", transform: "skewX(-20deg)" }}
                  animate={{ left: ["-150%", "250%"] }}
                  transition={{ duration: 0.2,  repeatDelay: 5, ease: "easeInOut" }} />
              </motion.div>
            </div>
          </div>
        </motion.header>

        {/* ══════ MAIN CONTENT ══════ */}
        <main className="px-6 py-10 sm:px-8 pb-28 flex items-start justify-center min-h-[calc(100vh-72px)]">
          {loading ? (
            <ProfileSkeleton />
          ) : error ? (
            <ErrorCard message={error} onGoBack={() => navigate(-1)} />
          ) : (
            /* ══════ PROFILE CARD ══════ */
            <motion.div
              className="w-full max-w-[480px] rounded-2xl p-8 overflow-hidden relative"
              style={glassStyle}
              initial={{ opacity: 0, y: 35, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            >
              {/* Top gradient accent */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-1 rounded-b-full"
                style={{ background: "linear-gradient(90deg, transparent, rgba(139,92,246,0.6), rgba(59,130,246,0.4), transparent)" }} />

              {/* Shimmer effect */}
              <motion.div className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none" style={{ zIndex: 0 }}>
                <motion.div style={{ position: "absolute", top: 0, left: "-100%", width: "40%", height: "100%", background: "linear-gradient(90deg,transparent,rgba(var(--theme-white),0.03),transparent)", transform: "skewX(-12deg)" }}
                  animate={{ left: ["-100%", "300%"] }}
                  transition={{ duration: 0.2,  repeatDelay: 4, ease: "easeInOut" }} />
              </motion.div>

              {/* Rotating conic border on hover */}
              <motion.div className="absolute -inset-[1px] rounded-2xl overflow-hidden opacity-0 hover:opacity-100 transition-opacity duration-200" style={{ zIndex: -1 }}>
                <motion.div className="absolute inset-0"
                  style={{ background: "conic-gradient(from 0deg, transparent 30%, rgba(167,139,250,0.12), rgba(96,165,250,0.1), transparent 70%, rgba(244,114,182,0.06), transparent 100%)" }}
                  animate={{ rotate: 360 }}
                  transition={{ duration: 0.2,  ease: "linear" }} />
              </motion.div>

              <div className="relative z-10 flex flex-col items-center text-center">
                {/* ─── Avatar ─── */}
                <motion.div className="relative mb-6"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.15, duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                >
                  <motion.div
                    className="relative flex h-28 w-28 items-center justify-center rounded-full overflow-hidden text-3xl font-bold text-white/80"
                    style={{
                      background: profilePicture && !isEditing
                        ? `url(${profilePicture}) center/cover no-repeat`
                        : isEditing && editProfilePic
                        ? `url(${editProfilePic}) center/cover no-repeat`
                        : "linear-gradient(135deg, rgba(139,92,246,0.4), rgba(59,130,246,0.3), rgba(236,72,153,0.2))",
                      border: "2px solid rgba(var(--theme-white),0.1)",
                      boxShadow: "0 8px 32px rgba(139,92,246,0.15), 0 0 0 4px rgba(10,6,24,0.6)",
                    }}
                    animate={{
                      borderColor: ["rgba(var(--theme-white),0.1)", "rgba(167,139,250,0.25)", "rgba(96,165,250,0.2)", "rgba(var(--theme-white),0.1)"],
                    }}
                    transition={{ duration: 0.2,  ease: "easeInOut" }}
                  >
                    {!(profilePicture || (isEditing && editProfilePic)) && initials}
                    {/* Avatar shimmer */}
                    <motion.div className="absolute inset-0 pointer-events-none"
                      style={{ background: "linear-gradient(90deg,transparent,rgba(var(--theme-white),0.1),transparent)", transform: "skewX(-20deg)" }}
                      animate={{ left: ["-150%", "250%"] }}
                      transition={{ duration: 0.2,  repeatDelay: 5, ease: "easeInOut" }} />
                  </motion.div>

                  {/* Online indicator */}
                  <motion.div className="absolute bottom-1 right-1 h-4 w-4 rounded-full"
                    style={{ background: "rgba(52,211,153,0.9)", border: "3px solid rgba(10,6,24,0.8)", boxShadow: "0 0 10px rgba(52,211,153,0.4)" }}
                    animate={{ scale: [1, 1.2, 1], opacity: [0.8, 1, 0.8] }}
                    transition={{ duration: 0.2,  }} />

                  {/* Camera overlay for editing */}
                  {isEditing && (
                    <motion.button
                      className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 text-white/70 hover:text-white/90 transition-colors duration-200 cursor-pointer"
                      onClick={() => fileInputRef.current?.click()}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      whileHover={{ backgroundColor: "rgba(var(--theme-black),0.55)" }}
                    >
                      {icons.camera}
                    </motion.button>
                  )}
                  <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                </motion.div>

                {/* ─── Name ─── */}
                <motion.h2
                  className="text-2xl font-bold mb-1"
                  style={{ background: "linear-gradient(135deg, #ffffff 0%, #e8e4f0 35%, #c4b5fd 65%, #818cf8 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text", backgroundSize: "200% 200%" }}
                  animate={{ backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"] }}
                  transition={{ duration: 0.2,  ease: "easeInOut" }}
                  initial={{ opacity: 0, y: 10 }}
                >
                  {displayName}
                </motion.h2>

                {/* ─── Username ─── */}
                <motion.p className="text-sm text-white/30 mb-5 font-medium"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25, duration: 0.2 }}
                >
                  @{displayUsername}
                </motion.p>

                {/* ─── Bio ─── */}
                <motion.div className="w-full mb-7"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.35, duration: 0.2 }}
                >
                  {isEditing ? (
                    <textarea
                      value={editBio}
                      onChange={(e) => setEditBio(e.target.value)}
                      placeholder="Write something about yourself..."
                      rows={3}
                      className="w-full rounded-xl px-4 py-3 text-sm text-white/80 placeholder-white/15 outline-none resize-none transition-all duration-200 focus:border-violet-500/30"
                      style={{
                        background: "rgba(var(--theme-white),0.04)",
                        border: "1px solid rgba(var(--theme-white),0.08)",
                      }}
                    />
                  ) : (
                    <div className="rounded-xl px-4 py-3"
                      style={{ background: "rgba(var(--theme-white),0.02)", border: "1px solid rgba(var(--theme-white),0.04)" }}>
                      <p className="text-sm text-white/40 leading-relaxed">
                        {bio || "No bio yet."}
                      </p>
                    </div>
                  )}
                </motion.div>

                {/* ─── Action Button ─── */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.45, duration: 0.2 }}
                  className="w-full"
                >
                  {isOwnProfile ? (
                    /* ── Own Profile: Edit / Save ── */
                    <AnimatePresence mode="wait">
                      {isEditing ? (
                        <motion.div key="edit-actions" className="flex items-center gap-3"
                          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                          transition={{ duration: 0.2 }}
                        >
                          <motion.button
                            onClick={() => { setIsEditing(false); setEditBio(profileData?.bio || ""); setEditProfilePic(profileData?.profilePicture || profileData?.avatar || ""); }}
                            className="flex-1 flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold text-white/40 hover:text-white/70 transition-all duration-200"
                            style={{ background: "rgba(var(--theme-white),0.04)", border: "1px solid rgba(var(--theme-white),0.08)" }}
                            whileHover={{ scale: 1.02, borderColor: "rgba(var(--theme-white),0.15)" }}
                            whileTap={{ scale: 0.97 }}
                          >
                            {icons.xMark}
                            Cancel
                          </motion.button>

                          <motion.button
                            onClick={handleSaveProfile}
                            disabled={editLoading}
                            className="flex-1 flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold text-white/90 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                            style={{ background: "linear-gradient(135deg, rgba(52,211,153,0.4), rgba(6,182,212,0.3))", border: "1px solid rgba(52,211,153,0.2)", boxShadow: "0 0 20px rgba(52,211,153,0.1)" }}
                            whileHover={{ scale: 1.02, boxShadow: "0 0 30px rgba(52,211,153,0.2)" }}
                            whileTap={{ scale: 0.97 }}
                          >
                            {editLoading ? (
                              <motion.div className="h-5 w-5 rounded-full border-2 border-white/20 border-t-white/80"
                                animate={{ rotate: 360 }}
                                transition={{ duration: 0.2,  ease: "linear" }} />
                            ) : editSuccess ? (
                              <>{icons.check} Saved!</>
                            ) : (
                              <>{icons.check} Save Changes</>
                            )}
                          </motion.button>
                        </motion.div>
                      ) : (
                        <motion.button
                          key="edit-btn"
                          onClick={() => setIsEditing(true)}
                          className="w-full flex items-center justify-center gap-2.5 rounded-xl py-3 text-sm font-semibold text-white/80 hover:text-white transition-all duration-200"
                          style={{ background: "linear-gradient(135deg, rgba(139,92,246,0.3), rgba(59,130,246,0.25))", border: "1px solid rgba(139,92,246,0.2)", boxShadow: "0 0 25px rgba(139,92,246,0.1)" }}
                          whileHover={{ scale: 1.03, boxShadow: "0 0 35px rgba(139,92,246,0.2)", borderColor: "rgba(167,139,250,0.35)" }}
                          whileTap={{ scale: 0.97 }}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -8 }}
                        >
                          {icons.edit}
                          Edit Profile
                        </motion.button>
                      )}
                    </AnimatePresence>
                  ) : (
                    /* ── Other User: Start Chat / Connection ── */
                    <div className="w-full flex flex-col gap-3">
                      {connectionStatus === 'connected' ? (
                        <motion.button
                          onClick={handleStartChat}
                          disabled={chatLoading}
                          className="w-full flex items-center justify-center gap-2.5 rounded-xl py-3 text-sm font-semibold text-white/90 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                          style={{ background: "linear-gradient(135deg, rgba(139,92,246,0.4), rgba(59,130,246,0.35))", border: "1px solid rgba(139,92,246,0.25)", boxShadow: "0 0 25px rgba(139,92,246,0.12)" }}
                          whileHover={{ scale: 1.03, boxShadow: "0 0 40px rgba(139,92,246,0.25), 0 0 80px rgba(59,130,246,0.08)", borderColor: "rgba(167,139,250,0.4)" }}
                          whileTap={{ scale: 0.97 }}
                        >
                          {chatLoading ? (
                            <motion.div className="h-5 w-5 rounded-full border-2 border-white/20 border-t-white/80" animate={{ rotate: 360 }} transition={{ duration: 0.2,  ease: "linear" }} />
                          ) : (
                            <>{icons.chat} Open Chat</>
                          )}
                        </motion.button>
                      ) : connectionStatus === 'pending_sent' ? (
                        <button disabled className="w-full flex items-center justify-center gap-2.5 rounded-xl py-3 text-sm font-semibold text-white/40 bg-white/5 border border-white/10 cursor-not-allowed">
                          Request Sent
                        </button>
                      ) : connectionStatus === 'pending_received' ? (
                        <div className="flex gap-3">
                          <motion.button onClick={() => handleRequestAction('accept')} disabled={connectionLoading}
                            className="flex-1 flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20 transition-all"
                            whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                            {icons.check} Accept
                          </motion.button>
                          <motion.button onClick={() => handleRequestAction('reject')} disabled={connectionLoading}
                            className="flex-1 flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold text-red-400 bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 transition-all"
                            whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                            {icons.xMark} Reject
                          </motion.button>
                        </div>
                      ) : (
                        <motion.button
                          onClick={handleSendRequest}
                          disabled={connectionLoading}
                          className="w-full flex items-center justify-center gap-2.5 rounded-xl py-3 text-sm font-semibold text-white/90 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                          style={{ background: "linear-gradient(135deg, rgba(59,130,246,0.4), rgba(139,92,246,0.35))", border: "1px solid rgba(59,130,246,0.25)", boxShadow: "0 0 25px rgba(59,130,246,0.12)" }}
                          whileHover={{ scale: 1.03, boxShadow: "0 0 40px rgba(59,130,246,0.25)", borderColor: "rgba(96,165,250,0.4)" }}
                          whileTap={{ scale: 0.97 }}
                        >
                          {connectionLoading ? (
                             <motion.div className="h-5 w-5 rounded-full border-2 border-white/20 border-t-white/80" animate={{ rotate: 360 }} transition={{ duration: 0.2,  ease: "linear" }} />
                          ) : (
                            <>Send Request</>
                          )}
                        </motion.button>
                      )}
                    </div>
                  )}
                </motion.div>

                {/* ─── Incoming Friend Requests (own profile) ─── */}
                {isOwnProfile && incomingRequests.length > 0 && (
                  <motion.div className="w-full mt-6"
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.55, duration: 0.2 }}
                  >
                    <h3 className="text-sm font-semibold text-white/50 mb-3 flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z" /></svg>
                      Friend Requests
                      <span className="bg-red-500/80 text-white text-[10px] px-1.5 py-0.5 rounded-full">{incomingRequests.length}</span>
                    </h3>
                    <div className="flex flex-col gap-2">
                      {incomingRequests.map(req => (
                        <div key={req._id} className="flex items-center gap-3 rounded-xl px-3 py-2.5" style={{ background: 'rgba(var(--theme-white),0.03)', border: '1px solid rgba(var(--theme-white),0.06)' }}>
                          <div className="h-10 w-10 shrink-0 rounded-full border border-white/10 overflow-hidden bg-white/5 flex items-center justify-center text-xs font-bold text-white/70">
                            {req.from_user?.profile_picture ? (
                              <img src={req.from_user.profile_picture} alt="" className="w-full h-full object-cover" onError={(e) => { e.target.style.display = 'none'; }} />
                            ) : (
                              req.from_user?.name?.charAt(0).toUpperCase() || '?'
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-white/80 truncate">{req.from_user?.name || req.from_user?.username}</p>
                            <p className="text-xs text-white/30 truncate">@{req.from_user?.username}</p>
                          </div>
                          <div className="flex gap-2 shrink-0">
                            <motion.button onClick={() => handleProfileRequestAction(req._id, 'accept')} disabled={requestActionLoading === req._id}
                              className="h-8 w-8 rounded-lg flex items-center justify-center bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-colors" title="Accept"
                              whileTap={{ scale: 0.9 }}>
                              {icons.check}
                            </motion.button>
                            <motion.button onClick={() => handleProfileRequestAction(req._id, 'reject')} disabled={requestActionLoading === req._id}
                              className="h-8 w-8 rounded-lg flex items-center justify-center bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors" title="Reject"
                              whileTap={{ scale: 0.9 }}>
                              {icons.xMark}
                            </motion.button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}

              </div>
            </motion.div>
          )}
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
          borderTop: "1px solid rgba(var(--theme-white),0.08)",
          background: "linear-gradient(165deg, var(--theme-bg-nav) 0%, var(--theme-bg-nav-dark) 100%)",
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
          { key: "appointments", label: "Appts", icon: icons.appointments, to: "/appointments" },
          { key: "profile", label: "Profile", icon: icons.profile, to: currentUser?.username ? `/profile/${currentUser.username}` : "/dashboard" },
        ].map((item) => {
          const isActive = item.key === "profile";
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
