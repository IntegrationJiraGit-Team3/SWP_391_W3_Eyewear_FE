import { useEffect, useMemo, useState } from "react";
import {
  FiX,
  FiPackage,
  FiTruck,
  FiCheckCircle,
  FiClock,
  FiXCircle,
  FiUser,
  FiMapPin,
  FiPhone,
  FiCreditCard,
  FiHash,
  FiFileText,
  FiSave,
} from "react-icons/fi";
import {
  createShipment,
  getShipmentByOrder,
  updateShipment,
} from "../services/shipmentService";
import {
  confirmOrderRefunded,
  updatePaymentStatus,
} from "../services/orderService";

const ORDER_STATUS_OPTIONS = [
  { value: "PENDING", label: "Pending" },
  { value: "PROCESSING", label: "Processing" },
  { value: "DELIVERING", label: "Delivering" },
  { value: "DELIVERED", label: "Delivered" },
  { value: "CANCELED", label: "Canceled" },
];

const TERMINAL_STATUS_OPTIONS = [
  { value: "COMPLETED", label: "Completed" },
  { value: "REFUND", label: "Refund" },
  { value: "CANCELED", label: "Canceled" },
];

const ORDER_STATUS_FLOW = [
  "PENDING",
  "PROCESSING",
  "SHIPPED",
  "DELIVERING",
  "DELIVERED",
  "COMPLETED",
];

const SHIPMENT_STATUS_OPTIONS = [
  "CREATED",
  "PICKUP_PENDING",
  "PICKED_UP",
  "IN_TRANSIT",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "FAILED",
  "RETURNING",
  "RETURNED",
];

const normalizeOrderStatus = (status) => {
  const s = String(status || "").toUpperCase();
  if (s === "CANCELLED") return "CANCELED";
  if (s === "SHIPPING" || s === "SHIPPED") return "DELIVERING";
  return s || "PENDING";
};

const badgeClass = (status) => {
  const s = normalizeOrderStatus(status);
  switch (s) {
    case "PENDING":
      return "bg-yellow-50 text-yellow-700 border border-yellow-200";
    case "PROCESSING":
      return "bg-orange-50 text-orange-700 border border-orange-200";
    case "SHIPPED":
    case "DELIVERING":
      return "bg-blue-50 text-blue-700 border border-blue-200";
    case "DELIVERED":
    case "COMPLETED":
      return "bg-green-50 text-green-700 border border-green-200";
    case "REFUND":
    case "REFUNDED":
      return "bg-fuchsia-50 text-fuchsia-700 border border-fuchsia-200";
    case "CANCELED":
      return "bg-red-50 text-red-700 border border-red-200";
    default:
      return "bg-gray-50 text-gray-700 border border-gray-200";
  }
};

const getAvailableOrderStatusOptions = (currentStatus, refundStatus) => {
  const current = normalizeOrderStatus(currentStatus);
  const normalizedRefundStatus = String(refundStatus || "NONE").toUpperCase();
  const canMarkRefund =
    normalizedRefundStatus && normalizedRefundStatus !== "NONE";

  if (current === "CANCELED") {
    return TERMINAL_STATUS_OPTIONS.filter(
      (option) => option.value === "CANCELED",
    );
  }

  if (
    current === "COMPLETED" ||
    current === "REFUND" ||
    current === "REFUNDED"
  ) {
    return TERMINAL_STATUS_OPTIONS.filter((option) => {
      if (option.value === "COMPLETED") return true;
      if (option.value === "REFUND") return canMarkRefund;
      return false;
    });
  }

  const currentIndex = ORDER_STATUS_FLOW.indexOf(current);
  const startIndex = currentIndex === -1 ? 0 : currentIndex;
  const canCancel = ["PENDING", "PROCESSING", "DELIVERING"].includes(current);

  return ORDER_STATUS_OPTIONS.filter((option) => {
    if (option.value === "CANCELED") return canCancel;
    const optionIndex = ORDER_STATUS_FLOW.indexOf(option.value);
    return optionIndex >= startIndex;
  });
};

const getNextOrderStatusFromShipment = (savedShipment, currentOrderStatus) => {
  const current = normalizeOrderStatus(currentOrderStatus);

  if (["CANCELED", "COMPLETED", "REFUND", "REFUNDED"].includes(current)) {
    return null;
  }

  const shipmentStatus = String(savedShipment?.status || "").toUpperCase();

  if (shipmentStatus === "DELIVERED") {
    return current === "DELIVERED" ? null : "DELIVERED";
  }

  return ["DELIVERING", "DELIVERED"].includes(current) ? null : "DELIVERING";
};

const formatCurrency = (value) =>
  `${Number(value || 0).toLocaleString("vi-VN")} \u20AB`;

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
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^tp\s+/, "");

const estimateDeliveredDate = (order, shipment) => {
  if (shipment?.deliveredDate) return shipment.deliveredDate;

  const baseDate = shipment?.shippedDate;
  if (!baseDate) return "-";

  const address = String(order?.address || "");
  const city = address.includes(",") ? address.split(",").at(-1)?.trim() : "";
  const distance = CITY_DISTANCE_MAP[normalizeLocation(city)];
  const transitDays =
    typeof distance === "number" ? (distance < 10 ? 3 : 5) : 3;

  const estimated = new Date(baseDate);
  if (Number.isNaN(estimated.getTime())) return "-";

  estimated.setDate(estimated.getDate() + transitDays);
  return estimated.toISOString().slice(0, 10);
};

function ViewOrderDetailsModal({ order, onClose, onUpdateStatus }) {
  const [shipment, setShipment] = useState(null);
  const [loadingShipment, setLoadingShipment] = useState(false);
  const [shipmentForm, setShipmentForm] = useState({
    carrier: "GHN",
    trackingNumber: "",
    status: "CREATED",
  });
  const [savingShipment, setSavingShipment] = useState(false);
  const [savingPayment, setSavingPayment] = useState(false);
  const [savingRefund, setSavingRefund] = useState(false);
  // const [prescriptionActionMap, setPrescriptionActionMap] = useState({});

  useEffect(() => {
    if (!order?.id) return;

    const loadShipment = async () => {
      try {
        setLoadingShipment(true);
        const data = await getShipmentByOrder(order.id);
        setShipment(data);
        setShipmentForm({
          carrier: data?.carrier || "GHN",
          trackingNumber: data?.trackingNumber || "",
          status: data?.status || "CREATED",
        });
      } catch {
        setShipment(null);
        setShipmentForm({
          carrier: "GHN",
          trackingNumber: "",
          status: "CREATED",
        });
      } finally {
        setLoadingShipment(false);
      }
    };

    loadShipment();
  }, [order?.id]);

  const orderStatus = useMemo(
    () => normalizeOrderStatus(order?.status),
    [order?.status],
  );
  const canConfirmRemainingPayment =
    order.depositType === "PARTIAL" &&
    orderStatus === "COMPLETED" &&
    order.remainingPaymentStage !== "PAID";

  const refundStatus = useMemo(
    () => String(order?.refundStatus || "NONE").toUpperCase(),
    [order?.refundStatus],
  );

  const showRefundInfo = refundStatus && refundStatus !== "NONE";
  const refundPending = refundStatus === "PENDING";
  const refundWaitingChoice = refundStatus === "WAITING_REFUND";

  const availableStatusOptions = useMemo(
    () => getAvailableOrderStatusOptions(orderStatus, refundStatus),
    [orderStatus, refundStatus],
  );

  const hasSavedTrackingNumber =
    Boolean(shipment?.shipmentId) &&
    String(shipment?.trackingNumber || "").trim() !== "";

  const rawOrderStatus = String(order?.status || "")
    .trim()
    .toUpperCase();

  // const canManageShipment = [
  //   "PROCESSING",
  //   "DELIVERING",
  //   "DELIVERED",
  //   "COMPLETED",
  // ].includes(rawOrderStatus);

  const canCreateOrUpdateShipment =
    rawOrderStatus === "PROCESSING" || rawOrderStatus === "DELIVERING";

  const shipmentBlockedMessage =
    rawOrderStatus === "PENDING" || rawOrderStatus === "PREORDER"
      ? "Cannot create shipment until the order is approved and moved to PROCESSING."
      : rawOrderStatus === "CANCELED" || rawOrderStatus === "CANCELLED"
        ? "Cannot manage shipment for a cancelled order."
        : rawOrderStatus === "REFUND" || rawOrderStatus === "REFUNDED"
          ? "Cannot manage shipment for a refunded order."
          : "";

  if (!order) return null;

  const handleSaveShipment = async () => {
    if (!canCreateOrUpdateShipment) {
      alert(
        shipmentBlockedMessage ||
          "Shipment can only be created/updated when order is in PROCESSING or DELIVERING.",
      );
      return;
    }

    try {
      setSavingShipment(true);

      let savedShipment;

      if (shipment?.shipmentId) {
        savedShipment = await updateShipment(shipment.shipmentId, shipmentForm);
      } else {
        savedShipment = await createShipment({
          orderId: order.id,
          carrier: shipmentForm.carrier,
          trackingNumber: shipmentForm.trackingNumber,
          status: shipmentForm.status,
        });
      }

      setShipment(savedShipment);
      setShipmentForm({
        carrier: savedShipment?.carrier || shipmentForm.carrier,
        trackingNumber:
          savedShipment?.trackingNumber || shipmentForm.trackingNumber,
        status: savedShipment?.status || shipmentForm.status,
      });

      const nextOrderStatus = getNextOrderStatusFromShipment(
        savedShipment,
        orderStatus,
      );

      if (nextOrderStatus) {
        await onUpdateStatus?.(nextOrderStatus);
      }
    } catch (err) {
      console.error("Save shipment error:", err);
      alert(err?.response?.data?.message || "Save shipment failed");
    } finally {
      setSavingShipment(false);
    }
  };

  const handleMarkRemainingPaid = async () => {
    if (!order?.id) return;

    if (!(order.depositType === "PARTIAL" && orderStatus === "COMPLETED")) {
      alert(
        "Remaining payment can only be confirmed when the order is COMPLETED.",
      );
      return;
    }
    const confirmed = window.confirm(
      "Mark the remaining payment as paid for this order?",
    );
    if (!confirmed) return;

    try {
      setSavingPayment(true);

      await updatePaymentStatus(order.id, "PAID_FULL");
      alert("Payment marked as completed successfully.");
      onClose?.();
    } catch (error) {
      console.error("Mark remaining payment failed:", error);
      alert(error?.response?.data?.message || "Update payment status failed");
    } finally {
      setSavingPayment(false);
    }
  };

  const handleOrderStatusChange = async (nextStatus) => {
    if (nextStatus === orderStatus) return;

    if (nextStatus === "REFUND" && !showRefundInfo) {
      alert(
        "Refund can only be processed after the customer has requested a refund.",
      );
      return;
    }

    if (nextStatus === "DELIVERING" && !hasSavedTrackingNumber) {
      alert("Please create shipment and tracking number before DELIVERING.");
      return;
    }

    await onUpdateStatus?.(nextStatus);
  };

  const handleConfirmRefunded = async () => {
    if (!order?.id || !refundPending) return;

    const note = window.prompt(
      "Refund note (optional):",
      order?.refundNote || "Refund completed",
    );

    if (note === null) return;

    const confirmed = window.confirm("Mark this order refund as completed?");
    if (!confirmed) return;

    try {
      setSavingRefund(true);
      await confirmOrderRefunded(order.id, { note: String(note || "").trim() });
      alert("Refund marked as completed successfully.");
      onClose?.();
    } catch (error) {
      console.error("Confirm refund failed:", error);
      alert(error?.response?.data?.message || "Confirm refund failed");
    } finally {
      setSavingRefund(false);
    }
  };

  const renderPrescriptionBlock = (item) => {
    const rx = item.prescription || item;
    const hasRx =
      rx &&
      (rx.sphLeft != null ||
        rx.sphRight != null ||
        rx.cylLeft != null ||
        rx.cylRight != null ||
        rx.axisLeft != null ||
        rx.axisRight != null ||
        rx.addLeft != null ||
        rx.addRight != null);

    if (!hasRx) return null;

    // const prescriptionId = item.prescription?.prescriptionId;
    // const localPrescriptionState = prescriptionId
    //   ? prescriptionActionMap[prescriptionId]
    //   : null;

    // const backendStatusRaw =
    //   item.prescription?.status || item.prescription?.reviewStatus;

    // const normalizedBackendStatus = String(backendStatusRaw || "")
    //   .toUpperCase()
    //   .trim();

    // let effectivePrescriptionStatus = null;

    // // if (localPrescriptionState) {
    //   // effectivePrescriptionStatus = localPrescriptionState;
    // } else if (
    //   backendStatusRaw === true ||
    //   normalizedBackendStatus === "APPROVED"
    // ) {
    //   // effectivePrescriptionStatus = "APPROVED";
    // } else if (
    //   backendStatusRaw === false ||
    //   normalizedBackendStatus === "REJECTED"
    // ) {
    //   // effectivePrescriptionStatus = "REJECTED";
    // }

    // const isActionFinalized =
    //   effectivePrescriptionStatus === "APPROVED" ||
    //   effectivePrescriptionStatus === "REJECTED";

    // const handlePrescriptionDecision = async (approve) => {
    //   if (!prescriptionId) return;

    //   const rejectionNote = approve
    //     ? ""
    //     : window.prompt("Rejection note:", "Invalid prescription");

    //   if (!approve && rejectionNote === null) return;

    //   const ok = await onPrescriptionAction?.(
    //     prescriptionId,
    //     approve,
    //     rejectionNote || "",
    //   );

    //   if (ok !== false) {
    //     setPrescriptionActionMap((prev) => ({
    //       ...prev,
    //       [prescriptionId]: approve ? "APPROVED" : "REJECTED",
    //     }));
    //   }
    // };

    return (
      <div className="mt-3 rounded-xl border border-indigo-100 bg-indigo-50/60 p-3">
        <div className="text-xs font-semibold text-indigo-700 mb-2 flex items-center gap-2">
          <FiFileText size={14} />
          Prescription
        </div>

        <div className="grid grid-cols-5 gap-2 text-[11px]">
          <div className="font-semibold text-gray-500">Eye</div>
          <div className="font-semibold text-gray-500">SPH</div>
          <div className="font-semibold text-gray-500">CYL</div>
          <div className="font-semibold text-gray-500">AXIS</div>
          <div className="font-semibold text-gray-500">ADD</div>

          <div className="font-medium">Right</div>
          <div>{rx.sphRight ?? "â€”"}</div>
          <div>{rx.cylRight ?? "â€”"}</div>
          <div>{rx.axisRight ?? "â€”"}</div>
          <div>{rx.addRight ?? "â€”"}</div>

          <div className="font-medium">Left</div>
          <div>{rx.sphLeft ?? "â€”"}</div>
          <div>{rx.cylLeft ?? "â€”"}</div>
          <div>{rx.axisLeft ?? "â€”"}</div>
          <div>{rx.addLeft ?? "â€”"}</div>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-100 bg-black/45 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl rounded-3xl bg-white shadow-2xl overflow-hidden max-h-[95vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-5 border-b bg-white sticky top-0 z-10">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Order Details</h2>
            <p className="text-sm text-gray-500 mt-1">{order.code}</p>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full hover:bg-gray-100 flex items-center justify-center"
          >
            <FiX size={20} />
          </button>
        </div>

        <div className="overflow-y-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="rounded-2xl border p-4 bg-gray-50">
                <div className="text-xs text-gray-500 mb-1 flex items-center gap-2">
                  <FiHash size={14} />
                  Order status
                </div>
                <div
                  className={`inline-flex px-3 py-1 rounded-full text-sm font-semibold ${badgeClass(orderStatus)}`}
                >
                  {orderStatus}
                </div>
              </div>

              <div className="rounded-2xl border p-4 bg-gray-50">
                <div className="text-xs text-gray-500 mb-1 flex items-center gap-2">
                  <FiCreditCard size={14} />
                  Payment
                </div>
                <div className="text-sm font-semibold text-gray-800">
                  {order.paymentStatus || "UNPAID"}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {order.paymentMethod || "N/A"}
                </div>

                {order.depositType === "PARTIAL" && (
                  <>
                    <div
                      className={`inline-flex mt-2 px-2 py-0.5 rounded-full border text-[11px] font-semibold ${
                        order.remainingPaymentStage === "PAID"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : order.remainingPaymentStage ===
                              "PENDING_CONFIRMATION"
                            ? "bg-blue-50 text-blue-700 border-blue-200"
                            : "bg-amber-50 text-amber-700 border-amber-200"
                      }`}
                    >
                      Remaining payment:{" "}
                      {order.remainingPaymentStage === "PENDING_CONFIRMATION"
                        ? "WAITING_CONFIRM"
                        : order.remainingPaymentStatus || "UNPAID"}
                    </div>

                    {order.remainingPaymentStage === "PENDING_CONFIRMATION" && (
                      <div className="mt-2 text-xs text-blue-700">
                        Customer selected COD for remaining payment. Please
                        confirm collection when received.
                      </div>
                    )}

                    {canConfirmRemainingPayment && (
                      <button
                        onClick={handleMarkRemainingPaid}
                        disabled={savingPayment}
                        className="mt-2 inline-flex items-center justify-center px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-60"
                      >
                        {savingPayment
                          ? "Saving..."
                          : order.remainingPaymentStage ===
                              "PENDING_CONFIRMATION"
                            ? "Confirm Collected"
                            : "Mark as Paid"}
                      </button>
                    )}
                  </>
                )}
              </div>

              <div className="rounded-2xl border p-4 bg-gray-50">
                <div className="text-xs text-gray-500 mb-1 flex items-center gap-2">
                  <FiPackage size={14} />
                  Total
                </div>
                <div className="text-lg font-bold text-gray-900">
                  {formatCurrency(order.total)}
                </div>
                {order.depositType === "PARTIAL" && (
                  <div className="text-xs text-amber-600 mt-1">
                    Deposit: {formatCurrency(order.depositAmount)}
                  </div>
                )}
              </div>
            </div>

            {showRefundInfo && (
              <div className="rounded-2xl border p-5 bg-gray-50">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-base font-bold text-gray-900">
                      Refund Information
                    </h3>
                    <div className="text-xs text-gray-500 mt-1">
                      {refundWaitingChoice
                        ? "Cancelled & paid. Waiting for customer refund choice."
                        : "For cancelled orders paid online."}
                    </div>
                  </div>
                  <span
                    className={`inline-flex px-3 py-1 rounded-full border text-xs font-semibold ${
                      refundStatus === "REFUNDED"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : "bg-blue-50 text-blue-700 border-blue-200"
                    }`}
                  >
                    {refundStatus}
                  </span>
                </div>

                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <div className="rounded-xl border bg-white p-3">
                    <div className="text-xs font-semibold text-gray-500">
                      Requested At
                    </div>
                    <div className="font-semibold text-gray-800">
                      {order?.refundRequestedAt
                        ? new Date(order.refundRequestedAt).toLocaleString(
                            "vi-VN",
                          )
                        : "-"}
                    </div>
                  </div>

                  <div className="rounded-xl border bg-white p-3">
                    <div className="text-xs font-semibold text-gray-500">
                      Processed At
                    </div>
                    <div className="font-semibold text-gray-800">
                      {order?.refundProcessedAt
                        ? new Date(order.refundProcessedAt).toLocaleString(
                            "vi-VN",
                          )
                        : "-"}
                    </div>
                  </div>

                  <div className="rounded-xl border bg-white p-3">
                    <div className="text-xs font-semibold text-gray-500">
                      Bank
                    </div>
                    <div className="font-semibold text-gray-800">
                      {order?.refundBankName || "-"}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {order?.refundBankAccountNumber || "-"}
                    </div>
                  </div>

                  <div className="rounded-xl border bg-white p-3">
                    <div className="text-xs font-semibold text-gray-500">
                      Account Holder
                    </div>
                    <div className="font-semibold text-gray-800">
                      {order?.refundBankAccountHolder || "-"}
                    </div>
                  </div>
                </div>

                {order?.refundNote && (
                  <div className="mt-3 text-sm text-gray-700">
                    <span className="font-semibold">Note:</span>{" "}
                    {order.refundNote}
                  </div>
                )}

                {refundPending && (
                  <button
                    onClick={handleConfirmRefunded}
                    disabled={savingRefund}
                    className="mt-4 inline-flex items-center justify-center rounded-xl bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-gray-900 disabled:opacity-60"
                  >
                    {savingRefund ? "Saving..." : "Mark Refunded"}
                  </button>
                )}
              </div>
            )}

            <div className="rounded-2xl border p-5">
              <h3 className="text-base font-bold text-gray-900 mb-4">
                Customer Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="flex items-start gap-3">
                  <FiUser className="mt-0.5 text-gray-400" />
                  <div>
                    <div className="font-semibold text-gray-800">
                      {order.customer || order.fullName}
                    </div>
                    <div className="text-gray-500">
                      {order.email || "No email"}
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <FiPhone className="mt-0.5 text-gray-400" />
                  <div className="text-gray-700">
                    {order.phone || "No phone"}
                  </div>
                </div>

                <div className="flex items-start gap-3 md:col-span-2">
                  <FiMapPin className="mt-0.5 text-gray-400" />
                  <div className="text-gray-700">
                    {order.address || "No address"}
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border p-5">
              <h3 className="text-base font-bold text-gray-900 mb-4">
                Order Items
              </h3>

              <div className="space-y-4">
                {(order.orderItems || []).map((item, index) => (
                  <div
                    key={item.orderItemId || index}
                    className="rounded-2xl border p-4"
                  >
                    <div className="flex gap-4">
                      <img
                        src={
                          item.imageUrl ||
                          item.image ||
                          "https://placehold.co/100"
                        }
                        alt={item.productName || item.name}
                        className="w-20 h-20 rounded-xl border object-cover"
                      />
                      <div className="flex-1">
                        <div className="font-semibold text-gray-900">
                          {item.productName || item.name}
                        </div>
                        <div className="text-sm text-gray-500 mt-1">
                          Qty: {item.quantity || 1}
                        </div>
                        <div className="text-sm text-gray-500">
                          Unit Price: {formatCurrency(item.unitPrice)}
                        </div>
                        {item.lensType && (
                          <div className="text-sm text-indigo-600 mt-1">
                            Lens: {item.lensType}
                          </div>
                        )}
                        {item.isPreorder && (
                          <div className="inline-flex mt-2 px-2 py-1 rounded-lg bg-amber-50 text-amber-700 text-xs font-semibold border border-amber-200">
                            Pre-order
                          </div>
                        )}
                      </div>
                    </div>

                    {renderPrescriptionBlock(item)}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="lg:col-span-4 space-y-6">
            <div className="rounded-2xl border p-5">
              <h3 className="text-base font-bold text-gray-900 mb-4">
                Update Order Status
              </h3>

              <div className="grid grid-cols-2 gap-2">
                {availableStatusOptions.map((option) => {
                  const blockedByTracking =
                    option.value === "DELIVERING" && !hasSavedTrackingNumber;
                  const isCurrent = option.value === orderStatus;

                  return (
                    <button
                      key={option.value}
                      disabled={isCurrent || blockedByTracking}
                      onClick={() => handleOrderStatusChange(option.value)}
                      className={`rounded-xl px-3 py-2 text-sm font-semibold border transition ${
                        isCurrent
                          ? "bg-black text-white border-black"
                          : blockedByTracking
                            ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
                            : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
                      } ${isCurrent ? "cursor-default" : ""}`}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>

              {!hasSavedTrackingNumber &&
                availableStatusOptions.some(
                  (option) => option.value === "DELIVERING",
                ) && (
                  <div className="mt-3 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-700">
                    Create shipment with tracking number before moving to
                    DELIVERING.
                  </div>
                )}
            </div>

            <div className="rounded-2xl border p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold text-gray-900">Shipment</h3>
                {loadingShipment && (
                  <span className="text-xs text-gray-400">Loading...</span>
                )}
              </div>

              {!canCreateOrUpdateShipment && shipmentBlockedMessage && (
                <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                  {shipmentBlockedMessage}
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-2">
                    Carrier
                  </label>
                  <input
                    value={shipmentForm.carrier}
                    onChange={(e) =>
                      setShipmentForm((prev) => ({
                        ...prev,
                        carrier: e.target.value,
                      }))
                    }
                    disabled={!canCreateOrUpdateShipment}
                    className="w-full rounded-xl border px-4 py-3 text-sm disabled:bg-gray-100 disabled:text-gray-400"
                    placeholder="GHN / GHTK / Viettel Post"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-2">
                    Tracking Number
                  </label>
                  <input
                    value={shipmentForm.trackingNumber}
                    onChange={(e) =>
                      setShipmentForm((prev) => ({
                        ...prev,
                        trackingNumber: e.target.value,
                      }))
                    }
                    disabled={!canCreateOrUpdateShipment}
                    className="w-full rounded-xl border px-4 py-3 text-sm disabled:bg-gray-100 disabled:text-gray-400"
                    placeholder="Tracking number"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-2">
                    Shipment Status
                  </label>
                  <select
                    value={shipmentForm.status}
                    onChange={(e) =>
                      setShipmentForm((prev) => ({
                        ...prev,
                        status: e.target.value,
                      }))
                    }
                    disabled={!canCreateOrUpdateShipment}
                    className="w-full rounded-xl border px-4 py-3 text-sm disabled:bg-gray-100 disabled:text-gray-400"
                  >
                    {SHIPMENT_STATUS_OPTIONS.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  onClick={handleSaveShipment}
                  disabled={savingShipment || !canCreateOrUpdateShipment}
                  className="w-full rounded-xl bg-blue-600 text-white py-3 font-semibold hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <FiSave size={16} />
                  {savingShipment
                    ? "Saving..."
                    : shipment?.shipmentId
                      ? "Update Shipment"
                      : "Create Shipment"}
                </button>

                {shipment && (
                  <div className="rounded-xl bg-gray-50 border p-4 text-sm">
                    <div className="font-semibold text-gray-800 mb-2">
                      Current Shipment
                    </div>
                    <div className="text-gray-600">
                      Carrier: {shipment.carrier || "-"}
                    </div>
                    <div className="text-gray-600">
                      Tracking: {shipment.trackingNumber || "-"}
                    </div>
                    <div className="text-gray-600">
                      Status: {shipment.status || "-"}
                    </div>
                    <div className="text-gray-600">
                      Shipped Date: {shipment.shippedDate || "-"}
                    </div>
                    <div className="text-gray-600">
                      Delivered Date: {estimateDeliveredDate(order, shipment)}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-2xl border p-5 bg-gray-50">
              <h3 className="text-base font-bold text-gray-900 mb-3">Notes</h3>
              <p className="text-sm text-gray-600">
                Khi cập nhật shipment status thành <b>DELIVERED</b>, backend sẽ
                tự chuyển order sang <b>DELIVERED</b> và nếu là COD thì tự set
                payment status thành <b>PAID</b>.
              </p>
              <p className="text-sm text-gray-600 mt-2">
                Shipment chỉ được tạo khi order đã vào <b>PROCESSING</b>.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ViewOrderDetailsModal;
