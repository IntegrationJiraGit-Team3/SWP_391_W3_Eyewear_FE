import axiosClient from "./axiosClient";

// Lấy tất cả đơn thuốc (Admin)
export const getAllPrescriptionsApi = () => {
  return axiosClient.get("/prescriptions");
};

// Lấy chi tiết đơn thuốc theo ID
export const getPrescriptionByIdApi = (id) => {
  return axiosClient.get(`/prescriptions/${id}`);
};

// Duyệt đơn thuốc
export const approvePrescriptionApi = (id, reviewNote) => {
  return axiosClient.patch(`/prescriptions/${id}/status`, null, {
    params: { status: true, note: reviewNote }
  });
};

// Từ chối đơn thuốc
export const declinePrescriptionApi = (id, reviewNote) => {
  return axiosClient.patch(`/prescriptions/${id}/status`, null, {
    params: { status: false, note: reviewNote }
  });
};

// Cập nhật trạng thái đơn thuốc (Duyệt/Từ chối kèm ghi chú)
export const updatePrescriptionStatusApi = (id, status, note) => {
  return axiosClient.patch(`/prescriptions/${id}/status`, null, {
    params: { status, note }
  });
};

// Tạo đơn thuốc offline (Admin nhập thủ công)
export const createOfflinePrescriptionApi = (data) => {
  return axiosClient.post("/prescriptions/offline", data);
};
