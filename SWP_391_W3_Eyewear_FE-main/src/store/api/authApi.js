import axios from "axios";
import axiosClient from "../api/axiosClient"
// API LOGIN
// URL
const BASE_URL = "http://localhost:8081/api";
export const loginApi = async (email, password) => {
  const res = await axios.post(`${BASE_URL}/users/login`, null, {
    params: {
      email: email,
      password: password,
    },
  });
  const token = res.data.data;
  localStorage.setItem("token", token);
  return token;
};

export const getUserById = async (userId) => {
  const res = await axiosClient.get(`/users/${userId}`);
  return res.data.data;
};


export const loginGoogleAPi = async (gmail, name) => {
  const res = await axiosClient.post(`/users/login-google?gmail=${gmail}&name=${name}`);
  const token = res.data.data;
  return token;
}