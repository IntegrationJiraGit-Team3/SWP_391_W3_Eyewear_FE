import axiosClient from "../api/axiosClient";
import adminClient from "../api/adminClient";
export const getAllProductsApi = async () => {
  const res = await axiosClient.get(`/products`);
  return res.data.data;
};

export const createProductApi = async (productData) => {
  const res = await axiosClient.post(`/products`, productData);
  return res.data.data;
};

export const deleteProductApi = async (id) => {
  const res = await axiosClient.delete(`/products/${id}`);
  return res.data;
};

export const getProductByIdApi = async (id) => {
  return axiosClient.get(`/products/${id}`);
};

export const updateProductApi = async (id, payload) => {
  return axiosClient.put(`/products/${id}`, payload);
};

export const updateVariantApi = async (id, quantity, data) => {
  return adminClient.put(
    `/admin/products/variants/updateStock/${id}?quantity=${quantity}`,
    data,
  );
};

export const updateVariantQuantityApi = async (id, quantity) => {
  return adminClient.put(
    `/admin/products/variants/updateQuantity/${id}?quantity=${quantity}`,
  );
};

export const createVariantApi = async (id, data) => {
  return adminClient.post(`/admin/products/${id}/variants`, data);
};

export const deleteVariantApi = async (id) => {
  return adminClient.delete(`/admin/products/variants/${id}`);
};
