import axiosClient from "./axiosClient";

export const getAllReturnRequestsApi = () => {
    return axiosClient.get("/return-requests").catch((error) => {
        const status = error?.response?.status;
        if (status === 404 || status === 403 || status === 405) {
            return axiosClient.get("/admin/return-requests");
        }
        throw error;
    });
};

export const getReturnRequestByIdApi = (requestId) => {
    return axiosClient.get(`/return-requests/${requestId}`);
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

export const markRefundedApi = (requestId, payload) => {
    return axiosClient.put(`/return-requests/${requestId}/refunded`, payload);
};

export const confirmRefundReceivedApi = (requestId) => {
    return axiosClient.put(`/return-requests/${requestId}/confirm-refund-received`);
};

export const completeExchangeRequestApi = (requestId) => {
    return axiosClient.put(`/return-requests/${requestId}/complete`);
};

const isEndpointNotFound = (error) => {
    const status = error?.response?.status;
    return status === 404 || status === 405;
};

export const adminConfirmRefundFinalApi = async (requestId) => {
    try {
        return await axiosClient.put(`/return-requests/${requestId}/confirm-refund-final`);
    } catch (error) {
        if (!isEndpointNotFound(error)) throw error;
    }

    try {
        return await axiosClient.put(`/return-requests/${requestId}/refund-complete`);
    } catch (error) {
        if (!isEndpointNotFound(error)) throw error;
    }

    return axiosClient.put(`/return-requests/${requestId}/complete`);
};

export const updateRefundBankInfoApi = (requestId, payload) => {
    return axiosClient.put(`/return-requests/${requestId}/refund-info`, payload);
};