import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import api from "../utils/api";
import { Link, useNavigate } from "react-router-dom";
import socket from "../utils/socket";

const icons = {
  bell: (<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>),
  check: (<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>),
  xMark: (<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>)
};

export default function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('requests');
  const [requests, setRequests] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [hasUnread, setHasUnread] = useState(false);
  const [loadingAction, setLoadingAction] = useState(null);

  const navigate = useNavigate();
  const dropdownRef = useRef(null);

  const storedUser = localStorage.getItem("user");
  const user = storedUser ? JSON.parse(storedUser) : null;
  const currentUserId = user?._id || user?.id;

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const [reqRes, convRes] = await Promise.all([
        api.get('/requests/incoming'),
        api.get('/conversations')
      ]);

      const fetchedRequests = reqRes.data || [];
      const fetchedConvos = convRes.data || [];
      setRequests(fetchedRequests);
      setConversations(fetchedConvos);
      
      const unreadConvos = fetchedConvos.some(c => c.unread > 0);
      setHasUnread(fetchedRequests.length > 0 || unreadConvos);
    } catch (_err) {
      // handled by api interceptor
    }
  };

  useEffect(() => {
    fetchData();

    const handleNewRequest = () => fetchData();
    const handleReceiveMessage = () => fetchData();
    const handleRequestAccepted = () => fetchData();

    socket.on("new_request", handleNewRequest);
    socket.on("receiveMessage", handleReceiveMessage);
    socket.on("request_accepted", handleRequestAccepted);
    
    if (currentUserId) {
      socket.emit('authenticate', currentUserId);
    }

    return () => {
      socket.off("new_request", handleNewRequest);
      socket.off("receiveMessage", handleReceiveMessage);
      socket.off("request_accepted", handleRequestAccepted);
    };
  // eslint-disable-next-line
  }, [currentUserId]);

  const handleRequestAction = async (requestId, action) => {
    setLoadingAction(requestId);
    try {
      await api.put(`/requests/${requestId}/${action}`);
      fetchData();
      if (action === 'accept') setActiveTab('messages');
    } catch (_err) {
      // handled by api interceptor
    } finally {
      setLoadingAction(null);
    }
  };

  const handleOpenChat = (convId) => {
    setIsOpen(false);
    navigate(`/chat/${convId}`);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <motion.button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative flex items-center justify-center h-10 w-10 rounded-xl text-white/30 hover:text-white/60 transition-colors duration-300"
        style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
        whileHover={{ scale: 1.08, borderColor: "rgba(255,255,255,0.12)" }}
        whileTap={{ scale: 0.95 }}
      >
        {icons.bell}
        {hasUnread && (
          <motion.div className="absolute top-2 right-2 h-2 w-2 rounded-full"
            style={{ background: "rgba(239,68,68,0.8)", boxShadow: "0 0 8px rgba(239,68,68,0.4)" }}
            animate={{ scale: [1, 1.4, 1], opacity: [0.8, 1, 0.8] }}
            transition={{ duration: 2, repeat: Infinity }} />
        )}
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            className="fixed sm:absolute right-2 sm:right-0 top-[60px] sm:top-12 sm:mt-2 w-[calc(100vw-1rem)] sm:w-96 max-w-sm rounded-2xl overflow-hidden shadow-2xl z-[99] flex flex-col"
            style={{ 
              background: "linear-gradient(165deg, rgba(20,15,35,0.95) 0%, rgba(10,5,25,0.98) 100%)",
              backdropFilter: "blur(20px)",
              border: "1px solid rgba(255,255,255,0.1)",
              maxHeight: "80vh"
            }}
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
          >
            {/* Header Tabs */}
            <div className="flex border-b border-white/10 bg-black/20 shrink-0">
              <button 
                onClick={() => setActiveTab('requests')}
                className={`flex-1 py-3 text-sm font-medium transition-colors border-b-2 ${activeTab === 'requests' ? 'text-violet-400 border-violet-500' : 'text-white/40 border-transparent hover:text-white/70'}`}
              >
                Requests {requests.length > 0 && <span className="ml-1 bg-red-500/80 text-white text-[10px] px-1.5 py-0.5 rounded-full">{requests.length}</span>}
              </button>
              <button 
                onClick={() => setActiveTab('messages')}
                className={`flex-1 py-3 text-sm font-medium transition-colors border-b-2 ${activeTab === 'messages' ? 'text-violet-400 border-violet-500' : 'text-white/40 border-transparent hover:text-white/70'}`}
              >
                Messages
              </button>
            </div>

            {/* List Body */}
            <div className="flex-1 overflow-y-auto px-2 py-2" style={{ scrollbarWidth: "thin", scrollbarColor: "rgba(255,255,255,0.1) transparent" }}>
              {activeTab === 'requests' ? (
                requests.length === 0 ? (
                  <p className="text-center text-sm text-white/30 py-8">No incoming friend requests.</p>
                ) : (
                  requests.map((req) => (
                    <div key={req._id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors">
                      <div className="h-10 w-10 shrink-0 rounded-full border border-white/10 overflow-hidden bg-white/5 flex items-center justify-center text-xs font-bold text-white/70">
                        {req.from_user?.profile_picture ? (
                          <img src={req.from_user.profile_picture} alt="avatar" className="w-full h-full object-cover" onError={(e) => { e.target.style.display = 'none'; }} />
                        ) : (
                          req.from_user?.name?.charAt(0).toUpperCase()
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-white/90 truncate">{req.from_user?.name || req.from_user?.username}</p>
                        <p className="text-xs text-white/40 truncate">wants to connect</p>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <button onClick={() => handleRequestAction(req._id, 'accept')} disabled={loadingAction === req._id}
                          className="h-8 w-8 rounded-lg flex items-center justify-center bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-colors" title="Accept">
                          {icons.check}
                        </button>
                        <button onClick={() => handleRequestAction(req._id, 'reject')} disabled={loadingAction === req._id}
                          className="h-8 w-8 rounded-lg flex items-center justify-center bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors" title="Reject">
                          {icons.xMark}
                        </button>
                      </div>
                    </div>
                  ))
                )
              ) : (
                conversations.length === 0 ? (
                  <p className="text-center text-sm text-white/30 py-8">No recent messages.</p>
                ) : (
                  conversations.map((conv) => {
                    const name = conv.otherUser?.name || conv.otherUser?.username || "Unknown";
                    const init = name.charAt(0).toUpperCase();
                    return (
                      <div key={conv._id || conv.id} onClick={() => handleOpenChat(conv._id || conv.id)} className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors cursor-pointer">
                        <div className="h-10 w-10 shrink-0 rounded-full border border-white/10 overflow-hidden bg-white/5 flex items-center justify-center text-xs font-bold text-white/70">
                          {conv.otherUser?.profile_picture ? (
                            <img src={conv.otherUser.profile_picture} alt="avatar" className="w-full h-full object-cover" onError={(e) => { e.target.style.display = 'none'; }} />
                          ) : (
                            init
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-white/90 truncate">{name}</p>
                          <p className="text-xs text-white/40 truncate">{conv.lastMessage?.text || "Started a chat"}</p>
                        </div>
                        {conv.unread > 0 && (
                          <div className="h-5 w-5 rounded-full bg-violet-500 flex items-center justify-center text-[10px] font-bold text-white shrink-0">
                            {conv.unread}
                          </div>
                        )}
                      </div>
                    );
                  })
                )
              )}
            </div>
            
            {/* View All Footer */}
            <div className="p-3 border-t border-white/10 flex justify-center text-xs shrink-0">
              <Link to="/messages" onClick={() => setIsOpen(false)} className="text-violet-400 hover:text-violet-300 font-medium">Open Messages Hub</Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
