import {
  FiX,
  FiCheckCircle,
  FiClock,
  FiXCircle,
  FiPackage,
  FiUser,
  FiHash,
  FiCalendar,
  FiTruck,
  FiAlertCircle,
  FiFileText,
} from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

const STATUS_CONFIG = {
  pending: {
    label: "Pending",
    icon: <FiClock size={13} />,
    badge: "bg-yellow-50 text-yellow-700 border border-yellow-200",
    dot: "bg-yellow-400",
  },
  processing: {
    label: "Packaging",
    icon: <FiPackage size={13} />,
    badge: "bg-orange-50 text-orange-700 border border-orange-200",
    dot: "bg-orange-400",
  },
  shipped: {
    label: "Shipping",
    icon: <FiTruck size={13} />,
    badge: "bg-blue-50 text-blue-700 border border-blue-200",
    dot: "bg-blue-400",
  },
  delivering: {
    label: "Delivering",
    icon: <FiTruck size={13} />,
    badge: "bg-blue-50 text-blue-700 border border-blue-200",
    dot: "bg-blue-400",
  },
  completed: {
    label: "Completed",
    icon: <FiCheckCircle size={13} />,
    badge: "bg-green-50 text-green-700 border border-green-200",
    dot: "bg-green-500",
  },
  cancelled: {
    label: "Cancelled",
    icon: <FiXCircle size={13} />,
    badge: "bg-red-50 text-red-700 border border-red-200",
    dot: "bg-red-400",
  },
};

// Định nghĩa các bước của đơn hàng
const ORDER_STEPS = [
  {
    key: "pending",
    label: "Pending",
    icon: FiClock,
    description: "Order received",
  },
  {
    key: "processing",
    label: "Processing",
    icon: FiPackage,
    description: "Packaging items",
  },
  {
    key: "shipped",
    label: "Shipping",
    icon: FiTruck,
    description: "On the way",
  },
  {
    key: "completed",
    label: "Delivered",
    icon: FiCheckCircle,
    description: "Order completed",
  },
];

function OrderProgressStepper({ currentStatus }) {
  const statusLower = (currentStatus || "pending")
    .toString()
    .toLowerCase()
    .trim();
  const normalizedStatus = statusLower === "delivering" ? "shipped" : statusLower;
  const isCancelled = statusLower === "cancelled";
  const currentStepIndex = ORDER_STEPS.findIndex(
    (step) => step.key === normalizedStatus,
  );

  if (isCancelled) {
    return (
      <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
        <div className="flex items-center gap-2 text-red-700">
          <FiXCircle size={18} />
          <span className="font-semibold text-sm">Order Cancelled</span>
        </div>
        <p className="text-xs text-red-600 mt-1 ml-6">
          This order has been cancelled
        </p>
      </div>
    );
  }

  // Timestamps giả — bạn có thể truyền từ order data thực

  return (
    <div className="w-full mb-6 pb-8 pt-2">
      <div className="relative flex justify-between items-center px-6">
        {/* Connector lines */}
        <div className="absolute left-10 right-10 top-1/2 -translate-y-1/2 h-[3px] bg-gray-100 rounded-full">
          <div
            className="absolute left-0 top-0 h-full bg-green-400 rounded-full transition-all duration-500 ease-in-out"
            style={{
              width: `${(Math.max(0, currentStepIndex) / (ORDER_STEPS.length - 1)) * 100}%`,
            }}
          />
        </div>

        {ORDER_STEPS.map((step, index) => {
          const isCompleted = index < currentStepIndex;
          const isCurrent = index === currentStepIndex;
          const StepIcon = step.icon;

          return (
            <div
              key={step.key}
              className="relative z-10 flex flex-col items-center"
            >
              {/* Icon dot */}
              <div
                className={`
                  w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors
                  ${isCompleted
                    ? "bg-green-500 border-green-500 text-white"
                    : isCurrent
                      ? "bg-blue-50 border-blue-500 text-blue-600"
                      : "bg-white border-gray-200 text-gray-400"
                  }
                `}
              >
                {isCompleted ? (
                  <FiCheckCircle size={16} />
                ) : (
                  <StepIcon size={14} />
                )}
              </div>

              {/* Text underneath */}
              <div className="absolute top-10 w-28 text-center flex flex-col items-center">
                <span
                  className={`text-[13px] font-semibold ${isCompleted
                    ? "text-gray-800"
                    : isCurrent
                      ? "text-blue-600"
                      : "text-gray-400"
                    }`}
                >
                  {step.label}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ViewOrderDetailsModal({ order, onClose, onUpdateStatus }) {
  const navigate = useNavigate();



  if (!order) return null;

  // Tính toán lại subtotal từ items nếu cần
  const calculatedSubtotal =
    order.orderItems?.reduce((sum, item) => {
      return sum + (item.unitPrice || 0) * (item.quantity || 1);
    }, 0) || 0;

  const currentStatus = (order.status || "pending")
    .toString()
    .toLowerCase()
    .trim();
  const normalizedStatus = (currentStatus === "delivering" || currentStatus === "shipped") ? "shipped" 
                         : (currentStatus === "preorder" || currentStatus === "pending") ? "pending"
                         : currentStatus;
  const status = STATUS_CONFIG[normalizedStatus] || STATUS_CONFIG.pending;

  // Kiểm tra đơn hàng có prescription không (Broad + Deep scan)
  const isPrescriptionOrder =
    order.hasPrescription ||
    order.orderItems?.some((item) => {
      // 1. Dựa trên flag hoặc type
      if (
        item.itemType === "PRESCRIPTION" ||
        item.fulfillmentType === "PRESCRIPTION" ||
        item.isLens === true
      )
        return true;
      // 2. Dựa trên sự tồn tại của object prescription
      if (item.prescription != null) return true;
      // 3. Dựa trên thông số mắt nhập tay (OD/OS) hoặc Lens Option (Tròng kính luôn cần đơn)
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

  // Lọc ra các item có prescription data
  const prescriptionItems =
    order.orderItems?.filter(
      (item) =>
        item.itemType === "PRESCRIPTION" ||
        item.prescription != null ||
        item.fulfillmentType === "PRESCRIPTION",
    ) || [];

  const allPrescriptionsApproved =
    prescriptionItems.length === 0 ||
    prescriptionItems.every((item) => item.prescription?.status === true);

  // Nếu là đơn prescription + đang pending + chưa được duyệt toàn bộ → chặn chỉnh sửa status
  const isPrescriptionBlocked =
    isPrescriptionOrder &&
    !allPrescriptionsApproved &&
    currentStatus === "pending";

  // Kiểm tra đơn hàng có sản phẩm Pre-order không
  const isPreOrderOrder = order.orderItems?.some((item) => {
    return (
      item.isPreorder === true ||
      item.type === "PRE_ORDER" ||
      item.fulfillmentType === "PRE_ORDER" ||
      item.isPreOrder === true
    );
  });

  // Chặn xử lý đơn hàng Pre-order tại trang Order thông thường
  const isPreOrderBlocked = isPreOrderOrder && (currentStatus === "pending" || currentStatus === "preorder");

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15 }}
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 8 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white w-full max-w-4xl rounded-2xl shadow-xl max-h-[92vh] flex flex-col"
        >
          {/* ── Header ── */}
          <div className="flex items-start justify-between px-6 py-4 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
                <FiPackage size={17} className="text-blue-600" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="font-semibold text-gray-800 leading-tight">
                    Order Details
                  </h2>
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${status.badge}`}
                  >
                    {status.icon} {status.label}
                  </span>
                  {isPrescriptionOrder && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-200">
                      <FiFileText size={11} /> Prescription
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 mt-1">
                  <span className="flex items-center gap-1 text-xs text-gray-400">
                    <FiHash size={11} /> {order.orderCode || order.code}
                  </span>
                  <span className="flex items-center gap-1 text-xs text-gray-400">
                    <FiCalendar size={11} />{" "}
                    {new Date(
                      order.orderDate || order.createdAt,
                    ).toLocaleString("vi-VN")}
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600 transition-colors"
            >
              <FiX size={18} />
            </button>
          </div>

          {/* ── Body ── */}
          <div className="flex-1 overflow-y-auto">
            {/* Progress Stepper - Hiển thị full width */}
            <div className="px-6 pt-6 pb-2 bg-gradient-to-b from-gray-50/50 to-transparent">
              <OrderProgressStepper currentStatus={currentStatus} />
            </div>

            <div className="grid grid-cols-5 divide-x divide-gray-100 min-h-0">
              {/* Left — items */}
              <div className="col-span-3 px-6 py-5">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-1.5">
                  <FiPackage size={12} /> Products (
                  {order.orderItems?.length || 0})
                </p>

                <div className="space-y-4">
                  {order.orderItems?.map((item, i) => {
                    const itemName =
                      item.productName ||
                      item.product?.name ||
                      "Unnamed product";
                    const itemImage =
                      item.imageUrl ||
                      item.product?.imageUrl ||
                      `https://placehold.co/100x100?text=${itemName}`;
                    const itemColor = item.variantColor || item.variant?.color;
                    const itemSize =
                      item.variantSize || item.variant?.frameSize;
                    const itemPrice = item.unitPrice || 0;
                    const isLensItem =
                      item.itemType === "PRESCRIPTION" ||
                      item.prescription != null;

                    return (
                      <div
                        key={i}
                        className="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 transition-colors"
                      >
                        <img
                          src={itemImage}
                          alt={itemName}
                          className="w-14 h-14 rounded-xl object-cover border border-gray-100 flex-shrink-0"
                          loading="lazy"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-800 text-sm truncate">
                            {itemName}
                          </p>
                          <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-2 flex-wrap">
                            {itemColor && <span>Color: {itemColor}</span>}
                            {itemSize && <span>Size: {itemSize}</span>}
                            {(item.isPreorder || item.type === "PRE_ORDER") && (
                              <span className="text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-md font-bold text-[9px]">
                                PRE-ORDER
                              </span>
                            )}
                            {isLensItem && (
                              <span className="text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded-md font-bold text-[9px]">
                                HAS PRESCRIPTION
                              </span>
                            )}
                          </p>

                          <div className="flex items-center gap-2 mt-1.5">
                            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-medium">
                              x{item.quantity}
                            </span>
                            <span className="text-xs text-gray-400">
                              {itemPrice.toLocaleString("vi-VN")} ₫ / sp
                            </span>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="font-semibold text-gray-800 text-sm">
                            {(itemPrice * (item.quantity || 1)).toLocaleString(
                              "vi-VN",
                            )}{" "}
                            ₫
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Hiển thị thông tin toa thuốc cho từng item có prescription */}
                {prescriptionItems.length > 0 && (
                  <div className="mt-6 pt-4 border-t border-gray-100">
                    <p className="text-xs font-semibold text-indigo-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                      <FiFileText size={12} /> Prescription Information
                    </p>
                    {prescriptionItems.map((item, idx) => {
                      const rx = item.prescription || {};
                      return (
                        <div
                          key={idx}
                          className="bg-indigo-50/50 rounded-xl p-4 mb-3 border border-indigo-100"
                        >
                          <p className="text-xs font-medium text-indigo-700 mb-2">
                            {item.productName || `Product ${idx + 1}`}
                          </p>
                          <div className="grid grid-cols-5 gap-1 text-[10px] font-semibold text-gray-400 uppercase text-center mb-1">
                            <div className="text-left">Eye</div>
                            <div>SPH</div>
                            <div>CYL</div>
                            <div>AXIS</div>
                            <div>ADD</div>
                          </div>
                          <div className="grid grid-cols-5 gap-1 text-xs text-center font-mono text-gray-700 mb-1">
                            <div className="text-left font-semibold text-gray-500">
                              Right (OD)
                            </div>
                            <div>{rx.sphRight ?? "—"}</div>
                            <div>{rx.cylRight ?? "—"}</div>
                            <div>
                              {rx.axisRight != null ? `${rx.axisRight}°` : "—"}
                            </div>
                            <div>{rx.addRight ?? "—"}</div>
                          </div>
                          <div className="grid grid-cols-5 gap-1 text-xs text-center font-mono text-gray-700">
                            <div className="text-left font-semibold text-gray-500">
                              Left (OS)
                            </div>
                            <div>{rx.sphLeft ?? "—"}</div>
                            <div>{rx.cylLeft ?? "—"}</div>
                            <div>
                              {rx.axisLeft != null ? `${rx.axisLeft}°` : "—"}
                            </div>
                            <div>{rx.addLeft ?? "—"}</div>
                          </div>
                          {rx.pd && (
                            <div className="mt-2 text-xs text-gray-500">
                              PD:{" "}
                              <span className="font-semibold text-gray-700 font-mono">
                                {rx.pd} mm
                              </span>
                            </div>
                          )}

                          {/* Hướng dẫn Duyệt đơn thuốc (Không xử lý trực tiếp) */}
                          {currentStatus === "pending" &&
                            rx.status !== true && (
                              <div className="mt-4 pt-4 border-t border-indigo-100/50">
                                <div className="flex items-start gap-2 p-3 bg-indigo-50/80 border border-indigo-100 rounded-xl">
                                  <FiAlertCircle
                                    size={14}
                                    className="text-indigo-500 mt-0.5 flex-shrink-0"
                                  />
                                  <div>
                                    <p className="text-xs font-semibold text-indigo-700 mb-1">
                                      Prescription approval required
                                    </p>
                                    <p className="text-[10px] text-indigo-600 leading-relaxed mb-2">
                                      Approving/declining prescriptions is now
                                      managed on a dedicated page.
                                    </p>
                                    <button
                                      onClick={() => {
                                        onClose();
                                        navigate("/dashboard/prescriptions");
                                      }}
                                      className="text-[10px] font-bold text-indigo-700 underline flex items-center gap-1 hover:text-indigo-800 transition-colors"
                                    >
                                      Go to Prescription Management
                                    </button>
                                  </div>
                                </div>
                              </div>
                            )}

                          {rx.status === true && (
                            <div className="mt-2 flex items-center gap-1.5 text-emerald-600">
                              <FiCheckCircle size={12} />
                              <span className="text-[10px] font-bold uppercase">
                                Prescription Approved
                              </span>
                            </div>
                          )}
                          {rx.adminNote && (
                            <div className="mt-2 text-[11px] text-gray-500 italic bg-white/50 p-2 rounded-lg border border-gray-100">
                              Note: {rx.adminNote}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Right — summary */}
              <div className="col-span-2 px-6 py-5 flex flex-col gap-6">
                {/* Customer */}
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <FiUser size={12} /> Customer
                  </p>
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                    <img
                      src={`https://ui-avatars.com/api/?name=${order.userName || order.customer || order.userEmail || "Guest"}&background=1c1917&color=fff&bold=true`}
                      alt={order.userName}
                      className="w-10 h-10 rounded-full object-cover border border-gray-200 flex-shrink-0"
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">
                        {order.userName || order.customer || "Guest Customer"}
                      </p>
                      <p className="text-xs text-gray-400 truncate">
                        {order.userEmail || order.email || "N/A"}
                      </p>
                    </div>
                  </div>
                  {order.phone && (
                    <p className="text-xs text-gray-500 mt-2">
                      Phone: {order.phone}
                    </p>
                  )}
                  {order.address && (
                    <p className="text-xs text-gray-500 mt-1">
                      Address: {order.address}
                    </p>
                  )}
                </div>

                {/* Payment */}
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <FiTruck size={12} /> Payment
                  </p>
                  <div className="bg-gray-50 rounded-xl p-4 space-y-2.5 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Subtotal</span>
                      <span className="text-gray-700 font-medium">
                        {(
                          order.totalPrice || calculatedSubtotal
                        ).toLocaleString("vi-VN")}{" "}
                        ₫
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Shipping Fee</span>
                      <span className="text-green-600 font-medium">
                        {order.shippingFee > 0
                          ? `${order.shippingFee.toLocaleString("vi-VN")} ₫`
                          : "Free"}
                      </span>
                    </div>
                    {order.voucherDiscount > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Discount</span>
                        <span className="text-red-500 font-medium">
                          -{order.voucherDiscount.toLocaleString("vi-VN")} ₫
                        </span>
                      </div>
                    )}
                    <div className="border-t border-gray-200 pt-2.5 flex justify-between">
                      <span className="font-semibold text-gray-700">Total</span>
                      <span className="font-bold text-blue-600 text-base">
                        {(
                          order.finalPrice ||
                          order.totalPrice ||
                          calculatedSubtotal
                        ).toLocaleString("vi-VN")}{" "}
                        ₫
                      </span>
                    </div>

                    {/* Pre-order Payment Info */}
                    {order.depositType === "PARTIAL" && currentStatus !== "completed" && currentStatus !== "delivered" && (
                      <div className="mt-3 pt-3 border-t border-gray-100 flex flex-col gap-2">
                        <div className="flex justify-between text-[11px]">
                          <span className="text-stone-400">Deposit Paid ({order.depositPaymentMethod || order.paymentMethod})</span>
                          <span className="font-bold text-stone-600">
                            {order.depositAmount?.toLocaleString("vi-VN")} ₫
                          </span>
                        </div>
                        <div className="flex justify-between items-center py-2 px-3 bg-white rounded-lg border border-blue-100">
                          <span className="text-xs font-bold text-blue-700">Remaining Balance</span>
                          <div className="flex flex-col items-end">
                            <span className="font-extrabold text-blue-600">
                              {order.paymentStatus === "PAID_FULL" || (order.remainingPaymentStatus === "PAID") ? "0" : (order.finalPrice - order.depositAmount).toLocaleString("vi-VN")} ₫
                            </span>
                            {order.paymentStatus === "PAID_FULL" || order.remainingPaymentStatus === "PAID" ? (
                              <span className="text-[10px] text-emerald-600 font-bold uppercase">Settled</span>
                            ) : order.paymentMethod === "COD" || (order.stockReadyAt && (new Date() - new Date(order.stockReadyAt)) / (1000 * 60 * 60) > 12) ? (
                              <span className="text-[10px] text-green-600 font-bold uppercase">COD (Collect on Delivery)</span>
                            ) : (
                              <span className="text-[10px] text-amber-600 font-bold uppercase animate-pulse">Waiting for customer ({Math.max(0, 12 - Math.floor((new Date() - new Date(order.stockReadyAt)) / (1000 * 60 * 60)))}h left)</span>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Status + Actions */}
                <div className="p-3 rounded-xl border border-gray-200 bg-gray-50 flex flex-col gap-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-2.5 h-2.5 rounded-full ${status.dot}`} />
                    <span className="text-sm font-medium text-gray-700">
                      Status: {status.label}
                    </span>
                  </div>

                  {/* 1. Nếu là đơn PRESCRIPTION + PENDING + CHƯA DUYỆT XONG → chặn */}
                  {isPrescriptionBlocked ? (
                    <div className="pt-2 border-t border-gray-200">
                      <div className="flex items-start gap-2 p-3 bg-indigo-50 border border-indigo-200 rounded-xl mb-3">
                        <FiAlertCircle
                          size={15}
                          className="text-indigo-500 mt-0.5 flex-shrink-0"
                        />
                        <div>
                          <p className="text-xs font-semibold text-indigo-700 mb-1">
                            Prescriptions not approved
                          </p>
                          <p className="text-xs text-indigo-600 leading-relaxed mb-2">
                            Needs approval for <strong>all</strong>{" "}
                            prescriptions on the left before confirming this
                            order.
                          </p>
                          <button
                            onClick={() => {
                              onClose();
                              navigate("/dashboard/prescriptions");
                            }}
                            className="text-xs font-bold text-indigo-700 underline flex items-center gap-1 hover:text-indigo-800 transition-colors"
                          >
                            Go to Prescription Management
                          </button>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          if (
                            window.confirm(
                              "Are you sure you want to cancel this order?",
                            )
                          ) {
                            onUpdateStatus("cancelled");
                          }
                        }}
                        className="w-full px-3 bg-white border border-red-200 text-red-600 hover:bg-red-50 text-xs font-semibold py-2 rounded-lg transition-colors"
                      >
                        Cancel Order
                      </button>
                    </div>
                  ) : isPreOrderBlocked ? (
                    /* 2. Nếu là đơn PRE-ORDER + PENDING → chặn xử lý tại đây, hướng dẫn qua trang Pre-order */
                    <div className="pt-2 border-t border-gray-200">
                      <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl mb-3">
                        <FiClock
                          size={15}
                          className="text-amber-500 mt-0.5 flex-shrink-0"
                        />
                        <div>
                          <p className="text-xs font-semibold text-amber-700 mb-1">
                            Order contains Pre-order products
                          </p>
                          <p className="text-xs text-amber-600 leading-relaxed mb-2">
                            Please manage and process this order on the{" "}
                            <strong>Pre-order Management</strong> page.
                          </p>
                          <button
                            onClick={() => {
                              onClose();
                              navigate("/dashboard/preoders");
                            }}
                            className="text-xs font-bold text-amber-700 underline flex items-center gap-1 hover:text-amber-800 transition-colors"
                          >
                            Go to Pre-order Management
                          </button>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          if (
                            window.confirm(
                              "Are you sure you want to cancel this pre-order?",
                            )
                          ) {
                            onUpdateStatus("cancelled");
                          }
                        }}
                        className="w-full px-3 bg-white border border-red-200 text-red-600 hover:bg-red-50 text-xs font-semibold py-2 rounded-lg transition-colors"
                      >
                        Cancel Order
                      </button>
                    </div>
                  ) : (
                    /* 3. Actions bình thường cho các trường hợp còn lại */
                    <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-200">
                       {currentStatus === "pending" && (
                         <button
                           onClick={() => onUpdateStatus("processing")}
                           className="flex-1 bg-orange-600 hover:bg-orange-700 text-white text-xs font-semibold py-2 rounded-lg transition-colors"
                         >
                           Confirm & Pack
                         </button>
                       )}
                       {currentStatus === "processing" && (
                         <div className="flex-1 flex flex-col gap-2">
                            {order.depositType === "PARTIAL" && 
                             order.paymentMethod !== "COD" && 
                             order.remainingPaymentStatus !== "PAID" && 
                             order.paymentStatus !== "PAID_FULL" &&
                             !(order.stockReadyAt && (new Date() - new Date(order.stockReadyAt)) / (1000 * 60 * 60) > 12) && (
                              <div className="flex items-center gap-1.5 p-2 bg-amber-50 border border-amber-200 rounded-lg text-amber-700 text-[10px] font-bold uppercase animate-pulse">
                                <FiAlertCircle size={12} /> Waiting for customer payment (12h window)
                              </div>
                            )}

                            {!allPrescriptionsApproved && (
                              <div className="flex flex-col gap-2 p-2 bg-purple-50 border border-purple-200 rounded-lg shadow-sm border-dashed">
                                <div className="flex items-center gap-1.5 text-purple-700 text-[10px] font-bold uppercase transition-all">
                                  <FiAlertCircle size={12} className="animate-pulse" /> Prescription Details Unconfirmed
                                </div>
                                <button
                                  onClick={() => {
                                    onClose();
                                    navigate("/dashboard/prescriptions");
                                  }}
                                  className="text-[10px] font-bold text-purple-600 underline text-left hover:text-purple-800 transition-colors"
                                >
                                  Go to Prescription Management
                                </button>
                              </div>
                            )}

                            <div className="flex gap-2">
                              <button
                                onClick={() => {
                                  const hoursPassed = order.stockReadyAt ? (new Date() - new Date(order.stockReadyAt)) / (1000 * 60 * 60) : 0;
                                  const is12hPassed = hoursPassed > 12;
                                  const isBalanceSettled = order.paymentMethod === "COD" || 
                                                          order.remainingPaymentStatus === "PAID" || 
                                                          order.paymentStatus === "PAID_FULL" ||
                                                          is12hPassed;
                                  
                                  const canShip = (order.depositType !== "PARTIAL" || isBalanceSettled) && allPrescriptionsApproved;
                                  
                                  if (!canShip) {
                                    if (!allPrescriptionsApproved) {
                                      alert("Cannot ship yet. All prescriptions in this order must be approved first.");
                                    } else {
                                      alert(`Cannot ship yet. Premium pre-order requires full payment. Customer has ${Math.max(0, 12 - Math.floor(hoursPassed))}h left to pay via VNPay before it defaults to COD.`);
                                    }
                                    return;
                                  }
                                  onUpdateStatus("shipped");
                                }}
                                disabled={
                                  (order.depositType === "PARTIAL" && 
                                   order.paymentMethod !== "COD" && 
                                   order.remainingPaymentStatus !== "PAID" && 
                                   order.paymentStatus !== "PAID_FULL" &&
                                   !(order.stockReadyAt && (new Date() - new Date(order.stockReadyAt)) / (1000 * 60 * 60) > 12)) ||
                                  !allPrescriptionsApproved
                                }
                                className={`flex-1 text-white text-xs font-semibold py-2 rounded-lg transition-colors ${
                                  ((order.depositType === "PARTIAL" && 
                                   order.paymentMethod !== "COD" && 
                                   order.remainingPaymentStatus !== "PAID" && 
                                   order.paymentStatus !== "PAID_FULL" &&
                                   !(order.stockReadyAt && (new Date() - new Date(order.stockReadyAt)) / (1000 * 60 * 60) > 12)) ||
                                   !allPrescriptionsApproved)
                                   ? "bg-gray-400 cursor-not-allowed"
                                   : "bg-blue-600 hover:bg-blue-700"
                                }`}
                              >
                                Ship Now
                              </button>
                              <button
                                onClick={() => {
                                  if (window.confirm("Are you sure you want to cancel this order?")) {
                                    onUpdateStatus("cancelled");
                                  }
                                }}
                                className="px-4 bg-white border border-red-200 text-red-600 hover:bg-red-50 text-xs font-semibold py-2 rounded-lg transition-colors flex items-center gap-2"
                              >
                                <FiX size={14} /> Cancel
                              </button>
                            </div>
                         </div>
                       )}
                       {["shipped", "delivering"].includes(currentStatus) && (
                         <button
                           onClick={() => onUpdateStatus("completed")}
                           className="flex-1 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold py-2 rounded-lg transition-colors"
                         >
                           Delivery Success
                         </button>
                       )}
                       {currentStatus === "pending" && (
                         <button
                           onClick={() => {
                             if (window.confirm("Are you sure you want to cancel this order?")) {
                               onUpdateStatus("cancelled");
                             }
                           }}
                           className="px-4 bg-white border border-red-200 text-red-600 hover:bg-red-50 text-xs font-semibold py-2 rounded-lg transition-colors"
                         >
                           Cancel Order
                         </button>
                       )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* ── Footer ── */}
          <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 rounded-b-2xl flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm border border-gray-200 rounded-lg text-gray-600 hover:bg-white transition-colors"
            >
              Close
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export default ViewOrderDetailsModal;
