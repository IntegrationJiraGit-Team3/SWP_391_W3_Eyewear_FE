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
  FiFileText,
} from "react-icons/fi";
import { getMyOrders, cancelOrder } from "../services/orderService";
import { useToast } from "../../context/ToastContext";
import { getReturnRequestsByOrderItemApi } from "../api/returnRequestApi";

const TABS = [
  "All",
  "PENDING",
  "PROCESSING",
  "SHIPPING",
  "COMPLETED",
  "REFUND",
  "CANCELLED",
];

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

const iconByStatus = (status) => {
  const s = String(status || "").toUpperCase();
  if (s === "PENDING") return <FiClock />;
  if (s === "PROCESSING") return <FiShoppingBag />;
  if (s === "SHIPPING") return <FiTruck />;
  if (s === "COMPLETED") return <FiCheckCircle />;
  if (s === "REFUND") return <FiRotateCcw />;
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
  if (s === "REFUND")
    return "bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200";
  if (s === "CANCELLED") return "bg-red-50 text-red-700 border-red-200";
  return "bg-gray-50 text-gray-700 border-gray-200";
};

const returnStatusBadge = (status) => {
  const s = String(status || "").toUpperCase();
  if (s === "PENDING") return "bg-yellow-50 text-yellow-700 border-yellow-200";
  if (s === "WAITING_CUSTOMER_RETURN")
    return "bg-indigo-50 text-indigo-700 border-indigo-200";
  if (s === "RECEIVED_RETURN")
    return "bg-cyan-50 text-cyan-700 border-cyan-200";
  if (s === "REFUND_INFO_INVALID")
    return "bg-red-50 text-red-700 border-red-200";
  if (s === "REFUND_PENDING") return "bg-blue-50 text-blue-700 border-blue-200";
  if (s === "REFUNDED")
    return "bg-emerald-50 text-emerald-700 border-emerald-200";
  if (s === "REFUND_RECEIVED_CONFIRMED")
    return "bg-violet-50 text-violet-700 border-violet-200";
  if (s === "REFUND")
    return "bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200";
  if (s === "COMPLETED") return "bg-green-50 text-green-700 border-green-200";
  if (s === "REJECTED") return "bg-red-50 text-red-700 border-red-200";
  if (s === "APPROVED") return "bg-blue-50 text-blue-700 border-blue-200";
  return "bg-gray-50 text-gray-700 border-gray-200";
};

const isLensLineItem = (item) => {
  if (!item) return false;

  if (item.lensType || item.lensOptionId) return true;

  const name = String(item.name || item.productName || "").toLowerCase();
  return name.includes("lens") || name.includes("trong");
};

const isComboOrder = (order) => {
  const items = order?.items || [];
  if (!items.length) return false;

  const hasLens = items.some((item) => isLensLineItem(item));
  const hasFrame = items.some((item) => !isLensLineItem(item));

  return hasLens && hasFrame;
};

function OrderHistoryPage() {
  const [orders, setOrders] = useState([]);
  const [returnRequestMap, setReturnRequestMap] = useState({});
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

  const loadReturnRequests = useCallback(async (ordersData) => {
    try {
      const items = (ordersData || []).flatMap((order) => order.items || []);
      const itemIds = items.map((item) => item.orderItemId).filter(Boolean);

      const results = await Promise.all(
        itemIds.map(async (orderItemId) => {
          try {
            const res = await getReturnRequestsByOrderItemApi(orderItemId);
            const list = res?.data?.data || [];
            return [orderItemId, list];
          } catch {
            return [orderItemId, []];
          }
        }),
      );

      const map = {};
      results.forEach(([orderItemId, list]) => {
        map[orderItemId] = list;
      });

      setReturnRequestMap(map);
    } catch (err) {
      console.error("Load return requests error:", err);
    }
  }, []);

  useEffect(() => {
    const initialTimer = setTimeout(async () => {
      try {
        const data = await getMyOrders();
        setOrders(data || []);
        await loadReturnRequests(data || []);
      } catch (err) {
        console.error("Load orders error:", err);
        showToast("Failed to load orders");
      }
    }, 0);

    return () => clearTimeout(initialTimer);
  }, [loadReturnRequests, showToast]);

  const getLatestReturnRequest = useCallback(
    (orderItemId) => {
      const list = returnRequestMap[orderItemId] || [];
      if (!list.length) return null;
      return [...list].sort(
        (a, b) => new Date(b.requestedAt) - new Date(a.requestedAt),
      )[0];
    },
    [returnRequestMap],
  );

  const getEffectiveOrderStatus = useCallback(
    (order) => {
      const hasFinalRefund = (order.items || []).some((item) => {
        const latest = getLatestReturnRequest(item.orderItemId);
        if (!latest || latest.requestType !== "RETURN") return false;
        return FINAL_RETURN_REFUND_STATUSES.has(
          String(latest.status || "").toUpperCase(),
        );
      });

      return hasFinalRefund ? "REFUND" : order.status;
    },
    [getLatestReturnRequest],
  );

  const filteredOrders = useMemo(() => {
    if (activeTab === "All") return orders;
    return orders.filter(
      (order) =>
        String(getEffectiveOrderStatus(order) || "").toUpperCase() ===
        activeTab,
    );
  }, [orders, activeTab, getEffectiveOrderStatus]);

  const handleCancel = async (orderId) => {
    const confirmed = window.confirm(
      "Are you sure you want to cancel this order?",
    );
    if (!confirmed) return;

    try {
      await cancelOrder(orderId);
      showToast("Order cancelled successfully");
      await loadOrders();
    } catch (err) {
      console.error("Cancel error:", err);
      showToast(err?.response?.data?.message || "Cancel failed");
    }
  };

  const getOrderHasAnyReturnRequest = (order) => {
    return (order.items || []).some(
      (item) => !!getLatestReturnRequest(item.orderItemId),
    );
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
        {filteredOrders.map((order) => {
          const effectiveStatus = getEffectiveOrderStatus(order);
          const comboOnlyReturn = isComboOrder(order);

          return (
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
                  className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-semibold ${badgeByStatus(effectiveStatus)}`}
                >
                  {iconByStatus(effectiveStatus)}
                  {effectiveStatus}
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
                  {order.depositType === "PARTIAL" && (
                    <div
                      className={`inline-flex mt-2 px-2 py-0.5 rounded-full border text-[11px] font-semibold ${
                        order.remainingPaymentStatus === "PAID"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : "bg-amber-50 text-amber-700 border-amber-200"
                      }`}
                    >
                      Remaining payment:{" "}
                      {order.remainingPaymentStatus || "UNPAID"}
                    </div>
                  )}
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
                  {order.items.map((item) => {
                    const latestRequest = getLatestReturnRequest(
                      item.orderItemId,
                    );

                    return (
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

                          {latestRequest && (
                            <div className="mt-3 rounded-xl border border-stone-200 bg-stone-50 p-3">
                              <div className="flex flex-wrap items-center gap-2">
                                <span
                                  className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${returnStatusBadge(latestRequest.status)}`}
                                >
                                  {latestRequest.status}
                                </span>

                                <span className="text-xs text-gray-500">
                                  {latestRequest.requestType}
                                </span>
                              </div>

                              {latestRequest.requestType === "RETURN" && (
                                <div className="mt-2 text-sm">
                                  <span className="text-gray-500">
                                    Refund amount:
                                  </span>{" "}
                                  <span className="font-semibold text-emerald-700">
                                    {formatCurrency(latestRequest.refundAmount)}
                                  </span>
                                </div>
                              )}

                              {latestRequest.status === "REFUNDED" && (
                                <div className="mt-1 text-sm text-blue-600 font-medium">
                                  Refund transferred
                                </div>
                              )}

                              <Link
                                to={`/my-return-requests/${latestRequest.requestId}`}
                                className="inline-flex items-center gap-2 mt-3 rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100"
                              >
                                <FiFileText size={14} />
                                View Return Detail
                              </Link>
                            </div>
                          )}

                          {effectiveStatus === "COMPLETED" &&
                            item.orderItemId &&
                            !comboOnlyReturn &&
                            !latestRequest && (
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
                    );
                  })}
                </div>
              )}

              {effectiveStatus === "COMPLETED" &&
                comboOnlyReturn &&
                !getOrderHasAnyReturnRequest(order) && (
                  <div className="mt-4 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700">
                    This order contains a frame + lens combo. Return/exchange is
                    allowed for the whole combo only.
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

                {effectiveStatus === "COMPLETED" &&
                  !getOrderHasAnyReturnRequest(order) && (
                    <Link
                      to={`/return-request?orderId=${order.orderId}&combo=true`}
                      className="inline-flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-700 hover:bg-amber-100"
                    >
                      <FiRotateCcw size={16} />
                      Return/Exchange Whole Order
                    </Link>
                  )}

                {effectiveStatus === "PENDING" && (
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
          );
        })}

        {!filteredOrders.length && (
          <div className="rounded-3xl border bg-white p-12 text-center text-gray-400">
            No orders found.
          </div>
        )}
      </div>
    </div>
  );
}

function formatCurrency(value) {
  if (value == null) return "-";
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(value);
}

export default OrderHistoryPage;
