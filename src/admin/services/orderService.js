import {
  getAllOrdersApi,
  updatePaymentStatusApi,
  updateOrderStatusApi,
  getOrderByIdApi,
} from "../api/orderApi";

const normalizePaymentToken = (value) =>
  String(value || "")
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, "_");

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

const resolveRemainingPaymentStatus = (order) => {
  const backendRemaining = normalizePaymentToken(
    order?.remainingPaymentStatus ?? order?.finalPaymentStatus,
  );
  if (backendRemaining === "PAID") return "PAID";
  if (backendRemaining === "UNPAID") return "UNPAID";

  if (isFullyPaid(order?.paymentStatus)) {
    return "PAID";
  }

  const remainingAmount = Number(
    order?.remainingAmount ??
    (Number(order?.finalPrice ?? order?.totalPrice ?? 0) -
      Number(order?.depositAmount || 0)),
  );

  return remainingAmount <= 0 ? "PAID" : "UNPAID";
};

const resolveRemainingPaymentStage = (order) => {
  const status = resolveRemainingPaymentStatus(order);
  if (status === "PAID") return "PAID";

  const isPartial = String(order?.depositType || "").toUpperCase() === "PARTIAL";
  const method = normalizePaymentToken(order?.paymentMethod);

  if (isPartial && method === "COD") {
    return "PENDING_CONFIRMATION";
  }

  return "UNPAID";
};

// Hàm kiểm tra đơn có toa thuốc hay không (Broad check)
const checkIfHasPrescription = (items = []) => {
  return items.some((item) => {
    // 1. Flag or Type
    if (item.itemType === "PRESCRIPTION" || item.fulfillmentType === "PRESCRIPTION" || item.isLens) return true;
    // 2. Object link
    if (item.prescription != null) return true;
    // 3. Raw parameters (OD/OS) lồng hoặc phẳng
    const rx = item.prescription || item;
    return (
      rx.sphLeft != null ||
      rx.sphRight != null ||
      rx.lensOptionId != null
    );
  });
};

export const getAllOrders = async () => {
  const res = await getAllOrdersApi();
  const orders = res.data?.data || [];

  return orders.map((o) => {
    const items = o.orderItems || o.items || [];
    const hasPrescription = checkIfHasPrescription(items);

    return {
      id: o.orderId,
      code: o.orderCode,
      customer: o.userName,
      email: o.userEmail,
      avatar: `https://ui-avatars.com/api/?name=${o.userName}&background=random`,
      total: o.finalPrice ?? o.totalPrice ?? 0,
      paymentMethod: o.paymentMethod,
      depositAmount: o.depositAmount,
      depositType: o.depositType,
      status: mapStatus(o.status),
      paymentStatus: o.paymentStatus,
      remainingPaymentStatus: resolveRemainingPaymentStatus(o),
      remainingPaymentStage: resolveRemainingPaymentStage(o),
      createdAt: new Date(o.orderDate || Date.now()).toLocaleDateString("vi-VN"),
      rawDate: o.orderDate ? new Date(o.orderDate) : new Date(),
      orderItems: items,
      hasPrescription: hasPrescription,
    };
  });
};

export const getOrderById = async (id) => {
  const res = await getOrderByIdApi(id);
  const o = res.data?.data || res.data;
  const items = o.orderItems || o.items || [];



  const hasPrescription = checkIfHasPrescription(items);

  return {
    ...o,
    id: o.orderId,
    code: o.orderCode,
    customer: o.userName,
    email: o.userEmail,
    total: o.finalPrice ?? o.totalPrice ?? 0,
    status: mapStatus(o.status),
    createdAt: new Date(o.orderDate || Date.now()).toLocaleDateString("vi-VN"),
    paymentStatus: o.paymentStatus,
    remainingPaymentStatus: resolveRemainingPaymentStatus(o),
    remainingPaymentStage: resolveRemainingPaymentStage(o),
    orderItems: items,
    hasPrescription,
  };
};

export const updateOrderStatus = async (orderId, status) => {
  let backendStatus = status.toUpperCase();
  if (backendStatus === "SHIPPING" || backendStatus === "SHIPPED") backendStatus = "DELIVERING";
  if (backendStatus === "COMPLETED") backendStatus = "DELIVERED";
  if (backendStatus === "CANCELLED") backendStatus = "CANCELED";

  const res = await updateOrderStatusApi(orderId, backendStatus);
  return res.data;
};

export const updatePaymentStatus = async (orderId, status) => {
  const res = await updatePaymentStatusApi(orderId, status);
  return res.data;
};

const mapStatus = (status) => {
  if (!status) return "pending";
  const s = status.toUpperCase();
  switch (s) {
    case "PENDING": return "pending";
    case "PROCESSING": return "processing";
    case "DELIVERING":
    case "SHIPPING":
    case "SHIPPED": return "delivering";
    case "DELIVERED":
    case "COMPLETED": return "completed";
    case "REFUND":
    case "REFUNDED": return "refund";
    case "CANCELED":
    case "CANCELLED": return "cancelled";
    default: return s.toLowerCase();
  }
};
