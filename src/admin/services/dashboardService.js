import {
  getCustomerCountApi,
  getOrdersCountApi,
  getRevenueApi,
  getTotalRevenueApi,
  getDashboardSummaryApi,
} from "../api/dashboardApi";

export const getOrdersCount = async () => {
  const res = await getOrdersCountApi();
  return res.data.data;
};

export const getCustomerCount = async () => {
  const res = await getCustomerCountApi();
  return res.data.data;
};

export const getRevenue = async (fromDate, toDate) => {
  const res = await getRevenueApi(fromDate, toDate);
  return res.data.data;
};

export const getTotalRevenue = async () => {
  const res = await getTotalRevenueApi();
  return res.data.data;
};

export const getDashboardSummary = async (fromDate, toDate) => {
  const res = await getDashboardSummaryApi(fromDate, toDate);
  return res.data.data;
};