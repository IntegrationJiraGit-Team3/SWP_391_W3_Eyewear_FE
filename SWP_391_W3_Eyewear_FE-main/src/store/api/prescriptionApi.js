import axiosClient from "./axiosClient";

// Lấy danh sách đơn thuốc của user đang đăng nhập
export const getMyPrescriptionsApi = () => {
  return axiosClient.get("/prescriptions");
};

// Lưu đơn thuốc mới
export const savePrescriptionApi = (data) => {
  return axiosClient.post("/prescriptions", data);
};

// Xoá đơn thuốc
export const deletePrescriptionApi = (id) => {
  return axiosClient.delete(`/prescriptions/${id}`);
};

// Lấy chi tiết đơn thuốc theo ID
export const getPrescriptionByIdApi = (id) => {
  return axiosClient.get(`/prescriptions/${id}`);
};
