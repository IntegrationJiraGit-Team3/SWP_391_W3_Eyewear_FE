import axios from "axios";

const BASE_URL = "http://localhost:8081/api";

export const createUser = async (user) => {
  const res = await axios.post(`${BASE_URL}/users/create`, user);

  return res.data;
};

export const checkEmail = async (email) => {
  const res = await axios.post(`${BASE_URL}/users/check-email`, null, {
    params: { email },
  });

  return res.data;
};
