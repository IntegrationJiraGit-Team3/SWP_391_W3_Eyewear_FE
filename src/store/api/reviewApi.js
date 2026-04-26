import axiosClient from "./axiosClient";

export const createReview = (data) => {
  return axiosClient.post("/reviews", data);
};

export const getReviewsByUser = (userId) => {
  return axiosClient.get(`/reviews/user/${userId}`);
};
// API GET REVIEWS BY PRODUCT ID
export const getReviewsByProduct = (productId) => {
  return axiosClient.get(`/reviews/product/${productId}`);
};
