import { useCallback, useMemo, useState, memo, useEffect } from "react";
import {
  FiSearch,
  FiEye,
  FiShoppingBag,
  FiChevronUp,
  FiChevronDown,
  FiFilter,
} from "react-icons/fi";

import ViewOrderDetailsModal from "../modal/ViewOrderDetailModel";
import { motion, AnimatePresence } from "framer-motion";

import { getAllOrders, getOrderById, updateOrderStatus } from "../services/orderService";
import { updatePrescriptionStatus } from "../services/prescriptionService";

/* ── helpers ── */
const isOrderPrescription = (order) => {
  if (order.hasPrescription) return true;
  return order.orderItems?.some((item) => {
    if (
      item.itemType === "PRESCRIPTION" ||
      item.fulfillmentType === "PRESCRIPTION" ||
      item.isLens === true
    )
      return true;
    if (item.prescription != null) return true;
    const rx = item.prescription || item;
    return (
      rx.sphLeft != null ||
      rx.sphRight != null ||
      rx.cylLeft != null ||
      rx.cylRight != null ||
      rx.addLeft != null ||
      rx.addRight != null ||
      item.lensOptionId != null ||
      item.productName?.toLowerCase().includes("tròng") ||
      item.productName?.toLowerCase().includes("thấu kính")
    );
  });
};

/* ── status config ── */
const statusMap = {
  completed: {
    label: "Completed",
    className: "bg-green-50 text-green-700 border border-green-200",
  },
  pending: {
    label: "Pending",
    className: "bg-yellow-50 text-yellow-700 border border-yellow-200",
  },
  processing: {
    label: "Processing",
    className: "bg-orange-50 text-orange-700 border border-orange-200",
  },
  shipped: {
    label: "Shipping",
    className: "bg-blue-50 text-blue-700 border border-blue-200",
  },
  cancelled: {
    label: "Cancelled",
    className: "bg-red-50 text-red-700 border border-red-200",
  },
};

/* ── sort icon ── */
const SortIcon = memo(({ sortOrder }) => {
  if (sortOrder === "asc")
    return <FiChevronUp size={13} className="text-blue-600" />;
  if (sortOrder === "desc")
    return <FiChevronDown size={13} className="text-blue-600" />;
  return (
    <span className="flex flex-col opacity-30">
      <FiChevronUp size={10} />
      <FiChevronDown size={10} />
    </span>
  );
});
SortIcon.displayName = "SortIcon";

/* ── memoised row ── */
const OrderRow = memo(({ order, onView }) => {
  const statusUI = statusMap[order.status] ?? {
    label: order.status,
    className: "bg-gray-100 text-gray-600",
  };

  return (
    <tr className="hover:bg-gray-50/60">
      {/* Order code */}
      <td className="px-6 py-4">
        <span className="font-mono font-semibold text-gray-700 text-xs bg-gray-100 px-2 py-1 rounded-md">
          {order.code}
        </span>
      </td>

      {/* Customer */}
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <img
            src={`https://ui-avatars.com/api/?name=${order.customer || order.email}&background=1c1917&color=fff&bold=true`}
            alt={order.customer}
            className="w-9 h-9 rounded-full object-cover border border-gray-100 shadow-sm flex-shrink-0"
            loading="lazy"
          />
          <div className="min-w-0">
            <p className="font-medium text-gray-800 truncate leading-tight">
              {order.customer}
            </p>
            <p className="text-xs text-gray-400 truncate mt-0.5">
              {order.email}
            </p>
          </div>
        </div>
      </td>

      {/* Total */}
      <td className="px-6 py-4 text-right">
        <div className="flex flex-col items-end">
          <span className="font-bold text-gray-900">
            {order.total.toLocaleString("en-US")} ₫
          </span>
          {order.depositType === "PARTIAL" && (
            <div className="flex flex-col items-end mt-1 text-[10px]">
              <span className="text-amber-600 font-bold bg-amber-50 px-1.5 py-0.5 rounded border border-amber-100">
                Deposit: {order.depositAmount?.toLocaleString("en-US")} ₫
              </span>
              <span className="text-gray-400 mt-0.5 whitespace-nowrap">
                Remain: {(order.total - order.depositAmount).toLocaleString("en-US")} ₫
              </span>
            </div>
          )}
          {order.depositType === "FULL" && (
            <span className="text-green-600 text-[10px] font-bold bg-green-50 px-1.5 py-0.5 rounded border border-green-100 mt-1">
              Paid Full
            </span>
          )}
        </div>
      </td>

      {/* Payment Method */}
      <td className="px-6 py-4 text-center">
        <span className="px-2.5 py-1 bg-gray-100 text-gray-600 rounded-lg text-[11px] font-bold uppercase tracking-wider border border-gray-200">
          {order.paymentMethod || "N/A"}
        </span>
      </td>

      {/* Status */}
      <td className="px-6 py-4 text-center">
        <div className="flex flex-col items-center gap-1.5">
          <span
            className={`px-3 py-1 text-xs rounded-full font-medium ${statusUI.className}`}
          >
            {statusUI.label}
          </span>
          {order.orderItems?.some((item) => item.isPreorder) && (
            <span className="px-2 py-0.5 text-[10px] bg-amber-100 text-amber-700 border border-amber-200 rounded-md font-bold uppercase tracking-tight">
              Pre-order
            </span>
          )}
          {order.depositType === "PARTIAL" && order.paymentStatus !== "PAID" && order.status !== "pending" && (
            <span className="px-2 py-0.5 text-[10px] bg-rose-100 text-rose-700 border border-rose-200 rounded-md font-bold uppercase tracking-tight animate-pulse">
                Waiting for Balance
            </span>
          )}
          {isOrderPrescription(order) && (
            <span className="px-2 py-0.5 text-[10px] bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-md font-bold uppercase tracking-tight">
              Prescription
            </span>
          )}
        </div>
      </td>

      {/* Date */}
      <td className="px-6 py-4 text-center text-sm text-gray-400">
        {order.createdAt}
      </td>

      {/* Action */}
      <td className="px-6 py-4">
        <div className="flex justify-end">
          <div className="relative group">
            <button
              onClick={() => onView(order)}
              className="p-2 rounded-lg text-blue-600 hover:bg-blue-50"
            >
              <FiEye size={16} />
            </button>
            <span className="pointer-events-none absolute bottom-full mb-2 right-0 px-2 py-1 text-xs rounded-md bg-gray-800 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-150 whitespace-nowrap z-50">
              View Details
            </span>
          </div>
        </div>
      </td>
    </tr>
  );
});
OrderRow.displayName = "OrderRow";

/* ── main ── */
function AdminOrders() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [sortOrder, setSortOrder] = useState("default");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orders, setOrders] = useState([]);

  const fetchOrders = useCallback(async () => {
    try {
      const data = await getAllOrders();
      setOrders(data);
    } catch (err) {
      console.error("Lỗi lấy orders:", err);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 10000); // refresh orders list every 10s for real-time sync
    return () => clearInterval(interval);
  }, [fetchOrders]);

  const itemsPerPage = 5;

  /* ── filter + sort ── */
  const filteredOrders = useMemo(() => {
    let result = orders.filter((o) => {
      const matchText =
        (o.code?.toLowerCase() || "").includes(search.toLowerCase()) ||
        (o.customer?.toLowerCase() || "").includes(search.toLowerCase());
      const matchStatus = status === "all" || o.status === status;
      return matchText && matchStatus;
    });
    if (sortOrder === "asc")
      result = [...result].sort((a, b) => (a.total || 0) - (b.total || 0));

    if (sortOrder === "desc")
      result = [...result].sort((a, b) => (b.total || 0) - (a.total || 0));
    return result;
  }, [orders, search, status, sortOrder]);

  /* ── pagination ── */
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const safeCurrentPage =
    totalPages === 0 ? 1 : Math.min(currentPage, totalPages);
  const paginatedOrders = filteredOrders.slice(
    (safeCurrentPage - 1) * itemsPerPage,
    safeCurrentPage * itemsPerPage,
  );

  /* ── smart pagination ── */
  const getPagination = () => {
    if (totalPages <= 7)
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    const pages = [1];
    if (safeCurrentPage > 4) pages.push("...");
    const start = Math.max(2, safeCurrentPage - 1);
    const end = Math.min(totalPages - 1, safeCurrentPage + 1);
    for (let i = start; i <= end; i++) pages.push(i);
    if (safeCurrentPage < totalPages - 3) pages.push("...");
    pages.push(totalPages);
    return pages;
  };

  /* ── callbacks ── */
  const handleView = useCallback(async (order) => {
    try {
      const data = await getOrderById(order.id);
      setSelectedOrder(data);
    } catch (err) {
      console.error("Lỗi lấy chi tiết order:", err);
    }
  }, []);
  const handleClose = useCallback(() => setSelectedOrder(null), []);

  const handleUpdateStatus = useCallback(
    async (newStatus) => {
      if (!selectedOrder) return;
      try {
        const res = await updateOrderStatus(selectedOrder.id, newStatus);
        console.log(res);
        if (res.success || res.status === 200 || res.data) {
          const updated = await getOrderById(selectedOrder.id);
          setSelectedOrder(updated);
          fetchOrders();
        }
      } catch (err) {
        console.error("Lỗi cập nhật trạng thái:", err);
      }
    },
    [selectedOrder, fetchOrders]
  );

  const handlePrescriptionAction = useCallback(
    async (prescriptionId, approve, note) => {
      try {
        await updatePrescriptionStatus(prescriptionId, approve, note);
        // Sau khi xử lý prescription thành công, load lại chi tiết order
        if (selectedOrder) {
          const updated = await getOrderById(selectedOrder.id);
          setSelectedOrder(updated);
          fetchOrders();
        }
      } catch (err) {
        console.error("Lỗi xử lý đơn thuốc:", err);
        throw err;
      }
    },
    [selectedOrder, fetchOrders]
  );

  /* ── stats ── */
  const stats = useMemo(
    () => ({
      total: orders.length,
      pending: orders.filter((o) => o.status === "pending").length,
      processing: orders.filter((o) => o.status === "processing").length,
      shipped: orders.filter((o) => o.status === "shipped").length,
      completed: orders.filter((o) => o.status === "completed").length,
      cancelled: orders.filter((o) => o.status === "cancelled").length,
    }),
    [orders],
  );

  const activeFilters = [status !== "all", search !== ""].filter(
    Boolean,
  ).length;
  const isEmpty = paginatedOrders.length === 0;

  return (
    <div className="px-8 pt-6 pb-12 bg-gray-50 min-h-full">
      {/* ── HEADER ── */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Order Management</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {filteredOrders.length} / {orders.length} orders
          </p>
        </div>
      </div>

      {/* ── STAT PILLS ── */}
      <div className="grid grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        {[
          {
            label: "All",
            value: stats.total,
            color: "bg-gray-100 text-gray-700",
            active: status === "all",
            key: "all",
          },
          {
            label: "Pending",
            value: stats.pending,
            color: "bg-yellow-50 text-yellow-700",
            active: status === "pending",
            key: "pending",
          },
          {
            label: "Packaging",
            value: stats.processing,
            color: "bg-orange-50 text-orange-700",
            active: status === "processing",
            key: "processing",
          },
          {
            label: "Shipping",
            value: stats.shipped,
            color: "bg-blue-50 text-blue-700",
            active: status === "shipped",
            key: "shipped",
          },
          {
            label: "Completed",
            value: stats.completed,
            color: "bg-green-50 text-green-700",
            active: status === "completed",
            key: "completed",
          },
          {
            label: "Cancelled",
            value: stats.cancelled,
            color: "bg-red-50 text-red-700",
            active: status === "cancelled",
            key: "cancelled",
          },
        ].map((s) => (
          <button
            key={s.key}
            onClick={() => {
              setStatus(s.key);
              setCurrentPage(1);
            }}
            className={`flex items-center justify-between px-4 py-3 rounded-xl border text-sm font-medium transition-all duration-150
              ${
                s.active
                  ? "border-blue-300 bg-blue-50 text-blue-700 shadow-sm"
                  : "border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50"
              }`}
          >
            <span>{s.label}</span>
            <span
              className={`px-2 py-0.5 rounded-full text-xs font-bold ${s.color}`}
            >
              {s.value}
            </span>
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm">
        {/* ── TOOLBAR ── */}
        <div className="flex items-center justify-between gap-3 p-5 border-b border-gray-100 flex-wrap">
          <div className="relative w-72">
            <FiSearch
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              size={14}
            />
            <input
              type="text"
              placeholder="Search order code or customer..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-gray-50 focus:bg-white transition-shadow"
            />
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 text-gray-400">
              <FiFilter size={13} />
              {activeFilters > 0 && (
                <span className="bg-blue-600 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center font-bold">
                  {activeFilters}
                </span>
              )}
            </div>

            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setCurrentPage(1);
              }}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-gray-50 text-gray-700"
            >
              <option value="all">All status</option>
              <option value="completed">Completed</option>
              <option value="pending">Pending</option>
              <option value="cancelled">Cancelled</option>
            </select>

            {activeFilters > 0 && (
              <button
                onClick={() => {
                  setSearch("");
                  setStatus("all");
                  setCurrentPage(1);
                }}
                className="text-xs text-gray-400 hover:text-red-500 px-2 py-1 rounded-md hover:bg-red-50"
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>

        {/* ── TABLE ── */}
        <div className="overflow-x-auto">
          <table className="w-full table-fixed text-sm">
            <thead>
              <tr className="text-xs uppercase text-gray-400 border-b border-gray-100 bg-gray-50/60">
                <th className="w-[12%] text-left px-6 py-3.5 font-semibold tracking-wider">
                  Order Code
                </th>
                <th className="w-[25%] text-left px-6 py-3.5 font-semibold tracking-wider">
                  Customer
                </th>
                <th className="w-[18%] text-right px-6 py-3.5 font-semibold tracking-wider">
                  <span
                    onClick={() =>
                      setSortOrder((p) =>
                        p === "asc" ? "desc" : p === "desc" ? "default" : "asc",
                      )
                    }
                    className="cursor-pointer select-none hover:text-gray-700 normal-case inline-flex items-center justify-end gap-1"
                  >
                    Total Amount <SortIcon sortOrder={sortOrder} />
                  </span>
                </th>
                <th className="w-[10%] text-center px-6 py-3.5 font-semibold tracking-wider">
                  Method
                </th>
                <th className="w-[15%] text-center px-6 py-3.5 font-semibold tracking-wider">
                  Status
                </th>
                <th className="w-[12%] text-center px-6 py-3.5 font-semibold tracking-wider">
                  Created At
                </th>
                <th className="w-[8%] px-6 py-3.5" />
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-50">
              {isEmpty ? (
                <tr>
                  <td colSpan={7} className="py-20 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <FiShoppingBag
                        size={40}
                        strokeWidth={1.2}
                        className="text-gray-200"
                      />
                      <p className="text-sm text-gray-400">
                        No matching orders found
                      </p>
                      {activeFilters > 0 && (
                        <button
                          onClick={() => {
                            setSearch("");
                            setStatus("all");
                          }}
                          className="text-sm text-blue-500 hover:underline"
                        >
                          Clear Filters
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedOrders.map((order) => (
                  <OrderRow key={order.id} order={order} onView={handleView} />
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* ── FOOTER ── */}
        {!isEmpty && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
            <p className="text-xs text-gray-400">
              Showing{" "}
              <span className="font-medium text-gray-600">
                {(safeCurrentPage - 1) * itemsPerPage + 1}–
                {Math.min(
                  safeCurrentPage * itemsPerPage,
                  filteredOrders.length,
                )}
              </span>{" "}
              of{" "}
              <span className="font-medium text-gray-600">
                {filteredOrders.length}
              </span>{" "}
              orders
            </p>

            {totalPages > 1 && (
              <div className="flex items-center gap-1 select-none">
                <button
                  disabled={safeCurrentPage === 1}
                  onClick={() => setCurrentPage((p) => p - 1)}
                  className="px-3 py-1.5 rounded-lg text-sm text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:pointer-events-none"
                >
                  ←
                </button>

                {getPagination().map((page, index) =>
                  page === "..." ? (
                    <span key={index} className="px-2 text-gray-300 text-sm">
                      …
                    </span>
                  ) : (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`min-w-[34px] px-3 py-1.5 rounded-lg text-sm font-medium
                        ${safeCurrentPage === page ? "bg-blue-600 text-white" : "text-gray-600 hover:bg-gray-100"}`}
                    >
                      {page}
                    </button>
                  ),
                )}

                <button
                  disabled={safeCurrentPage === totalPages}
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

      {/* ── MODAL ── */}
      <ViewOrderDetailsModal
        order={selectedOrder}
        onClose={handleClose}
        onUpdateStatus={handleUpdateStatus}
        onPrescriptionAction={handlePrescriptionAction}
      />
    </div>
  );
}

export default AdminOrders;
