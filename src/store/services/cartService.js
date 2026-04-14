import {
  addToCartApi,
  clearCartApi,
  deletesCartItemApi,
  getCartByUserApi,
  updateCartItemApi,
} from "../api/cartApi";

export const addToCartService = async (item) => {
  try {
    const res = await addToCartApi(item);

    return res.data;
  } catch (error) {
    console.error("Cart service error:", error);
    throw error;
  }
};

export const getCartByUserService = async (userId) => {
  try {
    const res = await getCartByUserApi(userId);
    return res.data;
  } catch (error) {
    console.error("Get cart error:", error);
    throw error;
  }
};

export const updateCartItemService = async (cartItemId, quantity) => {
  const res = await updateCartItemApi(cartItemId, quantity);
  return res.data;
};

export const deleteCartItemService = async (cartItemId) => {
  const res = await deletesCartItemApi(cartItemId);
  return res.data;
};

export const clearCartService = async () => {
  const res = await clearCartApi();
  return res.data;
};
