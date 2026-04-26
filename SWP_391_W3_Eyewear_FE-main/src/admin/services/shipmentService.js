import {
    createShipmentApi,
    getShipmentByOrderApi,
    updateShipmentApi,
} from "../api/shipmentApi";

export const createShipment = async (payload) => {
    const res = await createShipmentApi(payload);
    return res.data.data;
};

export const getShipmentByOrder = async (orderId) => {
    const res = await getShipmentByOrderApi(orderId);
    return res.data.data;
};

export const updateShipment = async (shipmentId, payload) => {
    const res = await updateShipmentApi(shipmentId, payload);
    return res.data.data;
};