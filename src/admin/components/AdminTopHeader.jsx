import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiSearch,
  FiChevronLeft,
  FiBell,
  FiSettings,
  FiUser,
  FiLogOut,
  FiTrash2,
  FiCheckCircle
} from "react-icons/fi";
import { adminMock } from "../data/adminMock";
import notificationService from "../../store/services/notificationService";

function AdminTopHeader({ onToggleSidebar, collapsed }) {
  const [open, setOpen] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const menuRef = useRef(null);
  const notifRef = useRef(null);
  const navigate = useNavigate();

  const [admin, setAdmin] = useState(() => {
    try {
      const stored = localStorage.getItem("currentUser");
      return stored ? JSON.parse(stored) : adminMock;
    } catch {
      return adminMock;
    }
  });

  const handleLogout = () => {
    localStorage.removeItem("currentUser");
    localStorage.removeItem("token");
    navigate("/login");
  };

  const [notifications, setNotifications] = useState([]);

  const fetchNotifications = async () => {
    const userId = admin?.userId || admin?.id; // Support both naming conventions
    if (userId) {
      const data = await notificationService.getNotifications(userId);
      setNotifications(data || []);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 5000); // 5s for real-time feel
    
    const handleStorage = () => {
      try {
        const stored = localStorage.getItem("currentUser");
        if (stored) setAdmin(JSON.parse(stored));
      } catch (e) {
        console.error("Storage sync error", e);
      }
    };
    window.addEventListener("storage", handleStorage);

    return () => {
      clearInterval(interval);
      window.removeEventListener("storage", handleStorage);
    };
  }, [admin?.userId, admin?.id]);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const handleMarkAsRead = async (id) => {
    await notificationService.markAsRead(id);
    fetchNotifications();
  };

  const handleClearAll = async () => {
    if (window.confirm("Clear all notifications?")) {
      await notificationService.clearAllNotifications(admin.userId);
      fetchNotifications();
    }
  };

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target))
        setOpen(false);
      if (notifRef.current && !notifRef.current.contains(e.target))
        setNotifOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Close one dropdown when the other opens
  const toggleMenu = () => {
    setOpen((v) => !v);
    setNotifOpen(false);
  };
  const toggleNotif = () => {
    setNotifOpen((v) => !v);
    setOpen(false);
  };

  const dropdownVariants = {
    hidden: { opacity: 0, scale: 0.96, y: -6 },
    visible: { opacity: 1, scale: 1, y: 0 },
  };

  return (
    <div className="sticky top-0 z-40 bg-white border-b border-slate-200">
      <div className="h-20 px-6 flex justify-between items-center">
        {/* ── LEFT ── */}
        <div className="flex items-center gap-4">
          {/* Sidebar toggle */}
          <button
            onClick={onToggleSidebar}
            title={collapsed ? "Expand" : "Collapse"}
            className="flex items-center px-3 py-1.5 rounded-full border border-slate-200 hover:bg-slate-100 transition"
          >
            <motion.div
              animate={{ rotate: collapsed ? 180 : 0 }}
              transition={{ duration: 0.25 }}
            >
              <FiChevronLeft size={16} />
            </motion.div>
          </button>

          {/* Search */}
          <div className="relative hidden md:block">
            <FiSearch
              className={`absolute left-3 top-1/2 -translate-y-1/2 text-sm transition-colors duration-200 ${
                searchFocused ? "text-blue-500" : "text-slate-400"
              }`}
            />
            <input
              type="text"
              placeholder="Search..."
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              className="w-56 pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
            />
          </div>
        </div>

        {/* ── RIGHT ── */}
        <div className="flex items-center gap-2">
          {/* Notification bell */}
          <div ref={notifRef} className="relative">
            <button
              onClick={toggleNotif}
              className="relative flex items-center justify-center w-9 h-9 rounded-full hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition"
              title="Notifications"
            >
              <FiBell size={18} />
              {unreadCount > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500 border border-white"
                />
              )}
            </button>

            <AnimatePresence>
              {notifOpen && (
                <motion.div
                  variants={dropdownVariants}
                  initial="hidden"
                  animate="visible"
                  exit="hidden"
                  transition={{ duration: 0.18 }}
                  className="absolute right-0 top-12 w-80 bg-white rounded-xl shadow-xl border border-slate-200 z-50 overflow-hidden"
                >
                  <div className="px-4 py-3 flex items-center justify-between border-b border-slate-100">
                    <p className="text-sm font-semibold text-slate-800">
                      Notifications
                    </p>
                    {unreadCount > 0 && (
                      <span className="text-xs text-blue-500 font-medium">
                        {unreadCount} unread
                      </span>
                    )}
                  </div>

                  <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="px-4 py-8 text-center">
                        <p className="text-xs text-slate-400">No notifications</p>
                      </div>
                    ) : (
                      notifications.map((n) => (
                        <div
                          key={n.notificationId}
                          onClick={() => {
                            if (!n.isRead) handleMarkAsRead(n.notificationId);
                            
                            // Specific Admin navigation
                            if (n.type === "ORDER") navigate("/dashboard/orders");
                            else if (n.type === "RETURN") navigate("/dashboard/return-requests");
                            else if (n.type === "PRESCRIPTION") navigate("/dashboard/prescriptions");
                            else if (n.type === "PRODUCT") navigate("/dashboard/products");
                            else if (n.title.toLowerCase().includes("order")) navigate("/dashboard/orders");
                            
                            setNotifOpen(false);
                          }}
                          className={`px-4 py-3 flex items-start gap-3 hover:bg-slate-50 transition cursor-pointer ${
                            !n.isRead ? "bg-blue-50/40" : ""
                          }`}
                        >
                          {!n.isRead && (
                            <span className="mt-1.5 w-2 h-2 rounded-full bg-blue-500 shrink-0" />
                          )}
                          <div>
                            <p className="text-xs font-bold text-blue-600 uppercase mb-0.5">
                              {n.title}
                            </p>
                            <p className="text-sm text-slate-700 leading-snug">
                              {n.message}
                            </p>
                            <p className="text-[10px] text-slate-400 mt-1">
                              {new Date(n.createdAt).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="px-4 py-2 border-t border-slate-100 flex justify-between bg-slate-50/50">
                    <button 
                      onClick={async () => {
                        await notificationService.markAllAsRead(admin.userId);
                        fetchNotifications();
                      }}
                      className="text-[10px] text-blue-500 hover:text-blue-700 font-bold flex items-center gap-1"
                    >
                      <FiCheckCircle size={12} /> Mark read
                    </button>
                    <button 
                      onClick={handleClearAll}
                      className="text-[10px] text-red-500 hover:text-red-700 font-bold flex items-center gap-1"
                    >
                      <FiTrash2 size={12} /> Clear all
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Settings shortcut */}
          <button
            onClick={() => navigate("/dashboard/settings")}
            className="flex items-center justify-center w-9 h-9 rounded-full hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition"
            title="Settings"
          >
            <FiSettings size={18} />
          </button>

          {/* Divider */}
          <div className="w-px h-6 bg-slate-200 mx-1" />

          {/* Avatar / user menu */}
          <div
            ref={menuRef}
            className="relative flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-slate-100 transition-all duration-200 cursor-pointer"
            onClick={toggleMenu}
          >
            <div className="relative group">
              <img
                src={`https://ui-avatars.com/api/?name=${admin.name || admin.email}&background=1c1917&color=fff&bold=true`}
                alt={admin.name}
                className="w-10 h-10 rounded-full object-cover shadow-md transition-all duration-300 group-hover:scale-105 group-hover:ring-2 group-hover:ring-blue-500"
              />
              {/* Online dot */}
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full shadow-sm" />
            </div>

            <div className="hidden sm:block text-sm">
              <p className="font-medium text-slate-800 leading-tight">
                {admin.name}
              </p>
              <p className="text-xs text-slate-400">Administrator</p>
            </div>

            {/* Dropdown */}
            <AnimatePresence>
              {open && (
                <motion.div
                  variants={dropdownVariants}
                  initial="hidden"
                  animate="visible"
                  exit="hidden"
                  transition={{ duration: 0.18 }}
                  className="absolute right-0 top-14 w-60 bg-white rounded-xl shadow-xl border border-slate-200 z-50 overflow-hidden"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* User info */}
                  <div className="px-4 py-3 flex items-center gap-3">
                    <img
                      src={admin.img}
                      alt={admin.name}
                      className="w-9 h-9 rounded-full object-cover shrink-0"
                    />
                    <div className="overflow-hidden">
                      <p className="text-sm font-semibold text-slate-800 truncate">
                        {admin.name}
                      </p>
                      <p className="text-xs text-slate-400 truncate mt-0.5">
                        {admin.email}
                      </p>
                    </div>
                  </div>

                  <div className="h-px bg-slate-100" />

                  <div className="py-1">
                    <button
                      onClick={() => {
                        navigate("/dashboard/profile");
                        setOpen(false);
                      }}
                      className="w-full px-4 py-2.5 text-left text-sm flex items-center gap-3 text-slate-700 hover:bg-slate-50 transition"
                    >
                      <FiUser size={15} className="text-slate-400" />
                      Profile
                    </button>

                    <button
                      onClick={() => {
                        navigate("/dashboard/settings");
                        setOpen(false);
                      }}
                      className="w-full px-4 py-2.5 text-left text-sm flex items-center gap-3 text-slate-700 hover:bg-slate-50 transition"
                    >
                      <FiSettings size={15} className="text-slate-400" />
                      Settings
                    </button>
                  </div>

                  <div className="h-px bg-slate-100" />

                  <div className="py-1">
                    <button
                      onClick={handleLogout}
                      className="w-full px-4 py-2.5 text-left text-sm flex items-center gap-3 text-red-600 hover:bg-red-50 transition"
                    >
                      <FiLogOut size={15} />
                      Logout
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminTopHeader;
