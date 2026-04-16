import { useEffect, useMemo, useState } from "react";
import Chart from "react-apexcharts";
import { motion } from "framer-motion";
import {
  FiBarChart2,
  FiCalendar,
  FiDollarSign,
  FiPackage,
  FiRefreshCcw,
  FiShoppingBag,
  FiTrendingUp,
  FiUsers,
} from "react-icons/fi";
import { getDashboardAnalytics } from "../services/dashboardService";
import { connectDashboardSocket } from "../services/dashboardSocketService";

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, delay },
});

function AdminOverview() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [groupBy, setGroupBy] = useState("DAILY");
  const [customerSortBy, setCustomerSortBy] = useState("spent");
  const [orderSortBy, setOrderSortBy] = useState("count");
  const [expandedProductGroups, setExpandedProductGroups] = useState({
    lens: false,
    frame: false,
  });

  const [fromDate, setFromDate] = useState(() => {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    return toInputDate(firstDay);
  });

  const [toDate, setToDate] = useState(() => toInputDate(new Date()));

  useEffect(() => {
    let disposeSocket = () => {};

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

    fetchDashboard();

    disposeSocket = connectDashboardSocket({
      fromDate,
      toDate,
      groupBy,
      onAnalytics: (nextAnalytics) => {
        setAnalytics(nextAnalytics);
        setLoading(false);
      },
      onError: (error) => {
        console.error("Dashboard socket error:", error);
      },
    });

    return () => disposeSocket();
  }, [fromDate, toDate, groupBy]);

  const revenueGroup = useMemo(() => {
    const grossRevenue = toNumber(
      analytics?.grossRevenue ?? analytics?.totalRevenue,
    );
    const netRevenue = toNumber(
      analytics?.netRevenue ?? analytics?.remainingRevenueAfterRefund,
    );
    const refundedAmount = toNumber(analytics?.refundedAmount);
    const pendingRevenue = toNumber(
      analytics?.pendingRevenue ?? analytics?.projectedRevenue,
    );

    const totalForShare = grossRevenue + refundedAmount + pendingRevenue;

    return [
      {
        label: "Doanh thu thuần",
        value: grossRevenue,
        share: computePercent(grossRevenue, totalForShare),
      },
      {
        label: "Doanh thu ròng",
        value: netRevenue,
        share: computePercent(netRevenue, grossRevenue || totalForShare),
      },
      {
        label: "Doanh thu hoàn trả",
        value: refundedAmount,
        share: computePercent(refundedAmount, totalForShare),
      },
      {
        label: "Doanh thu pending",
        value: pendingRevenue,
        share: computePercent(pendingRevenue, totalForShare),
      },
    ];
  }, [analytics]);

  const orderStatusRows = useMemo(() => {
    const rows = (analytics?.orderStatusReport || []).map((item) => ({
      status: item?.status || "Unknown",
      count: toNumber(item?.count),
    }));

    const totalOrders = Math.max(toNumber(analytics?.totalOrders), 0);
    const refundCount = toNumber(analytics?.refundedCount);
    const hasRefundRow = rows.some((row) =>
      normalizeStatus(row.status).includes("refund"),
    );

    if (!hasRefundRow && refundCount > 0) {
      rows.push({ status: "Refunded", count: refundCount });
    }

    return rows
      .map((item) => ({
        ...item,
        percent: computePercent(
          item.count,
          totalOrders || rows.reduce((sum, row) => sum + row.count, 0),
        ),
      }))
      .sort((left, right) => {
        if (orderSortBy === "name") {
          return left.status.localeCompare(right.status, "vi");
        }
        return right.count - left.count;
      });
  }, [analytics, orderSortBy]);

  const orderOutcomeSummary = useMemo(() => {
    const sourceRows = analytics?.orderStatusReport || [];

    const sumByStatusMatcher = (matcher) => {
      return sourceRows.reduce((sum, row) => {
        const normalized = normalizeStatus(row?.status);
        return matcher(normalized) ? sum + toNumber(row?.count) : sum;
      }, 0);
    };

    const completedFromStatus = sumByStatusMatcher(
      (status) =>
        status.includes("complete") ||
        status.includes("done") ||
        status.includes("success") ||
        status.includes("hoanthanh"),
    );

    const cancelledFromStatus = sumByStatusMatcher(
      (status) =>
        status.includes("cancel") ||
        status.includes("huy") ||
        status.includes("rejected"),
    );

    const refundedFromStatus = sumByStatusMatcher(
      (status) =>
        status.includes("refund") ||
        status.includes("hoantien") ||
        status.includes("trahang"),
    );

    const completed = toNumber(
      analytics?.completedOrders ?? completedFromStatus,
    );

    const cancelled = toNumber(
      analytics?.cancelledOrders ?? analytics?.canceledOrders,
    );

    const refunded = toNumber(analytics?.refundedCount ?? refundedFromStatus);

    return {
      refunded,
      cancelled: cancelled > 0 ? cancelled : cancelledFromStatus,
      completed,
    };
  }, [analytics]);

  const productInventoryGroupedRows = useMemo(() => {
    const rows = analytics?.productInventoryReport || [];

    const grouped = {
      lens: [],
      frame: [],
    };

    rows.forEach((item) => {
      const groupKey = classifyProductGroup(item?.productName);

      grouped[groupKey].push({
        productName: item?.productName || "Unknown Product",
        color: item?.color || item?.productColor || "",
        purchasedQuantity: toNumber(item?.purchasedQuantity),
        inStockQuantity: toNumber(item?.inStockQuantity),
        preorderQuantity: toNumber(item?.preorderQuantity),
      });
    });

    const sorter = (left, right) =>
      right.purchasedQuantity - left.purchasedQuantity ||
      left.productName.localeCompare(right.productName, "vi");

    grouped.lens.sort(sorter);
    grouped.frame.sort(sorter);

    return grouped;
  }, [analytics]);

  const inventoryPreviewLimit = 3;

  const toggleProductGroup = (groupKey) => {
    setExpandedProductGroups((current) => ({
      ...current,
      [groupKey]: !current[groupKey],
    }));
  };

  const topCustomers = useMemo(() => {
    const rows = (analytics?.topCustomersBySpending || []).map(
      (item, index) => ({
        rank: index + 1,
        userId: item?.userId,
        customerName: item?.customerName || "Guest",
        orderCount: toNumber(item?.orderCount),
        totalSpent: toNumber(item?.totalSpent),
        avgSpent:
          toNumber(item?.orderCount) > 0
            ? toNumber(item?.totalSpent) / toNumber(item?.orderCount)
            : 0,
      }),
    );

    return [...rows].sort((left, right) => {
      if (customerSortBy === "orders")
        return right.orderCount - left.orderCount;
      if (customerSortBy === "avg") return right.avgSpent - left.avgSpent;
      return right.totalSpent - left.totalSpent;
    });
  }, [analytics, customerSortBy]);

  const bestByRevenue = useMemo(
    () => analytics?.bestSellingProductsByRevenue || [],
    [analytics],
  );
  const bestByQuantity = useMemo(
    () => analytics?.bestSellingProductsByQuantity || [],
    [analytics],
  );
  const timeline = useMemo(() => analytics?.timeline || [], [analytics]);

  const productRevenueBreakdownRows = useMemo(() => {
    return bestByRevenue.map((item) => {
      return {
        productName: item?.productName,
        completedRevenue: Math.max(toNumber(item?.completedRevenue), 0),
        pendingRevenue: Math.max(toNumber(item?.pendingRevenue), 0),
        refundedRevenue: Math.max(Math.abs(toNumber(item?.refundedRevenue)), 0),
        totalRevenue: toNumber(item?.revenue),
      };
    });
  }, [bestByRevenue]);

  const overviewCards = useMemo(() => {
    return [
      {
        title: "Doanh thu thuần",
        value: formatCompactCurrency(
          analytics?.grossRevenue ?? analytics?.totalRevenue,
        ),
        sub: `Doanh thu ròng: ${formatCompactCurrency(
          analytics?.netRevenue ?? analytics?.remainingRevenueAfterRefund,
        )}`,
        icon: FiDollarSign,
        color: "bg-emerald-100 text-emerald-600",
      },
      {
        title: "Tổng đơn hàng",
        value: formatCompactNumber(analytics?.totalOrders),
        sub: `Hoàn tất: ${formatCompactNumber(analytics?.completedOrders)}`,
        icon: FiShoppingBag,
        color: "bg-blue-100 text-blue-600",
      },
      {
        title: "Tổng khách hàng",
        value: formatCompactNumber(analytics?.totalCustomers),
        sub: `Khách mới: ${formatCompactNumber(analytics?.newCustomers)}`,
        icon: FiUsers,
        color: "bg-violet-100 text-violet-600",
      },
      {
        title: "Tỉ lệ hoàn trả",
        value: `${Number(analytics?.refundRate || 0).toFixed(1)}%`,
        sub: `Refund: ${formatCompactNumber(analytics?.refundedCount)}`,
        icon: FiRefreshCcw,
        color: "bg-amber-100 text-amber-600",
      },
      {
        title: "Tỉ lệ hoàn tất",
        value: `${Number(analytics?.completionRate || 0).toFixed(1)}%`,
        sub: `Kính đã bán: ${formatCompactNumber(analytics?.soldItems)}`,
        icon: FiTrendingUp,
        color: "bg-sky-100 text-sky-600",
      },
    ];
  }, [analytics]);

  const revenueDonutOptions = useMemo(
    () => ({
      chart: {
        type: "donut",
        toolbar: { show: false },
        fontFamily: "Inter, system-ui, sans-serif",
      },
      labels: revenueGroup.map((item) => item.label),
      legend: { position: "bottom" },
      plotOptions: { pie: { donut: { size: "62%" } } },
      dataLabels: {
        formatter: (_, options) =>
          `${revenueGroup[options.seriesIndex]?.share || 0}%`,
      },
      tooltip: {
        y: { formatter: (value) => formatCurrency(value) },
      },
    }),
    [revenueGroup],
  );

  const revenueDonutSeries = useMemo(
    () => revenueGroup.map((item) => Math.max(item.value, 0)),
    [revenueGroup],
  );

  const orderDonutOptions = useMemo(
    () => ({
      chart: {
        type: "donut",
        toolbar: { show: false },
        fontFamily: "Inter, system-ui, sans-serif",
      },
      labels: orderStatusRows.map((item) => item.status),
      legend: { position: "bottom" },
      plotOptions: { pie: { donut: { size: "62%" } } },
      dataLabels: {
        formatter: (_, options) =>
          `${orderStatusRows[options.seriesIndex]?.percent || 0}%`,
      },
      tooltip: {
        y: {
          formatter: (value) =>
            `${Number(value || 0).toLocaleString("vi-VN")} đơn`,
        },
      },
    }),
    [orderStatusRows],
  );

  const orderDonutSeries = useMemo(
    () => orderStatusRows.map((item) => Math.max(item.count, 0)),
    [orderStatusRows],
  );

  const customerChartOptions = useMemo(
    () => ({
      chart: {
        type: "bar",
        toolbar: { show: false },
        fontFamily: "Inter, system-ui, sans-serif",
      },
      plotOptions: {
        bar: { horizontal: true, borderRadius: 8, barHeight: "60%" },
      },
      dataLabels: { enabled: false },
      xaxis: {
        categories: topCustomers.slice(0, 8).map((item) => item.customerName),
        labels: {
          formatter: (value) => formatAxisCurrency(value),
        },
      },
      tooltip: {
        y: { formatter: (value) => formatCurrency(value) },
      },
    }),
    [topCustomers],
  );

  const customerChartSeries = useMemo(
    () => [
      {
        name: "Tổng chi tiêu",
        data: topCustomers.slice(0, 8).map((item) => item.totalSpent),
      },
    ],
    [topCustomers],
  );

  const productRevenueOptions = useMemo(
    () =>
      buildHorizontalBarOptions(
        productRevenueBreakdownRows.map((item) => item.productName),
        {
          isCurrency: true,
          horizontal: true,
          stacked: true,
          colors: ["#ef4444", "#f59e0b", "#22c55e"],
        },
      ),
    [productRevenueBreakdownRows],
  );

  const productRevenueSeries = useMemo(
    () => [
      {
        name: "Refund",
        data: productRevenueBreakdownRows.map((item) => item.refundedRevenue),
      },
      {
        name: "Pending",
        data: productRevenueBreakdownRows.map((item) => item.pendingRevenue),
      },
      {
        name: "Complete",
        data: productRevenueBreakdownRows.map((item) => item.completedRevenue),
      },
    ],
    [productRevenueBreakdownRows],
  );

  const productQuantityOptions = useMemo(
    () =>
      buildHorizontalBarOptions(
        bestByQuantity.map((item) => item.productName),
        { isCurrency: false, horizontal: true },
      ),
    [bestByQuantity],
  );

  const productQuantitySeries = useMemo(
    () => [
      {
        name: "Số lượng",
        data: bestByQuantity.map((item) => toNumber(item?.quantitySold)),
      },
    ],
    [bestByQuantity],
  );

  const timelineOptions = useMemo(
    () => ({
      chart: {
        type: "line",
        toolbar: { show: false },
        fontFamily: "Inter, system-ui, sans-serif",
      },
      stroke: { width: [3, 3], curve: "smooth" },
      dataLabels: { enabled: false },
      xaxis: { categories: timeline.map((item) => item.label) },
      yaxis: [
        {
          labels: { formatter: (value) => formatAxisCurrency(value) },
        },
        {
          opposite: true,
          labels: {
            formatter: (value) => Number(value || 0).toLocaleString("vi-VN"),
          },
        },
      ],
      tooltip: { shared: true, intersect: false },
      legend: { position: "bottom" },
    }),
    [timeline],
  );

  const timelineSeries = useMemo(
    () => [
      {
        name: "Doanh thu",
        type: "line",
        data: timeline.map((item) => toNumber(item?.revenue)),
      },
      {
        name: "Hoàn trả",
        type: "line",
        data: timeline.map((item) => toNumber(item?.refundedAmount)),
      },
    ],
    [timeline],
  );

  return (
    <div className="min-h-screen bg-slate-50 px-8 pt-6 pb-12">
      <motion.div {...fadeUp(0)} className="mb-6 flex flex-col gap-2">
        <h1 className="text-3xl font-bold text-slate-900">Admin Dashboard</h1>
        <p className="text-sm text-slate-500">
          Tách rõ báo cáo doanh thu, đơn hàng, khách hàng và sản phẩm để dễ so
          sánh, giảm bớt tham số và thêm tỉ trọng cho từng nhóm.
        </p>
      </motion.div>

      <motion.section
        {...fadeUp(0.05)}
        className="mb-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
      >
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div className="flex flex-wrap gap-4">
            <DateField
              label="Từ ngày"
              value={fromDate}
              onChange={setFromDate}
            />
            <DateField label="Đến ngày" value={toDate} onChange={setToDate} />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="inline-flex rounded-xl bg-slate-100 p-1">
              <ToggleButton
                active={groupBy === "DAILY"}
                onClick={() => setGroupBy("DAILY")}
              >
                Theo ngày
              </ToggleButton>
              <ToggleButton
                active={groupBy === "MONTHLY"}
                onClick={() => setGroupBy("MONTHLY")}
              >
                Theo tháng
              </ToggleButton>
            </div>
          </div>
        </div>
      </motion.section>

      <section className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-5">
        {overviewCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <motion.div
              key={card.title}
              {...fadeUp(0.08 + index * 0.04)}
              className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-slate-500">
                    {card.title}
                  </p>
                  <div className="mt-2 text-2xl font-bold text-slate-900">
                    {card.value}
                  </div>
                  <div className="mt-2 text-sm text-slate-500">{card.sub}</div>
                </div>
                <div
                  className={`flex h-11 w-11 items-center justify-center rounded-2xl ${card.color}`}
                >
                  <Icon size={20} />
                </div>
              </div>
            </motion.div>
          );
        })}
      </section>

      <div className="mt-6 grid grid-cols-1 gap-5 xl:grid-cols-2">
        <DashboardCard
          delay={0.16}
          title="Nhóm doanh thu"
          description="Tách rõ các nhóm: doanh thu thuần, doanh thu ròng, refund và pending để dễ so sánh."
          icon={<FiDollarSign className="text-emerald-500" size={20} />}
        >
          {loading ? (
            <LoadingBlock />
          ) : (
            <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1.05fr_0.95fr]">
              <Chart
                options={revenueDonutOptions}
                series={revenueDonutSeries}
                type="donut"
                height={340}
              />
              <SimpleTable
                headers={["Loại doanh thu", "Giá trị", "Tỉ trọng"]}
                rows={revenueGroup.map((item) => [
                  item.label,
                  formatCurrency(item.value),
                  `${item.share}%`,
                ])}
              />
            </div>
          )}
        </DashboardCard>

        <DashboardCard
          delay={0.2}
          title="Nhóm đơn hàng"
          description="Chia tổng số đơn theo trạng thái, đồng thời tách rõ Refund, Cancel và Complete."
          icon={<FiShoppingBag className="text-blue-500" size={20} />}
        >
          {loading ? (
            <LoadingBlock />
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <StatusMetricCard
                  label="Refund"
                  value={orderOutcomeSummary.refunded}
                  tone="amber"
                />
                <StatusMetricCard
                  label="Cancel"
                  value={orderOutcomeSummary.cancelled}
                  tone="rose"
                />
                <StatusMetricCard
                  label="Complete"
                  value={orderOutcomeSummary.completed}
                  tone="emerald"
                />
              </div>

              <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1.05fr_0.95fr]">
                <Chart
                  options={orderDonutOptions}
                  series={orderDonutSeries}
                  type="donut"
                  height={340}
                />
                <div>
                  <div className="mb-3 flex items-center justify-end gap-2">
                    <select
                      value={orderSortBy}
                      onChange={(e) => setOrderSortBy(e.target.value)}
                      className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
                    >
                      <option value="count">Sort theo số lượng</option>
                      <option value="name">Sort theo tên</option>
                    </select>
                  </div>
                  <SimpleTable
                    headers={["Trạng thái", "Số đơn", "Tỉ trọng"]}
                    rows={orderStatusRows.map((item) => [
                      item.status,
                      Number(item.count || 0).toLocaleString("vi-VN"),
                      `${item.percent}%`,
                    ])}
                  />
                </div>
              </div>
            </div>
          )}
        </DashboardCard>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-5 xl:grid-cols-2">
        <DashboardCard
          delay={0.24}
          title="Báo cáo theo nhóm sản phẩm"
          description="Mặc định chỉ hiển thị vài sản phẩm đầu, có thể mở rộng khi cần xem thêm."
          icon={<FiRefreshCcw className="text-amber-500" size={20} />}
        >
          {loading ? (
            <LoadingBlock />
          ) : (
            <div className="space-y-5">
              <div>
                <h3 className="mb-2 text-sm font-semibold text-slate-700 uppercase tracking-wide">
                  Tròng kính
                </h3>
                {(() => {
                  const rows = productInventoryGroupedRows.lens;
                  const visibleRows = expandedProductGroups.lens
                    ? rows
                    : rows.slice(0, inventoryPreviewLimit);
                  const hasMore = rows.length > inventoryPreviewLimit;

                  return (
                    <>
                      <SimpleTable
                        headers={["Sản phẩm", "Đã mua", "Còn trong kho"]}
                        rows={visibleRows.map((item) => [
                          item.productName,
                          Number(item.purchasedQuantity || 0).toLocaleString(
                            "vi-VN",
                          ),
                          Number(item.inStockQuantity || 0).toLocaleString(
                            "vi-VN",
                          ),
                        ])}
                      />
                      {hasMore && (
                        <div className="mt-2 flex justify-end">
                          <button
                            type="button"
                            onClick={() => toggleProductGroup("lens")}
                            className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-slate-300 hover:bg-slate-50"
                          >
                            {expandedProductGroups.lens
                              ? "Thu gọn"
                              : `Xem thêm ${rows.length - inventoryPreviewLimit} sản phẩm`}
                          </button>
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>

              <div>
                <h3 className="mb-2 text-sm font-semibold text-slate-700 uppercase tracking-wide">
                  Kính
                </h3>
                {(() => {
                  const rows = productInventoryGroupedRows.frame;
                  const visibleRows = expandedProductGroups.frame
                    ? rows
                    : rows.slice(0, inventoryPreviewLimit);
                  const hasMore = rows.length > inventoryPreviewLimit;

                  return (
                    <>
                      <SimpleTable
                        headers={[
                          "Sản phẩm",
                          "Đã mua",
                          "Còn trong kho",
                          "Pre-order",
                        ]}
                        rows={visibleRows.map((item) => [
                          renderProductNameWithColor(
                            item.productName,
                            item.color,
                          ),
                          Number(item.purchasedQuantity || 0).toLocaleString(
                            "vi-VN",
                          ),
                          Number(item.inStockQuantity || 0).toLocaleString(
                            "vi-VN",
                          ),
                          Number(item.preorderQuantity || 0).toLocaleString(
                            "vi-VN",
                          ),
                        ])}
                      />
                      {hasMore && (
                        <div className="mt-2 flex justify-end">
                          <button
                            type="button"
                            onClick={() => toggleProductGroup("frame")}
                            className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-slate-300 hover:bg-slate-50"
                          >
                            {expandedProductGroups.frame
                              ? "Thu gọn"
                              : `Xem thêm ${rows.length - inventoryPreviewLimit} sản phẩm`}
                          </button>
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
            </div>
          )}
        </DashboardCard>
        <DashboardCard
          delay={0.4}
          title="Doanh thu sản phẩm"
          description="Tách riêng doanh thu theo từng sản phẩm và chia theo Complete / Pending / Refund."
          icon={<FiPackage className="text-fuchsia-500" size={20} />}
        >
          {loading ? (
            <LoadingBlock />
          ) : (
            <Chart
              options={productRevenueOptions}
              series={productRevenueSeries}
              type="bar"
              height={340}
            />
          )}
        </DashboardCard>

        <DashboardCard
          delay={0.44}
          title="Sản phẩm bán chạy"
          description="Tách riêng báo cáo số lượng bán để so với doanh thu sản phẩm."
          icon={<FiPackage className="text-rose-500" size={20} />}
        >
          {loading ? (
            <LoadingBlock />
          ) : (
            <Chart
              options={productQuantityOptions}
              series={productQuantitySeries}
              type="bar"
              height={340}
            />
          )}
        </DashboardCard>

        <DashboardCard
          delay={0.28}
          title="Diễn biến doanh thu và hoàn trả"
          description="Chỉ giữ 2 chỉ số chính theo thời gian để tránh dashboard bị rối."
          icon={<FiBarChart2 className="text-violet-500" size={20} />}
        >
          {loading ? (
            <LoadingBlock />
          ) : (
            <Chart
              options={timelineOptions}
              series={timelineSeries}
              type="line"
              height={340}
            />
          )}
        </DashboardCard>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-5 xl:grid-cols-2">
        <DashboardCard
          delay={0.32}
          title="Khách hàng"
          description="Có sort theo chi tiêu hoặc số đơn để lọc nhóm khách làm khuyến mãi."
          icon={<FiUsers className="text-indigo-500" size={20} />}
        >
          {loading ? (
            <LoadingBlock />
          ) : (
            <>
              <div className="mb-4 flex justify-end">
                <select
                  value={customerSortBy}
                  onChange={(e) => setCustomerSortBy(e.target.value)}
                  className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
                >
                  <option value="spent">Sort theo chi tiêu</option>
                  <option value="orders">Sort theo số đơn</option>
                  <option value="avg">Sort theo trung bình / đơn</option>
                </select>
              </div>
              <Chart
                options={customerChartOptions}
                series={customerChartSeries}
                type="bar"
                height={320}
              />
            </>
          )}
        </DashboardCard>

        <DashboardCard
          delay={0.36}
          title="Bảng khách hàng chi tiêu cao"
          description="Dữ liệu real từ khách hàng đã mua hàng, tách riêng thành bảng để dễ đọc."
          icon={<FiUsers className="text-sky-500" size={20} />}
        >
          {loading ? (
            <LoadingBlock />
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-slate-500">
                    <th className="py-3 pr-4 font-semibold">#</th>
                    <th className="py-3 pr-4 font-semibold">Khách hàng</th>
                    <th className="py-3 pr-4 font-semibold">User ID</th>
                    <th className="py-3 pr-4 font-semibold">Số đơn</th>
                    <th className="py-3 pr-4 font-semibold">TB / đơn</th>
                    <th className="py-3 text-right font-semibold">
                      Tổng chi tiêu
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {topCustomers.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="py-10 text-center text-slate-400"
                      >
                        Chưa có dữ liệu khách hàng trong khoảng thời gian này
                      </td>
                    </tr>
                  ) : (
                    topCustomers.map((customer, index) => (
                      <tr
                        key={`${customer.userId || customer.customerName}-${index}`}
                        className="border-b border-slate-100"
                      >
                        <td className="py-3 pr-4 font-semibold text-slate-700">
                          {index + 1}
                        </td>
                        <td className="py-3 pr-4 font-medium text-slate-900">
                          {customer.customerName}
                        </td>
                        <td className="py-3 pr-4 text-slate-500">
                          {customer.userId ?? "-"}
                        </td>
                        <td className="py-3 pr-4 text-slate-700">
                          {customer.orderCount.toLocaleString("vi-VN")}
                        </td>
                        <td className="py-3 pr-4 text-slate-700">
                          {formatCurrency(
                            Math.round(toNumber(customer.avgSpent)),
                          )}
                        </td>
                        <td className="py-3 text-right font-semibold text-slate-900">
                          {formatCurrency(customer.totalSpent)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </DashboardCard>
      </div>
    </div>
  );
}

function DashboardCard({ title, description, icon, children, delay }) {
  return (
    <motion.div
      {...fadeUp(delay)}
      className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900">{title}</h2>
          <p className="mt-1 text-sm text-slate-500">{description}</p>
        </div>
        {icon}
      </div>
      {children}
    </motion.div>
  );
}

function DateField({ label, value, onChange }) {
  return (
    <div>
      <label className="mb-2 block text-xs font-semibold text-slate-500">
        {label}
      </label>
      <div className="relative">
        <FiCalendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="date"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm"
        />
      </div>
    </div>
  );
}

function ToggleButton({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
        active ? "bg-white text-blue-600 shadow-sm" : "text-slate-500"
      }`}
    >
      {children}
    </button>
  );
}

function StatusMetricCard({ label, value, tone }) {
  const toneClassMap = {
    amber: "bg-amber-50 text-amber-700 border-amber-200",
    rose: "bg-rose-50 text-rose-700 border-rose-200",
    emerald: "bg-emerald-50 text-emerald-700 border-emerald-200",
  };

  const toneClass =
    toneClassMap[tone] || "bg-slate-50 text-slate-700 border-slate-200";

  return (
    <div className={`rounded-2xl border px-4 py-3 ${toneClass}`}>
      <div className="text-xs font-semibold uppercase tracking-wide">
        {label}
      </div>
      <div className="mt-1 text-2xl font-bold">
        {Number(value || 0).toLocaleString("vi-VN")}
      </div>
    </div>
  );
}

function SimpleTable({ headers, rows }) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200 text-left text-slate-500">
            {headers.map((header) => (
              <th key={header} className="py-3 pr-4 font-semibold last:pr-0">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td
                colSpan={headers.length}
                className="py-10 text-center text-slate-400"
              >
                Chưa có dữ liệu
              </td>
            </tr>
          ) : (
            rows.map((row, rowIndex) => (
              <tr key={rowIndex} className="border-b border-slate-100">
                {row.map((cell, cellIndex) => (
                  <td
                    key={`${rowIndex}-${cellIndex}`}
                    className="py-3 pr-4 text-slate-700 last:pr-0"
                  >
                    {cell}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

function LoadingBlock() {
  return (
    <div className="flex h-80 items-center justify-center text-slate-400">
      Loading...
    </div>
  );
}

function buildHorizontalBarOptions(categories, config = {}) {
  const {
    isCurrency = false,
    horizontal = true,
    stacked = false,
    colors = ["#0ea5e9"],
  } = config;

  return {
    chart: {
      type: "bar",
      stacked,
      toolbar: { show: false },
      fontFamily: "Inter, system-ui, sans-serif",
    },
    colors,
    legend: {
      show: stacked,
      position: "bottom",
    },
    plotOptions: {
      bar: {
        horizontal,
        borderRadius: 8,
        barHeight: horizontal ? "60%" : undefined,
        columnWidth: horizontal ? undefined : "58%",
      },
    },
    dataLabels: { enabled: false },
    xaxis: {
      categories,
      labels: {
        rotate: horizontal ? 0 : -25,
        formatter: (value) =>
          isCurrency
            ? formatAxisCurrency(value)
            : Number(value || 0).toLocaleString("vi-VN"),
      },
    },
    tooltip: {
      y: {
        formatter: (value) =>
          isCurrency
            ? formatCurrency(value)
            : Number(value || 0).toLocaleString("vi-VN"),
      },
    },
  };
}

function computePercent(value, total) {
  const numericValue = toNumber(value);
  const numericTotal = toNumber(total);
  if (numericTotal <= 0) return 0;
  return Number(((numericValue / numericTotal) * 100).toFixed(2));
}

function toNumber(value) {
  if (value == null || value === "") return 0;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatCurrency(value) {
  const number = toNumber(value);
  return `${number.toLocaleString("vi-VN")} VND`;
}

function formatCompactCurrency(value) {
  const number = toNumber(value);
  if (number >= 1_000_000_000)
    return `${(number / 1_000_000_000).toFixed(1)}B VND`;
  if (number >= 1_000_000) return `${(number / 1_000_000).toFixed(1)}M VND`;
  if (number >= 1_000) return `${(number / 1_000).toFixed(1)}K VND`;
  return `${number.toLocaleString("vi-VN")} VND`;
}

function formatCompactNumber(value) {
  const number = toNumber(value);
  if (number >= 1_000_000_000) return `${(number / 1_000_000_000).toFixed(1)}B`;
  if (number >= 1_000_000) return `${(number / 1_000_000).toFixed(1)}M`;
  if (number >= 1_000) return `${(number / 1_000).toFixed(1)}K`;
  return number.toLocaleString("vi-VN");
}

function formatAxisCurrency(value) {
  const number = toNumber(value);
  if (number >= 1_000_000_000) return `${(number / 1_000_000_000).toFixed(0)}B`;
  if (number >= 1_000_000) return `${(number / 1_000_000).toFixed(0)}M`;
  if (number >= 1_000) return `${(number / 1_000).toFixed(0)}K`;
  return number.toLocaleString("vi-VN");
}

function toInputDate(date) {
  const local = new Date(date);
  local.setMinutes(local.getMinutes() - local.getTimezoneOffset());
  return local.toISOString().slice(0, 10);
}

function normalizeStatus(status) {
  return String(status || "")
    .toLowerCase()
    .replace(/[_\-\s]/g, "");
}

function classifyProductGroup(productName) {
  const normalized = String(productName || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[_\-\s]/g, "");

  const lensHints = [
    "trong",
    "lens",
    "singlevision",
    "progressive",
    "blue",
    "anti",
    "varifocal",
  ];

  return lensHints.some((hint) => normalized.includes(hint)) ? "lens" : "frame";
}

function renderProductNameWithColor(productName, colorFromBackend) {
  const color = colorFromBackend || extractColorFromProductName(productName);

  if (!color) {
    return productName;
  }

  return (
    <div className="flex flex-col gap-1">
      <span className="font-medium text-slate-800">{productName}</span>
      <span className="inline-flex w-fit items-center rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold tracking-wide text-slate-600">
        Màu: {color}
      </span>
    </div>
  );
}

function extractColorFromProductName(productName) {
  const normalized = String(productName || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[_\-\s]/g, "");

  const colorMap = [
    ["black", "Đen"],
    ["white", "Trắng"],
    ["brown", "Nâu"],
    ["beige", "Be"],
    ["blue", "Xanh dương"],
    ["navy", "Xanh navy"],
    ["green", "Xanh lá"],
    ["red", "Đỏ"],
    ["pink", "Hồng"],
    ["purple", "Tím"],
    ["gray", "Xám"],
    ["grey", "Xám"],
    ["gold", "Vàng"],
    ["silver", "Bạc"],
    ["transparent", "Trong suốt"],
    ["clear", "Trong suốt"],
  ];

  const matched = colorMap.find(([keyword]) => normalized.includes(keyword));
  return matched ? matched[1] : "";
}

export default AdminOverview;
