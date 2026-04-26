import { updateProfileApi } from "../api/userApi";

export const updateProfile = async (data) => {
  const res = await updateProfileApi(data);
  return res.data;
};
