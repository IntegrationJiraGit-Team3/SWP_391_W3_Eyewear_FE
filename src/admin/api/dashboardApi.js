import axiosClient from "../api/axiosClient";

export const getOrdersCountApi = async () => {
  return axiosClient.get(`/orders/count`);
};
export const getCustomerCountApi = async () => {
  return axiosClient.get(`/orders/customers/count`);
};
export const getRevenueReportApi = async (fromDate, toDate) => {
  return axiosClient.get(`/admin/reports/revenue`, { params: { fromDate, toDate } });
};
export const getDailyRevenueApi = async (fromDate, toDate) => {
  return axiosClient.get(`/admin/reports/revenue/daily`, { params: { fromDate, toDate } });
};
export const getCancelledOrdersApi = async (fromDate, toDate) => {
  return axiosClient.get(`/admin/reports/orders/cancelled`, { params: { fromDate, toDate } });
};

export const getRevenueApi = async (fromDate, toDate) => {
  return axiosClient.get(`/admin/reports/revenue`, {
    params: { fromDate, toDate },
  });
};

export const getTotalRevenueApi = async () => {
  return axiosClient.get(`/admin/reports/total`);
};

