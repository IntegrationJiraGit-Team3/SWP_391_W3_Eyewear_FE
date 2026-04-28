import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  FiChevronLeft,
  FiClock,
  FiPackage,
  FiTruck,
  FiHome,
  FiMapPin,
  FiPhone,
  FiCreditCard,
  FiCheckCircle,
  FiRefreshCw,
  FiXCircle,
} from "react-icons/fi";
import {
  getOrderDetails,
  cancelOrder,
  updatePaymentMethod,
  requestRefund,
} from "../services/orderService";
import { getShipmentByOrder } from "../services/shipmentService";
import { createVNPayPayment } from "../services/checkoutService";
import { useToast } from "../../context/ToastContext";
import { requestVnpayRefundApi } from "../api/orderApi";

const getOrderStep = (status) => {
  const s = String(status || "").toUpperCase();
  if (s === "PENDING" || s === "PREORDER") return 0;
  if (s === "PROCESSING") return 1;
  if (s === "SHIPPED" || s === "DELIVERING" || s === "SHIPPING") return 2;
  if (s === "DELIVERED" || s === "COMPLETED") return 3;
  return 0;
};

const getShipmentStep = (status) => {
  const s = String(status || "").toUpperCase();
  if (["CREATED", "PICKUP_PENDING"].includes(s)) return 0;
  if (["PICKED_UP", "IN_TRANSIT"].includes(s)) return 1;
  if (["OUT_FOR_DELIVERY"].includes(s)) return 2;
  if (["DELIVERED"].includes(s)) return 3;
  return 0;
};

const isNumericId = (value) => /^\d+$/.test(String(value ?? "").trim());

const resolveNumericOrderId = (order, routeId) => {
  const candidates = [order?.orderId, routeId, order?.id]
    .map((v) => String(v ?? "").trim())
    .filter(Boolean);

  const numericCandidates = candidates.filter(isNumericId);
  return numericCandidates[0] || null;
};

const CITY_DISTANCE_MAP = {
  "ho chi minh": 1,
  hcm: 1,
  "tp hcm": 1,
  tphcm: 1,
  "ho chi minh city": 1,
  "binh duong": 5,
  "dong nai": 6,
  "ba ria vung tau": 7,
  "long an": 8,
  "tien giang": 9,
  "vinh long": 10,
  "can tho": 12,
  "an giang": 13,
  "soc trang": 14,
  "bac lieu": 15,
  "ca mau": 16,
  "kien giang": 18,
  "tra vinh": 11,
};

const normalizeLocation = (value) =>
  String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\u0111/g, "d")
    .replace(/\u0110/g, "D")
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^tp\s+/, "");

const estimateDeliveredDate = (order, shipment) => {
  if (shipment?.deliveredDate) return shipment.deliveredDate;

  const baseDate = shipment?.shippedDate;
  if (!baseDate) return "Not delivered yet";

  const address = String(order?.address || "");
  const city = address.includes(",") ? address.split(",").at(-1)?.trim() : "";
  const distance = CITY_DISTANCE_MAP[normalizeLocation(city)];
  const transitDays =
    typeof distance === "number" ? (distance < 10 ? 3 : 5) : 3;

  const estimated = new Date(baseDate);
  if (Number.isNaN(estimated.getTime())) return "Not delivered yet";

  estimated.setDate(estimated.getDate() + transitDays);
  return estimated.toISOString().slice(0, 10);
};

function ShippingProgressPage() {
  const { id } = useParams();
  const { showToast } = useToast();

  const [order, setOrder] = useState(null);
  const [shipment, setShipment] = useState(null);
  const [loading, setLoading] = useState(true);

  const [showRefundForm, setShowRefundForm] = useState(false);
  const [submittingRefund, setSubmittingRefund] = useState(false);
  const [refundForm, setRefundForm] = useState({
    cancelReason: "",
    bankName: "",
    bankAccountNumber: "",
    bankAccountHolder: "",
  });
  const [refundMode, setRefundMode] = useState("AUTO_VNPAY");

  const normalizePaymentToken = (value) =>
    String(value || "")
      .trim()
      .toUpperCase()
      .replace(/[\s-]+/g, "_");

  useEffect(() => {
    if (!showRefundForm || refundMode !== "MANUAL") return;

    setRefundForm((prev) => {
      const next = { ...prev };

      const orderBankName = String(order?.refundBankName || "").trim();
      const orderBankAccountNumber = String(
        order?.refundBankAccountNumber || "",
      ).trim();
      const orderBankAccountHolder = String(
        order?.refundBankAccountHolder || "",
      ).trim();

      if (!next.bankName && orderBankName) next.bankName = orderBankName;
      if (!next.bankAccountNumber && orderBankAccountNumber) {
        next.bankAccountNumber = orderBankAccountNumber;
      }
      if (!next.bankAccountHolder && orderBankAccountHolder) {
        next.bankAccountHolder = orderBankAccountHolder;
      }

      return next;
    });
  }, [order, showRefundForm, refundMode]);

  const isVnpayPaidOrder = (currentOrder) => {
    const paymentMethod = normalizePaymentToken(
      currentOrder?.paymentMethod,
    ).replace(/_/g, "");
    const paymentStatus = normalizePaymentToken(currentOrder?.paymentStatus);

    if (paymentMethod !== "VNPAY") return false;

    return [
      "PAID",
      "PAID_DEPOSIT",
      "PAID_FULL",
      "FULLY_PAID",
      "PAID_IN_FULL",
      "SETTLED",
    ].includes(paymentStatus);
  };

  const isVnpayOrder = (currentOrder) => {
    return (
      normalizePaymentToken(currentOrder?.paymentMethod).replace(/_/g, "") ===
      "VNPAY"
    );
  };

  const canCancelOrder = (currentOrder) => {
    const raw = String(currentOrder?.rawStatus || currentOrder?.status || "")
      .trim()
      .toUpperCase();

    const refundStatus = normalizePaymentToken(currentOrder?.refundStatus);

    if (refundStatus === "REFUNDED") return false;
    if (["CANCELLED", "CANCELED"].includes(raw)) return false;

    return ["PENDING", "PREORDER", "PROCESSING"].includes(raw);
  };

  const isRemainingPaid = (currentOrder) => {
    const paymentStatus = normalizePaymentToken(currentOrder?.paymentStatus);
    const isPartial =
      String(currentOrder?.depositType || "")
        .trim()
        .toUpperCase() === "PARTIAL";

    if (["UNPAID", "PENDING", "FAILED", "CANCELLED"].includes(paymentStatus)) {
      return false;
    }

    const remainingStatus = normalizePaymentToken(
      currentOrder?.remainingPaymentStatus ??
        currentOrder?.finalPaymentStatus ??
        currentOrder?.remainingPaymentStage,
    );

    if (remainingStatus === "PAID") return true;
    if (remainingStatus === "UNPAID") return false;
    if (
      ["WAITING_CONFIRM", "WAITING_CONFIRMATION", "PENDING"].includes(
        remainingStatus,
      )
    ) {
      return false;
    }

    if (isPartial) {
      return paymentStatus === "PAID_FULL";
    }

    if (
      ["PAID", "PAID_FULL", "FULLY_PAID", "PAID_IN_FULL", "SETTLED"].includes(
        paymentStatus,
      )
    ) {
      return true;
    }

    // fallback when fields are missing
    const remainingAmount = Number(
      currentOrder?.remainingAmount ??
        Number(
          currentOrder?.finalTotal ??
            currentOrder?.finalPrice ??
            currentOrder?.totalPrice ??
            0,
        ) - Number(currentOrder?.depositAmount || 0),
    );

    return remainingAmount <= 0;
  };

  const getRemainingAmount = (currentOrder) => {
    return Number(
      currentOrder?.remainingAmount ??
        Number(
          currentOrder?.finalTotal ??
            currentOrder?.finalPrice ??
            currentOrder?.totalPrice ??
            0,
        ) - Number(currentOrder?.depositAmount || 0),
    );
  };

  const loadAll = useCallback(async () => {
    try {
      setLoading(true);
      const orderData = await getOrderDetails(id);
      setOrder(orderData);

      try {
        const shipmentOrderId = resolveNumericOrderId(orderData, id);
        if (!shipmentOrderId) {
          setShipment(null);
        } else {
          const shipmentData = await getShipmentByOrder(shipmentOrderId);
          setShipment(shipmentData);
        }
      } catch {
        setShipment(null);
      }
    } catch (err) {
      console.error("Load tracking page error:", err);
      setOrder(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    const initialTimer = setTimeout(loadAll, 0);

    const handleMessage = (event) => {
      if (event.origin !== window.location.origin) return;
      const data = event.data;

      if (data && data.type === "VNPAY_RESULT") {
        if (data.success) {
          showToast("Payment successful!");
        } else {
          showToast("Payment failed or cancelled!");
        }
        loadAll();
      }
    };

    window.addEventListener("message", handleMessage);

    return () => {
      clearTimeout(initialTimer);
      window.removeEventListener("message", handleMessage);
    };
  }, [loadAll, showToast]);

  const refundStatusToken = normalizePaymentToken(order?.refundStatus);
  const rawStatusToken = String(order?.rawStatus || order?.status || "")
    .trim()
    .toUpperCase();

  const steps = useMemo(() => {
    const raw = String(order?.rawStatus || order?.status || "")
      .trim()
      .toUpperCase();

    if (refundStatusToken === "REFUNDED") {
      return [
        {
          title: "Refund completed",
          desc: "Your payment has been refunded successfully.",
          icon: <FiCheckCircle />,
        },
      ];
    }

    if (refundStatusToken === "PENDING") {
      return [
        {
          title: "Refund requested",
          desc: "Your refund request is being reviewed.",
          icon: <FiRefreshCw />,
        },
      ];
    }

    if (raw === "CANCELLED" || raw === "CANCELED") {
      return [
        {
          title: "Order Created",
          desc: "The order has been placed successfully.",
          icon: <FiClock />,
        },
        {
          title: "Cancelled",
          desc: "This order has been cancelled.",
          icon: <FiXCircle />,
        },
      ];
    }

    return [
      {
        title: "Order Created",
        desc: "The order has been placed successfully.",
        icon: <FiClock />,
      },
      {
        title: "Processing",
        desc: "The shop is preparing the order.",
        icon: <FiPackage />,
      },
      {
        title: "Shipping",
        desc: "The order is moving through delivery.",
        icon: <FiTruck />,
      },
      {
        title: "Delivered",
        desc: "The order has reached the customer.",
        icon: <FiHome />,
      },
    ];
  }, [order?.rawStatus, order?.status, refundStatusToken]);

  const orderStep = getOrderStep(order?.rawStatus || order?.status);
  const shipmentStep = shipment?.status ? getShipmentStep(shipment.status) : -1;

  const isRefundProgress =
    refundStatusToken === "REFUNDED" || refundStatusToken === "PENDING";

  const activeStep = isRefundProgress
    ? 0
    : rawStatusToken === "CANCELLED" || rawStatusToken === "CANCELED"
      ? 1
      : Math.max(orderStep, shipmentStep);

  const remainingAmount = getRemainingAmount(order);
  const remainingMethodToken = normalizePaymentToken(
    order?.remainingPaymentMethod,
  );
  const remainingStageToken = normalizePaymentToken(
    order?.remainingPaymentStage,
  );
  const isRemainingMethodCOD = remainingMethodToken === "COD";
  const isAwaitingManualConfirmation =
    !isRemainingPaid(order) &&
    remainingAmount > 0 &&
    isRemainingMethodCOD &&
    remainingStageToken === "PENDING_CONFIRMATION";
  const vnpayPaid = isVnpayPaidOrder(order);

  const canShowRemainingPayment =
    String(order?.depositType || "")
      .trim()
      .toUpperCase() === "PARTIAL" &&
    !isRemainingPaid(order) &&
    remainingAmount > 0 &&
    ["COMPLETED", "DELIVERED"].includes(rawStatusToken);

  const vnpayPaid = isVnpayPaidOrder(order);

  const handlePayBalance = async (method) => {
    try {
      const remaining = getRemainingAmount(order);

      if (
        String(order?.depositType || "")
          .trim()
          .toUpperCase() !== "PARTIAL" ||
        !["COMPLETED", "DELIVERED"].includes(rawStatusToken)
      ) {
        showToast(
          "You can pay the remaining amount only when the order is DELIVERED or COMPLETED",
        );
        return;
      }
      if (remaining <= 0) {
        showToast("No remaining payment");
        return;
      }

      if (method === "VNPAY") {
        try {
          localStorage.setItem(
            "vnpay:pendingRemainingPayment",
            JSON.stringify({
              orderId: order.orderId || order.id,
              amount: Math.round(remaining),
              source: "shipping-progress",
              ts: Date.now(),
            }),
          );
        } catch (storageError) {
          console.error("Store VNPay payment context failed:", storageError);
        }

        const url = await createVNPayPayment(
          Math.round(remaining),
          order.orderId || order.id,
        );

        const width = 800;
        const height = 600;
        const left = window.screen.width / 2 - width / 2;
        const top = window.screen.height / 2 - height / 2;

        window.open(
          url,
          "VNPay_Payment",
          `width=${width},height=${height},left=${left},top=${top}`,
        );
        return;
      }

      await updatePaymentMethod(order.orderId || order.id, "COD");
      showToast("Remaining payment will be collected by COD on delivery");
      loadAll();
    } catch (err) {
      console.error("Pay balance error:", err);
      showToast("Failed to update remaining payment");
    }
  };

  const handleCancelOrder = async () => {
    if (!canCancelOrder(order)) {
      showToast("This order cannot be cancelled at its current status");
      return;
    }

    if (isVnpayPaidOrder(order)) {
      const refundStatus = normalizePaymentToken(order?.refundStatus);

      if (refundStatus === "PENDING") {
        showToast("Refund is already pending");
        return;
      }

      if (refundStatus === "REFUNDED") {
        showToast("This order has already been refunded");
        return;
      }

      const confirmed = window.confirm(
        "Cancel this order and choose a refund method?",
      );
      if (!confirmed) return;

      try {
        await cancelOrder(order.orderId || order.id);
        showToast("Order cancelled. Please choose a refund method.");
        await loadAll();
        setRefundMode("AUTO_VNPAY");
        setShowRefundForm(true);
      } catch (err) {
        console.error("Cancel paid order error:", err);
        showToast(err?.response?.data?.message || "Cancel failed", "error");
      }
      return;
    }

    const confirmed = window.confirm(
      "Are you sure you want to cancel this order?",
    );
    if (!confirmed) return;

    try {
      await cancelOrder(order.orderId || order.id);
      showToast("Order cancelled successfully");
      loadAll();
    } catch (err) {
      console.error("Cancel order error:", err);
      showToast(err?.response?.data?.message || "Cancel failed");
    }
  };

  const submitCancelAndRefund = async () => {
    const cancelReason = refundForm.cancelReason.trim();
    const bankName = refundForm.bankName.trim();
    const bankAccountNumber = refundForm.bankAccountNumber.trim();
    const bankAccountHolder = refundForm.bankAccountHolder.trim();

    if (refundMode === "MANUAL") {
      if (!bankName) {
        showToast("Bank name is required", "error");
        return;
      }

      if (!bankAccountNumber) {
        showToast("Bank account number is required", "error");
        return;
      }

      if (!/^\d{6,20}$/.test(bankAccountNumber)) {
        showToast("Bank account number must be 6-20 digits", "error");
        return;
      }

      if (!bankAccountHolder) {
        showToast("Account holder is required", "error");
        return;
      }
    }

    if (refundMode === "AUTO_VNPAY" && !vnpayPaid) {
      showToast("Order is not paid via VNPay, cannot auto refund", "error");
      return;
    }

    const candidates = [order?.orderId, id]
      .map((v) => String(v ?? "").trim())
      .filter(Boolean);

    const numericCandidates = candidates.filter(isNumericId);
    const primaryOrderKey = numericCandidates[0] || null;

    if (!primaryOrderKey) {
      showToast("Missing orderId for refund request", "error");
      return;
    }

    try {
      setSubmittingRefund(true);

      const statusToken = normalizePaymentToken(
        order?.rawStatus || order?.status,
      );
      const isAlreadyCancelled = ["CANCELLED", "CANCELED"].includes(
        statusToken,
      );

      if (!isAlreadyCancelled) {
        await cancelOrder(primaryOrderKey);
      }

      if (refundMode === "AUTO_VNPAY") {
        await requestVnpayRefundApi(primaryOrderKey, {
          note: cancelReason || "Customer requested VNPay refund",
        });

        showToast(
          "Refund request submitted. Awaiting admin confirmation.",
          "success",
        );
      } else {
        await requestRefund(primaryOrderKey, {
          bankName,
          bankAccountNumber,
          bankAccountHolder,
          note: cancelReason || "Customer requested refund",
        });

        showToast("Refund request submitted successfully.", "success");
      }

      setShowRefundForm(false);
      setRefundForm({
        cancelReason: "",
        bankName: "",
        bankAccountNumber: "",
        bankAccountHolder: "",
      });

      await loadAll();
    } catch (err) {
      console.error("Cancel & refund error:", err);
      showToast(
        err?.response?.data?.message || "Cancel & refund failed",
        "error",
      );
    } finally {
      setSubmittingRefund(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-gray-200 border-t-black rounded-full animate-spin" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6">
        <div className="text-xl font-bold text-gray-800">Order not found</div>
        <Link to="/my-orders" className="mt-4 text-blue-600 font-semibold">
          Back to My Orders
        </Link>
      </div>
    );
  }

  const isManualValid =
    refundForm.bankName.trim() &&
    /^\d{6,20}$/.test(refundForm.bankAccountNumber.trim()) &&
    refundForm.bankAccountHolder.trim();

  return (
    <div className="min-h-screen bg-[#fcfcfc] pt-24 pb-16">
      <div className="max-w-6xl mx-auto px-6">
        <Link
          to="/my-orders"
          className="inline-flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-gray-900 mb-6"
        >
          <FiChevronLeft />
          Back to Orders
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 space-y-6">
            <div className="rounded-3xl border bg-white p-6 shadow-sm">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <div className="text-xs uppercase tracking-wider text-gray-400 font-bold">
                    Order Tracking
                  </div>
                  <div className="text-2xl font-black text-gray-900 mt-1">
                    {order.id}
                  </div>
                  <div className="text-sm text-gray-500 mt-2">
                    Status:{" "}
                    <span className="font-semibold text-gray-800">
                      {order.rawStatus || order.status}
                    </span>
                  </div>
                </div>

                <button
                  onClick={loadAll}
                  className="inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold hover:bg-gray-50"
                >
                  <FiRefreshCw />
                  Refresh
                </button>
              </div>

              <div className="mt-8">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {steps.map((step, index) => {
                    const active = index <= activeStep;

                    return (
                      <div
                        key={step.title}
                        className={`rounded-2xl border p-4 ${
                          active && step.title === "Cancelled"
                            ? "bg-red-600 text-white border-red-600"
                            : active
                              ? "bg-black text-white border-black"
                              : "bg-white text-gray-500 border-gray-200"
                        }`}
                      >
                        <div className="w-10 h-10 rounded-full flex items-center justify-center bg-white/10 border border-white/10">
                          {step.icon}
                        </div>
                        <div className="mt-4 font-bold">{step.title}</div>
                        <div
                          className={`text-sm mt-1 ${
                            active ? "text-white/80" : "text-gray-400"
                          }`}
                        >
                          {step.desc}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="rounded-3xl border bg-white p-6 shadow-sm">
              <h2 className="text-lg font-bold text-gray-900 mb-4">
                Shipment Information
              </h2>

              {shipment ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="rounded-2xl bg-gray-50 border p-4">
                    <div className="text-gray-400 text-xs font-semibold mb-1">
                      Carrier
                    </div>
                    <div className="font-semibold text-gray-800">
                      {shipment.carrier || "-"}
                    </div>
                  </div>

                  <div className="rounded-2xl bg-gray-50 border p-4">
                    <div className="text-gray-400 text-xs font-semibold mb-1">
                      Tracking Number
                    </div>
                    <div className="font-semibold text-gray-800">
                      {shipment.trackingNumber || "-"}
                    </div>
                  </div>

                  <div className="rounded-2xl bg-gray-50 border p-4">
                    <div className="text-gray-400 text-xs font-semibold mb-1">
                      Shipment Status
                    </div>
                    <div className="font-semibold text-gray-800">
                      {shipment.status || "-"}
                    </div>
                  </div>

                  <div className="rounded-2xl bg-gray-50 border p-4">
                    <div className="text-gray-400 text-xs font-semibold mb-1">
                      Shipped Date
                    </div>
                    <div className="font-semibold text-gray-800">
                      {shipment.shippedDate || "-"}
                    </div>
                  </div>

                  <div className="rounded-2xl bg-gray-50 border p-4 md:col-span-2">
                    <div className="text-gray-400 text-xs font-semibold mb-1">
                      Delivered Date
                    </div>
                    <div className="font-semibold text-gray-800">
                      {estimateDeliveredDate(order, shipment)}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl bg-amber-50 border border-amber-200 p-4 text-sm text-amber-800">
                  This order has not been assigned to a shipment yet.
                </div>
              )}
            </div>

            <div className="rounded-3xl border bg-white p-6 shadow-sm">
              <h2 className="text-lg font-bold text-gray-900 mb-4">
                Order Items
              </h2>

              <div className="space-y-4">
                {(order.items || []).map((item, idx) => (
                  <div
                    key={item.orderItemId || idx}
                    className="rounded-2xl border p-4 flex gap-4"
                  >
                    <img
                      src={item.image || "https://placehold.co/100"}
                      alt={item.name}
                      className="w-20 h-20 rounded-xl object-cover border"
                    />
                    <div className="flex-1">
                      <div className="font-semibold text-gray-900">
                        {item.name}
                      </div>
                      <div className="text-sm text-gray-500 mt-1">
                        Quantity: {item.quantity}
                      </div>
                      <div className="text-sm text-gray-500">
                        Variant ID: {item.variantId || "-"}
                      </div>
                      {item.lensType && (
                        <div className="text-sm text-indigo-600 mt-1">
                          Lens: {item.lensType}
                        </div>
                      )}
                      {item.isPreorder && (
                        <div className="inline-flex mt-2 px-2 py-1 rounded-lg bg-amber-50 text-amber-700 border border-amber-200 text-xs font-semibold">
                          Pre-order item
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="lg:col-span-4 space-y-6">
            <div className="rounded-3xl border bg-white p-6 shadow-sm">
              <h2 className="text-lg font-bold text-gray-900 mb-4">
                Order Summary
              </h2>

              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-3">
                  <FiMapPin className="mt-0.5 text-gray-400" />
                  <div>{order.address || "-"}</div>
                </div>

                <div className="flex items-start gap-3">
                  <FiPhone className="mt-0.5 text-gray-400" />
                  <div>{order.phone || "-"}</div>
                </div>

                <div className="flex items-start gap-3">
                  <FiCreditCard className="mt-0.5 text-gray-400" />
                  <div>
                    {order.paymentMethod || "-"} / {order.paymentStatus || "-"}
                    {(() => {
                      const token = normalizePaymentToken(order?.refundStatus);
                      if (!token || token === "NONE") return null;

                      const isRefunded = token === "REFUNDED";

                      return (
                        <div
                          className={`inline-flex mt-2 px-2 py-0.5 rounded-full border text-[11px] font-semibold ${
                            isRefunded
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : "bg-blue-50 text-blue-700 border-blue-200"
                          }`}
                        >
                          Refund: {token}
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </div>

              <div className="border-t mt-5 pt-5 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>
                    {Number(order.subTotal || 0).toLocaleString("vi-VN")} đ
                  </span>
                </div>

                <div className="flex justify-between">
                  <span>Shipping fee</span>
                  <span>
                    {Number(order.shippingFee || 0).toLocaleString("vi-VN")} đ
                  </span>
                </div>

                {/* <div className="flex justify-between">
                  <span>Discount</span>
                  <span>
                    {Number(order.discount || 0).toLocaleString("vi-VN")} đ
                  </span>
                </div> */}

                <div className="flex justify-between text-base font-bold pt-2 border-t">
                  <span>Total</span>
                  <span>
                    {Number(
                      order.finalTotal ?? order.finalPrice ?? 0,
                    ).toLocaleString("vi-VN")}{" "}
                    đ
                  </span>
                </div>

                {String(order?.depositType || "")
                  .trim()
                  .toUpperCase() === "PARTIAL" && (
                  <>
                    <div className="flex justify-between">
                      <span>Deposit paid</span>
                      <span>
                        {Number(order.depositAmount || 0).toLocaleString(
                          "vi-VN",
                        )}{" "}
                        đ
                      </span>
                    </div>
                    <div className="flex justify-between font-semibold text-amber-700">
                      <span>Remaining</span>
                      <span>
                        {Number(remainingAmount).toLocaleString("vi-VN")} đ
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {canShowRemainingPayment && (
              <div className="rounded-3xl border bg-amber-50 border-amber-200 p-6 shadow-sm">
                <div className="text-lg font-bold text-amber-900">
                  Remaining Payment
                </div>

                <div className="mt-2 text-sm text-amber-800">
                  Remaining amount:
                  <span className="font-bold ml-1">
                    {getRemainingAmount(order).toLocaleString("vi-VN")} đ
                  </span>
                </div>

                {isAwaitingManualConfirmation ? (
                  <div className="mt-4 rounded-2xl border border-amber-200 bg-white px-4 py-3 text-sm text-amber-800">
                    COD has been selected for the remaining payment. Waiting for
                    admin confirmation.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-3 mt-4">
                    <button
                      onClick={() => handlePayBalance("VNPAY")}
                      className="rounded-xl bg-black text-white py-3 font-semibold hover:opacity-90"
                    >
                      Pay by VNPay
                    </button>
                    <button
                      onClick={() => handlePayBalance("COD")}
                      className="rounded-xl border py-3 font-semibold hover:bg-white"
                    >
                      Switch to COD for remaining payment
                    </button>
                  </div>
                )}
              </div>
            )}

            {canCancelOrder(order) && (
              <div className="space-y-3">
                <button
                  onClick={handleCancelOrder}
                  className="w-full rounded-2xl bg-red-600 text-white py-3 font-semibold hover:opacity-90"
                >
                  {isVnpayPaidOrder(order) ? "Cancel & Refund" : "Cancel Order"}
                </button>
              </div>
            )}

            {isVnpayOrder(order) && refundStatusToken === "PENDING" && (
              <div className="rounded-2xl border bg-blue-50 border-blue-200 p-4 text-sm text-blue-800">
                <div className="font-bold">Refund pending</div>
                <div className="mt-1 text-xs text-blue-700">
                  Your refund request has been submitted and is awaiting admin
                  processing.
                </div>
                <div className="mt-2 text-xs text-blue-700 space-y-1">
                  {order?.refundRequestedAt && (
                    <div>
                      Requested at:{" "}
                      {new Date(order.refundRequestedAt).toLocaleString()}
                    </div>
                  )}
                  {order?.refundBankName && (
                    <div>Bank: {order.refundBankName}</div>
                  )}
                  {order?.refundBankAccountHolder && (
                    <div>Account holder: {order.refundBankAccountHolder}</div>
                  )}
                </div>
              </div>
            )}

            {isVnpayOrder(order) && refundStatusToken === "REFUNDED" && (
              <div className="rounded-2xl border bg-emerald-50 border-emerald-200 p-4 text-sm text-emerald-800 flex items-start gap-3">
                <FiCheckCircle className="mt-0.5" />
                <div>
                  <div className="font-bold">Refund completed</div>
                  {order?.refundProcessedAt && (
                    <div className="text-xs text-emerald-700 mt-1">
                      Processed at:{" "}
                      {new Date(order.refundProcessedAt).toLocaleString()}
                    </div>
                  )}
                </div>
              </div>
            )}

            {["CANCELLED", "CANCELED"].includes(rawStatusToken) &&
              isVnpayOrder(order) &&
              vnpayPaid &&
              !showRefundForm &&
              ["", "NONE", "WAITING_REFUND"].includes(
                normalizePaymentToken(order?.refundStatus),
              ) && (
                <div className="rounded-2xl border bg-white p-4">
                  <div className="text-sm font-bold text-gray-900">Refund</div>
                  <div className="text-xs text-gray-500 mt-1">
                    Choose how you want to process the refund for this cancelled
                    order.
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setRefundMode("AUTO_VNPAY");
                      setShowRefundForm(true);
                    }}
                    className="mt-3 w-full rounded-xl bg-black text-white py-2 text-sm font-semibold hover:opacity-90"
                  >
                    Request Refund
                  </button>
                </div>
              )}

            {showRefundForm && isVnpayOrder(order) && vnpayPaid && (
              <div className="rounded-2xl border bg-white p-4">
                <div className="text-sm font-bold text-gray-900">
                  Refund Information
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {refundMode === "AUTO_VNPAY"
                    ? "Refund will be returned to your original VNPay payment method."
                    : "Enter your bank details for manual refund processing."}
                </div>

                <div className="mt-4 space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      className={`rounded-xl border py-2 text-sm font-semibold ${
                        refundMode === "AUTO_VNPAY"
                          ? "bg-black text-white"
                          : "bg-white"
                      }`}
                      onClick={() => setRefundMode("AUTO_VNPAY")}
                    >
                      Refund via VNPay
                    </button>

                    <button
                      type="button"
                      className={`rounded-xl border py-2 text-sm font-semibold ${
                        refundMode === "MANUAL"
                          ? "bg-black text-white"
                          : "bg-white"
                      }`}
                      onClick={() => {
                        setRefundMode("MANUAL");
                        setRefundForm({
                          cancelReason: refundForm.cancelReason,
                          bankName: "",
                          bankAccountNumber: "",
                          bankAccountHolder: "",
                        });
                      }}
                    >
                      Manual refund
                    </button>
                  </div>

                  <input
                    className="w-full rounded-xl border px-3 py-2 text-sm"
                    placeholder="Cancel reason (optional)"
                    value={refundForm.cancelReason}
                    onChange={(e) =>
                      setRefundForm((p) => ({
                        ...p,
                        cancelReason: e.target.value,
                      }))
                    }
                  />

                  {refundMode === "MANUAL" && (
                    <>
                      <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                        Báº¡n pháº£i nháº­p Ä‘Ãºng STK cá»§a mÃ¬nh. Náº¿u cÃ³
                        sá»± nháº§m láº«n gÃ¬ thÃ¬ bÃªn há»‡ thá»‘ng khÃ´ng
                        chá»‹u trÃ¡ch nhiá»‡m.
                      </div>

                      <input
                        className="w-full rounded-xl border px-3 py-2 text-sm"
                        placeholder="Bank name"
                        value={refundForm.bankName}
                        onChange={(e) =>
                          setRefundForm((p) => ({
                            ...p,
                            bankName: e.target.value,
                          }))
                        }
                      />

                      <input
                        className="w-full rounded-xl border px-3 py-2 text-sm"
                        placeholder="Bank account number"
                        value={refundForm.bankAccountNumber}
                        onChange={(e) =>
                          setRefundForm((p) => ({
                            ...p,
                            bankAccountNumber: e.target.value.replace(
                              /\D/g,
                              "",
                            ),
                          }))
                        }
                      />

                      <input
                        className="w-full rounded-xl border px-3 py-2 text-sm"
                        placeholder="Account holder"
                        value={refundForm.bankAccountHolder}
                        onChange={(e) =>
                          setRefundForm((p) => ({
                            ...p,
                            bankAccountHolder: e.target.value,
                          }))
                        }
                      />
                    </>
                  )}

                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      className="rounded-xl border py-2 text-sm font-semibold hover:bg-gray-50"
                      onClick={() => setShowRefundForm(false)}
                      disabled={submittingRefund}
                    >
                      Close
                    </button>

                    <button
                      type="button"
                      className="rounded-xl bg-black text-white py-2 text-sm font-semibold hover:opacity-90 disabled:opacity-60"
                      onClick={submitCancelAndRefund}
                      disabled={
                        submittingRefund ||
                        (refundMode === "MANUAL" && !isManualValid)
                      }
                    >
                      {submittingRefund ? "Submitting..." : "Submit"}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {isRemainingPaid(order) &&
              !["CANCELLED", "CANCELED"].includes(rawStatusToken) && (
                <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-4 text-sm text-emerald-800 flex items-start gap-3">
                  <FiCheckCircle className="mt-0.5" />
                  <div>
                    {String(order?.depositType || "")
                      .trim()
                      .toUpperCase() === "PARTIAL"
                      ? "The remaining payment has been completed successfully."
                      : "This order has been paid successfully."}
                  </div>
                </div>
              )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ShippingProgressPage;
