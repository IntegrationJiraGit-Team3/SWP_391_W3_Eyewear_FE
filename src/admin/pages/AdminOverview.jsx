import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import Chart from "react-apexcharts";

import {
  FiDollarSign,
  FiShoppingCart,
  FiUsers,
  FiTrendingUp,
  FiArrowUpRight,
  FiArrowDownRight,
  FiCalendar, FiX
} from "react-icons/fi";

import { useEffect, useState, useMemo } from "react";
import { getAllOrders } from "../services/orderService";
import {
  getCustomerCount,
  getOrdersCount,
  getTotalRevenue,
} from "../services/dashboardService";

/* ── animation helpers ── */
const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, delay, ease: "easeOut" },
});

/* ── stat card config ── */
const statCards = [
  {
    key: "revenue",
    label: "Total Revenue",
    icon: FiDollarSign,
    color: "blue",
    bg: "bg-blue-50",
    text: "text-blue-600",
    ring: "ring-blue-100",
  },
  {
    key: "orders",
    label: "Orders",
    icon: FiShoppingCart,
    color: "green",
    bg: "bg-green-50",
    text: "text-green-600",
    ring: "ring-green-100",
  },
  {
    key: "customers",
    label: "Customers",
    icon: FiUsers,
    color: "yellow",
    bg: "bg-yellow-50",
    text: "text-yellow-600",
    ring: "ring-yellow-100",
  },
  {
    key: "growth",
    label: "Avg Value",
    icon: FiTrendingUp,
    color: "purple",
    bg: "bg-purple-50",
    text: "text-purple-600",
    ring: "ring-purple-100",
  },
];

/* ── order status badge ── */
const statusStyle = {
  completed: "bg-green-50 text-green-700",
  pending: "bg-yellow-50 text-yellow-700",
  cancelled: "bg-red-50 text-red-700",
  shipped: "bg-blue-50 text-blue-700",
  processing: "bg-indigo-50 text-indigo-700",
};

const statusText = {
  completed: "Completed",
  pending: "Pending",
  cancelled: "Cancelled",
  shipped: "Shipped",
  processing: "Processing",
};

function AdminOverview() {
  const [orders, setOrders] = useState([]);
  const [orderCount, setOrderCount] = useState(0);
  const [customerCount, setCustomerCount] = useState(0);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [filter, setFilter] = useState("7days"); // mặc định 7 ngày

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [ordersData, orderCountData, customerCountData, revData] =
          await Promise.all([
            getAllOrders(),
            getOrdersCount(),
            getCustomerCount(),
            getTotalRevenue(),
          ]);

        setOrderCount(orderCountData);
        setCustomerCount(customerCountData);
        setOrders(ordersData);
        setTotalRevenue(revData.totalRevenue || 0);
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 20000); // 20s
    return () => clearInterval(interval);
  }, []);

  const stats = useMemo(() => {
    const deliveredOrders = orders.filter((o) => o.status === "completed");
    const avgValue =
      deliveredOrders.length > 0 ? totalRevenue / deliveredOrders.length : 0;

    // Simple growth logic: compare today vs yesterday if data exists
    const todayStr = new Date().toLocaleDateString("vi-VN");
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toLocaleDateString("vi-VN");

    const todayRevenue = orders
      .filter((o) => o.createdAt === todayStr && o.status === "completed")
      .reduce((s, o) => s + o.total, 0);
    const yesterdayRevenue = orders
      .filter((o) => o.createdAt === yesterdayStr && o.status === "completed")
      .reduce((s, o) => s + o.total, 0);

    const growth =
      yesterdayRevenue > 0
        ? ((todayRevenue - yesterdayRevenue) / yesterdayRevenue) * 100
        : todayRevenue > 0
          ? 100
          : 0;

    return {
      avgValue,
      growth: growth.toFixed(1),
      isGrowthUp: growth >= 0,
    };
  }, [orders, totalRevenue]);

  const { revenueChartSeries, revenueChartCategories } = useMemo(() => {
    const days = filter === "7days" ? 7 : 30;
    const categories = [];
    const values = [];
    const now = new Date();

    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      const localeDateStr = d.toLocaleDateString("vi-VN");
      categories.push(localeDateStr.split("/").slice(0, 2).join("/"));

      const dailyTotal = orders
        .filter((o) => {
          const oDate = o.rawDate ? new Date(o.rawDate) : null;
          if (!oDate) return false;
          return (
            oDate.toLocaleDateString("vi-VN") === localeDateStr &&
            o.status === "completed"
          );
        })
        .reduce((sum, o) => {
          const val =
            typeof o.total === "number" ? o.total : parseFloat(o.total || 0);
          return sum + (isNaN(val) ? 0 : val);
        }, 0);
      values.push(dailyTotal);
    }

    return {
      revenueChartSeries: [{ name: "Revenue", data: values }],
      revenueChartCategories: categories,
    };
  }, [orders, filter]);

  const recentOrdersFiltered = useMemo(() => {
    const now = new Date();
    const days = filter === "7days" ? 7 : 30;

    return orders
      .filter((order) => {
        const created = order.rawDate ? new Date(order.rawDate) : null;
        if (!created) return false;

        const diffTime = Math.abs(now.getTime() - created.getTime());
        const diffDays = diffTime / (1000 * 60 * 60 * 24);
        return diffDays <= days;
      })
      .sort((a, b) => {
        const dateA = a.rawDate ? new Date(a.rawDate) : new Date(0);
        const dateB = b.rawDate ? new Date(b.rawDate) : new Date(0);
        return dateB - dateA;
      })
      .slice(0, 5);
  }, [orders, filter]);

  const statusRatioData = useMemo(() => {
    const statuses = ["completed", "pending", "shipped", "cancelled"];
    const counts = statuses.map(
      (s) => orders.filter((o) => o.status === s).length,
    );
    return {
      labels: ["Completed", "Pending", "Shipping", "Cancelled"],
      series: counts.some((v) => v > 0) ? counts : [45, 25, 20, 10], // fallback to mock if no data
    };
  }, [orders]);

  const todayStrDisplay = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const cancelledOrders = useMemo(() => {
    return orders.filter((o) => o.status === "cancelled");
  }, [orders]);

  return (
    <div className="px-8 pt-8 pb-16 bg-gradient-to-br from-gray-50 to-gray-200 min-h-screen">
      {/* ── TITLE ── */}
      <motion.div
        {...fadeUp(0)}
        className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
            System Overview
          </h1>
          <p className="text-sm text-gray-500 mt-1 font-medium">
            Monitoring business health and customer activity
          </p>
        </div>
        <div className="flex items-center gap-3 text-sm font-semibold text-gray-600 bg-white border border-gray-100 shadow-xl rounded-2xl px-5 py-3 hover:shadow-2xl transition-all">
          <FiCalendar className="text-blue-500" size={16} />
          <span className="capitalize">{todayStrDisplay}</span>
        </div>
      </motion.div>

      {/* ── STAT CARDS ── */}
      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
        {statCards.map((card, i) => {
          const Icon = card.icon;
          let val = "—";
          let subtext = "";
          let up = true;

          if (card.key === "orders") val = orderCount.toLocaleString();
          else if (card.key === "customers")
            val = customerCount.toLocaleString();
          else if (card.key === "revenue") {
            val = `${totalRevenue.toLocaleString("vi-VN")} ₫`;
            subtext = `${stats.growth}% today`;
            up = stats.isGrowthUp;
          } else if (card.key === "growth") {
            val = `${Math.round(stats.avgValue).toLocaleString("vi-VN")} ₫`;
            subtext = "per order";
          }

          return (
            <motion.div
              key={card.label}
              {...fadeUp(0.05 * i)}
              className="bg-white rounded-3xl p-7 border border-gray-50 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 group relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <Icon size={80} />
              </div>

              <div className="flex items-center justify-between relative z-10">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                  {card.label}
                </p>
                <div
                  className={`w-12 h-12 flex items-center justify-center rounded-2xl ${card.bg} ${card.text} shadow-lg shadow-current/20 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500`}
                >
                  <Icon size={20} />
                </div>
              </div>

              <div className="mt-6 relative z-10">
                <p className="text-3xl font-black text-gray-800 tracking-tight">
                  {val}
                </p>
                {subtext && (
                  <div
                    className={`flex items-center gap-1.5 mt-2 text-xs font-bold ${up ? "text-emerald-500" : "text-rose-500"}`}
                  >
                    {up ? <FiArrowUpRight /> : <FiArrowDownRight />}
                    <span>{subtext}</span>
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </section>

      {/* ── CHART + RECENT ORDERS ── */}
      <section className="mt-10 grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Area chart */}
        <motion.div
          {...fadeUp(0.15)}
          className="xl:col-span-2 bg-white rounded-[2.5rem] border border-gray-100 p-8 shadow-sm hover:shadow-2xl transition-all duration-500"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-black text-gray-800 letter-spacing-tight">
                {filter === "7days" ? "Weekly" : "Monthly"} Revenue
              </h2>
              <p className="text-sm text-gray-400 font-medium mt-1">
                Trends of successfully delivered orders
              </p>
            </div>
            <div className="bg-gray-50 p-1 rounded-xl border border-gray-100 flex gap-1">
              {["7days", "30days"].map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${filter === f ? "bg-white text-blue-600 shadow-md" : "text-gray-400 hover:text-gray-600"}`}
                >
                  {f === "7days" ? "7D" : "30D"}
                </button>
              ))}
            </div>
          </div>

          <Chart
            type="area"
            height={320}
            series={revenueChartSeries}
            options={{
              chart: {
                toolbar: { show: false },
                zoom: { enabled: false },
                sparkline: { enabled: false },
              },
              stroke: { curve: "smooth", width: 4 },
              colors: ["#3b82f6"],
              fill: {
                type: "gradient",
                gradient: {
                  shadeIntensity: 1,
                  opacityFrom: 0.35,
                  opacityTo: 0.02,
                  stops: [0, 95, 100],
                },
              },
              markers: { size: 0, hover: { size: 6, strokeWidth: 3 } },
              dataLabels: { enabled: false },
              xaxis: {
                categories: revenueChartCategories,
                axisBorder: { show: false },
                axisTicks: { show: false },
                labels: {
                  style: {
                    fontSize: "11px",
                    fontWeight: 600,
                    colors: "#94a3b8",
                  },
                },
              },
              yaxis: {
                labels: {
                  style: {
                    fontSize: "11px",
                    fontWeight: 600,
                    colors: "#94a3b8",
                  },
                  formatter: (v) =>
                    Math.abs(v) >= 1000000
                      ? (v / 1000000).toFixed(1) + "M"
                      : v.toLocaleString("vi-VN"),
                },
              },
              grid: {
                borderColor: "#f8fafc",
                strokeDashArray: 6,
                padding: { left: 0, right: 0 },
              },
              tooltip: {
                theme: "light",
                y: { formatter: (val) => val.toLocaleString("vi-VN") + " ₫" },
              },
            }}
          />
        </motion.div>

        {/* Recent orders */}
        <motion.div
          {...fadeUp(0.2)}
          className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-2xl transition-all duration-500 p-8 flex flex-col"
        >
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-xl font-black text-gray-800">Recent Sales</h2>
              <p className="text-xs text-gray-400 font-bold mt-1 uppercase tracking-tighter">
                Latest {recentOrdersFiltered.length} activity
              </p>
            </div>
            <Link
              to="/dashboard/orders"
              className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-50 text-gray-400 hover:bg-blue-50 hover:text-blue-600 transition-all border border-gray-100"
            >
              <FiArrowUpRight size={20} />
            </Link>
          </div>

          <div className="space-y-4 flex-1">
            {recentOrdersFiltered.map((order, i) => (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.25 + i * 0.08 }}
                className="flex items-center justify-between p-4 rounded-[1.5rem] hover:bg-blue-50/40 hover:shadow-sm transition-all duration-300 cursor-pointer group border border-transparent hover:border-blue-100"
              >
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <img
                      src={
                        order.avatar ||
                        `https://ui-avatars.com/api/?name=${order.customer}&background=random`
                      }
                      alt={order.customer}
                      className="w-11 h-11 rounded-2xl object-cover ring-2 ring-white shadow-md group-hover:scale-105 transition-transform"
                    />
                    <div
                      className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${order.status === "completed" ? "bg-emerald-500" : "bg-amber-500"}`}
                    />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-800 leading-tight group-hover:text-blue-700 transition-colors">
                      {order.customer}
                    </p>
                    <p className="text-[11px] text-gray-400 font-medium mt-1">
                      {order.createdAt}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-1.5">
                  <p className="text-sm font-black text-gray-700">
                    {order.total.toLocaleString("vi-VN")} ₫
                  </p>
                  {order.status && (
                    <span
                      className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg ${statusStyle[order.status] ?? "bg-gray-100 text-gray-500 shadow-sm"}`}
                    >
                      {statusText[order.status]}
                    </span>
                  )}
                </div>
              </motion.div>
            ))}

            {recentOrdersFiltered.length === 0 && (
              <div className="flex flex-col items-center justify-center h-40 text-gray-300 opacity-50">
                <FiShoppingCart size={40} className="mb-2" />
                <p className="text-xs font-bold uppercase">No recent orders</p>
              </div>
            )}
          </div>
        </motion.div>
      </section>

      {/* ── DONUT + LINE ── */}
      <section className="mt-10 grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Status Donut */}
        <motion.div
          {...fadeUp(0.25)}
          className="bg-white rounded-[2.5rem] border border-gray-100 p-8 shadow-sm hover:shadow-2xl transition-all duration-500 flex flex-col"
        >
          <div className="mb-8">
            <h2 className="text-xl font-black text-gray-800">Efficiency</h2>
            <p className="text-sm text-gray-400 font-medium mt-1">
              Order fulfillment status breakdown
            </p>
          </div>

          <div className="flex-1 flex items-center justify-center">
            <Chart
              type="donut"
              height={320}
              series={statusRatioData.series}
              options={{
                labels: statusRatioData.labels,
                colors: ["#10b981", "#f59e0b", "#3b82f6", "#ef4444"],
                stroke: { width: 0 },
                plotOptions: {
                  pie: {
                    donut: {
                      size: "75%",
                      labels: {
                        show: true,
                        name: {
                          fontSize: "14px",
                          fontWeight: 800,
                          color: "#64748b",
                          offsetY: -5,
                        },
                        value: {
                          fontSize: "24px",
                          fontWeight: 900,
                          color: "#1e293b",
                          offsetY: 5,
                        },
                        total: {
                          show: true,
                          label: "TOTAL",
                          fontSize: "10px",
                          fontWeight: 900,
                          color: "#94a3b8",
                          formatter: (w) =>
                            w.globals.seriesTotals.reduce((a, b) => a + b, 0),
                        },
                      },
                    },
                  },
                },
                legend: {
                  show: true,
                  position: "bottom",
                  fontSize: "12px",
                  fontWeight: 700,
                  labels: { colors: "#64748b" },
                  markers: { radius: 6 },
                },
                dataLabels: { enabled: false },
                tooltip: { theme: "light" },
              }}
            />
          </div>
        </motion.div>

        {/* Growth Trend */}
        <motion.div
          {...fadeUp(0.3)}
          className="bg-white rounded-[2.5rem] border border-gray-100 p-8 shadow-sm hover:shadow-2xl transition-all duration-500 xl:col-span-2"
        >
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-xl font-black text-gray-800">
                Growth Projection
              </h2>
              <p className="text-sm text-gray-400 font-medium mt-1">
                Cumulative revenue growth over time
              </p>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-600 rounded-2xl text-xs font-black">
              <FiTrendingUp size={14} />
              <span>ACTIVE STOCKS</span>
            </div>
          </div>

          <Chart
            type="line"
            height={300}
            series={revenueChartSeries}
            options={{
              chart: {
                toolbar: { show: false },
                animations: { enabled: true, easing: "easeinout", speed: 800 },
              },
              stroke: { curve: "smooth", width: 5, dashArray: 0 },
              markers: {
                size: 6,
                strokeWidth: 4,
                strokeColors: "#fff",
                colors: ["#10b981"],
                hover: { size: 9 },
              },
              colors: ["#10b981"],
              xaxis: {
                categories: revenueChartCategories,
                axisBorder: { show: false },
                labels: {
                  style: {
                    fontSize: "11px",
                    fontWeight: 600,
                    colors: "#94a3b8",
                  },
                },
              },
              yaxis: {
                labels: {
                  style: {
                    fontSize: "11px",
                    fontWeight: 600,
                    colors: "#94a3b8",
                  },
                  formatter: (v) => v.toLocaleString("vi-VN"),
                },
              },
              grid: { borderColor: "#f8fafc", strokeDashArray: 6 },
              tooltip: {
                theme: "light",
                marker: { show: true },
                y: { formatter: (val) => val.toLocaleString("vi-VN") + " ₫" },
              },
            }}
          />
        </motion.div>
      </section>

      {/* ── CANCELLED ORDERS ── */}
      {cancelledOrders.length > 0 && (
        <section className="mt-10">
          <motion.div
            {...fadeUp(0.35)}
            className="bg-white rounded-3xl border border-red-100 p-6 shadow-sm hover:shadow-xl transition-all duration-300"
          >
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-base font-semibold text-red-800 flex items-center gap-2">
                  <FiX className="text-red-500" /> Cancelled Orders
                </h2>
                <p className="text-xs text-red-400 mt-0.5">
                  Orders that were not successful
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {cancelledOrders.map((order, i) => (
                <div
                  key={order.orderId}
                  className="flex items-center justify-between p-4 bg-red-50/30 rounded-2xl border border-red-50 hover:bg-red-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-red-100 text-red-600 rounded-full flex items-center justify-center font-bold">
                      {order.fullName?.charAt(0) || "U"}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-800">
                        {order.orderCode}
                      </p>
                      <p className="text-xs text-gray-500">{order.fullName}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-red-600">
                      {(order.finalPrice || 0).toLocaleString()} ₫
                    </p>
                    <p className="text-[10px] text-gray-400">
                      {new Date(order.orderDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </section>
      )}
    </div>
  );
}

export default AdminOverview;
