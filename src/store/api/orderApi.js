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

export const getOrderByIdApi = (id) => {
  return axiosClient.get(`/orders/${id}`);
};

export const createPaymentApi = (amount, orderId) => {
  return axiosClient.post(
    `/v1/payment/create_payment?amount=${amount}&orderInfo=${orderId}`,
  );
};

export const updatePaymentStatusApi = (orderId, status) => {
  return axiosClient.patch(`/orders/${orderId}/paymentStatus?status=${status}`);
};

export const updatePaymentMethodApi = (orderId, method) => {
  return axiosClient.patch(`/orders/${orderId}/paymentMethod?method=${method}`);
};