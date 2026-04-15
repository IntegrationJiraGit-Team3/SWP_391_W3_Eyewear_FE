import axiosClient from "../api/axiosClient";

export const getOrdersCountApi = async () => {
  return axiosClient.get(`/orders/count`);
};

export const getCustomerCountApi = async () => {
  return axiosClient.get(`/orders/customers/count`);
};

export const getRevenueApi = async (fromDate, toDate) => {
  return axiosClient.get(`/admin/reports/revenue`, {
    params: { fromDate, toDate },
  });
};

export const getTotalRevenueApi = async () => {
  return axiosClient.get(`/admin/reports/total`);
};

export const getDashboardSummaryApi = async (fromDate, toDate) => {
  return axiosClient.get(`/admin/reports/dashboard-summary`, {
    params: { fromDate, toDate },
  });
};