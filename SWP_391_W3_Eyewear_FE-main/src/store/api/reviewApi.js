import axiosClient from "./axiosClient";

export const createReview = (data) => {
  return axiosClient.post("/reviews", data);
};

export const getReviewsByUser = (userId) => {
  return axiosClient.get(`/reviews/user/${userId}`);
};

export const getReviewsByProduct = (productId) => {
  return axiosClient.get(`/reviews/product/${productId}`);
};
