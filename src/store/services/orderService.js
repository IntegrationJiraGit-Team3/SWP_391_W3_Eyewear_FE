import {
  historyOrderApi,
  cancelOrderApi,
  getOrderByIdApi,
  updatePaymentStatusApi,
  updatePaymentMethodApi,
} from "../api/orderApi";

// map status backend → frontend
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

  // transform data cho UI
  return rawOrders.map((order) => ({
    id: order.orderCode,
    orderId: order.orderId, // ✅ Cần dùng để gọi API update
    date: new Date(order.orderDate).toLocaleDateString("en-US"),
    status: mapStatus(order.status),
    total: order.finalPrice,
    paymentStatus: order.paymentStatus,
    paymentMethod: order.paymentMethod,
    depositAmount: order.depositAmount,
    depositType: order.depositType,
    depositPaymentMethod: order.depositPaymentMethod,
    remainingPaymentStatus: order.paymentStatus === "PAID_FULL" ? "PAID" : "UNPAID",

    items: order.orderItems.map((item) => ({
      orderItemId: item.orderItemId, // ✅ Cần để đổi trả
      productId: item.productId, // ✅ Thêm để có link qua trang Review
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
      isPreorder: item.isPreorder
    })),
  }));
};

export const cancelOrder = async (orderId) => {
  const res = await cancelOrderApi(orderId);
  return res.data;
};

export const getOrderDetails = async (id) => {
  const res = await getOrderByIdApi(id);
  const order = res.data.data;

  // Trình trạng số (0, 1, 2, 3) cho thanh tiến trình
  let statusCode = 0;
  const status = order.status?.toUpperCase();
  
  if (status === "PENDING") statusCode = 0;
  else if (status === "PROCESSING") statusCode = 1;
  else if (status === "SHIPPING" || status === "DELIVERING") statusCode = 2;
  else if (status === "DELIVERED" || status === "COMPLETED") statusCode = 3;

  return {
    ...order,
    depositPaymentMethod: order.depositPaymentMethod,
    remainingPaymentStatus: order.paymentStatus === "PAID_FULL" ? "PAID" : "UNPAID",
    id: order.orderCode,
    orderId: order.orderId,
    date: new Date(order.orderDate).toLocaleDateString("en-US"),
    status: statusCode,
    rawStatus: mapStatusLabel(order.status),
    items: (order.orderItems || []).map(item => ({
       ...item,
       name: item.productName,
       image: item.imageUrl,
       total: item.quantity * item.unitPrice
    })),
    subTotal: order.totalPrice || 0,
    shippingFee: order.finalPrice > order.totalPrice ? (order.finalPrice - order.totalPrice) : 0,
    discount: order.totalPrice > order.finalPrice ? (order.totalPrice - order.finalPrice) : 0,
    finalTotal: order.finalPrice || 0
  };
};

export const updatePaymentStatus = async (orderId, resCode, transCode) => {
  // Đối với VNPay, mã resCode "00" là chỉ số quan trọng nhất cho thành công
  const isSuccess = resCode === "00";
  const status = isSuccess ? "PAID" : "UNPAID";
  
  // Trích lọc ID số (VD: "ORD-123" -> "123") để đảm bảo gọi API chính xác
  const cleanOrderId = String(orderId).replace(/\D/g, "");

  try {
    const res = await updatePaymentStatusApi(cleanOrderId, status);
    console.log("Payment status update success:", res.data);
    return res.data;
  } catch (error) {
    console.error("Failed to update payment status API:", error.response?.data || error);
    throw error;
  }
};

export const updatePaymentMethod = async (orderId, method) => {
  const res = await updatePaymentMethodApi(orderId, method);
  return res.data;
};
