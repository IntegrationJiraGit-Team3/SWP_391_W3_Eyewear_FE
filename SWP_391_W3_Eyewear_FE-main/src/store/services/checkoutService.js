import { checkoutOrderApi, createPaymentApi } from "../api/orderApi";

export const checkoutOrder = async (
  formData,
  shippingFee,
  items,
  paymentMethod = "COD",
) => {
  const hasPreOrder = items.some(
    (item) => item.isPreorder === true || item.isPreOrder === true,
  );

  const payload = {
    fullName: formData.fullName,
    phone: formData.phone,
    address: `${formData.address}, ${formData.city || ""}`.trim(),
    note: formData.note || "",
    paymentMethod,
    shippingFee: parseFloat(shippingFee) || 0,
    voucherDiscount: 0,
    idempotencyKey: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    isPreorder: !!hasPreOrder,
    depositType: formData.depositType || "FULL",
  };

  const response = await checkoutOrderApi(payload);
  if (response.data?.success) {
    return response.data.data;
  }

  throw new Error(response.data?.message || "Checkout failed");
};

export const createVNPayPayment = async (amount, orderId) => {
  const res = await createPaymentApi(amount, orderId);
  return res.data.paymentUrl;
};