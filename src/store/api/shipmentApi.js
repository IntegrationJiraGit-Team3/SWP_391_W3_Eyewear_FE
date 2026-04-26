import axiosClient from "./axiosClient";

export const getShipmentByOrderApi = (orderId) => {
    return axiosClient.get(`/shipments/order/${orderId}`);
};
// API GET SHIPMENT BY TRACKING NUMBER
export const getShipmentByTrackingApi = (trackingNumber) => {
    return axiosClient.get(`/shipments/track/${trackingNumber}`);
};