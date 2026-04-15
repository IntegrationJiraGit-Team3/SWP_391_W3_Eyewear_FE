import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  FiShoppingBag,
  FiTruck,
  FiCheckCircle,
  FiClock,
  FiXCircle,
  FiMapPin,
  FiCreditCard,
  FiRotateCcw,
} from "react-icons/fi";
import { getMyOrders, cancelOrder } from "../services/orderService";
import { useToast } from "../../context/ToastContext";

const TABS = [
  "All",
  "PENDING",
  "PROCESSING",
  "SHIPPING",
  "COMPLETED",
  "CANCELLED",
];

const iconByStatus = (status) => {
  const s = String(status || "").toUpperCase();
  if (s === "PENDING") return <FiClock />;
  if (s === "PROCESSING") return <FiShoppingBag />;
  if (s === "SHIPPING") return <FiTruck />;
  if (s === "COMPLETED") return <FiCheckCircle />;
  if (s === "CANCELLED") return <FiXCircle />;
  return <FiShoppingBag />;
};

const badgeByStatus = (status) => {
  const s = String(status || "").toUpperCase();
  if (s === "PENDING") return "bg-yellow-50 text-yellow-700 border-yellow-200";
  if (s === "PROCESSING")
    return "bg-orange-50 text-orange-700 border-orange-200";
  if (s === "SHIPPING") return "bg-blue-50 text-blue-700 border-blue-200";
  if (s === "COMPLETED") return "bg-green-50 text-green-700 border-green-200";
  if (s === "CANCELLED") return "bg-red-50 text-red-700 border-red-200";
  return "bg-gray-50 text-gray-700 border-gray-200";
};

function OrderHistoryPage() {
  const [orders, setOrders] = useState([]);
  const [activeTab, setActiveTab] = useState("All");
  const { showToast } = useToast();

  const loadOrders = useCallback(async () => {
    try {
      const data = await getMyOrders();
      setOrders(data || []);
    } catch (err) {
      console.error("Load orders error:", err);
      showToast("Failed to load orders");
    }
  }, [showToast]);

  useEffect(() => {
    const initialTimer = setTimeout(loadOrders, 0);
    return () => clearTimeout(initialTimer);
  }, [loadOrders]);

  const filteredOrders = useMemo(() => {
    if (activeTab === "All") return orders;
    return orders.filter(
      (order) => String(order.status || "").toUpperCase() === activeTab,
    );
  }, [orders, activeTab]);

  const handleCancel = async (orderId) => {
    const confirmed = window.confirm(
      "Are you sure you want to cancel this order?",
    );
    if (!confirmed) return;

    try {
      await cancelOrder(orderId);
      showToast("Order cancelled successfully");
      loadOrders();
    } catch (err) {
      console.error("Cancel error:", err);
      showToast(err?.response?.data?.message || "Cancel failed");
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">My Orders</h1>
        <p className="text-gray-500 mt-2">
          Track orders, view status, and manage your purchases.
        </p>
      </div>

      <div className="flex flex-wrap gap-3 mb-8">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`rounded-full px-4 py-2 text-sm font-semibold border ${
              activeTab === tab
                ? "bg-black text-white border-black"
                : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="space-y-5">
        {filteredOrders.map((order) => (
          <div
            key={order.orderId}
            className="rounded-3xl border bg-white shadow-sm p-6"
          >
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div>
                <div className="text-xs uppercase tracking-wider text-gray-400 font-bold">
                  Order Code
                </div>
                <div className="text-lg font-bold text-gray-900 mt-1">
                  {order.id}
                </div>
                <div className="text-sm text-gray-500 mt-1">{order.date}</div>
              </div>

              <div
                className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-semibold ${badgeByStatus(order.status)}`}
              >
                {iconByStatus(order.status)}
                {order.status}
              </div>
            </div>

            <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="rounded-2xl bg-gray-50 border p-4">
                <div className="text-xs text-gray-400 font-semibold mb-1">
                  Total Amount
                </div>
                <div className="font-bold text-gray-900">
                  {Number(order.total || 0).toLocaleString("vi-VN")} ₫
                </div>
              </div>

              <div className="rounded-2xl bg-gray-50 border p-4">
                <div className="text-xs text-gray-400 font-semibold mb-1">
                  Payment
                </div>
                <div className="font-bold text-gray-900 flex items-center gap-2">
                  <FiCreditCard />
                  {order.paymentMethod || "N/A"} /{" "}
                  {order.paymentStatus || "UNPAID"}
                </div>
              </div>

              <div className="rounded-2xl bg-gray-50 border p-4">
                <div className="text-xs text-gray-400 font-semibold mb-1">
                  Items
                </div>
                <div className="font-bold text-gray-900">
                  {(order.items || []).length} item(s)
                </div>
              </div>
            </div>

            {!!order.items?.length && (
              <div className="mt-5 space-y-3">
                {order.items.map((item) => (
                  <div
                    key={item.orderItemId}
                    className="flex gap-4 rounded-2xl border p-4"
                  >
                    <img
                      src={item.image || "https://placehold.co/100"}
                      alt={item.name}
                      className="w-16 h-16 rounded-xl object-cover border"
                    />
                    <div className="flex-1">
                      <div className="font-semibold text-gray-900">
                        {item.name}
                      </div>
                      <div className="text-sm text-gray-500 mt-1">
                        Quantity: {item.quantity}
                      </div>
                      {item.lensType && (
                        <div className="text-sm text-indigo-600 mt-1">
                          Lens: {item.lensType}
                        </div>
                      )}

                      {order.status === "COMPLETED" && item.orderItemId && (
                        <Link
                          to={`/return-request?orderItemId=${item.orderItemId}&orderId=${order.orderId}`}
                          className="inline-flex items-center gap-2 mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700 hover:bg-amber-100"
                        >
                          <FiRotateCcw size={14} />
                          Request Return/Exchange
                        </Link>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                to={`/shipping-progress/${order.orderId}`}
                className="inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-100"
              >
                <FiMapPin size={16} />
                Track Order
              </Link>

              {order.status === "COMPLETED" && (
                <Link
                  to={`/return-request?orderId=${order.orderId}&combo=true`}
                  className="inline-flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-700 hover:bg-amber-100"
                >
                  <FiRotateCcw size={16} />
                  Return/Exchange Whole Order
                </Link>
              )}

              {(order.status === "PENDING" ||
                order.status === "PROCESSING") && (
                <button
                  onClick={() => handleCancel(order.orderId)}
                  className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-100"
                >
                  <FiXCircle size={16} />
                  Cancel Order
                </button>
              )}
            </div>
          </div>
        ))}

        {!filteredOrders.length && (
          <div className="rounded-3xl border bg-white p-12 text-center text-gray-400">
            No orders found.
          </div>
        )}
      </div>
    </div>
  );
}

export default OrderHistoryPage;
