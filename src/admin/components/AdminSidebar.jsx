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
  FiBarChart2,
  FiPackage,
  FiUsers,
  FiPieChart,
} from "react-icons/fi";
import { CiDeliveryTruck } from "react-icons/ci";
import { GiMicroscopeLens } from "react-icons/gi";
import { useState } from "react";
import { useToast } from "../../context/ToastContext";
import ConfirmDialog from "../../shared/common/ConfirmDialog";

const navItem =
  "group relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200";

function AdminSidebar({ collapsed }) {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem("currentUser");
    localStorage.removeItem("token");
    setShowLogoutConfirm(false);
    showToast("Logout successful!");
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
          {isActive && (
            <motion.span
              layoutId="active-pill"
              transition={{ type: "spring", stiffness: 600, damping: 40 }}
              className="absolute left-0 top-1/2 h-7 w-1.5 -translate-y-1/2 rounded-full bg-blue-500"
            />
          )}

          <div className="flex w-6 shrink-0 items-center justify-center text-base">
            {icon}
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
            <span className="truncate">{label}</span>
          </motion.div>

          <AnimatePresence>
            {collapsed && (
              <motion.span
                initial={{ opacity: 0, x: -4 }}
                animate={{ opacity: 0 }}
                whileHover={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                className="pointer-events-none absolute left-full top-1/2 z-50 ml-3 -translate-y-1/2 whitespace-nowrap rounded-md bg-gray-900 px-2.5 py-1 text-xs font-medium text-white opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100"
              >
                {label}
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
      className="relative flex h-screen flex-col overflow-visible border-r border-slate-200 bg-white shadow-sm"
    >
      <div className="h-20 bg-white px-4">
        <motion.div layout className="flex h-full w-full items-center gap-3">
          <motion.div
            whileHover={{ scale: 1.08 }}
            transition={{ type: "spring", stiffness: 400, damping: 20 }}
            className="relative shrink-0"
          >
            <img
              src="https://tse1.mm.bing.net/th/id/OIP.VNNzIRDW9nZsWGt1vmCCXwHaFL?rs=1&pid=ImgDetMain&o=7&rm=3"
              alt="Falcon"
              className="h-9 w-9 rounded-lg object-contain"
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
              <h1 className="leading-tight tracking-tight text-slate-900 text-base font-semibold">
                Falcon Eyewear
              </h1>
              <span className="text-[11px] uppercase tracking-[0.18em] text-slate-400">
                Admin Dashboard
              </span>
            </div>
          </motion.div>
        </motion.div>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto overflow-x-hidden px-3 pb-4 pt-5">
        <div className="flex h-5 items-center px-1 text-slate-400">
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

        <div className="space-y-1.5">
          {renderItem("/dashboard", <FiGrid size={18} />, "Tổng quan", true)}
          {renderItem(
            "/dashboard/report-orders",
            <FiBarChart2 size={18} />,
            "Báo cáo đơn hàng",
          )}
          {renderItem(
            "/dashboard/report-products",
            <FiPackage size={18} />,
            "Báo cáo sản phẩm",
          )}
          {renderItem(
            "/dashboard/report-customers",
            <FiUsers size={18} />,
            "Báo cáo khách hàng",
          )}
          {renderItem("/", <FiHome size={18} />, "Customer Store", true)}
          {renderItem("/dashboard/products", <FiBox size={18} />, "Products")}
          {renderItem(
            "/dashboard/orders",
            <FiShoppingCart size={18} />,
            "Orders",
          )}
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
        </div>
      </div>

      <div className="border-t border-slate-200 p-3">
        <motion.button
          onClick={() => setShowLogoutConfirm(true)}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
          className={`${navItem} w-full text-red-500 hover:bg-red-50 hover:text-red-600`}
        >
          <div className="flex w-6 shrink-0 items-center justify-center text-base">
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
            <span>Logout</span>
          </motion.div>
        </motion.button>
      </div>

      <ConfirmDialog
        open={showLogoutConfirm}
        title="Confirm logout"
        message="You are about to sign out of your admin account. Continue?"
        confirmText="Logout"
        cancelText="Cancel"
        danger
        onConfirm={handleLogout}
        onCancel={() => setShowLogoutConfirm(false)}
      />
    </motion.aside>
  );
}

export default AdminSidebar;
