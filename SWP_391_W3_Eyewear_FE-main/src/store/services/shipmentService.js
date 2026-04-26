import {
    getShipmentByOrderApi,
    getShipmentByTrackingApi,
} from "../api/shipmentApi";

export const getShipmentByOrder = async (orderId) => {
    const res = await getShipmentByOrderApi(orderId);
    return res.data.data;
};

export const getShipmentByTracking = async (trackingNumber) => {
    const res = await getShipmentByTrackingApi(trackingNumber);
    return res.data.data;
};