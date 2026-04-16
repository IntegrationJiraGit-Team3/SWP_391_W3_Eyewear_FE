import { useCallback, useEffect, useMemo, useState } from "react";
import { FiEye, FiFilter, FiSearch, FiShoppingBag } from "react-icons/fi";
import ViewOrderDetailsModal from "../modal/ViewOrderDetailModel";
import {
  getAllOrders,
  getOrderById,
  updateOrderStatus,
} from "../services/orderService";
import { updatePrescriptionStatus } from "../services/prescriptionService";
import { getAllReturnRequestsApi } from "../../store/api/returnRequestApi";

const FINAL_RETURN_REFUND_STATUSES = new Set([
  "REFUNDED",
  "REFUND",
  "REFUND_COMPLETED",
  "REFUND_FINALIZED",
  "REFUND_RECEIVED_CONFIRMED",
  "CUSTOMER_CONFIRMED_REFUND",
  "CUSTOMER_REFUND_CONFIRMED",
  "WAITING_ADMIN_REFUND_CONFIRM",
  "COMPLETED",
]);

const statusColor = (status) => {
  const s = String(status || "").toLowerCase();
  switch (s) {
    case "pending":
    case "preorder":
      return "bg-yellow-50 text-yellow-700 border-yellow-200";
    case "processing":
      return "bg-orange-50 text-orange-700 border-orange-200";
    case "shipped":
    case "delivering":
    case "shipping":
      return "bg-blue-50 text-blue-700 border-blue-200";
    case "delivered":
    case "completed":
      return "bg-green-50 text-green-700 border-green-200";
    case "refund":
    case "refunded":
      return "bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200";
    case "canceled":
    case "cancelled":
      return "bg-red-50 text-red-700 border-red-200";
    default:
      return "bg-gray-50 text-gray-700 border-gray-200";
  }
};

function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [selectedOrder, setSelectedOrder] = useState(null);

  const fetchOrders = useCallback(async () => {
    try {
      const data = await getAllOrders();

      const returnRes = await getAllReturnRequestsApi().catch(() => null);
      const returnRequests = returnRes?.data?.data || [];

      const refundOrderIds = new Set(
        returnRequests
          .filter(
            (req) =>
              req?.requestType === "RETURN" &&
              FINAL_RETURN_REFUND_STATUSES.has(
                String(req?.status || "").toUpperCase(),
              ),
          )
          .map((req) => String(req?.orderId || ""))
          .filter(Boolean),
      );

      const enriched = (data || []).map((order) => {
        if (refundOrderIds.has(String(order.id))) {
          return { ...order, status: "refund" };
        }
        return order;
      });

      setOrders(enriched);
    } catch (err) {
      console.error("Fetch orders error:", err);
    }
  }, []);

  useEffect(() => {
    const initialTimer = setTimeout(fetchOrders, 0);
    const interval = setInterval(fetchOrders, 10000);
    return () => {
      clearTimeout(initialTimer);
      clearInterval(interval);
    };
  }, [fetchOrders]);

  const filteredOrders = useMemo(() => {
    return (orders || []).filter((order) => {
      const matchesSearch =
        String(order.code || "")
          .toLowerCase()
          .includes(search.toLowerCase()) ||
        String(order.customer || "")
          .toLowerCase()
          .includes(search.toLowerCase()) ||
        String(order.email || "")
          .toLowerCase()
          .includes(search.toLowerCase());

      const rawStatus = String(order.status || "").toLowerCase();
      const matchesStatus = status === "all" || rawStatus === status;

      return matchesSearch && matchesStatus;
    });
  }, [orders, search, status]);

  const handleView = async (order) => {
    try {
      const detail = await getOrderById(order.id);
      setSelectedOrder(
        order.status === "refund" ? { ...detail, status: "refund" } : detail,
      );
    } catch (err) {
      console.error("Get order detail error:", err);
    }
  };

  const handleUpdateStatus = async (newStatus) => {
    if (!selectedOrder?.id) return;
    try {
      await updateOrderStatus(selectedOrder.id, newStatus);
      const refreshed = await getOrderById(selectedOrder.id);
      setSelectedOrder(refreshed);
      fetchOrders();
    } catch (err) {
      console.error("Update order status error:", err);
      alert(err?.response?.data?.message || "Update order status failed");
    }
  };

  const handlePrescriptionAction = async (prescriptionId, approve, note) => {
    try {
      await updatePrescriptionStatus(prescriptionId, approve, note || "");
      if (selectedOrder?.id) {
        const refreshed = await getOrderById(selectedOrder.id);
        setSelectedOrder(refreshed);
      }
      fetchOrders();
      return true;
    } catch (err) {
      console.error("Update prescription error:", err);
      alert(err?.response?.data?.message || "Update prescription failed");
      return false;
    }
  };

  return (
    <div className="px-8 pt-6 pb-12 bg-gray-50 min-h-full">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-800">Order Management</h1>
        <p className="text-sm text-gray-500 mt-1">
          Manage orders, shipment, and prescription approval
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between gap-3 p-5 border-b border-gray-100 flex-wrap">
          <div className="relative w-full md:w-80">
            <FiSearch
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              size={14}
            />
            <input
              type="text"
              placeholder="Search order code / customer / email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-3 border border-gray-200 rounded-xl text-sm bg-gray-50"
            />
          </div>

          <div className="flex items-center gap-2">
            <FiFilter size={14} className="text-gray-400" />
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="border border-gray-200 rounded-xl px-3 py-3 text-sm bg-gray-50"
            >
              <option value="all">All status</option>
              <option value="pending">Pending</option>
              <option value="preorder">Preorder</option>
              <option value="processing">Processing</option>
              <option value="delivering">Delivering</option>
              <option value="delivered">Delivered</option>
              <option value="completed">Completed</option>
              <option value="refund">Refund</option>
              <option value="canceled">Canceled</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1050px] text-sm">
            <thead className="bg-gray-50/80 border-b">
              <tr className="text-left text-gray-500">
                <th className="px-6 py-4 font-semibold">Order Code</th>
                <th className="px-6 py-4 font-semibold">Customer</th>
                <th className="px-6 py-4 font-semibold text-right">Total</th>
                <th className="px-6 py-4 font-semibold">Payment</th>
                <th className="px-6 py-4 font-semibold">Payment Status</th>
                <th className="px-6 py-4 font-semibold">Order Status</th>
                <th className="px-6 py-4 font-semibold">Created At</th>
                <th className="px-6 py-4 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((order) => (
                <tr
                  key={order.id}
                  className="border-b last:border-0 hover:bg-gray-50/60"
                >
                  <td className="px-6 py-4 font-mono text-xs font-semibold text-gray-700">
                    {order.code}
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-semibold text-gray-800">
                      {order.customer}
                    </div>
                    <div className="text-xs text-gray-400">{order.email}</div>
                  </td>
                  <td className="px-6 py-4 text-right font-bold text-gray-800">
                    {Number(order.total || 0).toLocaleString("vi-VN")} ₫
                    {order.depositType === "PARTIAL" && (
                      <div className="text-[11px] text-amber-600 mt-1">
                        Deposit:{" "}
                        {Number(order.depositAmount || 0).toLocaleString(
                          "vi-VN",
                        )}{" "}
                        ₫
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">{order.paymentMethod || "N/A"}</td>
                  <td className="px-6 py-4">
                    {order.paymentStatus || "UNPAID"}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex px-3 py-1 rounded-full border text-xs font-semibold ${statusColor(order.status)}`}
                    >
                      {order.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-500">{order.createdAt}</td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => handleView(order)}
                      className="inline-flex items-center gap-2 rounded-xl bg-blue-50 text-blue-700 px-4 py-2 font-semibold hover:bg-blue-100"
                    >
                      <FiEye size={16} />
                      View
                    </button>
                  </td>
                </tr>
              ))}

              {!filteredOrders.length && (
                <tr>
                  <td colSpan={8} className="py-16 text-center">
                    <div className="flex flex-col items-center gap-3 text-gray-400">
                      <FiShoppingBag size={40} />
                      <div>No orders found</div>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedOrder && (
        <ViewOrderDetailsModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onUpdateStatus={handleUpdateStatus}
          onPrescriptionAction={handlePrescriptionAction}
        />
      )}
    </div>
  );
}

export default AdminOrders;
