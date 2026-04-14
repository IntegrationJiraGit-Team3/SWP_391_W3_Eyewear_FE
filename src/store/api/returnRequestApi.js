import axiosClient from "./axiosClient";

// export const createReturnRequestApi = (data) => {
//     return axiosClient.post("/return-requests", data);
// };
// ADMIN / STAFF lấy danh sách yêu cầu đổi/trả
export const getAllReturnRequestsApi = () => {
    return axiosClient.get("/return-requests");
};
export const getReturnRequestByIdApi = (requestId) => {
    return axiosClient.get(`/return-requests/${requestId}`);
};

// ADMIN / STAFF cập nhật status
export const updateReturnRequestStatusApi = (id, payload) => {
    return axiosClient.patch(`/return-requests/${id}/status`, payload);
};

export const createReturnRequestApi = (payload) => {
    return axiosClient.post("/return-requests", payload);
};

export const getReturnRequestsByOrderItemApi = (orderItemId) => {
    return axiosClient.get(`/return-requests/order-item/${orderItemId}`);
};

export const approveReturnRequestApi = (requestId) => {
    return axiosClient.put(`/return-requests/${requestId}/approve`);
};

export const rejectReturnRequestApi = (requestId, payload) => {
    return axiosClient.put(`/return-requests/${requestId}/reject`, payload);
};

export const markReceivedReturnApi = (requestId) => {
    return axiosClient.put(`/return-requests/${requestId}/received`);
};

export const markRefundPendingApi = (requestId) => {
    return axiosClient.put(`/return-requests/${requestId}/refund-pending`);
};

export const markRefundInvalidApi = (requestId, payload) => {
    return axiosClient.put(`/return-requests/${requestId}/refund-invalid`, payload);
};

export const markRefundedApi = (requestId) => {
    return axiosClient.put(`/return-requests/${requestId}/refunded`);
};

export const completeExchangeRequestApi = (requestId) => {
    return axiosClient.put(`/return-requests/${requestId}/complete`);
};

export const updateRefundBankInfoApi = (requestId, payload) => {
    return axiosClient.put(`/return-requests/${requestId}/refund-info`, payload);
};
