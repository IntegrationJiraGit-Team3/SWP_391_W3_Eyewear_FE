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
  FiFileText,
  FiCheckCircle,
  FiRefreshCw,
} from "react-icons/fi";
import {
  getOrderDetails,
  cancelOrder,
  updatePaymentMethod,
} from "../services/orderService";
import { getShipmentByOrder } from "../services/shipmentService";
import { createVNPayPayment } from "../services/checkoutService";
import { useToast } from "../../context/ToastContext";

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

function ShippingProgressPage() {
  const { id } = useParams();
  const { showToast } = useToast();

  const [order, setOrder] = useState(null);
  const [shipment, setShipment] = useState(null);
  const [loading, setLoading] = useState(true);

  const normalizePaymentToken = (value) =>
    String(value || "")
      .trim()
      .toUpperCase()
      .replace(/[\s-]+/g, "_");

  const isRemainingPaid = (order) => {
    const remainingStatus = normalizePaymentToken(
      order?.remainingPaymentStatus,
    );
    if (remainingStatus === "PAID") return true;
    if (remainingStatus === "UNPAID") return false;

    const paymentStatus = normalizePaymentToken(order?.paymentStatus);
    if (
      ["PAID", "PAID_FULL", "FULLY_PAID", "PAID_IN_FULL", "SETTLED"].includes(
        paymentStatus,
      )
    ) {
      return true;
    }

    const remainingAmount = Number(
      order?.remainingAmount ??
        Number(order?.finalTotal || 0) - Number(order?.depositAmount || 0),
    );
    return remainingAmount <= 0;
  };

  const getRemainingAmount = (order) => {
    return Number(
      order?.remainingAmount ??
        Number(order?.finalTotal || 0) - Number(order?.depositAmount || 0),
    );
  };

  const loadAll = useCallback(async () => {
    try {
      setLoading(true);
      const orderData = await getOrderDetails(id);
      setOrder(orderData);

      try {
        const shipmentData = await getShipmentByOrder(
          orderData.orderId || orderData.id,
        );
        setShipment(shipmentData);
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
    const interval = setInterval(loadAll, 10000);
    return () => {
      clearTimeout(initialTimer);
      clearInterval(interval);
    };
  }, [loadAll]);

  const steps = useMemo(
    () => [
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
    ],
    [],
  );

  const orderStep = getOrderStep(order?.rawStatus || order?.status);
  const shipmentStep = shipment?.status ? getShipmentStep(shipment.status) : -1;

  // Keep progress consistent across screens by taking the furthest known step.
  // Example: order is SHIPPING but shipment is still PICKUP_PENDING.
  const activeStep = Math.max(orderStep, shipmentStep);
  const remainingAmount = getRemainingAmount(order);
  const isRemainingMethodCOD =
    normalizePaymentToken(order?.paymentMethod) === "COD";
  const isAwaitingManualConfirmation =
    !isRemainingPaid(order) && remainingAmount > 0 && isRemainingMethodCOD;

  const handlePayBalance = async (method) => {
    try {
      const remaining = getRemainingAmount(order);

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
        window.location.href = url;
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
    if (order?.rawStatus !== "Pending") {
      showToast("Only pending orders can be cancelled");
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
                          active
                            ? "bg-black text-white border-black"
                            : "bg-white text-gray-500 border-gray-200"
                        }`}
                      >
                        <div className="w-10 h-10 rounded-full flex items-center justify-center bg-white/10 border border-white/10">
                          {step.icon}
                        </div>
                        <div className="mt-4 font-bold">{step.title}</div>
                        <div
                          className={`text-sm mt-1 ${active ? "text-white/80" : "text-gray-400"}`}
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
                      {shipment.deliveredDate || "Not delivered yet"}
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
                  </div>
                </div>
              </div>

              <div className="border-t mt-5 pt-5 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>
                    {Number(order.subTotal || 0).toLocaleString("vi-VN")} ₫
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Shipping fee</span>
                  <span>
                    {Number(order.shippingFee || 0).toLocaleString("vi-VN")} ₫
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Discount</span>
                  <span>
                    {Number(order.discount || 0).toLocaleString("vi-VN")} ₫
                  </span>
                </div>
                <div className="flex justify-between text-base font-bold pt-2 border-t">
                  <span>Total</span>
                  <span>
                    {Number(order.finalTotal || 0).toLocaleString("vi-VN")} ₫
                  </span>
                </div>
              </div>
            </div>

            {order.depositType === "PARTIAL" &&
              !isRemainingPaid(order) &&
              remainingAmount > 0 &&
              (order.rawStatus === "Processing" ||
                order.rawStatus === "Shipping" ||
                order.rawStatus === "Delivered") && (
                <div className="rounded-3xl border bg-amber-50 border-amber-200 p-6 shadow-sm">
                  <div className="text-lg font-bold text-amber-900">
                    Remaining Payment
                  </div>
                  <div className="mt-2 text-sm text-amber-800">
                    Remaining amount:
                    <span className="font-bold ml-1">
                      {getRemainingAmount(order).toLocaleString("vi-VN")} ₫
                    </span>
                  </div>

                  {isAwaitingManualConfirmation ? (
                    <div className="mt-4 rounded-2xl border border-amber-200 bg-white px-4 py-3 text-sm text-amber-800">
                      COD has been selected for the remaining payment. Waiting
                      for admin confirmation.
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

            {order.rawStatus === "Pending" && (
              <button
                onClick={handleCancelOrder}
                className="w-full rounded-2xl bg-red-600 text-white py-3 font-semibold hover:opacity-90"
              >
                Cancel Order
              </button>
            )}

            {isRemainingPaid(order) && (
              <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-4 text-sm text-emerald-800 flex items-start gap-3">
                <FiCheckCircle className="mt-0.5" />
                <div>This order has been paid successfully.</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ShippingProgressPage;
