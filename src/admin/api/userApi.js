import axiosClient from "../api/axiosClient";

export const updateProfileApi = async (data) => {
    return axiosClient.patch(`/users/profile`, data);
}