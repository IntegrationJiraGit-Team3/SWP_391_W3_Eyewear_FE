import { Link, NavLink, useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { FiShoppingBag, FiClipboard, FiBell } from "react-icons/fi";
import notificationService from "../services/notificationService";

function Header() {
  const navigate = useNavigate();

  const MENU_ITEMS = [
    { label: "Store", path: "/shop" },
    { label: "About Us", path: "/about" },
    { label: "Contact", path: "/contact" },
  ];

  const [cart, setCart] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("cart")) || [];
    } catch (e) {
      return [];
    }
  });

  const [currentUser, setCurrentUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("currentUser"));
    } catch (e) {
      return null;
    }
  });

  const [showUserMenu, setShowUserMenu] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const userRef = useRef(null);
  const notificationRef = useRef(null);

  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const userRole = String(currentUser?.role || "").toUpperCase();
  const canAccessDashboard =
    userRole === "ADMIN" || userRole === "OPERATIONAL_STAFF";

  const unreadCount = notifications.filter((n) => !Boolean(n.isRead)).length;

  const fetchNotifications = async () => {
    if (currentUser?.userId) {
      const data = await notificationService.getNotifications(
        currentUser.userId,
      );
      setNotifications(Array.isArray(data) ? data : []);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 5000); // poll every 5s for real-time feel
    return () => clearInterval(interval);
  }, [currentUser]);

  const cartCount = cart.reduce((s, i) => s + i.quantity, 0);

  /* sync storage events */
  useEffect(() => {
    const onStorage = () => {
      try {
        setCart(JSON.parse(localStorage.getItem("cart")) || []);
      } catch {
        setCart([]);
      }

      try {
        setCurrentUser(JSON.parse(localStorage.getItem("currentUser")));
      } catch {
        setCurrentUser(null);
      }
    };

    const onScroll = () => setScrolled(window.scrollY > 20);

    window.addEventListener("storage", onStorage);
    window.addEventListener("scroll", onScroll);

    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  /* close dropdowns on outside click */
  useEffect(() => {
    const fn = (e) => {
      if (userRef.current && !userRef.current.contains(e.target)) {
        setShowUserMenu(false);
      }
      if (
        notificationRef.current &&
        !notificationRef.current.contains(e.target)
      ) {
        setShowNotifications(false);
      }
    };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("currentUser");
    localStorage.removeItem("cart");
    localStorage.removeItem("token");

    setCurrentUser(null);
    setCart([]);
    setShowUserMenu(false);

    navigate("/");
  };

  return (
    <>
      <style>{`
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .dropdown {
          animation: slideDown .2s cubic-bezier(.22,1,.36,1);
        }
      `}</style>

      <header
        className={`fixed w-full top-0 z-50 transition-all duration-300 ${
          scrolled
            ? "bg-white/80 backdrop-blur-md shadow-sm border-b border-stone-100"
            : "bg-white border-b border-stone-100"
        }`}
      >
        <div className="max-w-7xl mx-auto px-8 py-4 flex items-center justify-between">
          {/* LOGO */}
          <Link
            to="/"
            className="group flex items-end text-2xl font-extrabold tracking-widest gap-4"
          >
            <span className="text-blue-600 group-hover:text-blue-500 transition-colors duration-300">
              FALCON
            </span>
          </Link>

          {/* DESKTOP NAV */}
          <nav className="hidden md:flex items-center gap-8 lg:gap-10 text-xs uppercase tracking-[0.2em] font-semibold text-stone-600">
            {MENU_ITEMS.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `relative pb-1.5 transition-all duration-300 ${
                    isActive ? "text-blue-600" : "hover:text-blue-600"
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    {item.label}
                    <span
                      className={`absolute left-0 -bottom-0 h-[2px] bg-blue-600 rounded-full transition-all duration-300 ${
                        isActive ? "w-full" : "w-0"
                      }`}
                    />
                  </>
                )}
              </NavLink>
            ))}

            {/* RIGHT ACTIONS */}
            <div className="flex items-center gap-5 ml-2 border-l border-stone-200 pl-6">
              {/* ORDER HISTORY */}
              <Link
                to="/my-orders"
                className="flex items-center gap-1.5 text-stone-500 hover:text-blue-600 transition-colors group"
                title="Order History"
              >
                <FiClipboard
                  size={18}
                  className="group-hover:-translate-y-0.5 transition-transform"
                />
                <span className="mt-0.5">Orders</span>
              </Link>

              {/* NOTIFICATIONS */}
              {currentUser && (
                <div className="relative" ref={notificationRef}>
                  <button
                    onClick={() => setShowNotifications(!showNotifications)}
                    className="relative p-2 rounded-full hover:bg-stone-100 hover:text-blue-600 transition-colors"
                    title="Notifications"
                  >
                    <FiBell size={18} />
                    {unreadCount > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] font-bold w-4.5 h-4.5 min-w-[18px] min-h-[18px] flex items-center justify-center rounded-full shadow animate-pulse">
                        {unreadCount > 9 ? "9+" : unreadCount}
                      </span>
                    )}
                  </button>

                  {showNotifications && (
                    <div className="dropdown absolute right-0 mt-3 w-80 bg-white rounded-2xl shadow-xl border border-stone-100 py-2 z-50">
                      <div className="px-4 py-2 border-b border-stone-100 flex justify-between items-center">
                        <span className="text-xs font-bold text-stone-700 uppercase tracking-wider">
                          Notifications
                        </span>
                        {unreadCount > 0 && (
                          <button
                            onClick={async () => {
                              const userId =
                                currentUser?.userId || currentUser?.id;
                              if (!userId) return;

                              setNotifications((prev) =>
                                prev.map((item) => ({ ...item, isRead: true })),
                              );

                              const success =
                                await notificationService.markAllAsRead(userId);

                              if (!success) {
                                fetchNotifications();
                              }
                            }}
                            className="text-[10px] font-medium text-blue-600 hover:text-blue-700"
                          >
                            Mark read
                          </button>
                        )}
                        <button
                          onClick={async () => {
                            if (window.confirm("Clear all notifications?")) {
                              await notificationService.clearAllNotifications(
                                currentUser.userId,
                              );
                              fetchNotifications();
                            }
                          }}
                          className="text-[10px] font-medium text-red-500 hover:text-red-600 ml-3"
                        >
                          Clear all
                        </button>
                      </div>

                      <div className="max-h-[350px] overflow-y-auto scrollbar-hide">
                        {notifications.length === 0 ? (
                          <div className="px-4 py-8 text-center">
                            <FiBell
                              size={24}
                              className="mx-auto text-stone-200 mb-2"
                            />
                            <p className="text-xs text-stone-400">
                              No notifications yet
                            </p>
                          </div>
                        ) : (
                          notifications.map((n) => (
                            <div
                              key={n.notificationId}
                              onClick={async () => {
                                if (!Boolean(n.isRead) && n.notificationId) {
                                  setNotifications((prev) =>
                                    prev.map((item) =>
                                      item.notificationId === n.notificationId
                                        ? { ...item, isRead: true }
                                        : item,
                                    ),
                                  );

                                  const success =
                                    await notificationService.markAsRead(
                                      n.notificationId,
                                    );

                                  if (!success) {
                                    fetchNotifications();
                                  }
                                }
                                setShowNotifications(false);

                                const type = n.type?.toUpperCase();
                                const refId = n.referenceId;

                                if (type === "ORDER" && refId) {
                                  navigate(`/shipping-progress/${refId}`);
                                } else if (type === "RETURN") {
                                  navigate("/my-orders");
                                } else if (type === "PRESCRIPTION") {
                                  const targetId = n.orderId || n.referenceId;
                                  if (targetId) {
                                    navigate(`/shipping-progress/${targetId}`);
                                  } else {
                                    navigate("/my-orders");
                                  }
                                } else if (
                                  n.title?.toLowerCase().includes("order")
                                ) {
                                  // Fallback for legacy notifications or non-typed ones
                                  navigate("/my-orders");
                                }
                              }}
                              className={`px-4 py-3 border-b border-stone-50 hover:bg-stone-50 cursor-pointer transition-colors ${
                                !Boolean(n.isRead) ? "bg-blue-50/30" : ""
                              }`}
                            >
                              <div className="flex justify-between items-start mb-1">
                                <span className="text-[11px] font-bold text-blue-600 uppercase">
                                  {n.title}
                                </span>
                                <span className="text-[9px] text-stone-400">
                                  {new Date(n.createdAt).toLocaleDateString()}
                                </span>
                              </div>
                              <p className="text-xs text-stone-600 line-clamp-2 leading-relaxed">
                                {n.message}
                              </p>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* CART */}
              <div className="relative">
                <button
                  onClick={() => {
                    navigate("/checkout");
                    setShowUserMenu(false);
                  }}
                  className="relative p-2 rounded-full hover:bg-stone-100 hover:text-blue-600 transition-colors"
                >
                  <FiShoppingBag size={18} />
                  {cartCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 bg-blue-600 text-white text-[10px] font-bold w-4.5 h-4.5 min-w-[18px] min-h-[18px] flex items-center justify-center rounded-full shadow">
                      {cartCount}
                    </span>
                  )}
                </button>
              </div>
            </div>

            {/* USER */}
            {currentUser ? (
              <div className="relative" ref={userRef}>
                <button
                  onClick={() => setShowUserMenu((p) => !p)}
                  className="flex items-center gap-2 ml-2"
                >
                  <img
                    src={`https://ui-avatars.com/api/?name=${
                      currentUser.name || currentUser.email
                    }&background=1c1917&color=fff&bold=true`}
                    alt="User"
                    className="w-9 h-9 rounded-full border-2 border-stone-200 hover:border-blue-400 transition"
                  />
                </button>

                {showUserMenu && (
                  <div className="dropdown absolute right-0 mt-3 w-52 bg-white rounded-2xl shadow-xl border border-stone-100 py-2 z-50">
                    <div className="px-4 py-2.5 border-b border-stone-100">
                      <p className="text-xs font-medium text-stone-700 truncate">
                        {currentUser.name || "User"}
                      </p>
                      <p className="text-[11px] text-stone-400 truncate mt-0.5 lowercase tracking-normal">
                        {currentUser.email}
                      </p>
                    </div>

                    <Link
                      to="/dashboard"
                      onClick={() => setShowUserMenu(false)}
                      className={`block w-full px-4 py-2.5 text-sm transition-colors font-medium ${
                        canAccessDashboard
                          ? "text-stone-600 hover:bg-stone-50 hover:text-blue-600"
                          : "hidden"
                      }`}
                    >
                      Dashboard
                    </Link>

                    <Link
                      to="/my-orders"
                      onClick={() => setShowUserMenu(false)}
                      className="block w-full px-4 py-2.5 text-sm text-stone-600 hover:bg-stone-50 hover:text-blue-600 transition-colors font-medium"
                    >
                      Orders
                    </Link>

                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors font-medium"
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => navigate("/login")}
                className="bg-blue-600 text-white px-5 py-2 rounded-full text-xs font-semibold tracking-wider hover:bg-blue-700 transition-all duration-300 ml-2"
              >
                Login
              </button>
            )}
          </nav>

          {/* MOBILE */}
          <div className="md:hidden flex items-center gap-3">
            <Link
              to="/my-orders"
              className="text-stone-600 hover:text-blue-600 p-2"
            >
              <FiClipboard size={20} />
            </Link>

            <button
              onClick={() => navigate("/checkout")}
              className="text-stone-700 p-2 relative"
            >
              <FiShoppingBag size={20} />
              {cartCount > 0 && (
                <span className="absolute top-0 right-0 bg-blue-600 text-white text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full shadow">
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>
    </>
  );
}

export default Header;
