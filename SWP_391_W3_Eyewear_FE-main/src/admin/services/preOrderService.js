import {
  approvePreorderApi,
  getAllOrdersApi,
} from "../api/orderApi";
import { getStockVariantByIdApi } from "../api/preOrderApi";

export const getPreorderItemsService = async () => {
  try {
    const res = await getAllOrdersApi();

    const orders = res?.data?.data || [];
    const preorderItems = orders.flatMap((order) =>
      (order.orderItems || [])
        .filter((item) => item.isPreorder === true)
        .map((item) => ({
          ...item,

          orderId: order.orderId,
          orderCode: order.orderCode,
          orderStatus: order.status,

          customerName: order.userName,
          customerEmail: order.userEmail,

          createdAt: order.orderDate,

          phone: order.phone,
          address: order.address,

          note: order.note,

          totalPrice: order.finalPrice || order.totalPrice,
          paymentStatus: order.paymentStatus,
          remainingPaymentStatus: order.remainingPaymentStatus,
          depositType: order.depositType,
        })),
    );

    return preorderItems;
  } catch (error) {
    console.error("Get preorder items error:", error);
    throw error;
  }
};

export const getStockVariantById = async (id) => {
  const res = await getStockVariantByIdApi(id);
  return res.data.data;
};

export const approvePreorderService = async (orderId) => {
  const res = await approvePreorderApi(orderId);
  return res?.data?.data;
};