import { updatePrescriptionStatusApi } from "../api/prescriptionApi";

export const updatePrescriptionStatus = async (prescriptionId, status, note) => {
  try {
    const response = await updatePrescriptionStatusApi(prescriptionId, status, note);
    return response.data;
  } catch (error) {
    console.error("Lỗi khi cập nhật trạng thái đơn thuốc:", error);
    throw error;
  }
};
