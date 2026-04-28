import {
  historyOrderApi,
  cancelOrderApi,
  cancelPendingPaymentApi,
  requestRefundApi,
  getOrderByIdApi,
  processVnpayReturnApi,
  updatePaymentStatusApi,
  updatePaymentMethodApi,
} from "../api/orderApi";

const normalizePaymentToken = (value) =>
  String(value || "")
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, "_");

const normalizePaymentMethod = (value) =>
  normalizePaymentToken(value).replace(/_/g, "");

const isFullyPaid = (value) => {
  const token = normalizePaymentToken(value);
  return [
    "PAID",
    "PAID_FULL",
    "FULLY_PAID",
    "PAID_IN_FULL",
    "SETTLED",
    "COMPLETED",
  ].includes(token);
};

// Display rule: VNPay orders should start at PENDING until payment is confirmed.
// Some backends may return PROCESSING immediately; we normalize display status
// so users still see the expected initial PENDING state.
const resolveDisplayStatus = (order) => {
  const backendStatus = normalizePaymentToken(order?.status);
  const paymentMethod = normalizePaymentMethod(order?.paymentMethod);

  const paymentStatus = normalizePaymentToken(order?.paymentStatus);

  // Only force VNPay orders to show PENDING while payment is not yet confirmed.
  // For partial orders, PAID_DEPOSIT means payment *is* confirmed, so we should
  // show the actual order status (PROCESSING/DELIVERING/...).
  if (
    paymentMethod === "VNPAY" &&
    ["", "UNPAID", "PENDING"].includes(paymentStatus)
  ) {
    if (["PROCESSING", "PENDING", ""].includes(backendStatus)) {
      return "PENDING";
    }
  }

  return backendStatus || "PENDING";
};

const resolveRemainingPaymentStatus = (order) => {
  const backendRemaining = normalizePaymentToken(
    order?.remainingPaymentStatus ?? order?.finalPaymentStatus,
  );
  if (backendRemaining === "PAID") return "PAID";
  if (backendRemaining === "UNPAID") return "UNPAID";

  const isPartial =
    String(order?.depositType || "").trim().toUpperCase() === "PARTIAL";
  const paymentStatus = normalizePaymentToken(order?.paymentStatus);

  // Với đơn trả cọc 50%:
  // PAID = mới trả cọc
  // PAID_FULL = đã trả toàn bộ
  if (isPartial) {
    return paymentStatus === "PAID_FULL" ? "PAID" : "UNPAID";
  }

  if (isFullyPaid(order?.paymentStatus)) {
    return "PAID";
  }

  const remainingAmount = Number(
    order?.remainingAmount ??
      Number(order?.finalPrice || 0) - Number(order?.depositAmount || 0),
  );

  return remainingAmount <= 0 ? "PAID" : "UNPAID";
};

const mapStatus = (status) => {
  const s = status?.toUpperCase() || "PENDING";
  switch (s) {
    case "PENDING":
    case "PREORDER":
      return "PENDING";
    case "PROCESSING":
      return "PROCESSING";
    case "DELIVERING":
    case "SHIPPING":
    case "SHIPPED":
      return "SHIPPING";
    case "DELIVERED":
    case "COMPLETED":
      return "COMPLETED";
    case "REFUND":
    case "REFUNDED":
      return "REFUND";
    case "CANCELED":
    case "CANCELLED":
      return "CANCELLED";
    default:
      return s;
  }
};

const mapStatusLabel = (status) => {
  const s = status?.toUpperCase() || "PENDING";
  switch (s) {
    case "PENDING":
    case "PREORDER":
      return "Pending";
    case "PROCESSING":
      return "Processing";
    case "DELIVERING":
    case "SHIPPING":
    case "SHIPPED":
      return "Shipping";
    case "DELIVERED":
    case "COMPLETED":
      return "Delivered";
    case "REFUND":
    case "REFUNDED":
      return "Refund";
    case "CANCELED":
    case "CANCELLED":
      return "Cancelled";
    default:
      return "Pending";
  }
};

const normalizeRefundStatus = (value) => {
  const token = normalizePaymentToken(value);
  return token ? token : "NONE";
};

export const getMyOrders = async () => {
  const res = await historyOrderApi();
  const rawOrders = res.data.data;

  return rawOrders.map((order) => ({
    id: order.orderCode,
    orderId: order.orderId,
    orderDate: order.orderDate,
    orderDateMs: order.orderDate ? new Date(order.orderDate).getTime() : 0,
    date: new Date(order.orderDate).toLocaleDateString("en-US"),
    status: mapStatus(resolveDisplayStatus(order)),
    total: Number(order.finalPrice ?? order.totalPrice ?? 0),
    paymentStatus: order.paymentStatus,
    paymentMethod: order.paymentMethod,
    refundStatus: normalizeRefundStatus(order.refundStatus),
    refundRequestedAt: order.refundRequestedAt,
    refundProcessedAt: order.refundProcessedAt,
    depositAmount: order.depositAmount,
    depositType: order.depositType,
    depositPaymentMethod: order.depositPaymentMethod,
    remainingPaymentStatus: resolveRemainingPaymentStatus(order),
    items: (order.orderItems || []).map((item) => ({
      orderItemId: item.orderItemId,
      productId: item.productId,
      name: item.productName,
      quantity: item.quantity,
      image: item.imageUrl,
      variantId: item.variantId,
      lensOptionId: item.lensOptionId,
      lensType: item.lensType,
      sphLeft: item.sphLeft,
      sphRight: item.sphRight,
      cylLeft: item.cylLeft,
      cylRight: item.cylRight,
      axisLeft: item.axisLeft,
      axisRight: item.axisRight,
      addLeft: item.addLeft,
      addRight: item.addRight,
      pd: item.pd,
      isPreorder: item.isPreorder,
    })),
  }));
};

export const cancelOrder = async (orderId) => {
  const res = await cancelOrderApi(orderId);
  return res.data;
};

export const cancelPendingPayment = async (orderId) => {
  const res = await cancelPendingPaymentApi(orderId);
  return res.data;
};

export const requestRefund = async (orderId, payload) => {
  const res = await requestRefundApi(orderId, payload);
  return res.data;
};

export const getOrderDetails = async (id) => {
  const res = await getOrderByIdApi(id);
  const order = res.data.data;

  let statusCode = 0;
  const status = resolveDisplayStatus(order);

  if (status === "PENDING" || status === "PREORDER") statusCode = 0;
  else if (status === "PROCESSING") statusCode = 1;
  else if (
    status === "SHIPPING" ||
    status === "DELIVERING" ||
    status === "SHIPPED"
  )
    statusCode = 2;
  else if (
    status === "DELIVERED" ||
    status === "COMPLETED" ||
    status === "REFUND" ||
    status === "REFUNDED"
  )
    statusCode = 3;

  return {
    ...order,
    depositPaymentMethod: order.depositPaymentMethod,
    orderDate: order.orderDate,
    orderDateMs: order.orderDate ? new Date(order.orderDate).getTime() : 0,
    refundStatus: normalizeRefundStatus(order.refundStatus),
    refundRequestedAt: order.refundRequestedAt,
    refundProcessedAt: order.refundProcessedAt,
    refundBankName: order.refundBankName,
    refundBankAccountNumber: order.refundBankAccountNumber,
    refundBankAccountHolder: order.refundBankAccountHolder,
    refundNote: order.refundNote,
    remainingPaymentStatus: resolveRemainingPaymentStatus(order),
    id: order.orderCode,
    orderId: order.orderId,
    date: new Date(order.orderDate).toLocaleDateString("en-US"),
    status: statusCode,
    rawStatus: mapStatusLabel(status),
    items: (order.orderItems || []).map((item) => ({
      ...item,
      name: item.productName,
      image: item.imageUrl,
      total: Number(item.quantity || 0) * Number(item.unitPrice || 0),
    })),
    subTotal: Number(order.totalPrice ?? 0),
    shippingFee: Number(order.shippingFee ?? 0),
    discount: Number(order.voucherDiscount ?? 0),
    finalTotal: Number(order.finalPrice ?? order.totalPrice ?? 0),
  };
};

export const updatePaymentStatus = async (orderId, status) => {
  const res = await updatePaymentStatusApi(orderId, status);
  return res.data;
};

export const updatePaymentMethod = async (orderId, method) => {
  const res = await updatePaymentMethodApi(orderId, method);
  return res.data;
};

export const processVnpayReturn = async (params) => {
  const res = await processVnpayReturnApi(params);
  return res.data;
};
