import axiosClient from "../api/axiosClient";

export const addToCartApi = (data) => {
  return axiosClient.post("/cart/add", data);
};


export const getCartByUserApi = (userId) => {
  return axiosClient.get(`/cart/user/${userId}`);
};

// UPDATE quantity
export const updateCartItemApi = (cartItemId, quantity) => {
  return axiosClient.put(`/cart/item/${cartItemId}?quantity=${quantity}`);
};

// DELETE item
export const deletesCartItemApi = (cartItemId) => {
  return axiosClient.delete(`/cart/item/${cartItemId}`);
};

export const deleteCartItemService = async (cartItemId) => {
  const res = await deletesCartItemApi(cartItemId);
  return res.data;
};

export const clearCartService = async () => {
  const res = await clearCartApi();
  return res.data;
};

export const clearCartApi = () => {
  return axiosClient.delete("/cart/clear");
};