import axiosClient from "../api/axiosClient";

export const createShipmentApi = (payload) => {
    return axiosClient.post("/shipments", payload);
};

export const getShipmentByOrderApi = (orderId) => {
    return axiosClient.get(`/shipments/order/${orderId}`);
};

export const updateShipmentApi = (shipmentId, payload) => {
    return axiosClient.patch(`/shipments/${shipmentId}`, payload);
};