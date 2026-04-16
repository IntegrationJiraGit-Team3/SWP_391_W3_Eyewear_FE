import {
  historyOrderApi,
  cancelOrderApi,
  cancelPendingPaymentApi,
  getOrderByIdApi,
  updatePaymentStatusApi,
  updatePaymentMethodApi,
} from "../api/orderApi";

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

export const getMyOrders = async () => {
  const res = await historyOrderApi();
  const rawOrders = res.data.data;

  return rawOrders.map((order) => ({
    id: order.orderCode,
    orderId: order.orderId,
    date: new Date(order.orderDate).toLocaleDateString("en-US"),
    status: mapStatus(order.status),
    total: Number(order.finalPrice || 0),
    paymentStatus: order.paymentStatus,
    paymentMethod: order.paymentMethod,
    depositAmount: order.depositAmount,
    depositType: order.depositType,
    depositPaymentMethod: order.depositPaymentMethod,
    remainingPaymentStatus: order.paymentStatus === "PAID_FULL" ? "PAID" : "UNPAID",
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

export const getOrderDetails = async (id) => {
  const res = await getOrderByIdApi(id);
  const order = res.data.data;

  let statusCode = 0;
  const status = order.status?.toUpperCase();

  if (status === "PENDING" || status === "PREORDER") statusCode = 0;
  else if (status === "PROCESSING") statusCode = 1;
  else if (status === "SHIPPING" || status === "DELIVERING" || status === "SHIPPED") statusCode = 2;
  else if (status === "DELIVERED" || status === "COMPLETED" || status === "REFUND" || status === "REFUNDED") statusCode = 3;

  return {
    ...order,
    depositPaymentMethod: order.depositPaymentMethod,
    remainingPaymentStatus: order.paymentStatus === "PAID_FULL" ? "PAID" : "UNPAID",
    id: order.orderCode,
    orderId: order.orderId,
    date: new Date(order.orderDate).toLocaleDateString("en-US"),
    status: statusCode,
    rawStatus: mapStatusLabel(order.status),
    items: (order.orderItems || []).map((item) => ({
      ...item,
      name: item.productName,
      image: item.imageUrl,
      total: Number(item.quantity || 0) * Number(item.unitPrice || 0),
    })),
    subTotal: Number(order.totalPrice || 0),
    shippingFee: Number(order.shippingFee || 0),
    discount: Number(order.voucherDiscount || 0),
    finalTotal: Number(order.finalPrice || 0),
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