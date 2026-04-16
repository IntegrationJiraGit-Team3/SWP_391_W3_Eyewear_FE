import axiosClient from "./axiosClient";

export const getAllOrdersApi = async () => {
  return axiosClient.get("/orders");
};

export const getOrderByIdApi = async (id) => {
  return axiosClient.get(`/orders/${id}`);
};

export const updatePaymentStatusApi = async (orderId, status) => {
  return axiosClient.patch(`/orders/${orderId}/paymentStatus?status=${status}`);
};

export const updateOrderStatusApi = async (orderId, status) => {
  return axiosClient.patch(`/orders/${orderId}/status?status=${status}`);
};

