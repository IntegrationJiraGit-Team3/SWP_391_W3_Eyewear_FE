import {
  getUserPrescriptionApi,
  saveUserPrescriptionApi,
  deleteUserPrescriptionApi
} from "../api/userPrescriptionApi";

// GET
export const getMyUserPrescriptions = async () => {
  const res = await getUserPrescriptionApi();
  return res.data;
};

// SAVE
export const saveUserPrescription = async (data) => {
  const res = await saveUserPrescriptionApi(data);
  return res.data;
};

// DELETE
export const deleteUserPrescription = async (id) => {
  await deleteUserPrescriptionApi(id);
};