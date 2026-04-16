import { useEffect, useMemo, useState } from "react";
import Chart from "react-apexcharts";
import { motion } from "framer-motion";
import {
  FiDollarSign,
  FiUsers,
  FiShoppingBag,
  FiRefreshCcw,
  FiCalendar,
  FiTrendingUp,
  FiPackage,
  FiBarChart2,
} from "react-icons/fi";
import { getDashboardAnalytics } from "../services/dashboardService";

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.45, delay },
});

const PROJECTED_REVENUE_KEYS = new Set([
  "projectedrevenue",
  "expectedrevenue",
  "estimatedrevenue",
  "forecastrevenue",
  "projectrevenue",
  "revenueprojected",
  "dukiendoanhthu",
  "doanhthudukien",
]);

const REMAINING_REVENUE_KEYS = new Set([
  "remainingrevenueafterrefund",
  "remainingrevenue",
  "netrevenue",
  "sotienhienhuusaurefund",
  "doanhthuconlai",
]);

function toFiniteNumber(value) {
  if (value == null || value === "") return null;
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }

  const normalized = String(value).replace(/,/g, "").trim();
  if (!normalized) return null;

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizeKey(key) {
  return String(key || "")
    .toLowerCase()
    .replace(/[_\-\s]/g, "");
}

function isProjectedRevenueKey(key) {
  const normalized = normalizeKey(key);
  if (PROJECTED_REVENUE_KEYS.has(normalized)) return true;

  const hasRevenue =
    normalized.includes("revenue") || normalized.includes("doanhthu");
  const hasProjectedHint =
    normalized.includes("project") ||
    normalized.includes("expect") ||
    normalized.includes("estimate") ||
    normalized.includes("forecast") ||
    normalized.includes("dukien");

  return hasRevenue && hasProjectedHint;
}

function isRemainingRevenueKey(key) {
  const normalized = normalizeKey(key);
  if (REMAINING_REVENUE_KEYS.has(normalized)) return true;

  const hasRevenue =
    normalized.includes("revenue") || normalized.includes("doanhthu");
  const hasRemainingHint =
    normalized.includes("remain") ||
    normalized.includes("afterrefund") ||
    normalized.includes("net") ||
    normalized.includes("conlai") ||
    normalized.includes("hienhuu");

  return hasRevenue && hasRemainingHint;
}

function resolveProjectedRevenue(analytics) {
  if (!analytics || typeof analytics !== "object") return null;

  const visited = new Set();
  const queue = [analytics];

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current || typeof current !== "object") continue;
    if (visited.has(current)) continue;
    visited.add(current);

    for (const [key, value] of Object.entries(current)) {
      if (isProjectedRevenueKey(key)) {
        const parsed = toFiniteNumber(value);
        if (parsed != null) return parsed;
      }

      if (value && typeof value === "object") {
        queue.push(value);
      }
    }
  }

  return null;
}

function resolveRemainingRevenueAfterRefund(analytics) {
  if (!analytics || typeof analytics !== "object") return null;

  const visited = new Set();
  const queue = [analytics];

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current || typeof current !== "object") continue;
    if (visited.has(current)) continue;
    visited.add(current);

    for (const [key, value] of Object.entries(current)) {
      if (isRemainingRevenueKey(key)) {
        const parsed = toFiniteNumber(value);
        if (parsed != null) return parsed;
      }

      if (value && typeof value === "object") {
        queue.push(value);
      }
    }
  }

  return null;
}

function AdminOverview() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [groupBy, setGroupBy] = useState("DAILY");

  const [fromDate, setFromDate] = useState(() => {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    return toInputDate(firstDay);
  });

  const [toDate, setToDate] = useState(() => {
    return toInputDate(new Date());
  });

  useEffect(() => {
    fetchDashboard();
    const interval = setInterval(fetchDashboard, 30000);
    return () => clearInterval(interval);
  }, [fromDate, toDate, groupBy]);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const data = await getDashboardAnalytics(fromDate, toDate, groupBy);
      setAnalytics(data);
    } catch (error) {
      console.error("Fetch dashboard analytics error:", error);
    } finally {
      setLoading(false);
    }
  };

  const summaryCards = useMemo(() => {
    return [
      {
        title: "Tổng doanh thu",
        value: formatCompactCurrency(analytics?.totalRevenue),
        change: analytics?.revenueChangePercent ?? 0,
        icon: FiDollarSign,
        iconBg: "bg-emerald-100",
        iconText: "text-emerald-600",
      },
      {
        title: "Tổng khách hàng",
        value: formatCompactNumber(analytics?.totalCustomers),
        change: analytics?.customerChangePercent ?? 0,
        icon: FiUsers,
        iconBg: "bg-blue-100",
        iconText: "text-blue-600",
      },
      {
        title: "Số kính đã bán",
        value: formatCompactNumber(analytics?.soldItems),
        change: analytics?.soldItemsChangePercent ?? 0,
        icon: FiShoppingBag,
        iconBg: "bg-violet-100",
        iconText: "text-violet-600",
      },
      {
        title: "Số tiền đã hoàn trả",
        value: formatCompactCurrency(analytics?.refundedAmount),
        change: analytics?.refundedChangePercent ?? 0,
        icon: FiRefreshCcw,
        iconBg: "bg-amber-100",
        iconText: "text-amber-600",
      },
    ];
  }, [analytics]);

  const quickStats = useMemo(() => {
    const projectedRevenueValue = resolveProjectedRevenue(analytics);
    const remainingRevenueAfterRefundValue =
      resolveRemainingRevenueAfterRefund(analytics);

    return [
      {
        label: "Doanh thu dự kiến",
        value: formatCurrency(projectedRevenueValue),
      },
      {
        label: "Tiền hiện hữu sau refund",
        value: formatCurrency(remainingRevenueAfterRefundValue),
      },
      {
        label: "Tổng đơn hàng",
        value: formatCompactNumber(analytics?.totalOrders),
      },
      {
        label: "Đơn hoàn tất",
        value: formatCompactNumber(analytics?.completedOrders),
      },
      {
        label: "Khách mới tạo tài khoản",
        value: formatCompactNumber(analytics?.newCustomers),
      },
      {
        label: "Đơn chờ xử lý",
        value: formatCompactNumber(analytics?.pendingOrders),
      },
      {
        label: "Đơn đang giao",
        value: formatCompactNumber(analytics?.shippingOrders),
      },
    ];
  }, [analytics]);

  const timeline = analytics?.timeline || [];
  const bestByQuantity = analytics?.bestSellingProductsByQuantity || [];
  const bestByRevenue = analytics?.bestSellingProductsByRevenue || [];
  const orderStatusReport = analytics?.orderStatusReport || [];
  const topCustomersBySpending = analytics?.topCustomersBySpending || [];

  const topCustomers = useMemo(() => {
    return topCustomersBySpending.map((item, index) => ({
      rank: index + 1,
      userId: item?.userId,
      customerName: item?.customerName || "Guest",
      orderCount: Number(item?.orderCount || 0),
      totalSpent: Number(item?.totalSpent || 0),
    }));
  }, [topCustomersBySpending]);

  const revenueChartOptions = useMemo(() => {
    return {
      chart: {
        type: "bar",
        toolbar: { show: false },
        zoom: { enabled: false },
        fontFamily: "Inter, system-ui, sans-serif",
      },
      colors: ["#3b82f6"],
      dataLabels: { enabled: false },
      stroke: { show: false },
      plotOptions: {
        bar: {
          borderRadius: 8,
          columnWidth: "54%",
        },
      },
      xaxis: {
        categories: timeline.map((item) => item.label),
        axisBorder: { show: false },
        axisTicks: { show: false },
        labels: {
          rotate: -20,
          style: {
            colors: "#94a3b8",
            fontSize: "11px",
          },
        },
      },
      yaxis: {
        labels: {
          formatter: (value) => formatAxisCurrency(value),
          style: {
            colors: "#94a3b8",
            fontSize: "11px",
          },
        },
      },
      grid: {
        borderColor: "#e5e7eb",
        strokeDashArray: 4,
      },
      tooltip: {
        y: {
          formatter: (value) => formatCurrency(value),
        },
      },
      legend: { show: false },
    };
  }, [timeline]);

  const revenueChartSeries = useMemo(() => {
    return [
      {
        name: "Doanh thu",
        data: timeline.map((item) => Number(item.revenue || 0)),
      },
    ];
  }, [timeline]);

  const detailLineChartOptions = useMemo(() => {
    return {
      chart: {
        type: "line",
        toolbar: { show: false },
        zoom: { enabled: false },
        fontFamily: "Inter, system-ui, sans-serif",
      },
      colors: ["#10b981", "#3b82f6", "#8b5cf6", "#f59e0b"],
      stroke: {
        width: [3, 3, 3, 3],
        curve: "smooth",
      },
      dataLabels: { enabled: false },
      markers: {
        size: 4,
        hover: {
          size: 6,
        },
      },
      xaxis: {
        categories: timeline.map((item) => item.label),
        axisBorder: { show: false },
        axisTicks: { show: false },
        labels: {
          rotate: -20,
          style: {
            colors: "#94a3b8",
            fontSize: "11px",
          },
        },
      },
      yaxis: {
        labels: {
          formatter: (value) => formatAxisCurrency(value),
          style: {
            colors: "#94a3b8",
            fontSize: "11px",
          },
        },
      },
      grid: {
        borderColor: "#e5e7eb",
        strokeDashArray: 4,
      },
      tooltip: {
        shared: true,
        intersect: false,
      },
      legend: {
        position: "bottom",
        horizontalAlign: "left",
      },
    };
  }, [timeline]);

  const detailLineChartSeries = useMemo(() => {
    return [
      {
        name: "Doanh thu",
        data: timeline.map((item) => Number(item.revenue || 0)),
      },
      {
        name: "Khách hàng",
        data: timeline.map((item) => Number(item.customerRegistrations || 0)),
      },
      {
        name: "Kính đã bán",
        data: timeline.map((item) => Number(item.soldItems || 0)),
      },
      {
        name: "Hoàn trả",
        data: timeline.map((item) => Number(item.refundedAmount || 0)),
      },
    ];
  }, [timeline]);

  const bestByQuantityOptions = useMemo(() => {
    return buildHorizontalBarOptions(
      bestByQuantity.map((item) => item.productName),
      "Số lượng",
    );
  }, [bestByQuantity]);

  const bestByQuantitySeries = useMemo(() => {
    return [
      {
        name: "Số lượng",
        data: bestByQuantity.map((item) => Number(item.quantitySold || 0)),
      },
    ];
  }, [bestByQuantity]);

  const bestByRevenueOptions = useMemo(() => {
    return buildHorizontalBarOptions(
      bestByRevenue.map((item) => item.productName),
      "Doanh thu",
      true,
    );
  }, [bestByRevenue]);

  const bestByRevenueSeries = useMemo(() => {
    return [
      {
        name: "Doanh thu",
        data: bestByRevenue.map((item) => Number(item.revenue || 0)),
      },
    ];
  }, [bestByRevenue]);

  const signupChartOptions = useMemo(() => {
    return {
      chart: {
        type: "bar",
        toolbar: { show: false },
        fontFamily: "Inter, system-ui, sans-serif",
      },
      colors: ["#10b981"],
      dataLabels: { enabled: false },
      plotOptions: {
        bar: {
          borderRadius: 6,
          columnWidth: "58%",
        },
      },
      xaxis: {
        categories: timeline.map((item) => item.label),
        axisBorder: { show: false },
        axisTicks: { show: false },
        labels: {
          rotate: -20,
          style: {
            colors: "#94a3b8",
            fontSize: "11px",
          },
        },
      },
      yaxis: {
        labels: {
          style: {
            colors: "#94a3b8",
            fontSize: "11px",
          },
        },
      },
      grid: {
        borderColor: "#e5e7eb",
        strokeDashArray: 4,
      },
      legend: { show: false },
      tooltip: {
        y: {
          formatter: (value) =>
            `${Number(value || 0).toLocaleString("vi-VN")} khách`,
        },
      },
    };
  }, [timeline]);

  const signupChartSeries = useMemo(() => {
    return [
      {
        name: "Khách hàng tạo tài khoản",
        data: timeline.map((item) => Number(item.customerRegistrations || 0)),
      },
    ];
  }, [timeline]);

  const orderStatusText = useMemo(() => {
    return orderStatusReport
      .map((item) => `${item.status}: ${item.count}`)
      .join(" · ");
  }, [orderStatusReport]);

  return (
    <div className="px-8 pt-6 pb-12 bg-gray-50 min-h-screen">
      <motion.div {...fadeUp(0)} className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">
          Báo cáo doanh thu, đơn hàng, khách hàng, sản phẩm bán chạy và hoàn
          tiền
        </p>
      </motion.div>

      <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
        {summaryCards.map((card, index) => {
          const Icon = card.icon;
          const positive = Number(card.change || 0) >= 0;

          return (
            <motion.div
              key={card.title}
              {...fadeUp(index * 0.05)}
              className="bg-white rounded-2xl border border-gray-200 shadow-sm px-5 py-4"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-sm text-gray-500">{card.title}</div>
                  <div className="text-3xl font-bold text-gray-900 mt-1">
                    {card.value}
                  </div>
                  <div
                    className={`text-sm mt-2 ${positive ? "text-emerald-600" : "text-red-500"}`}
                  >
                    {positive ? "↗" : "↘"}{" "}
                    {Math.abs(Number(card.change || 0)).toFixed(1)}% so với kỳ
                    trước
                  </div>
                </div>

                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center ${card.iconBg}`}
                >
                  <Icon className={card.iconText} size={20} />
                </div>
              </div>
            </motion.div>
          );
        })}
      </section>

      <motion.section
        {...fadeUp(0.1)}
        className="mt-6 bg-white rounded-2xl border border-gray-200 shadow-sm p-5"
      >
        <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
          <div className="flex flex-wrap items-end gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-2">
                Từ ngày
              </label>
              <div className="relative">
                <FiCalendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="pl-10 pr-4 py-3 border border-gray-200 rounded-xl bg-white text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-2">
                Đến ngày
              </label>
              <div className="relative">
                <FiCalendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="pl-10 pr-4 py-3 border border-gray-200 rounded-xl bg-white text-sm"
                />
              </div>
            </div>

            <button
              onClick={fetchDashboard}
              className="px-5 py-3 rounded-xl bg-gray-900 hover:bg-gray-800 text-white font-semibold text-sm"
            >
              Tải lại
            </button>
          </div>

          <div className="inline-flex rounded-xl bg-gray-100 p-1 self-start">
            <button
              type="button"
              onClick={() => setGroupBy("DAILY")}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
                groupBy === "DAILY"
                  ? "bg-white text-blue-600 shadow-sm"
                  : "text-gray-500"
              }`}
            >
              Theo tuần
            </button>
            <button
              type="button"
              onClick={() => setGroupBy("MONTHLY")}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
                groupBy === "MONTHLY"
                  ? "bg-white text-blue-600 shadow-sm"
                  : "text-gray-500"
              }`}
            >
              Theo tháng
            </button>
          </div>
        </div>
      </motion.section>

      <motion.section
        {...fadeUp(0.15)}
        className="mt-5 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-7 gap-4"
      >
        {quickStats.map((item) => (
          <div
            key={item.label}
            className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm"
          >
            <div className="text-xs uppercase tracking-wide text-gray-400 font-semibold">
              {item.label}
            </div>
            <div className="text-lg font-bold text-gray-900 mt-2">
              {item.value}
            </div>
          </div>
        ))}
      </motion.section>

      <div className="mt-5 grid grid-cols-1 xl:grid-cols-2 gap-5">
        <motion.div
          {...fadeUp(0.2)}
          className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5"
        >
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-lg font-bold text-gray-900">
                Doanh thu theo thời gian
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Theo dõi doanh thu trong khoảng thời gian đã chọn
              </p>
            </div>
            <FiTrendingUp className="text-blue-500" size={20} />
          </div>

          {loading ? (
            <div className="h-[320px] flex items-center justify-center text-gray-400">
              Loading...
            </div>
          ) : (
            <Chart
              options={revenueChartOptions}
              series={revenueChartSeries}
              type="bar"
              height={320}
            />
          )}
        </motion.div>

        <motion.div
          {...fadeUp(0.25)}
          className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5"
        >
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-lg font-bold text-gray-900">
                Thống kê chi tiết
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Doanh thu · Khách hàng · Kính đã bán · Hoàn trả
              </p>
            </div>
            <FiBarChart2 className="text-emerald-500" size={20} />
          </div>

          {loading ? (
            <div className="h-[320px] flex items-center justify-center text-gray-400">
              Loading...
            </div>
          ) : (
            <Chart
              options={detailLineChartOptions}
              series={detailLineChartSeries}
              type="line"
              height={320}
            />
          )}
        </motion.div>
      </div>

      <div className="mt-5 grid grid-cols-1 xl:grid-cols-2 gap-5">
        <motion.div
          {...fadeUp(0.3)}
          className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5"
        >
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-lg font-bold text-gray-900">
                Sản phẩm bán chạy - Số lượng
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Báo cáo sản phẩm bán chạy nhất theo số lượng
              </p>
            </div>
            <FiPackage className="text-violet-500" size={20} />
          </div>

          {loading ? (
            <div className="h-[320px] flex items-center justify-center text-gray-400">
              Loading...
            </div>
          ) : (
            <Chart
              options={bestByQuantityOptions}
              series={bestByQuantitySeries}
              type="bar"
              height={320}
            />
          )}
        </motion.div>

        <motion.div
          {...fadeUp(0.35)}
          className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5"
        >
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-lg font-bold text-gray-900">
                Sản phẩm bán chạy - Doanh thu
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Báo cáo doanh thu của từng sản phẩm
              </p>
            </div>
            <FiDollarSign className="text-blue-500" size={20} />
          </div>

          {loading ? (
            <div className="h-[320px] flex items-center justify-center text-gray-400">
              Loading...
            </div>
          ) : (
            <Chart
              options={bestByRevenueOptions}
              series={bestByRevenueSeries}
              type="bar"
              height={320}
            />
          )}
        </motion.div>
      </div>

      <motion.div
        {...fadeUp(0.38)}
        className="mt-5 bg-white rounded-2xl border border-gray-200 shadow-sm p-5"
      >
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-lg font-bold text-gray-900">
              Khách hàng mua nhiều nhất
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Danh sách khách hàng đã mua hàng và tổng số tiền đã chi
            </p>
          </div>
          <FiUsers className="text-indigo-500" size={20} />
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-left text-gray-500">
                <th className="py-3 pr-4 font-semibold">#</th>
                <th className="py-3 pr-4 font-semibold">Khách hàng</th>
                <th className="py-3 pr-4 font-semibold">User ID</th>
                <th className="py-3 pr-4 font-semibold">Số đơn</th>
                <th className="py-3 font-semibold text-right">Tổng chi tiêu</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-gray-400">
                    Loading...
                  </td>
                </tr>
              ) : topCustomers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-gray-400">
                    Chưa có dữ liệu khách hàng mua hàng trong khoảng thời gian
                    này
                  </td>
                </tr>
              ) : (
                topCustomers.map((customer) => (
                  <tr
                    key={`${customer.userId ?? customer.customerName}-${customer.rank}`}
                    className="border-b border-gray-100 last:border-none"
                  >
                    <td className="py-3 pr-4 font-semibold text-gray-700">
                      {customer.rank}
                    </td>
                    <td className="py-3 pr-4 text-gray-900 font-medium">
                      {customer.customerName}
                    </td>
                    <td className="py-3 pr-4 text-gray-500">
                      {customer.userId ?? "-"}
                    </td>
                    <td className="py-3 pr-4 text-gray-700">
                      {customer.orderCount.toLocaleString("vi-VN")}
                    </td>
                    <td className="py-3 text-right font-semibold text-gray-900">
                      {formatCurrency(customer.totalSpent)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

      <motion.div
        {...fadeUp(0.4)}
        className="mt-5 bg-white rounded-2xl border border-gray-200 shadow-sm p-5"
      >
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 mb-3">
          <div>
            <h2 className="text-lg font-bold text-gray-900">
              Số lượng khách hàng tạo tài khoản
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Theo dõi lượng khách hàng mới theo thời gian
            </p>
          </div>

          <div className="text-sm text-gray-500">
            {orderStatusText || "Không có dữ liệu đơn hàng"}
          </div>
        </div>

        {loading ? (
          <div className="h-[320px] flex items-center justify-center text-gray-400">
            Loading...
          </div>
        ) : (
          <Chart
            options={signupChartOptions}
            series={signupChartSeries}
            type="bar"
            height={320}
          />
        )}
      </motion.div>
    </div>
  );
}

function buildHorizontalBarOptions(categories, seriesName, isCurrency = false) {
  return {
    chart: {
      type: "bar",
      toolbar: { show: false },
      fontFamily: "Inter, system-ui, sans-serif",
    },
    colors: ["#8b5cf6"],
    plotOptions: {
      bar: {
        horizontal: true,
        borderRadius: 8,
        barHeight: "56%",
      },
    },
    dataLabels: { enabled: false },
    xaxis: {
      categories,
      labels: {
        formatter: (value) =>
          isCurrency
            ? formatAxisCurrency(value)
            : Number(value || 0).toLocaleString("vi-VN"),
        style: {
          colors: "#94a3b8",
          fontSize: "11px",
        },
      },
    },
    yaxis: {
      labels: {
        style: {
          colors: "#64748b",
          fontSize: "12px",
          fontWeight: 600,
        },
      },
    },
    grid: {
      borderColor: "#e5e7eb",
      strokeDashArray: 4,
    },
    tooltip: {
      y: {
        formatter: (value) =>
          isCurrency
            ? formatCurrency(value)
            : `${Number(value || 0).toLocaleString("vi-VN")}`,
      },
    },
    legend: { show: false },
  };
}

function formatCurrency(value) {
  if (value == null || value === "") return "-";

  const number = Number(value);
  if (!Number.isFinite(number)) return "-";

  return `${number.toLocaleString("vi-VN")} VND`;
}

function formatCompactCurrency(value) {
  const number = Number(value || 0);

  if (number >= 1_000_000_000) {
    return `${(number / 1_000_000_000).toFixed(1)}B VND`;
  }

  if (number >= 1_000_000) {
    return `${(number / 1_000_000).toFixed(1)}M VND`;
  }

  if (number >= 1_000) {
    return `${(number / 1_000).toFixed(1)}K VND`;
  }

  return `${number.toLocaleString("vi-VN")} VND`;
}

function formatCompactNumber(value) {
  const number = Number(value || 0);

  if (number >= 1_000_000_000) {
    return `${(number / 1_000_000_000).toFixed(1)}B`;
  }

  if (number >= 1_000_000) {
    return `${(number / 1_000_000).toFixed(1)}M`;
  }

  if (number >= 1_000) {
    return `${(number / 1_000).toFixed(1)}K`;
  }

  return `${number.toLocaleString("vi-VN")}`;
}

function formatAxisCurrency(value) {
  const number = Number(value || 0);

  if (number >= 1_000_000_000) {
    return `${(number / 1_000_000_000).toFixed(0)}B`;
  }

  if (number >= 1_000_000) {
    return `${(number / 1_000_000).toFixed(0)}M`;
  }

  if (number >= 1_000) {
    return `${(number / 1_000).toFixed(0)}K`;
  }

  return `${number.toLocaleString("vi-VN")}`;
}

function toInputDate(date) {
  const local = new Date(date);
  local.setMinutes(local.getMinutes() - local.getTimezoneOffset());
  return local.toISOString().slice(0, 10);
}

export default AdminOverview;
