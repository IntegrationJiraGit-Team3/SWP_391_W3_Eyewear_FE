import { NavLink, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiGrid,
  FiBox,
  FiHome,
  FiShoppingCart,
  FiUser,
  FiLogOut,
  FiMoreHorizontal,
  FiEye,
} from "react-icons/fi";
import { CiDeliveryTruck } from "react-icons/ci";
import { GiMicroscopeLens } from "react-icons/gi";

const navItem =
  "group relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200";

function AdminSidebar({ collapsed }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("currentUser");
    localStorage.removeItem("token");
    navigate("/login");
  };

  const renderItem = (to, icon, label, end = false) => (
    <NavLink
      to={to}
      end={end}
      aria-label={label}
      title={collapsed ? label : undefined}
      className={({ isActive }) =>
        `${navItem} ${
          isActive
            ? "bg-blue-50 text-blue-600 font-semibold shadow-sm"
            : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
        }`
      }
    >
      {({ isActive }) => (
        <>
          {/* Animated active pill */}
          {isActive && (
            <motion.span
              layoutId="active-pill"
              transition={{ type: "spring", stiffness: 600, damping: 40 }}
              className="absolute left-0 top-1/2 -translate-y-1/2 h-7 w-1.5 rounded-full bg-blue-500"
            />
          )}

          {/* Icon */}
          <div className="w-6 flex justify-center items-center text-base shrink-0">
            {icon}
          </div>

          {/* Label */}
          <motion.div
            initial={false}
            animate={{
              width: collapsed ? 0 : "auto",
              opacity: collapsed ? 0 : 1,
            }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="overflow-hidden whitespace-nowrap"
          >
            <span className="truncate">{label}</span>
          </motion.div>

          {/* Tooltip when collapsed */}
          <AnimatePresence>
            {collapsed && (
              <motion.span
                initial={{ opacity: 0, x: -4 }}
                animate={{ opacity: 0 }}
                whileHover={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                className="pointer-events-none absolute left-full ml-3 top-1/2 -translate-y-1/2
                  rounded-md bg-gray-900 px-2.5 py-1 text-xs font-medium
                  text-white shadow-lg whitespace-nowrap z-50
                  opacity-0 group-hover:opacity-100
                  transition-opacity duration-150"
              >
                {label}
                {/* Tooltip arrow */}
                <span className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-gray-900" />
              </motion.span>
            )}
          </AnimatePresence>
        </>
      )}
    </NavLink>
  );

  return (
    <motion.aside
      layout
      role="navigation"
      aria-label="Admin sidebar"
      animate={{ width: collapsed ? 80 : 256 }}
      transition={{ type: "spring", stiffness: 180, damping: 32, mass: 0.9 }}
      className="relative h-screen bg-white border-r border-slate-200 shadow-sm flex flex-col overflow-visible"
    >
      {/* ===== BRAND ===== */}
      <div className="h-20 flex items-center px-4 bg-white ">
        <motion.div layout className="flex items-center gap-3 w-full">
          {/* Logo with pulse ring on hover */}
          <motion.div
            whileHover={{ scale: 1.08 }}
            transition={{ type: "spring", stiffness: 400, damping: 20 }}
            className="relative shrink-0"
          >
            <img
              src="https://tse1.mm.bing.net/th/id/OIP.VNNzIRDW9nZsWGt1vmCCXwHaFL?rs=1&pid=ImgDetMain&o=7&rm=3"
              alt="Falcon"
              className="w-9 h-9 object-contain rounded-lg"
            />
          </motion.div>

          <motion.div
            initial={false}
            animate={{
              width: collapsed ? 0 : "auto",
              opacity: collapsed ? 0 : 1,
            }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="overflow-hidden whitespace-nowrap"
          >
            <div className="flex flex-col">
              <h1 className="text-base font-semibold text-slate-900 tracking-tight leading-tight">
                Falcon Eyewear
              </h1>
              <span className="text-[11px] uppercase tracking-[0.18em] text-slate-400">
                Admin Dashboard
              </span>
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* ===== MENU ===== */}
      <div className="flex-1 pt-5 pb-4 px-3 space-y-3 overflow-y-auto overflow-x-hidden">
        {/* Section label */}
        <div className="h-5 flex items-center px-1 text-slate-400">
          {collapsed ? (
            <FiMoreHorizontal size={16} className="mx-auto opacity-70" />
          ) : (
            <motion.div
              initial={false}
              animate={{
                width: collapsed ? 0 : "auto",
                opacity: collapsed ? 0 : 1,
              }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
              className="overflow-hidden whitespace-nowrap"
            >
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em]">
                Admin Management
              </p>
            </motion.div>
          )}
        </div>

        {/* Nav items */}
        <div className="space-y-1.5 mt-1">
          <div className="relative">
            {renderItem("/dashboard", <FiGrid size={18} />, "Dashboard", true)}
          </div>
          <div className="relative">
            {renderItem("/", <FiHome size={18} />, "Customer Store", true)}
          </div>
          <div className="relative">
            {renderItem("/dashboard/products", <FiBox size={18} />, "Products")}
          </div>
          <div className="relative">
            {renderItem(
              "/dashboard/orders",
              <FiShoppingCart size={18} />,
              "Orders",
            )}
          </div>

          {renderItem(
            "/dashboard/return-requests",
            <FiEye size={18} />,
            "Return Requests",
          )}

          {renderItem(
            "/dashboard/preoders",
            <CiDeliveryTruck size={18} />,
            "Pre-order",
          )}
          <div className="relative">
            {renderItem(
              "/dashboard/prescriptions",
              <GiMicroscopeLens size={18} />,
              "Prescription",
            )}
          </div>

          <div className="relative">
            {renderItem("/dashboard/profile", <FiUser size={18} />, "Profile")}
          </div>
        </div>
      </div>

      {/* ===== FOOTER LOGOUT ===== */}
      <div className="p-3 border-t border-slate-200">
        <motion.button
          onClick={handleLogout}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
          className={`${navItem} w-full text-red-500 hover:bg-red-50 hover:text-red-600`}
        >
          <div className="w-6 flex justify-center items-center text-base shrink-0">
            <FiLogOut size={18} />
          </div>

          <motion.div
            initial={false}
            animate={{
              width: collapsed ? 0 : "auto",
              opacity: collapsed ? 0 : 1,
            }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="overflow-hidden whitespace-nowrap"
          >
            <span className="truncate">Logout</span>
          </motion.div>

          {/* Tooltip when collapsed */}
          {collapsed && (
            <span
              className="pointer-events-none absolute left-full ml-3 top-1/2 -translate-y-1/2
                rounded-md bg-gray-900 px-2.5 py-1 text-xs font-medium
                text-white shadow-lg whitespace-nowrap z-50
                opacity-0 group-hover:opacity-100
                transition-opacity duration-150"
            >
              Logout
              <span className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-gray-900" />
            </span>
          )}
        </motion.button>
      </div>
    </motion.aside>
  );
}

export default AdminSidebar;
