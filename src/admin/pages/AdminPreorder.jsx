import { useCallback, useMemo, useState, memo, useEffect } from "react";
import {
  getPreorderItemsService,
  getStockVariantById,
  updateStockService,
} from "../services/preOrderService";
import {
  FiPackage,
  FiCheck,
  FiSearch,
  FiFilter,
  FiX,
  FiEye,
  FiClock,
  FiAlertCircle,
  FiZap,
  FiCheckCircle,
  FiRefreshCw,
} from "react-icons/fi";
import { updateOrderStatus } from "../services/orderService";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "../../context/ToastContext";

const STEP_COLORS = {
  gray: {
    bg: "bg-gray-100",
    text: "text-gray-600",
    border: "border-gray-200",
    dot: "bg-gray-400",
    ring: "ring-gray-200",
    btn: "bg-gray-800 hover:bg-gray-700",
  },
  blue: {
    bg: "bg-blue-50",
    text: "text-blue-700",
    border: "border-blue-200",
    dot: "bg-blue-500",
    ring: "ring-blue-200",
    btn: "bg-blue-600 hover:bg-blue-700",
  },
  violet: {
    bg: "bg-violet-50",
    text: "text-violet-700",
    border: "border-violet-200",
    dot: "bg-violet-500",
    ring: "ring-violet-200",
    btn: "bg-violet-600 hover:bg-violet-700",
  },
  amber: {
    bg: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-200",
    dot: "bg-amber-500",
    ring: "ring-amber-200",
    btn: "bg-amber-500 hover:bg-amber-600",
  },
  orange: {
    bg: "bg-orange-50",
    text: "text-orange-700",
    border: "border-orange-200",
    dot: "bg-orange-400",
    ring: "ring-orange-200",
    btn: "bg-orange-500 hover:bg-orange-600",
  },
  teal: {
    bg: "bg-teal-50",
    text: "text-teal-700",
    border: "border-teal-200",
    dot: "bg-teal-500",
    ring: "ring-teal-200",
    btn: "bg-teal-600 hover:bg-teal-700",
  },
  green: {
    bg: "bg-green-50",
    text: "text-green-700",
    border: "border-green-200",
    dot: "bg-green-500",
    ring: "ring-green-200",
    btn: "bg-green-600 hover:bg-green-700",
  },
};

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   HELPERS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

const colorOf = (step) => STEP_COLORS[step.color] || STEP_COLORS.gray;

const fmtDate = () => new Date().toLocaleDateString("en-US");

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   MINI PIPELINE TRACK (in row)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
function MiniPipeline({ currentStep, cancelled }) {
  return (
    <div className="flex items-center gap-0.5">
      {STEPS.map((s, i) => {
        const done = !cancelled && currentStep > s.id;
        const active = !cancelled && currentStep === s.id;
        const cx = colorOf(s);
        return (
          <div key={s.id} className="flex items-center">
            <div
              className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] border transition-all
              ${cancelled && currentStep <= s.id
                  ? "bg-gray-100 border-gray-200 text-gray-300"
                  : done
                    ? "bg-green-500 border-green-500 text-white"
                    : active
                      ? `${cx.bg} ${cx.border} ${cx.text} border`
                      : "bg-gray-50 border-gray-200 text-gray-300"
                }`}
              title={s.label}
            >
              {done ? <FiCheck size={9} /> : i + 1}
            </div>
            {i < STEPS.length - 1 && (
              <div
                className={`w-2.5 h-px ${done ? "bg-green-400" : "bg-gray-200"}`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   PREORDER ROW
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
const PreorderRow = memo(({ order, checkStock, onFastApprove }) => {
  const canApprove = !order.cancelled && order.step === 0 && order.allInStock;

  return (
    <tr className="hover:bg-gray-50/50 group text-gray-700">
      {/* ID */}
      <td className="px-5 py-4">
        <span className="font-mono text-xs font-bold bg-gray-100 text-gray-700 px-2.5 py-1.5 rounded-lg tracking-wider">
          {order.id}
        </span>
      </td>

      {/* Customer */}
      <td className="px-5 py-4">
        <div className="flex items-center gap-3">
          <img
            src={order.avatar}
            alt={order.customer}
            className="w-9 h-9 rounded-full object-cover border border-gray-100 flex-shrink-0"
            loading="lazy"
          />
          <div className="min-w-0">
            <p className="font-semibold text-gray-800 text-sm truncate">
              {order.customer}
            </p>
            <p className="text-xs text-gray-400 truncate">{order.email}</p>
          </div>
        </div>
      </td>

      {/* Items */}
      <td className="px-5 py-4">
        {order.items.map((item, i) => (
          <div key={i}>
            <p className="text-sm font-medium text-gray-800">
              {item.name} - {order.color}
            </p>
            <p className="text-xs text-gray-400">Quantity: {item.quantity}</p>
          </div>
        ))}
      </td>

      <td className="px-5 py-4">
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${order.allInStock ? "bg-green-50 text-green-700 border-green-200" : "bg-amber-50 text-amber-700 border-amber-200"}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${order.allInStock ? "bg-green-500" : "bg-amber-400"}`} />
          {order.allInStock ? "Ready to ship" : "Waiting for items"}
        </span>
      </td>

      <td className="px-5 py-4">
        {order.cancelled ? (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-200">
            <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
            Cancelled
          </span>
        ) : (
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${order.step === 6
              ? "bg-green-50 text-green-700 border-green-200"
              : order.step === 0
                ? "bg-yellow-50 text-yellow-700 border-yellow-200"
                : "bg-blue-50 text-blue-700 border-blue-200"
              }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${order.step === 6
                ? "bg-green-500"
                : order.step === 0
                  ? "bg-yellow-400"
                  : "bg-blue-400"
                }`}
            />
            {order.step === 6
              ? "Completed"
              : order.step === 0
                ? "Pending"
                : "Processing"}
          </span>
        )}
      </td>

      {/* Date */}
      <td className="px-5 py-4 text-sm text-gray-400 whitespace-nowrap">
        {order.createdAt}
      </td>
      <td className="px-5 py-4 text-right">
        <div className="flex justify-end gap-2">
          {canApprove && (
            <div className="relative group/tip">
              <button
                onClick={() => onFastApprove(order)}
                className="p-2 rounded-lg text-green-600 hover:bg-green-50 transition-colors"
              >
                <FiCheckCircle size={18} />
              </button>
              <span className="pointer-events-none absolute bottom-full mb-2 right-0 px-2 py-1 text-[10px] rounded-md bg-gray-800 text-white opacity-0 group-hover/tip:opacity-100 transition-opacity duration-150 whitespace-nowrap z-50">
                Quick Approve (FIFO)
              </span>
            </div>
          )}
          <div className="relative group/tip">
            <button
              onClick={() => checkStock(order)}
              className="p-2 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors"
            >
              <FiEye size={18} />
            </button>
            <span className="pointer-events-none absolute bottom-full mb-2 right-0 px-2 py-1 text-[10px] rounded-md bg-gray-800 text-white opacity-0 group-hover/tip:opacity-100 transition-opacity duration-150 whitespace-nowrap z-50">
              View details
            </span>
          </div>
        </div>
      </td>
    </tr>
  );
});
PreorderRow.displayName = "PreorderRow";

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   MAIN PAGE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
export default function AdminPreorders() {
  const [orders, setOrders] = useState([]);
  const [search, setSearch] = useState("");
  const [stepFilter, setStepFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [viewing, setViewing] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const { showToast } = useToast();
  const itemsPerPage = 7;
  const mapStatusToStep = (status) => {
    const s = String(status || "").toUpperCase();
    switch (s) {
      case "PENDING":
        return 0;
      case "PROCESSING":
      case "CONFIRMED":
        return 1;
      case "PRESCRIPTION_CHECKED":
        return 2;
      case "IN_PRODUCTION":
        return 3;
      case "QC":
        return 4;
      case "SHIPPING":
        return 5;
      case "DELIVERED":
        return 6;
      default:
        return 0;
    }
  };

  useEffect(() => {
    const fetchPreorder = async () => {
      const data = await getPreorderItemsService();

      // 1. Group items by orderId
      const groups = {};
      data.forEach(item => {
        if (!groups[item.orderId]) {
          groups[item.orderId] = {
            orderId: item.orderId,
            orderCode: item.orderCode,
            orderStatus: item.orderStatus,
            customerName: item.customerName,
            customerEmail: item.customerEmail,
            phone: item.phone,
            address: item.address,
            createdAt: item.createdAt,
            note: item.note,
            items: []
          };
        }
        groups[item.orderId].items.push(item);
      });

      // 2. Map groups to row objects with accurate stock per item
      const mapped = await Promise.all(
        Object.values(groups).map(async (group) => {
          const itemsWithStock = await Promise.all(
            group.items.map(async (it) => {
              let currentStock = 0;
              try {
                const stockData = await getStockVariantById(it.variantId);
                currentStock = stockData?.stockQuantity ?? 0;
              } catch (e) {
                console.error("Stock error:", e);
              }
              return {
                ...it,
                name: it.productName || "Product",
                img: it.imageUrl || "https://placehold.co/50",
                currentStock
              };
            })
          );

          // Determine overall stock status for the order
          const allInStock = itemsWithStock.every(it => it.currentStock >= it.quantity);

          return {
            id: group.orderCode,
            orderId: group.orderId,
            customer: group.customerName,
            email: group.customerEmail,
            phone: group.phone,
            address: group.address,
            createdAt: new Date(group.createdAt).toLocaleDateString("en-US"),
            rawDate: new Date(group.createdAt),
            note: group.note,
            avatar: `https://ui-avatars.com/api/?name=${group.customerName}`,
            items: itemsWithStock,
            allInStock,
            step: mapStatusToStep(group.orderStatus),
            cancelled: group.orderStatus === "CANCELLED",
            history: [],
          };
        })
      );

      setOrders(mapped.sort((a, b) => a.rawDate - b.rawDate));
    };

    fetchPreorder();
  }, []);

  const checkStockBeforeConfirm = async (order) => {
    try {
      // Re-verify stock for all items
      const itemsWithFreshStock = await Promise.all(
        order.items.map(async (it) => {
          const res = await getStockVariantById(it.variantId);
          return { ...it, freshStock: res?.stockQuantity ?? 0 };
        })
      );

      const missingItems = itemsWithFreshStock.filter(it => it.freshStock < it.quantity);

      if (missingItems.length > 0) {
        showToast(`Missing stock for: ${missingItems.map(it => it.name).join(", ")}`, "error");
        return;
      }

      showToast("All items are available in inventory.");
      setViewing(order);
    } catch (error) {
      console.error(error);
      showToast("Error checking stock!", "error");
    }
  };

  const handleFastApprove = async (order) => {
    if (!window.confirm(`Approve order ${order.id} and deduct stock for all items immediately?`)) return;
    setIsProcessing(true);
    try {
      // 1. Deduct stock for all items
      for (const item of order.items) {
        const variantRes = await getStockVariantById(item.variantId);
        const currentStock = variantRes?.stockQuantity ?? variantRes?.quantity ?? 0;
        const newQuantity = Math.max(0, currentStock - (item.quantity || 0));
        await updateStockService(item.variantId, newQuantity);
      }

      // 2. Update order status
      await updateOrderStatus(order.orderId, "PROCESSING");

      showToast(`Order ${order.id} approved and items deducted!`);
      setTimeout(() => window.location.reload(), 1000);
    } catch (error) {
      console.error(error);
      showToast("Failed to approve order.", "error");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAutoFulfill = async () => {
    // 1. Filter out orders that are ready and pending
    const candidates = orders.filter(o => o.step === 0 && !o.cancelled && o.allInStock);

    if (candidates.length === 0) {
      showToast("No additional orders found where ALL items are currently in stock.", "info");
      return;
    }

    // 2. FIFO sorting already done in state, but let's be sure
    const sorted = [...candidates].sort((a, b) => a.rawDate - b.rawDate);

    // 3. Deduction Pool to prevent over-approving limited stock
    const variantPool = {}; 
    const approvedTasks = [];

    for (const order of sorted) {
      let canFulfillTotal = true;
      const groupTasks = [];

      for (const item of order.items) {
        if (variantPool[item.variantId] === undefined) {
          variantPool[item.variantId] = Number(item.currentStock) || 0;
        }

        if (variantPool[item.variantId] >= item.quantity) {
          groupTasks.push({
            variantId: item.variantId,
            newQuantity: variantPool[item.variantId] - item.quantity,
            quantity: item.quantity
          });
        } else {
          canFulfillTotal = false;
          break;
        }
      }

      if (canFulfillTotal) {
        groupTasks.forEach(gt => {
          variantPool[gt.variantId] -= gt.quantity;
        });
        approvedTasks.push({
          orderId: order.orderId,
          code: order.id,
          stockUpdates: groupTasks
        });
      }
    }

    if (approvedTasks.length === 0) {
      showToast("Aggregate inventory limit reached. No more complete orders can be fulfilled.", "info");
      return;
    }

    if (!window.confirm(`Found ${approvedTasks.length} orders that can be fully satisfied. Approve them all now?`)) return;

    setIsProcessing(true);
    let count = 0;
    try {
      for (const t of approvedTasks) {
        for (const update of t.stockUpdates) {
          await updateStockService(update.variantId, update.newQuantity);
        }
        await updateOrderStatus(t.orderId, "PROCESSING");
        count++;
      }
      showToast(`Batch approved ${count} orders!`);
      setTimeout(() => window.location.reload(), 1000);
    } catch (error) {
      console.error(error);
      showToast("Batch processing interrupted by an error.", "error");
    } finally {
      setIsProcessing(false);
    }
  };

  /* ── filter ── */
  const filtered = useMemo(() => {
    return orders.filter((o) => {
      // 🟢 Logic: Once approved (step > 0), it should move to Order Management, 
      // so we filter it out if we just want to see "Waiting for Approval" items.
      // But we check stepFilter first.
      if (stepFilter === "all" && o.step > 0 && !o.cancelled) return false;

      const matchSearch =
        o.id.toLowerCase().includes(search.toLowerCase()) ||
        o.customer.toLowerCase().includes(search.toLowerCase()) ||
        o.email.toLowerCase().includes(search.toLowerCase());
      if (!matchSearch) return false;
      if (stepFilter === "all") return true;
      if (stepFilter === "cancelled") return o.cancelled;
      if (stepFilter === "active") return !o.cancelled && o.step < 6;
      if (stepFilter === "done") return !o.cancelled && o.step === 6;
      return !o.cancelled && String(o.step) === stepFilter;
    });
  }, [orders, search, stepFilter]);

  /* ── pagination ── */
  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const safePage = Math.min(currentPage, Math.max(1, totalPages));
  const paginated = filtered.slice(
    (safePage - 1) * itemsPerPage,
    safePage * itemsPerPage,
  );

  const getPagination = () => {
    if (totalPages <= 7)
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    const pages = [1];
    if (safePage > 4) pages.push("...");
    for (
      let i = Math.max(2, safePage - 1);
      i <= Math.min(totalPages - 1, safePage + 1);
      i++
    )
      pages.push(i);
    if (safePage < totalPages - 3) pages.push("...");
    pages.push(totalPages);
    return pages;
  };

  /* ── advance step ── */
  const handleAdvance = useCallback(
    (id, note) => {
      setOrders((prev) =>
        prev.map((o) => {
          if (o.id !== id) return o;
          const nextStep = o.step + 1;
          const histEntry = { step: nextStep, date: fmtDate(), note };
          return {
            ...o,
            step: nextStep,
            history: [...(o.history || []), histEntry],
          };
        }),
      );
      // update viewing
      setViewing((v) => {
        if (!v || v.id !== id) return v;
        const nextStep = v.step + 1;
        return {
          ...v,
          step: nextStep,
          history: [
            ...(v.history || []),
            { step: nextStep, date: fmtDate(), note },
          ],
        };
      });
      showToast(
        `Moved to: ${STEPS[Math.min(orders.find((o) => o.id === id)?.step + 1 || 0, 6)]?.label}`,
      );
    },
    [orders, showToast],
  );

  /* ── cancel ── */
  const handleCancel = useCallback(
    (id) => {
      setOrders((prev) =>
        prev.map((o) => {
          if (o.id !== id) return o;
          const histEntry = {
            step: o.step,
            date: fmtDate(),
            note: "Admin cancelled the order.",
          };
          return {
            ...o,
            cancelled: true,
            history: [...(o.history || []), histEntry],
          };
        }),
      );
      setViewing((v) => {
        if (!v || v.id !== id) return v;
        return {
          ...v,
          cancelled: true,
          history: [
            ...(v.history || []),
            {
              step: v.step,
              date: fmtDate(),
              note: "Admin cancelled the order.",
            },
          ],
        };
      });
      showToast("Order cancelled", "error");
    },
    [showToast],
  );

  const activeFilters = [stepFilter !== "all", search !== ""].filter(
    Boolean,
  ).length;

  return (
    <div className="px-8 pt-6 pb-12 bg-gray-50 min-h-full">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-800">
            Pre-order Management
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Track and process custom eyeglass production
          </p>
        </div>
        <button
          onClick={handleAutoFulfill}
          disabled={isProcessing}
          className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all disabled:opacity-50 active:scale-95"
        >
          {isProcessing ? (
            <FiRefreshCw className="animate-spin" size={16} />
          ) : (
            <FiZap size={16} />
          )}
          Auto-Approve (FIFO)
        </button>
      </div>

      {/* Table card */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm">
        {/* Toolbar */}
        <div className="flex items-center justify-between gap-3 p-5 border-b border-gray-100 flex-wrap">
          <div className="relative w-72">
            <FiSearch
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              size={14}
            />
            <input
              type="text"
              placeholder="Search order code, customer..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-gray-50 focus:bg-white transition-shadow"
            />
          </div>
          <div className="flex items-center gap-2">
            <FiFilter size={13} className="text-gray-400" />
            {activeFilters > 0 && (
              <button
                onClick={() => {
                  setSearch("");
                  setStepFilter("all");
                  setCurrentPage(1);
                }}
                className="text-xs text-gray-400 hover:text-red-500 px-2 py-1 rounded-md hover:bg-red-50 transition-colors"
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs uppercase text-gray-400 border-b border-gray-100 bg-gray-50/60">
                <th className="text-left px-5 py-3.5 font-semibold tracking-wider">
                  Order Code
                </th>
                <th className="text-left px-5 py-3.5 font-semibold tracking-wider">
                  Customer
                </th>
                <th className="text-left px-5 py-3.5 font-semibold tracking-wider">
                  Product
                </th>
                <th className="text-left px-5 py-3.5 font-semibold tracking-wider">
                  Stock
                </th>
                <th className="text-left px-5 py-3.5 font-semibold tracking-wider">
                  Status
                </th>
                <th className="text-left px-5 py-3.5 font-semibold tracking-wider">
                  Order Date
                </th>

                <th className="w-16 px-5 py-3.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-20 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <FiPackage
                        size={40}
                        strokeWidth={1.2}
                        className="text-gray-200"
                      />
                      <p className="text-sm text-gray-400">
                        No pre-orders found
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginated.map((o) => (
                  <PreorderRow
                    key={o.id}
                    order={o}
                    checkStock={checkStockBeforeConfirm}
                    onFastApprove={handleFastApprove}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        {paginated.length > 0 && (
          <div className="flex items-center justify-between px-5 py-4 border-t border-gray-100">
            <p className="text-xs text-gray-400">
              Showing{" "}
              <span className="font-medium text-gray-600">
                {(safePage - 1) * itemsPerPage + 1}–
                {Math.min(safePage * itemsPerPage, filtered.length)}
              </span>{" "}
              of{" "}
              <span className="font-medium text-gray-600">
                {filtered.length}
              </span>{" "}
              orders
            </p>
            {totalPages > 1 && (
              <div className="flex items-center gap-1 select-none">
                <button
                  disabled={safePage === 1}
                  onClick={() => setCurrentPage((p) => p - 1)}
                  className="px-3 py-1.5 rounded-lg text-sm text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:pointer-events-none"
                >
                  ←
                </button>
                {getPagination().map((page, i) =>
                  page === "..." ? (
                    <span key={i} className="px-2 text-gray-300 text-sm">
                      …
                    </span>
                  ) : (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`min-w-[34px] px-3 py-1.5 rounded-lg text-sm font-medium
                        ${safePage === page ? "bg-blue-600 text-white" : "text-gray-600 hover:bg-gray-100"}`}
                    >
                      {page}
                    </button>
                  ),
                )}
                <button
                  disabled={safePage === totalPages}
                  onClick={() => setCurrentPage((p) => p + 1)}
                  className="px-3 py-1.5 rounded-lg text-sm text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:pointer-events-none"
                >
                  →
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modals */}
      <AnimatePresence>
        {viewing && (
          <DetailModal
            key={viewing.id}
            order={viewing}
            onClose={() => setViewing(null)}
            onAdvance={handleAdvance}
            onCancel={handleCancel}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   DETAIL MODAL
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
function DetailModal({ order, onClose, onAdvance, onCancel }) {
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  const handleApprove = async () => {
    if (!window.confirm("Approve this pre-order and deduct inventory for ALL items?")) return;
    setLoading(true);
    try {
      // 1. Deduct stock for each item sequentially
      for (const item of order.items) {
        const variantRes = await getStockVariantById(item.variantId);
        const currentStock = variantRes?.stockQuantity ?? variantRes?.quantity ?? 0;
        const qtyToDeduct = Number(item.quantity) || 0;
        const newQuantity = Math.max(0, currentStock - qtyToDeduct);
        
        console.log(`Deducting ${qtyToDeduct} from ${currentStock} for ${item.name}. New stock: ${newQuantity}`);
        await updateStockService(item.variantId, newQuantity);
      }

      // 2. Update order status to PROCESSING
      await updateOrderStatus(order.orderId, "PROCESSING");

      showToast(`Processed successfully!`);
      setTimeout(() => window.location.reload(), 1500);
    } catch (error) {
      console.error("Lỗi xử lý:", error);
      showToast(
        "Error processing pre-order: " +
        (error.response?.data?.message || error.message),
        "error",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 bg-black/40 flex items-center justify-center z-[60] p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          onClick={(e) => e.stopPropagation()}
          className="bg-white w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden flex flex-col"
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-blue-50/30">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-200">
                <FiPackage size={20} />
              </div>
              <div>
                <h3 className="font-bold text-gray-800">Approve Pre-order</h3>
                <p className="text-xs text-gray-500">Order Code: {order.id}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full text-gray-400"
            >
              <FiX size={18} />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 space-y-6 flex-1 overflow-y-auto max-h-[70vh]">
            <div className="flex items-center gap-4 bg-gray-50 p-4 rounded-xl border border-gray-100">
              <img
                src={order.avatar}
                className="w-12 h-12 rounded-full border-2 border-white shadow-sm"
                alt=""
              />
              <div>
                <p className="font-bold text-gray-800 text-sm">
                  {order.customer}
                </p>
                <p className="text-xs text-gray-400">{order.email}</p>
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                <FiPackage size={12} /> Pre-ordered Products
              </p>
              {order.items.map((it, idx) => (
                <div
                  key={idx}
                  className="flex gap-4 p-3 rounded-xl border border-gray-100 bg-white"
                >
                  <img
                    src={it.img}
                    className="w-14 h-14 rounded-lg object-cover border border-gray-100"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-800 text-sm truncate">
                      {it.name}
                    </p>
                    <p className="text-xs text-gray-500 font-medium">
                      Color: {order.color} | Qty: {it.quantity}
                    </p>
                    <div className="mt-1 flex items-center gap-2">
                       <span
                         className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${it.currentStock >= it.quantity ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}
                       >
                         In stock: {it.currentStock}
                       </span>
                       {it.prescription && (
                         <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${it.prescription.status ? "bg-indigo-50 text-indigo-700 border border-indigo-200" : "bg-purple-50 text-purple-700 border border-purple-200 animate-pulse"}`}>
                           {it.prescription.status ? <FiCheckCircle size={10} /> : <FiAlertCircle size={10} />}
                           {it.prescription.status ? "Prescription confirmed" : "Prescription Pending"}
                         </span>
                       )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className={`rounded-xl p-4 flex gap-3 ${order.hasPrescription && !order.prescriptionStatus ? "bg-purple-50 border-purple-200" : "bg-amber-50 border-amber-200"}`}>
              {order.hasPrescription && !order.prescriptionStatus ? (
                <FiFileText className="text-purple-500 flex-shrink-0 mt-0.5" size={16} />
              ) : (
                <FiAlertCircle className="text-amber-500 flex-shrink-0 mt-0.5" size={16} />
              )}
              <div className={`text-xs leading-relaxed ${order.hasPrescription && !order.prescriptionStatus ? "text-purple-800" : "text-stone-800"}`}>
                {order.hasPrescription && !order.prescriptionStatus ? (
                  <>
                    <strong>Prescription required:</strong> This order contains items with vision details that are <strong>not confirmed</strong>. You can approve the order but please ensure the prescription is reviewed before shipping.
                  </>
                ) : (
                  <>
                    <strong>Note:</strong> When you click "Approve Order", the system will move the order status to <strong>Packaging</strong>. This order can then be further processed in the Order Management page.
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-gray-100 bg-gray-50/50 flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2.5 text-xs font-bold text-gray-500 border border-gray-200 rounded-xl hover:bg-white transition-colors"
            >
              BACK
            </button>

            {order.step === 0 && !order.cancelled && (
              <button
                disabled={
                  loading || !order.allInStock
                }
                onClick={handleApprove}
                className="flex-[2] px-4 py-2.5 text-xs font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all disabled:opacity-50 disabled:grayscale"
              >
                {loading
                  ? "PROCESSING..."
                  : !order.allInStock
                    ? "WAITING FOR ALL ITEMS"
                    : "APPROVE ORDER"}
              </button>
            )}

            {(order.step > 0 || order.cancelled) && (
              <div className="flex-[2] flex items-center justify-center bg-gray-100 rounded-xl text-[10px] font-bold text-gray-400">
                {order.cancelled ? "ORDER CANCELLED" : "ORDER APPROVED"}
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

const STEPS = [
  { id: 0, label: "Pending", color: "amber" },
  { id: 1, label: "Confirm", color: "blue" },
  { id: 2, label: "Check", color: "violet" },
  { id: 3, label: "Production", color: "orange" },
  { id: 4, label: "QC", color: "teal" },
  { id: 5, label: "Shipping", color: "blue" },
  { id: 6, label: "Delivered", color: "green" },
];
