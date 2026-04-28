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
import {
  getMyOrders,
  cancelOrder,
  requestRefund,
} from "../services/orderService";
import { useToast } from "../../context/ToastContext";
import { getReturnRequestsByOrderItemApi } from "../api/returnRequestApi";
import { requestVnpayRefundApi } from "../api/orderApi";

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

const normalizeToken = (value) =>
  String(value || "")
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, "_");

function OrderHistoryPage() {
  const [orders, setOrders] = useState([]);
  const [returnRequestMap, setReturnRequestMap] = useState({});
  const [activeTab, setActiveTab] = useState("All");

  const [refundFormOrderId, setRefundFormOrderId] = useState(null);
  const [refundMode, setRefundMode] = useState("AUTO_VNPAY");
  const [refundForm, setRefundForm] = useState({
    cancelReason: "",
    bankAccountNumber: "",
    bankName: "",
    bankAccountHolder: "",
  });
  const [submittingRefund, setSubmittingRefund] = useState(false);

  const { showToast } = useToast();

  const loadOrders = useCallback(async () => {
    try {
      const data = await getMyOrders();
      const list = Array.isArray(data) ? data : [];
      const sorted = [...list].sort((a, b) => {
        const aMs =
          Number(a?.orderDateMs) ||
          (a?.orderDate ? new Date(a.orderDate).getTime() : 0) ||
          0;
        const bMs =
          Number(b?.orderDateMs) ||
          (b?.orderDate ? new Date(b.orderDate).getTime() : 0) ||
          0;
        return bMs - aMs;
      });

      setOrders(sorted);
      return sorted;
    } catch (err) {
      console.error("Load orders error:", err);
      showToast("Failed to load orders");
      return [];
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
      const data = await loadOrders();
      await loadReturnRequests(data || []);
    }, 0);

    return () => clearTimeout(initialTimer);
  }, [loadOrders, loadReturnRequests]);

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

  const normalizePaymentToken = useCallback(
    (value) => normalizeToken(value),
    [],
  );

  const isVnpayPaidOrder = useCallback(
    (order) => {
      const method = normalizePaymentToken(order?.paymentMethod).replace(
        /_/g,
        "",
      );
      const status = normalizePaymentToken(order?.paymentStatus);

      if (method !== "VNPAY") return false;
      return ["PAID", "PAID_DEPOSIT", "PAID_FULL"].includes(status);
    },
    [normalizePaymentToken],
  );

  const canCancelOrder = useCallback((effectiveStatus) => {
    const s = String(effectiveStatus || "").toUpperCase();
    // BE only allows cancelling before shipping.
    return ["PENDING", "PREORDER", "PROCESSING"].includes(s);
  }, []);

  const handleCancel = async (order) => {
    const effectiveStatus = getEffectiveOrderStatus(order);

    if (!canCancelOrder(effectiveStatus)) {
      showToast("Orders in pending or processing cannot be cancelled");
      return;
    }

    if (isVnpayPaidOrder(order)) {
      setRefundFormOrderId(order.orderId);
      setRefundMode("AUTO_VNPAY");
      setRefundForm({
        cancelReason: "",
        bankAccountNumber: "",
        bankName: "",
        bankAccountHolder: "",
      });
      return;
    }

    const confirmed = window.confirm(
      "Are you sure you want to cancel this order?",
    );
    if (!confirmed) return;

    try {
      await cancelOrder(order.orderId);
      showToast("Order cancelled successfully");
      const data = await loadOrders();
      await loadReturnRequests(data || []);
    } catch (err) {
      console.error("Cancel error:", err);
      showToast(err?.response?.data?.message || "Cancel failed");
    }
  };

  const submitCancelAndRefund = async (order) => {
    const orderId = String(order?.orderId || "").trim();
    if (!orderId) {
      showToast("Missing orderId");
      return;
    }

    const cancelReason = String(refundForm.cancelReason || "").trim();
    const bankAccountNumber = String(refundForm.bankAccountNumber || "").trim();
    const bankName = String(refundForm.bankName || "").trim();
    const bankAccountHolder = String(refundForm.bankAccountHolder || "").trim();

    if (refundMode === "MANUAL") {
      if (!bankAccountNumber) {
        showToast("Bank account number is required");
        return;
      }
      if (!/^\d{6,20}$/.test(bankAccountNumber)) {
        showToast("Bank account number must be 6-20 digits");
        return;
      }
      if (!bankName) {
        showToast("Bank name is required");
        return;
      }
      if (!bankAccountHolder) {
        showToast("Account holder is required");
        return;
      }
    }

    const confirmed = window.confirm(
      refundMode === "AUTO_VNPAY"
        ? "Cancel this paid order and submit a VNPay refund request?"
        : "Cancel this paid order and submit a manual refund request?",
    );
    if (!confirmed) return;

    try {
      setSubmittingRefund(true);

      const statusToken = String(order?.status || "").toUpperCase();
      const isAlreadyCancelled =
        statusToken === "CANCELLED" || statusToken === "CANCELED";

      if (!isAlreadyCancelled) {
        await cancelOrder(orderId);
      }

      if (refundMode === "AUTO_VNPAY") {
        await requestVnpayRefundApi(orderId, {
          note: cancelReason || "Customer requested VNPay refund",
        });

        showToast("Refund request submitted. Waiting for admin approval.");
      } else {
        await requestRefund(orderId, {
          bankAccountNumber,
          bankName,
          bankAccountHolder,
          note: cancelReason || "Customer requested refund",
        });

        showToast("Manual refund request submitted successfully.");
      }

      setRefundFormOrderId(null);
      setRefundForm({
        cancelReason: "",
        bankAccountNumber: "",
        bankName: "",
        bankAccountHolder: "",
      });

      const data = await loadOrders();
      await loadReturnRequests(data || []);
    } catch (err) {
      console.error("Cancel & refund error:", err);
      showToast(err?.response?.data?.message || "Cancel & refund failed");
    } finally {
      setSubmittingRefund(false);
    }
  };

  const getOrderHasAnyReturnRequest = (order) => {
    return (order.items || []).some(
      (item) => !!getLatestReturnRequest(item.orderItemId),
    );
  };

  const isManualValid =
    refundForm.bankName.trim() &&
    /^\d{6,20}$/.test(refundForm.bankAccountNumber.trim()) &&
    refundForm.bankAccountHolder.trim();

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
          const comboOnlyReturn = true;
          const vnpayPaid = isVnpayPaidOrder(order);
          const refundStatus = normalizeToken(order.refundStatus);
          const refundPending = refundStatus === "PENDING";
          const waitingRefundChoice = refundStatus === "WAITING_REFUND";
          const canCancel = canCancelOrder(effectiveStatus);
          const isCancelled =
            String(effectiveStatus || "").toUpperCase() === "CANCELLED";

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
                  className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-semibold ${badgeByStatus(
                    effectiveStatus,
                  )}`}
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
                  {String(order.refundStatus || "").toUpperCase() &&
                    String(order.refundStatus || "").toUpperCase() !==
                      "NONE" && (
                      <div
                        className={`inline-flex mt-2 px-2 py-0.5 rounded-full border text-[11px] font-semibold ${
                          String(order.refundStatus || "").toUpperCase() ===
                          "REFUNDED"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-blue-50 text-blue-700 border-blue-200"
                        }`}
                      >
                        Refund: {String(order.refundStatus || "").toUpperCase()}
                      </div>
                    )}
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
                                  className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${returnStatusBadge(
                                    latestRequest.status,
                                  )}`}
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
                            !latestRequest &&
                            null}
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
                    Return/exchange is allowed for the whole order only.
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

                {canCancel && (
                  <button
                    onClick={() => handleCancel(order)}
                    disabled={refundPending}
                    className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold ${
                      refundPending
                        ? "border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed"
                        : "border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
                    }`}
                  >
                    <FiXCircle size={16} />
                    {vnpayPaid
                      ? isCancelled && waitingRefundChoice
                        ? "Request Refund"
                        : "Cancel & Refund"
                      : "Cancel Order"}
                  </button>
                )}
              </div>

              {refundFormOrderId === order.orderId &&
                vnpayPaid &&
                !refundPending && (
                  <div className="mt-4 rounded-2xl border bg-gray-50 p-4">
                    <div className="text-sm font-bold text-gray-900">
                      Refund information
                    </div>
                    <div className="mt-1 text-xs text-gray-500">
                      {refundMode === "AUTO_VNPAY"
                        ? "Refund will be returned to your original VNPay payment method."
                        : "Enter bank details for manual refund processing."}
                    </div>

                    <div className="mt-4 space-y-3">
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setRefundMode("AUTO_VNPAY")}
                          className={`rounded-xl border py-2 text-sm font-semibold ${
                            refundMode === "AUTO_VNPAY"
                              ? "bg-black text-white border-black"
                              : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
                          }`}
                        >
                          Refund via VNPay
                        </button>
                        <button
                          type="button"
                          onClick={() => setRefundMode("MANUAL")}
                          className={`rounded-xl border py-2 text-sm font-semibold ${
                            refundMode === "MANUAL"
                              ? "bg-black text-white border-black"
                              : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
                          }`}
                        >
                          Manual refund
                        </button>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-gray-500 mb-1">
                          Cancel reason (optional)
                        </label>
                        <textarea
                          value={refundForm.cancelReason}
                          onChange={(e) =>
                            setRefundForm((prev) => ({
                              ...prev,
                              cancelReason: e.target.value,
                            }))
                          }
                          rows={2}
                          className="w-full rounded-xl border px-3 py-2 text-sm bg-white"
                          placeholder="Reason for cancellation"
                        />
                      </div>

                      {refundMode === "MANUAL" && (
                        <>
                          <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                            Bạn phải nhập đúng STK của mình. Nếu có sự nhầm lẫn
                            gì thì bên hệ thống không chịu trách nhiệm.
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <div>
                              <label className="block text-xs font-semibold text-gray-500 mb-1">
                                Bank account number
                              </label>
                              <input
                                value={refundForm.bankAccountNumber}
                                onChange={(e) =>
                                  setRefundForm((prev) => ({
                                    ...prev,
                                    bankAccountNumber: e.target.value.replace(
                                      /\D/g,
                                      "",
                                    ),
                                  }))
                                }
                                className="w-full rounded-xl border px-3 py-2 text-sm bg-white"
                                placeholder="e.g. 0123456789"
                              />
                            </div>

                            <div>
                              <label className="block text-xs font-semibold text-gray-500 mb-1">
                                Bank name
                              </label>
                              <input
                                value={refundForm.bankName}
                                onChange={(e) =>
                                  setRefundForm((prev) => ({
                                    ...prev,
                                    bankName: e.target.value,
                                  }))
                                }
                                className="w-full rounded-xl border px-3 py-2 text-sm bg-white"
                                placeholder="e.g. Vietcombank"
                              />
                            </div>

                            <div>
                              <label className="block text-xs font-semibold text-gray-500 mb-1">
                                Account holder
                              </label>
                              <input
                                value={refundForm.bankAccountHolder}
                                onChange={(e) =>
                                  setRefundForm((prev) => ({
                                    ...prev,
                                    bankAccountHolder: e.target.value,
                                  }))
                                }
                                className="w-full rounded-xl border px-3 py-2 text-sm bg-white"
                                placeholder="e.g. Nguyen Van A"
                              />
                            </div>
                          </div>
                        </>
                      )}

                      <div className="mt-4 flex flex-wrap gap-2">
                        <button
                          onClick={() => submitCancelAndRefund(order)}
                          disabled={
                            submittingRefund ||
                            (refundMode === "MANUAL" && !isManualValid)
                          }
                          className="inline-flex items-center justify-center rounded-xl bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-gray-900 disabled:opacity-60"
                        >
                          {submittingRefund ? "Submitting..." : "Submit"}
                        </button>
                        <button
                          onClick={() => setRefundFormOrderId(null)}
                          disabled={submittingRefund}
                          className="inline-flex items-center justify-center rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-60"
                        >
                          Close
                        </button>
                      </div>
                    </div>
                  </div>
                )}
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
