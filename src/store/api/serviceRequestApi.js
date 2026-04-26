import axiosClient from "./axiosClient";

/**
 * Submit a service request (RETURN, WARRANTY, or REFUND)
 * @param {Object} data - { orderItemId, requestType, reason }
 */
export const submitServiceRequestApi = (data) => {
  return axiosClient.post("/service-requests", data);
};
// API GET SERVICE REQUESTS BY ORDER ITEM ID
export const getServiceRequestsByOrderItemApi = (orderItemId) => {
  return axiosClient.get(`/service-requests/order-item/${orderItemId}`);
};
