import axiosClient from "./axiosClient";

export const getAllProductStoreApi = async () => {
  const res = await axiosClient.get("/products");
  return res.data.data;
};

export const getProductByIdApi = async (id) => {
  const res = await axiosClient.get(`/products/${id}`);
  return res.data.data;
};