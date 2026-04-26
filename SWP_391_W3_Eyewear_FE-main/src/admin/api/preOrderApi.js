import adminClient from "./adminClient";

export const getStockVariantByIdApi = async (variantId) => {
  return adminClient.post(`/admin/products/variants/getStock/${variantId}`);
};

export const updateStockApi = (variantId, quantity) => {
  return adminClient.put(
    `/admin/products/variants/updateQuantity/${variantId}?quantity=${quantity}`
  );
};
