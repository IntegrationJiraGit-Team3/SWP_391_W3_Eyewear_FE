import axiosClient from "../api/axiosClient";

export const checkoutOrderApi = (payload) => {
  return axiosClient.post("/orders/checkout", payload);
};

export const historyOrderApi = () => {
  return axiosClient.get("/orders/my");
};

export const cancelOrderApi = (orderId) => {
  return axiosClient.patch(`/orders/${orderId}/status?status=CANCELED`);
};

export const cancelPendingPaymentApi = (orderId) => {
  return axiosClient.patch(`/orders/${orderId}/cancel-payment`);
};

export const requestRefundApi = (orderId, payload) => {
  return axiosClient.patch(`/orders/${orderId}/request-refund`, payload);
};

export const requestVnpayRefundApi = (orderId, payload) => {
  return axiosClient.patch(`/orders/${orderId}/request-vnpay-refund`, payload || {});
};

export const getOrderByIdApi = (id) => {
  return axiosClient.get(`/orders/${id}`);
};

export const createPaymentApi = (amount, orderId) => {
  return axiosClient.post(
    `/v1/payment/create_payment?amount=${amount}&orderInfo=${orderId}`,
  );
};

// Forward VNPay return parameters to backend so it can verify signature,
// update order payment status, and persist the Payment record.
export const processVnpayReturnApi = (params) => {
  return axiosClient.get("/v1/payment/vnpay_return", { params });
};

export const updatePaymentStatusApi = (orderId, status) => {
  return axiosClient.patch(`/orders/${orderId}/paymentStatus?status=${status}`);
};

export const updatePaymentMethodApi = (orderId, method) => {
  return axiosClient.patch(`/orders/${orderId}/paymentMethod?method=${method}`);
};

export const updateOrderStatusApi = (orderId, status) => {
  return axiosClient.patch(`/orders/${orderId}/status?status=${status}`);
};

export const refundVnpayApi = (orderId, reason) => {
  return axiosClient.post(
    `/orders/${orderId}/refund-vnpay?reason=${encodeURIComponent(reason || "Customer cancelled paid order")}`,
  );
};
