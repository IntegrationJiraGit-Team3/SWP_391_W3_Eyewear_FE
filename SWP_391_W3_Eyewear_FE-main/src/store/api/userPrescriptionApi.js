import axiosClient from "../api/axiosClient"

export const getUserPrescriptionApi = () => {
    return axiosClient.get("/user-prescriptions");
}


export const saveUserPrescriptionApi = (data) => {
    return axiosClient.post("/user-prescriptions", data);
}

export const deleteUserPrescriptionApi = (id) => {
  return axiosClient.delete(`/user-prescriptions/${id}`);
};