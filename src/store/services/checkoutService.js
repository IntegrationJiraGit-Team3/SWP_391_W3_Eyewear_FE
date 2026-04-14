import { checkoutOrderApi, createPaymentApi } from "../api/orderApi";

export const checkoutOrder = async (
  formData,
  shippingFee,
  items,
  paymentMethod = [],
) => {
  const hasPreOrder = items.some(item => (item.isPreorder === true || item.isPreOrder === true));

  const payload = {
    fullName: formData.fullName,
    phone: formData.phone,
    address: `${formData.address}, ${formData.city || ""}`.trim(),
    note: formData.note || "",
    paymentMethod: paymentMethod,
    shippingFee: parseFloat(shippingFee) || 0,
    voucherDiscount: 0,
    idempotencyKey: String(Date.now()),
    isPreorder: !!hasPreOrder,
    depositType: formData.depositType || "FULL",
    shipmentStatus: hasPreOrder ? "PREORDER" : "PENDING"
  };

  try {
    const response = await checkoutOrderApi(payload);
    if (response.data?.success) {
      return response.data.data; // trả về order
    } else {
      throw new Error(response.data?.message || "Checkout failed");
    }
  } catch (error) {
      console.error("LOI CHECKOUT:", error.response?.data);
      const backendMessage = error.response?.data?.message || JSON.stringify(error.response?.data) || error.message;
      throw new Error(`Backend error: ${backendMessage}`);
  }
};


export const createVNPayPayment = async (amount, orderId) => {
  try {
    const res = await createPaymentApi(amount, orderId);

    return res.data.paymentUrl;
  } catch (error) {
    console.error("Create payment error:", error);
    throw error;
  }
};
