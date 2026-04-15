import { useEffect, useMemo, useState } from "react";
import {
  FiCalendar,
  FiDollarSign,
  FiShoppingBag,
  FiRefreshCcw,
  FiCreditCard,
  FiTrendingUp,
  FiPackage,
  FiXCircle,
} from "react-icons/fi";
import Chart from "react-apexcharts";
import { motion } from "framer-motion";
import { getDashboardSummary } from "../services/dashboardService";
import { getAllOrders } from "../services/orderService";

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.45, delay },
});

const ORDER_DATE_REGEX = /^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/;

const parseOrderDate = (order) => {
  if (
    order?.rawDate instanceof Date &&
    !Number.isNaN(order.rawDate.getTime())
  ) {
    return order.rawDate;
  }

  const fallbackDate = order?.orderDate || order?.createdAt || order?.date;

  if (typeof fallbackDate === "string") {
    const parts = fallbackDate.match(ORDER_DATE_REGEX);
    if (parts) {
      const [, day, month, year] = parts;
      const parsedByParts = new Date(
        Number(year),
        Number(month) - 1,
        Number(day),
      );
      if (!Number.isNaN(parsedByParts.getTime())) return parsedByParts;
    }
  }

  const parsed = fallbackDate ? new Date(fallbackDate) : new Date();
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
};

const formatDayKey = (date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

const formatMonthKey = (date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

const getOrderRevenue = (order) =>
  Number(order?.total || order?.finalPrice || 0);

const buildRevenueTrend = (orders, chartMode, filter) => {
  const buildDailySeries = () => {
    const buckets = new Map();
    const days = filter === "7days" ? 7 : 30;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = days - 1; i >= 0; i -= 1) {
      const current = new Date(today);
      current.setDate(today.getDate() - i);
      buckets.set(formatDayKey(current), 0);
    }

    (orders || []).forEach((order) => {
      const key = formatDayKey(parseOrderDate(order));
      if (!buckets.has(key)) return;
      buckets.set(key, (buckets.get(key) || 0) + getOrderRevenue(order));
    });

    const categories = [];
    const data = [];
    for (const [key, value] of buckets.entries()) {
      categories.push(
        new Date(
          Number(key.slice(0, 4)),
          Number(key.slice(5, 7)) - 1,
          Number(key.slice(8, 10)),
        ).toLocaleDateString("vi-VN", {
          day: "2-digit",
          month: "2-digit",
        }),
      );
      data.push(value);
    }

    return {
      title: "Doanh thu theo ngày (tất cả đơn hàng)",
      subtitle: "7 hoặc 30 mốc gần nhất tùy bộ lọc",
      categories,
      data,
    };
  };

  const buildMonthlySeries = () => {
    const buckets = new Map();
    const months = 12;
    const today = new Date();

    for (let i = months - 1; i >= 0; i -= 1) {
      const current = new Date(today.getFullYear(), today.getMonth() - i, 1);
      buckets.set(formatMonthKey(current), 0);
    }

    (orders || []).forEach((order) => {
      const key = formatMonthKey(parseOrderDate(order));
      if (!buckets.has(key)) return;
      buckets.set(key, (buckets.get(key) || 0) + getOrderRevenue(order));
    });

    const categories = [];
    const data = [];
    for (const [key, value] of buckets.entries()) {
      const [year, month] = key.split("-");
      categories.push(
        new Date(Number(year), Number(month) - 1, 1).toLocaleDateString(
          "vi-VN",
          {
            month: "short",
            year: "numeric",
          },
        ),
      );
      data.push(value);
    }

    return {
      title: "Doanh thu theo tháng (tất cả đơn hàng)",
      subtitle: "12 tháng gần nhất",
      categories,
      data,
    };
  };

  return chartMode === "monthly" ? buildMonthlySeries() : buildDailySeries();
};

function AdminOverview() {
  const [summary, setSummary] = useState(null);
  const [orders, setOrders] = useState([]);
  const [filter, setFilter] = useState("7days");
  const [chartMode, setChartMode] = useState("daily");

  const dateRange = useMemo(() => {
    const now = new Date();
    const toDate = now.toISOString().split("T")[0];
    const from = new Date();
    from.setDate(now.getDate() - (filter === "7days" ? 6 : 29));
    const fromDate = from.toISOString().split("T")[0];
    return { fromDate, toDate };
  }, [filter]);

  const derivedHeldMoney = useMemo(() => {
    return (orders || []).reduce((sum, order) => {
      const orderStatus = String(order?.status || "").toLowerCase();
      const paymentStatus = String(order?.paymentStatus || "").toUpperCase();

      const isInProgress = [
        "pending",
        "processing",
        "shipped",
        "shipping",
        "delivering",
      ].includes(orderStatus);
      const isUnpaid = !["PAID", "PAID_FULL", "REFUNDED"].includes(
        paymentStatus,
      );

      if (!isInProgress || !isUnpaid) return sum;
      return sum + Number(order?.total || 0);
    }, 0);
  }, [orders]);

  const currentHeldMoney = useMemo(() => {
    const apiValue = Number(summary?.currentHeldMoney);

    if (Number.isFinite(apiValue) && apiValue > 0) return apiValue;
    if (derivedHeldMoney > 0) return derivedHeldMoney;
    if (Number.isFinite(apiValue)) return apiValue;
    return 0;
  }, [summary, derivedHeldMoney]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [summaryData, ordersData] = await Promise.all([
          getDashboardSummary(dateRange.fromDate, dateRange.toDate),
          getAllOrders(),
        ]);
        setSummary(summaryData);
        setOrders(ordersData || []);
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 20000);
    return () => clearInterval(interval);
  }, [dateRange]);

  const statCards = [
    {
      label: "Gross Revenue",
      value: `${Number(summary?.grossRevenue || 0).toLocaleString("vi-VN")} ₫`,
      icon: FiDollarSign,
      bg: "bg-emerald-100",
      text: "text-emerald-600",
    },
    {
      label: "Refunded / Deducted",
      value: `${Number(summary?.refundedAmount || 0).toLocaleString("vi-VN")} ₫`,
      icon: FiRefreshCcw,
      bg: "bg-amber-100",
      text: "text-amber-600",
    },
    {
      label: "Net Revenue",
      value: `${Number(summary?.netRevenue || 0).toLocaleString("vi-VN")} ₫`,
      icon: FiTrendingUp,
      bg: "bg-blue-100",
      text: "text-blue-600",
    },
    {
      label: "Current Held Money",
      value: `${Number(currentHeldMoney || 0).toLocaleString("vi-VN")} ₫`,
      icon: FiCreditCard,
      bg: "bg-amber-100",
      text: "text-amber-600",
    },
    {
      label: "Collected Cash",
      value: `${Number(summary?.collectedCash || 0).toLocaleString("vi-VN")} ₫`,
      icon: FiCreditCard,
      bg: "bg-violet-100",
      text: "text-violet-600",
    },
    {
      label: "Total Orders",
      value: Number(summary?.totalOrders || 0).toLocaleString("vi-VN"),
      icon: FiShoppingBag,
      bg: "bg-slate-100",
      text: "text-slate-600",
    },
    {
      label: "Shipping Orders",
      value: Number(summary?.shippingOrders || 0).toLocaleString("vi-VN"),
      icon: FiPackage,
      bg: "bg-cyan-100",
      text: "text-cyan-600",
    },
    {
      label: "Cancelled Orders",
      value: Number(summary?.cancelledOrders || 0).toLocaleString("vi-VN"),
      icon: FiXCircle,
      bg: "bg-slate-100",
      text: "text-slate-600",
    },
  ];

  const recentOrders = useMemo(() => {
    return [...orders].slice(0, 5);
  }, [orders]);

  const revenueTrend = useMemo(
    () => buildRevenueTrend(orders, chartMode, filter),
    [orders, chartMode, filter],
  );

  const revenueChartOptions = useMemo(
    () => ({
      chart: {
        type: "bar",
        toolbar: { show: false },
        zoom: { enabled: false },
        fontFamily: "Inter, system-ui, sans-serif",
        sparkline: { enabled: false },
      },
      colors: ["#2563eb"],
      dataLabels: { enabled: false },
      fill: {
        type: "gradient",
        gradient: {
          shadeIntensity: 0.25,
          opacityFrom: 0.92,
          opacityTo: 0.82,
          stops: [0, 90, 100],
        },
      },
      plotOptions: {
        bar: {
          horizontal: false,
          borderRadius: 10,
          columnWidth: "48%",
          distributed: false,
        },
      },
      grid: {
        borderColor: "#e5e7eb",
        strokeDashArray: 4,
        padding: {
          top: 0,
          right: 8,
          bottom: 0,
          left: 8,
        },
      },
      xaxis: {
        categories: revenueTrend.categories,
        axisBorder: { show: false },
        axisTicks: { show: false },
        labels: {
          style: {
            colors: "#64748b",
            fontSize: "12px",
            fontWeight: 600,
          },
          rotate: -30,
          trim: false,
        },
      },
      states: {
        hover: {
          filter: { type: "lighten", value: 0.08 },
        },
        active: {
          filter: { type: "none" },
        },
      },
      yaxis: {
        min: 0,
        labels: {
          formatter: (value) =>
            `${Number(value || 0).toLocaleString("vi-VN")} ₫`,
          style: {
            colors: "#64748b",
            fontSize: "12px",
            fontWeight: 600,
          },
        },
      },
      tooltip: {
        shared: false,
        intersect: true,
        custom: ({ series, seriesIndex, dataPointIndex, w }) => {
          const value = series[seriesIndex][dataPointIndex] || 0;
          const label = w.globals.labels[dataPointIndex] || "";
          return `
            <div style="padding:12px 14px;background:#0f172a;color:#fff;border-radius:14px;box-shadow:0 18px 40px rgba(15,23,42,.18);min-width:140px">
              <div style="font-size:12px;opacity:.72;margin-bottom:4px">${label}</div>
              <div style="font-size:18px;font-weight:700">${Number(value).toLocaleString("vi-VN")} ₫</div>
            </div>
          `;
        },
      },
      stroke: {
        show: false,
      },
      legend: {
        show: false,
      },
    }),
    [revenueTrend.categories],
  );

  const revenueSeries = useMemo(
    () => [
      {
        name: "Revenue",
        data: revenueTrend.data,
      },
    ],
    [revenueTrend.data],
  );

  const totalTrendRevenue = useMemo(
    () => revenueTrend.data.reduce((sum, value) => sum + Number(value || 0), 0),
    [revenueTrend.data],
  );

  const todayStrDisplay = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="px-8 pt-8 pb-16 bg-gradient-to-br from-gray-50 to-gray-200 min-h-screen">
      <motion.div
        {...fadeUp(0)}
        className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
            System Overview
          </h1>
          <p className="text-sm text-gray-500 mt-1 font-medium">
            Financial dashboard and order performance
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium"
          >
            <option value="7days">Last 7 days</option>
            <option value="30days">Last 30 days</option>
          </select>

          <div className="flex items-center gap-3 text-sm font-semibold text-gray-600 bg-white border border-gray-100 shadow-xl rounded-2xl px-5 py-3">
            <FiCalendar className="text-blue-500" size={16} />
            <span>{todayStrDisplay}</span>
          </div>
        </div>
      </motion.div>

      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
        {statCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <motion.div
              key={card.label}
              {...fadeUp(0.05 * i)}
              className="bg-white rounded-3xl p-7 border border-gray-50 shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all duration-300"
            >
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                  {card.label}
                </p>
                <div
                  className={`w-12 h-12 flex items-center justify-center rounded-2xl ${card.bg} ${card.text}`}
                >
                  <Icon size={20} />
                </div>
              </div>
              <div className="mt-6">
                <p className="text-2xl font-black text-gray-800 tracking-tight">
                  {card.value}
                </p>
              </div>
            </motion.div>
          );
        })}
      </section>

      <section className="mt-10 bg-white rounded-[2rem] border border-gray-100 p-8 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl font-black text-gray-800">Revenue Trend</h2>
            <p className="text-sm text-gray-500 mt-1">
              {revenueTrend.title} · {revenueTrend.subtitle} · Tổng:{" "}
              {Number(totalTrendRevenue || 0).toLocaleString("vi-VN")} ₫
            </p>
          </div>

          <div className="inline-flex rounded-2xl bg-gray-100 p-1 self-start">
            <button
              type="button"
              onClick={() => setChartMode("daily")}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${
                chartMode === "daily"
                  ? "bg-white text-blue-600 shadow-sm"
                  : "text-gray-500 hover:text-gray-800"
              }`}
            >
              Theo ngày
            </button>
            <button
              type="button"
              onClick={() => setChartMode("monthly")}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${
                chartMode === "monthly"
                  ? "bg-white text-blue-600 shadow-sm"
                  : "text-gray-500 hover:text-gray-800"
              }`}
            >
              Theo tháng
            </button>
          </div>
        </div>

        <div className="rounded-[1.75rem] border border-slate-100 bg-gradient-to-br from-slate-50 via-white to-blue-50/40 p-4 shadow-inner">
          {revenueSeries[0].data.some((value) => Number(value || 0) > 0) ? (
            <Chart
              options={revenueChartOptions}
              series={revenueSeries}
              type="bar"
              height={360}
            />
          ) : (
            <div className="h-[360px] flex items-center justify-center text-gray-400 text-sm">
              No revenue data for the selected range
            </div>
          )}
        </div>
      </section>

      <section className="mt-10 bg-white rounded-[2rem] border border-gray-100 p-8 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-black text-gray-800">Recent Orders</h2>
          <div className="text-sm text-gray-500">
            {dateRange.fromDate} → {dateRange.toDate}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px] text-sm">
            <thead>
              <tr className="text-left text-gray-400 border-b">
                <th className="py-3">Order</th>
                <th className="py-3">Customer</th>
                <th className="py-3">Status</th>
                <th className="py-3 text-right">Total</th>
                <th className="py-3">Payment</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.map((order) => (
                <tr key={order.orderId} className="border-b last:border-0">
                  <td className="py-4 font-semibold text-gray-700">
                    {order.code || order.orderCode}
                  </td>
                  <td className="py-4">
                    {order.customer || order.fullName || "-"}
                  </td>
                  <td className="py-4">{order.status || "-"}</td>
                  <td className="py-4 text-right font-bold">
                    {Number(
                      order.total || order.finalPrice || 0,
                    ).toLocaleString("vi-VN")}{" "}
                    ₫
                  </td>
                  <td className="py-4">{order.paymentStatus || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {!recentOrders.length && (
            <div className="py-12 text-center text-gray-400">
              No orders found
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

export default AdminOverview;
