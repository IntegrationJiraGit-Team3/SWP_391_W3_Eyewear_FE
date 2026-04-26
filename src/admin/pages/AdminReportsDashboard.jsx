import { useEffect, useMemo, useState, useCallback } from "react";
import Chart from "react-apexcharts";
import { motion } from "framer-motion";
import {
  FiCalendar,
  FiDollarSign,
  FiPackage,
  FiRefreshCcw,
  FiShoppingBag,
  FiTrendingUp,
  FiUsers,
  FiXCircle,
} from "react-icons/fi";
import { getDashboardAnalytics } from "../services/dashboardService";
import { useTheme } from "../../context/ThemeContext";
// import { connectDashboardSocket } from "../services/dashboardSocketService";

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, delay },
});

function AdminReportsDashboard({ type = "overview" }) {
  const { isDark } = useTheme();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [groupBy, setGroupBy] = useState("DAILY");
  const [refreshing, setRefreshing] = useState(false);
  const [fromDate, setFromDate] = useState(() => {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    return toInputDate(firstDay);
  });
  const [toDate, setToDate] = useState(() => toInputDate(new Date()));

  const fetchDashboard = useCallback(
    async (isManualRefresh = false) => {
      try {
        if (isManualRefresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        const data = await getDashboardAnalytics(fromDate, toDate, groupBy);
        setAnalytics(data);
      } catch (error) {
        console.error("Fetch dashboard analytics error:", error);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [fromDate, toDate, groupBy],
  );

  useEffect(() => {
    // let disposeSocket = () => {};

    fetchDashboard(false);

    // disposeSocket = connectDashboardSocket({
    //   fromDate,
    //   toDate,
    //   groupBy,
    //   onAnalytics: (nextAnalytics) => {
    //     setAnalytics(nextAnalytics);
    //     setLoading(false);
    //     setRefreshing(false);
    //   },
    //   onError: (error) => {
    //     console.error("Dashboard socket error:", error);
    //     setLoading(false);
    //     setRefreshing(false);
    //   },
    // });

    // return () => disposeSocket();
  }, [fetchDashboard, fromDate, toDate, groupBy]);

  const grossRevenue = toNumber(
    analytics?.grossRevenue ?? analytics?.totalRevenue,
  );
  const netRevenue = toNumber(
    analytics?.netRevenue ?? analytics?.remainingRevenueAfterRefund,
  );
  const refundedRevenue = toNumber(analytics?.refundedAmount);
  const pendingRevenue = toNumber(
    analytics?.pendingRevenue ?? analytics?.projectedRevenue,
  );

  const refundedOrders = toNumber(
    analytics?.refundedOrders ?? analytics?.refundedCount,
  );
  const processedOrders = toNumber(analytics?.processedOrders);

  const processedOrdersResolved = useMemo(() => {
    const completed = toNumber(analytics?.completedOrders);
    const cancelled = toNumber(analytics?.cancelledOrders);
    const fallback = completed + refundedOrders + cancelled;
    return processedOrders > 0 ? processedOrders : fallback;
  }, [analytics, processedOrders, refundedOrders]);

  // const kpiRates = useMemo(() => {
  //   const completed = toNumber(analytics?.completedOrders);
  //   const cancelled = toNumber(analytics?.cancelledOrders);

  //   const totalOrders = toNumber(analytics?.totalOrders);
  //   if (totalOrders <= 0) {
  //     return { completionRate: 0, refundRate: 0, cancelRate: 0 };
  //   }

  //   const refundRate = Number(
  //     ((refundedOrders / totalOrders) * 100).toFixed(1),
  //   );
  //   const completionRate = Number(((completed / totalOrders) * 100).toFixed(1));
  //   const cancelRate = Number(((cancelled / totalOrders) * 100).toFixed(1));

  //   return { completionRate, refundRate, cancelRate };
  // }, [analytics, processedOrders, refundedOrders]);

  const revenueGroup = useMemo(() => {
    const completedRevenue = Math.max(
      grossRevenue - refundedRevenue - pendingRevenue,
      0,
    );

    const rows = [
      {
        label: "Doanh thu hoàn tất",
        value: completedRevenue,
      },
      {
        label: "Doanh thu hoàn tiền",
        value: refundedRevenue,
      },
      {
        label: "Doanh thu đang xử lý",
        value: pendingRevenue,
      },
    ];

    return applyPercentages(rows, "value", "share");
  }, [grossRevenue, refundedRevenue, pendingRevenue]);

  const paymentMethodGroup = useMemo(() => {
    const rows = [
      {
        label: "COD",
        value: toNumber(analytics?.codRevenue),
        netValue: toNumber(analytics?.codNetRevenue ?? analytics?.codRevenue),
      },
      {
        label: "VNPAY",
        value: toNumber(analytics?.vnpayRevenue),
        netValue: toNumber(
          analytics?.vnpayNetRevenue ?? analytics?.vnpayRevenue,
        ),
      },
    ];

    return applyPercentages(rows, "value", "share");
  }, [analytics]);

  const paymentMethodDonutOptions = useMemo(
    () => ({
      chart: {
        type: "donut",
        toolbar: { show: false },
        fontFamily: "Inter, system-ui, sans-serif",
      },
      labels: paymentMethodGroup.map((item) => item.label),
      legend: { position: "bottom" },
      plotOptions: { pie: { donut: { size: "62%" } } },
      colors: ["#f59e0b", "#2563eb"],
      dataLabels: {
        formatter: (_, options) =>
          `${paymentMethodGroup[options.seriesIndex]?.share || 0}%`,
      },
      tooltip: {
        y: { formatter: (value) => formatCurrency(value) },
      },
    }),
    [paymentMethodGroup],
  );

  const paymentMethodDonutSeries = useMemo(
    () => paymentMethodGroup.map((item) => Math.max(item.value, 0)),
    [paymentMethodGroup],
  );

  const overviewOrderGroupRows = useMemo(() => {
    const rows = [
      {
        status: "Completed",
        count: toNumber(analytics?.completedOrders),
      },
      {
        status: "Refunded",
        count: refundedOrders,
      },
      {
        status: "Cancelled",
        count: toNumber(analytics?.cancelledOrders),
      },
      {
        status: "Pending",
        count: toNumber(analytics?.pendingOrders),
      },
      {
        status: "Processing",
        count: toNumber(analytics?.processingOrders),
      },
      {
        status: "Shipping",
        count: toNumber(analytics?.shippingOrders),
      },
    ];

    return applyPercentages(rows, "count", "percent");
  }, [analytics, refundedOrders]);

  const orderStatusRows = useMemo(() => {
    const baseRows = [
      {
        status: "Pending",
        count: toNumber(analytics?.pendingOrders),
      },
      {
        status: "Processing",
        count: toNumber(analytics?.processingOrders),
      },
      {
        status: "Shipping",
        count: toNumber(analytics?.shippingOrders),
      },
      {
        status: "Completed",
        count: toNumber(analytics?.completedOrders),
      },
      {
        status: "Refunded",
        count: refundedOrders,
      },
      {
        status: "Cancelled",
        count: toNumber(analytics?.cancelledOrders),
      },
    ];

    return applyPercentages(baseRows, "count", "percent");
  }, [analytics, refundedOrders]);

  // const orderOutcomeGroup = useMemo(() => {
  //   const rows = [
  //     {
  //       label: "Completed",
  //       value: toNumber(analytics?.completedOrders),
  //     },
  //     {
  //       label: "Refunded",
  //       value: refundedOrders,
  //     },
  //     {
  //       label: "Cancelled",
  //       value: toNumber(analytics?.cancelledOrders),
  //     },
  //   ];

  //   return applyPercentages(rows, "value", "share");
  // }, [analytics]);

  const orderStatusShares = useMemo(() => {
    const map = Object.create(null);
    for (const row of orderStatusRows) {
      map[row.status] = toNumber(row.percent);
    }
    return map;
  }, [orderStatusRows]);

  const orderStatusMap = useMemo(() => {
    const map = Object.create(null);
    for (const row of orderStatusRows) {
      map[row.status] = {
        count: toNumber(row.count),
        percent: toNumber(row.percent),
      };
    }
    return map;
  }, [orderStatusRows]);

  const overviewCards = useMemo(() => {
    return [
      {
        title: "Doanh thu gộp",
        value: formatCurrency(grossRevenue),
        sub: "Trước khi trừ hoàn tiền",
        icon: FiDollarSign,
        color: "bg-emerald-100 text-emerald-600",
      },
      {
        title: "Thanh toán thực nhận",
        value: formatCurrency(netRevenue),
        sub: "Sau khi trừ hoàn tiền",
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
    ];
  }, [analytics, grossRevenue, netRevenue]);

  // const orderOutcomeDonutOptions = useMemo(
  //   () => ({
  //     chart: {
  //       type: "donut",
  //       toolbar: { show: false },
  //       fontFamily: "Inter, system-ui, sans-serif",
  //     },
  //     labels: orderOutcomeGroup.map((item) => item.label),
  //     legend: { position: "bottom" },
  //     plotOptions: { pie: { donut: { size: "62%" } } },
  //     colors: ["#22c55e", "#f59e0b", "#ef4444"],
  //     dataLabels: {
  //       formatter: (_, options) =>
  //         `${orderOutcomeGroup[options.seriesIndex]?.share || 0}%`,
  //     },
  //     tooltip: {
  //       y: {
  //         formatter: (value) =>
  //           `${Number(value || 0).toLocaleString("vi-VN")} đơn`,
  //       },
  //     },
  //   }),
  //   [orderOutcomeGroup],
  // );

  // const orderOutcomeDonutSeries = useMemo(
  //   () => orderOutcomeGroup.map((item) => Math.max(item.value, 0)),
  //   [orderOutcomeGroup],
  // );

  const revenueDonutOptions = useMemo(
    () => ({
      chart: {
        type: "donut",
        toolbar: { show: false },
        fontFamily: "Inter, system-ui, sans-serif",
      },
      theme: { mode: isDark ? "dark" : "light" },
      labels: revenueGroup.map((item) => item.label),
      legend: { position: "bottom" },
      plotOptions: { pie: { donut: { size: "62%" } } },
      fill: { opacity: 1 },
      stroke: {
        show: true,
        width: 2,
        colors: [isDark ? "#111827" : "#ffffff"],
      },
      colors: ["#22c55e", "#ef4444", "#f59e0b"],
      dataLabels: {
        formatter: (_, options) =>
          `${revenueGroup[options.seriesIndex]?.share || 0}%`,
      },
      tooltip: {
        y: { formatter: (value) => formatCurrency(value) },
      },
    }),
    [isDark, revenueGroup],
  );

  const revenueDonutSeries = useMemo(
    () => revenueGroup.map((item) => Math.max(item.value, 0)),
    [revenueGroup],
  );

  const overviewOrderDonutOptions = useMemo(
    () => ({
      chart: {
        type: "donut",
        toolbar: { show: false },
        fontFamily: "Inter, system-ui, sans-serif",
      },
      labels: overviewOrderGroupRows.map((item) => item.status),
      legend: { position: "bottom" },
      plotOptions: { pie: { donut: { size: "62%" } } },
      colors: [
        "#22c55e",
        "#f59e0b",
        "#ef4444",
        "#3b82f6",
        "#8b5cf6",
        "#0ea5e9",
      ],
      dataLabels: {
        formatter: (_, options) =>
          `${overviewOrderGroupRows[options.seriesIndex]?.percent || 0}%`,
      },
      tooltip: {
        y: {
          formatter: (value) =>
            `${Number(value || 0).toLocaleString("vi-VN")} đơn`,
        },
      },
    }),
    [overviewOrderGroupRows],
  );

  const overviewOrderDonutSeries = useMemo(
    () => overviewOrderGroupRows.map((item) => Math.max(item.count, 0)),
    [overviewOrderGroupRows],
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
      colors: [
        "#3b82f6",
        "#8b5cf6",
        "#0ea5e9",
        "#22c55e",
        "#f59e0b",
        "#ef4444",
      ],
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

  const productQuantityRows = useMemo(
    () => analytics?.bestSellingProductsByQuantity || [],
    [analytics],
  );

  const productRevenueRows = useMemo(
    () => analytics?.bestSellingProductsByRevenue || [],
    [analytics],
  );

  const frameQuantityRows = useMemo(
    () => analytics?.bestSellingFramesByQuantity || productQuantityRows,
    [analytics, productQuantityRows],
  );

  const frameRevenueRows = useMemo(
    () => analytics?.bestSellingFramesByRevenue || productRevenueRows,
    [analytics, productRevenueRows],
  );

  const lensQuantityRows = useMemo(
    () => analytics?.bestSellingLensesByQuantity || [],
    [analytics],
  );

  const lensRevenueRows = useMemo(
    () => analytics?.bestSellingLensesByRevenue || [],
    [analytics],
  );

  const productInventoryRows = useMemo(
    () => analytics?.productInventoryReport || [],
    [analytics],
  );

  const productRevenueBaseRows = useMemo(() => {
    const map = new Map();

    for (const row of productInventoryRows) {
      const productName = row?.productName || "N/A";
      const productType =
        String(row?.productType || "").toUpperCase() === "LENS"
          ? "LENS"
          : "FRAME";
      const key = `${productType}::${productName}`;

      const current = map.get(key) || {
        name: productName,
        productType,
        quantitySold: 0,
        completed: 0,
        refunded: 0,
        pending: 0,
        total: 0,
      };

      current.quantitySold += toNumber(row?.purchasedQuantity);
      current.completed += toNumber(row?.completedRevenue);
      current.refunded += toNumber(row?.refundedRevenue);
      current.pending += toNumber(row?.pendingRevenue);
      current.total = current.completed + current.refunded + current.pending;

      map.set(key, current);
    }

    return Array.from(map.values()).sort((a, b) => {
      if (b.total !== a.total) return b.total - a.total;
      if (b.quantitySold !== a.quantitySold) {
        return b.quantitySold - a.quantitySold;
      }
      return a.name.localeCompare(b.name);
    });
  }, [productInventoryRows]);

  const frameRevenueBaseRows = useMemo(
    () =>
      productRevenueBaseRows.filter((item) => item.productType !== "LENS"),
    [productRevenueBaseRows],
  );

  const lensRevenueBaseRows = useMemo(
    () => productRevenueBaseRows.filter((item) => item.productType === "LENS"),
    [productRevenueBaseRows],
  );

  const totalFrameRevenue = useMemo(
    () => frameRevenueBaseRows.reduce((sum, item) => sum + item.total, 0),
    [frameRevenueBaseRows],
  );

  const totalLensRevenue = useMemo(
    () => lensRevenueBaseRows.reduce((sum, item) => sum + item.total, 0),
    [lensRevenueBaseRows],
  );

  const totalProductRevenue = totalFrameRevenue + totalLensRevenue;

  const productRevenueBreakdown = useMemo(() => {
    const rows = [
      { label: "Gọng", value: totalFrameRevenue },
      { label: "Lens", value: totalLensRevenue },
    ];
    return applyPercentages(rows, "value", "share");
  }, [totalFrameRevenue, totalLensRevenue]);

  const frameQuantityTable = useMemo(() => {
    const rows = frameQuantityRows.map((item) => ({
      name: item?.productName || "N/A",
      quantitySold: toNumber(item?.quantitySold),
      revenue: toNumber(item?.revenue),
    }));

    const withQuantityShare = applyPercentages(
      rows,
      "quantitySold",
      "shareQty",
    );
    return applyPercentages(withQuantityShare, "revenue", "shareRev");
  }, [frameQuantityRows]);

  const lensQuantityTable = useMemo(() => {
    const rows = lensQuantityRows.map((item) => ({
      name: item?.lensType || "N/A",
      quantitySold: toNumber(item?.quantitySold),
      revenue: toNumber(item?.revenue),
    }));

    const withQuantityShare = applyPercentages(
      rows,
      "quantitySold",
      "shareQty",
    );
    return applyPercentages(withQuantityShare, "revenue", "shareRev");
  }, [lensQuantityRows]);

  const frameRevenueTable = useMemo(() => {
    const rows = frameRevenueBaseRows.map((item) => ({ ...item }));

    const withQuantityShare = applyPercentages(
      rows,
      "quantitySold",
      "shareQty",
    );
    return applyPercentages(withQuantityShare, "total", "shareRev");
  }, [frameRevenueBaseRows]);

  const lensRevenueTable = useMemo(() => {
    const rows = lensRevenueBaseRows.map((item) => ({ ...item }));

    const withQuantityShare = applyPercentages(
      rows,
      "quantitySold",
      "shareQty",
    );
    return applyPercentages(withQuantityShare, "total", "shareRev");
  }, [lensRevenueBaseRows]);

  const frameRevenueChartRows = useMemo(
    () => frameRevenueTable.slice(0, 8),
    [frameRevenueTable],
  );

  const frameInventoryRows = useMemo(
    () =>
      productInventoryRows.filter((row) => {
        const type = row?.productType;
        return type == null || String(type).toUpperCase() !== "LENS";
      }),
    [productInventoryRows],
  );

  const lensInventoryRows = useMemo(
    () =>
      productInventoryRows.filter((row) => {
        const type = row?.productType;
        return type != null && String(type).toUpperCase() === "LENS";
      }),
    [productInventoryRows],
  );

  const soldQuantitySummary = useMemo(() => {
    const totalSold = productInventoryRows.reduce(
      (sum, row) => sum + toNumber(row?.purchasedQuantity),
      0,
    );
    const frameSold = frameInventoryRows.reduce(
      (sum, row) => sum + toNumber(row?.purchasedQuantity),
      0,
    );
    const lensSold = lensInventoryRows.reduce(
      (sum, row) => sum + toNumber(row?.purchasedQuantity),
      0,
    );

    const percent = (value, total) =>
      total > 0 ? Number(((value / total) * 100).toFixed(1)) : 0;

    return {
      totalSold,
      frameSold,
      lensSold,
      frameShare: percent(frameSold, totalSold),
      lensShare: percent(lensSold, totalSold),
    };
  }, [productInventoryRows, frameInventoryRows, lensInventoryRows]);

  const inventorySummary = useMemo(() => {
    const frameSold = frameInventoryRows.reduce(
      (sum, row) => sum + toNumber(row?.purchasedQuantity),
      0,
    );
    const frameCancelled = frameInventoryRows.reduce(
      (sum, row) => sum + toNumber(row?.cancelledQuantity),
      0,
    );
    const frameStock = frameInventoryRows.reduce(
      (sum, row) => sum + toNumber(row?.inStockQuantity),
      0,
    );
    const framePreorder = frameInventoryRows.reduce(
      (sum, row) => sum + toNumber(row?.preorderQuantity),
      0,
    );
    const frameTotalItems = frameSold + frameStock + framePreorder;
    const frameSellThroughBase = frameSold + frameStock;

    const lensSold = lensInventoryRows.reduce(
      (sum, row) => sum + toNumber(row?.purchasedQuantity),
      0,
    );
    const lensCancelled = lensInventoryRows.reduce(
      (sum, row) => sum + toNumber(row?.cancelledQuantity),
      0,
    );
    const lensStock = lensInventoryRows.reduce(
      (sum, row) => sum + toNumber(row?.inStockQuantity),
      0,
    );
    const lensTotalItems = lensSold + lensStock;
    const lensSellThroughBase = lensSold + lensStock;

    const totalSold = frameSold + lensSold;
    const totalCancelled = frameCancelled + lensCancelled;
    const totalItems = frameTotalItems + lensTotalItems;
    const totalSellThroughBase = frameSellThroughBase + lensSellThroughBase;

    const frameRevenue = frameInventoryRows.reduce(
      (sum, row) =>
        sum +
        toNumber(row?.completedRevenue) +
        toNumber(row?.refundedRevenue) +
        toNumber(row?.pendingRevenue),
      0,
    );
    const frameCancelledRevenue = frameInventoryRows.reduce(
      (sum, row) => sum + toNumber(row?.cancelledRevenue),
      0,
    );
    const frameRefundedRevenue = frameInventoryRows.reduce(
      (sum, row) => sum + toNumber(row?.refundedRevenue),
      0,
    );

    const lensRevenue = lensInventoryRows.reduce(
      (sum, row) =>
        sum +
        toNumber(row?.completedRevenue) +
        toNumber(row?.refundedRevenue) +
        toNumber(row?.pendingRevenue),
      0,
    );
    const lensCancelledRevenue = lensInventoryRows.reduce(
      (sum, row) => sum + toNumber(row?.cancelledRevenue),
      0,
    );
    const lensRefundedRevenue = lensInventoryRows.reduce(
      (sum, row) => sum + toNumber(row?.refundedRevenue),
      0,
    );

    const totalRevenue = frameRevenue + lensRevenue;
    const totalCancelledRevenue = frameCancelledRevenue + lensCancelledRevenue;
    const totalRefundedRevenue = frameRefundedRevenue + lensRefundedRevenue;

    const percent = (value, total) =>
      total > 0 ? Number(((value / total) * 100).toFixed(1)) : 0;

    return {
      frame: {
        sold: frameSold,
        cancelled: frameCancelled,
        stock: frameStock,
        preorder: framePreorder,
        totalItems: frameTotalItems,
        soldShareInItems: percent(frameSold, frameSellThroughBase),
        revenue: frameRevenue,
        cancelledRevenue: frameCancelledRevenue,
        refundedRevenue: frameRefundedRevenue,
        revenueShareInTotal: percent(frameRevenue, totalRevenue),
      },
      lens: {
        sold: lensSold,
        cancelled: lensCancelled,
        stock: lensStock,
        totalItems: lensTotalItems,
        soldShareInItems: percent(lensSold, lensSellThroughBase),
        revenue: lensRevenue,
        cancelledRevenue: lensCancelledRevenue,
        refundedRevenue: lensRefundedRevenue,
        revenueShareInTotal: percent(lensRevenue, totalRevenue),
      },
      total: {
        sold: totalSold,
        cancelled: totalCancelled,
        items: totalItems,
        soldShareInItems: percent(totalSold, totalSellThroughBase),
        revenue: totalRevenue,
        cancelledRevenue: totalCancelledRevenue,
        refundedRevenue: totalRefundedRevenue,
      },
    };
  }, [frameInventoryRows, lensInventoryRows]);

  const frameInventoryTable = useMemo(() => {
    const rows = frameInventoryRows.map((row) => {
      const sold = toNumber(row?.purchasedQuantity);
      const cancelled = toNumber(row?.cancelledQuantity);
      const stock = toNumber(row?.inStockQuantity);
      const preorder = toNumber(row?.preorderQuantity);
      const totalItems = sold + stock + preorder;
      const sellThroughBase = sold + stock;
      const refunded = toNumber(row?.refundedRevenue);
      const pending = toNumber(row?.pendingRevenue);
      const revenue = toNumber(row?.completedRevenue) + refunded + pending;

      return {
        name: row?.productName || "N/A",
        color: row?.color || "-",
        sold,
        cancelled,
        stock,
        preorder,
        totalItems,
        sellThroughBase,
        revenue,
        refunded,
        pending,
      };
    });

    const withSoldShare = applyPercentages(rows, "sold", "soldShare");
    const withRevenueShare = applyPercentages(
      withSoldShare,
      "revenue",
      "revShare",
    );
    return withRevenueShare.map((r) => ({
      ...r,
      soldInItemsShare:
        r.sellThroughBase > 0
          ? Number(((r.sold / r.sellThroughBase) * 100).toFixed(1))
          : 0,
    }));
  }, [frameInventoryRows]);

  const lensInventoryTable = useMemo(() => {
    const rows = lensInventoryRows.map((row) => {
      const sold = toNumber(row?.purchasedQuantity);
      const cancelled = toNumber(row?.cancelledQuantity);
      const stock = toNumber(row?.inStockQuantity);
      const totalItems = sold + stock;
      const sellThroughBase = sold + stock;
      const refunded = toNumber(row?.refundedRevenue);
      const pending = toNumber(row?.pendingRevenue);
      const revenue = toNumber(row?.completedRevenue) + refunded + pending;

      return {
        name: row?.productName || "N/A",
        color: row?.color || "-",
        sold,
        cancelled,
        stock,
        totalItems,
        sellThroughBase,
        revenue,
        refunded,
        pending,
      };
    });

    const withSoldShare = applyPercentages(rows, "sold", "soldShare");
    const withRevenueShare = applyPercentages(
      withSoldShare,
      "revenue",
      "revShare",
    );
    return withRevenueShare.map((r) => ({
      ...r,
      soldInItemsShare:
        r.sellThroughBase > 0
          ? Number(((r.sold / r.sellThroughBase) * 100).toFixed(1))
          : 0,
    }));
  }, [lensInventoryRows]);

  const productConclusion = useMemo(() => {
    const topQty = productQuantityRows?.[0] || null;
    const topRev = [...frameRevenueTable, ...lensRevenueTable]
      .filter(Boolean)
      .sort((a, b) => toNumber(b?.total) - toNumber(a?.total))?.[0];

    const refundedMax = [...frameRevenueTable, ...lensRevenueTable]
      .filter(Boolean)
      .sort(
        (a, b) => Math.abs(toNumber(b?.refunded)) - Math.abs(toNumber(a?.refunded)),
      )?.[0];

    const percent = (value, total) =>
      total > 0 ? Number(((value / total) * 100).toFixed(1)) : 0;

    const topQtyCount = toNumber(topQty?.quantitySold);
    const topQtyShare = percent(topQtyCount, soldQuantitySummary.totalSold);

    const topRevValue = toNumber(topRev?.total);
    const topRevShare = percent(topRevValue, totalProductRevenue);

    const refundedMaxValue = Math.abs(toNumber(refundedMax?.refunded));
    const refundedMaxShare = percent(refundedMaxValue, totalProductRevenue);

    return {
      topQty,
      topRev,
      refundedMax,
      topQtyShare,
      topRevShare,
      refundedMaxShare,
    };
  }, [
    productQuantityRows,
    frameRevenueTable,
    lensRevenueTable,
    soldQuantitySummary.totalSold,
    totalProductRevenue,
  ]);

  const productQuantityOptions = useMemo(
    () => ({
      chart: {
        type: "bar",
        toolbar: { show: false },
        fontFamily: "Inter, system-ui, sans-serif",
      },
      plotOptions: {
        bar: { horizontal: true, borderRadius: 0, barHeight: "60%" },
      },
      dataLabels: { enabled: false },
      xaxis: {
        categories: frameQuantityRows.map((item) => item.productName),
      },
      tooltip: {
        y: {
          formatter: (value) =>
            `${Number(value || 0).toLocaleString("vi-VN")} sản phẩm`,
        },
      },
      colors: ["#2563eb"],
    }),
    [frameQuantityRows],
  );

  const productQuantitySeries = useMemo(
    () => [
      {
        name: "Số lượng bán",
        data: frameQuantityRows.map((item) => toNumber(item?.quantitySold)),
      },
    ],
    [frameQuantityRows],
  );

  const productRevenueOptions = useMemo(
    () => ({
      chart: {
        type: "bar",
        stacked: true,
        toolbar: { show: false },
        fontFamily: "Inter, system-ui, sans-serif",
      },
      plotOptions: {
        bar: { horizontal: true, borderRadius: 0, barHeight: "60%" },
      },
      dataLabels: {
        enabled: true,
        formatter: (value) => (value > 0 ? formatCompactCurrency(value) : ""),
        style: { fontSize: "10px", colors: ["#fff"] },
      },
      xaxis: {
        categories: frameRevenueChartRows.map((item) => item.name),
        labels: {
          formatter: (value) => formatAxisCurrency(value),
        },
      },
      tooltip: {
        y: { formatter: (value) => formatCurrency(value) },
      },
      legend: { position: "bottom" },
      colors: ["#ef4444", "#f59e0b", "#22c55e"],
    }),
    [frameRevenueChartRows],
  );

  const productRevenueSeries = useMemo(
    () => [
      {
        name: "Refund",
        data: frameRevenueChartRows.map((item) => Math.abs(toNumber(item?.refunded))),
      },
      {
        name: "Đang xử lý",
        data: frameRevenueChartRows.map((item) => Math.max(toNumber(item?.pending), 0)),
      },
      {
        name: "Complete",
        data: frameRevenueChartRows.map((item) => Math.max(toNumber(item?.completed), 0)),
      },
    ],
    [frameRevenueChartRows],
  );

  const topCustomers = useMemo(
    () => analytics?.customerInsights || [],
    [analytics],
  );
  const topCustomersWithSpendShare = useMemo(
    () => applyPercentages(topCustomers, "totalSpent", "spendShare"),
    [topCustomers],
  );
  const cancelledCustomers = useMemo(
    () =>
      applyPercentages(
        [...topCustomers]
          .filter((item) => toNumber(item?.cancelledOrders) > 0)
          .sort(
            (a, b) =>
              toNumber(b?.cancelledOrders) - toNumber(a?.cancelledOrders),
          ),
        "cancelledOrders",
        "cancelledShare",
      ),
    [topCustomers],
  );

  const customerSummary = useMemo(() => {
    const totalCustomers = toNumber(analytics?.totalCustomers);
    const totalOrders = toNumber(analytics?.totalOrders);
    const totalRevenue = toNumber(
      analytics?.netRevenue ??
        analytics?.remainingRevenueAfterRefund ??
        analytics?.grossRevenue ??
        analytics?.totalRevenue,
    );

    const avgOrdersPerCustomer =
      totalCustomers > 0
        ? Number((totalOrders / totalCustomers).toFixed(2))
        : 0;

    return {
      totalCustomers,
      totalOrders,
      totalRevenue,
      avgOrdersPerCustomer,
    };
  }, [analytics]);
  const topCustomersBySpending = useMemo(() => {
    return topCustomersWithSpendShare.filter(
      (item) => toNumber(item?.totalSpent) !== 0,
    );
  }, [topCustomersWithSpendShare]);

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
      colors: ["#7c3aed"],
    }),
    [topCustomers],
  );

  const customerChartSeries = useMemo(
    () => [
      {
        name: "Tổng chi tiêu",
        data: topCustomers.slice(0, 8).map((item) => toNumber(item.totalSpent)),
      },
    ],
    [topCustomers],
  );

  const topOrders = useMemo(() => analytics?.topOrders || [], [analytics]);
  const cancelledOrders = useMemo(
    () => analytics?.cancelledOrdersReport || [],
    [analytics],
  );

  const timelineRows = useMemo(() => analytics?.timeline || [], [analytics]);

  const timelineRevenueChartOptions = useMemo(
    () => ({
      chart: {
        type: "line",
        toolbar: { show: false },
        fontFamily: "Inter, system-ui, sans-serif",
      },
      stroke: { curve: "smooth", width: [3, 3, 3] },
      markers: { size: 3 },
      dataLabels: { enabled: false },
      colors: ["#22c55e", "#ef4444", "#2563eb"],
      xaxis: {
        categories: timelineRows.map((item) => item?.label || "N/A"),
      },
      yaxis: {
        labels: {
          formatter: (value) => formatAxisCurrency(value),
        },
      },
      legend: { position: "top" },
      tooltip: {
        y: {
          formatter: (value) => formatCurrency(value),
        },
      },
    }),
    [timelineRows],
  );

  const timelineRevenueChartSeries = useMemo(
    () => [
      {
        name: "Doanh thu gộp",
        data: timelineRows.map((item) =>
          toNumber(item?.grossRevenue ?? item?.revenue),
        ),
      },
      {
        name: "Hoàn tiền",
        data: timelineRows.map((item) =>
          toNumber(item?.refundedAmount ?? item?.refundAmount),
        ),
      },
      {
        name: "Thanh toán thực nhận",
        data: timelineRows.map((item) => {
          const gross = toNumber(item?.grossRevenue ?? item?.revenue);
          const refunded = toNumber(item?.refundedAmount ?? item?.refundAmount);
          return toNumber(item?.netRevenue ?? gross - refunded);
        }),
      },
    ],
    [timelineRows],
  );

  return (
    <div className="min-h-screen bg-slate-50 px-8 pb-12 pt-6">
      <motion.div
        {...fadeUp(0)}
        className="mb-6 flex flex-col gap-4 md:flex-row md:items-start md:justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-slate-900">
            {type === "overview" && "Báo cáo tổng quan"}
            {type === "orders" && "Báo cáo đơn hàng"}
            {type === "products" && "Báo cáo sản phẩm"}
            {type === "customers" && "Báo cáo khách hàng"}
          </h1>
          <p className="text-sm text-slate-500">
            {type === "overview" &&
              "Tổng hợp toàn cảnh doanh thu, đơn hàng, khách hàng và biến động theo thời gian."}
            {type === "orders" &&
              "Tập trung vào trạng thái đơn hàng, tỷ lệ hoàn tất, hoàn tiền và các đơn nổi bật."}
            {type === "products" &&
              "Tập trung vào sản phẩm bán chạy, doanh thu theo sản phẩm và ảnh hưởng refund."}
            {type === "customers" &&
              "Tập trung vào khách hàng chi tiêu nhiều, mua nhiều đơn, hay hủy đơn và sản phẩm yêu thích."}
          </p>
        </div>
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

            <button
              type="button"
              onClick={() => fetchDashboard(true)}
              disabled={refreshing}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
            >
              <FiRefreshCcw
                className={refreshing ? "animate-spin" : ""}
                size={15}
              />
              {refreshing && (
                <div className="mt-2 flex items-center gap-2 text-sm text-sky-600">
                  <FiRefreshCcw className="animate-spin" />
                  Đang tải dữ liệu báo cáo...
                </div>
              )}
            </button>
          </div>
        </div>
      </motion.section>

      {type === "overview" && (
        <>
          <section className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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
                      <div className="mt-2 text-sm text-slate-500">
                        {card.sub}
                      </div>
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
              title="Cơ cấu doanh thu"
              description="Doanh thu gộp là mốc 100% nên không hiển thị tỷ lệ ở đây; chỉ hiển thị tỷ lệ của Thanh toán thực nhận, Doanh thu hoàn tiền và Doanh thu đang xử lý (đơn chưa hoàn tất: Pending/Processing/Shipping/Preorder)."
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
                    headers={["Nhóm doanh thu", "Giá trị", "Tỷ trọng"]}
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
              description="Nhóm đơn hàng gồm: Pending, Processing, Shipping, Completed, Refunded và Cancelled."
              icon={<FiShoppingBag className="text-blue-500" size={20} />}
            >
              {loading ? (
                <LoadingBlock />
              ) : (
                <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1.05fr_0.95fr]">
                  <Chart
                    options={overviewOrderDonutOptions}
                    series={overviewOrderDonutSeries}
                    type="donut"
                    height={340}
                  />
                  <SimpleTable
                    headers={["Trạng thái", "Số lượng", "Tỷ trọng"]}
                    rows={overviewOrderGroupRows.map((item) => [
                      item.status,
                      formatCompactNumber(item.count),
                      `${item.percent}%`,
                    ])}
                  />
                </div>
              )}
            </DashboardCard>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-5 xl:grid-cols-2">
            <DashboardCard
              delay={0.24}
              title="Cơ cấu thanh toán gộp"
              description="Tổng giá trị thanh toán theo phương thức (COD vs VNPAY) trong kỳ, chưa trừ hoàn tiền."
            >
              {loading ? (
                <LoadingBlock />
              ) : (
                <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1.05fr_0.95fr]">
                  <Chart
                    options={paymentMethodDonutOptions}
                    series={paymentMethodDonutSeries}
                    type="donut"
                    height={340}
                  />
                  <SimpleTable
                    headers={["Phương thức", "Giá trị", "Tỷ trọng"]}
                    rows={paymentMethodGroup.map((item) => [
                      item.label,
                      formatCurrency(item.value),
                      `${item.share}%`,
                    ])}
                  />
                </div>
              )}
            </DashboardCard>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-5">
            <DashboardCard
              delay={0.24}
              title="Biến động theo thời gian"
              description="Diễn biến doanh thu gồm: Doanh thu gộp, Hoàn tiền và Thanh toán thực nhận theo ngày hoặc tháng."
              icon={<FiCalendar className="text-sky-500" size={20} />}
            >
              {loading ? (
                <LoadingBlock />
              ) : (
                <Chart
                  options={timelineRevenueChartOptions}
                  series={timelineRevenueChartSeries}
                  type="line"
                  height={360}
                />
              )}
            </DashboardCard>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-2">
            <DashboardCard
              delay={0.28}
              title="Top 5 sản phẩm bán chạy"
              description="Những sản phẩm có số lượng bán ra cao nhất trong kỳ."
              icon={<FiPackage className="text-violet-500" size={20} />}
            >
              {loading ? (
                <LoadingBlock />
              ) : (
                <SimpleTable
                  headers={["Sản phẩm", "Đã bán"]}
                  rows={productQuantityRows
                    .slice(0, 5)
                    .map((item) => [
                      item?.productName || "N/A",
                      `${formatCompactNumber(toNumber(item?.quantitySold))} SP`,
                    ])}
                />
              )}
            </DashboardCard>

            <DashboardCard
              delay={0.32}
              title="Top 5 khách hàng VIP"
              description="Các khách hàng có tổng chi tiêu lớn nhất trong kỳ."
              icon={<FiUsers className="text-amber-500" size={20} />}
            >
              {loading ? (
                <LoadingBlock />
              ) : (
                <SimpleTable
                  headers={["Khách hàng", "Tổng chi tiêu"]}
                  rows={topCustomers
                    .slice(0, 5)
                    .map((item) => [
                      item?.customerName || "Khách lẻ",
                      formatCurrency(toNumber(item?.totalSpent)),
                    ])}
                />
              )}
            </DashboardCard>
          </div>
        </>
      )}

      {type === "orders" && (
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
          <DashboardCard
            delay={0.16}
            title="Phân bố trạng thái đơn hàng"
            description="Biểu đồ dùng mẫu số Tổng đơn. Đã bỏ bảng chi tiết thừa, chỉ giữ biểu đồ và các card trạng thái."
            icon={<FiShoppingBag className="text-blue-500" size={20} />}
          >
            {loading ? (
              <LoadingBlock />
            ) : (
              <div className="space-y-4">
                <div className="flex justify-center">
                  <Chart
                    options={orderDonutOptions}
                    series={orderDonutSeries}
                    type="donut"
                    height={340}
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
                  {[
                    {
                      key: "Pending",
                      label: "Pending",
                      accent: "border-blue-300",
                      bg: "bg-blue-50",
                      text: "text-blue-700",
                    },
                    {
                      key: "Processing",
                      label: "Processing",
                      accent: "border-violet-300",
                      bg: "bg-violet-50",
                      text: "text-violet-700",
                    },
                    {
                      key: "Shipping",
                      label: "Shipping",
                      accent: "border-blue-200",
                      bg: "bg-blue-50",
                      text: "text-blue-700",
                    },
                    {
                      key: "Completed",
                      label: "Completed",
                      accent: "border-emerald-300",
                      bg: "bg-emerald-50",
                      text: "text-emerald-700",
                    },
                    {
                      key: "Refunded",
                      label: "Refunded",
                      accent: "border-amber-300",
                      bg: "bg-amber-50",
                      text: "text-amber-700",
                    },
                    {
                      key: "Cancelled",
                      label: "Cancelled",
                      accent: "border-red-300",
                      bg: "bg-red-50",
                      text: "text-red-700",
                    },
                  ].map((item) => (
                    <div
                      key={item.key}
                      className={`rounded-2xl border border-slate-200 ${item.bg} p-4 border-l-4 ${item.accent}`}
                    >
                      <div className={`text-sm font-medium ${item.text}`}>
                        {item.label}
                      </div>
                      <div className="mt-2 flex items-end justify-between gap-3">
                        <div className="text-2xl font-bold text-slate-900">
                          {formatCompactNumber(orderStatusMap[item.key]?.count)}
                        </div>
                        <div className="text-sm font-semibold text-slate-600">
                          {toNumber(orderStatusMap[item.key]?.percent).toFixed(
                            1,
                          )}
                          %
                        </div>
                      </div>
                      <div className="mt-1 text-sm text-slate-500">
                        / Tổng đơn
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </DashboardCard>

          <DashboardCard
            delay={0.2}
            title="KPI đơn hàng"
            description="3 tỷ lệ này dùng cùng mẫu số Tổng đơn để khớp với biểu đồ và bảng Nhóm đơn hàng."
            icon={<FiTrendingUp className="text-emerald-500" size={20} />}
          >
            {loading ? (
              <LoadingBlock />
            ) : (
              <div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                  <KpiBox
                    title="Tỷ lệ hoàn tiền"
                    value={`${kpiRates.refundRate.toFixed(1)}%`}
                    sub="Refunded / Tổng đơn"
                  />
                  <KpiBox
                    title="Tỷ lệ hoàn tất"
                    value={`${kpiRates.completionRate.toFixed(1)}%`}
                    sub="Completed / Tổng đơn"
                  />
                  <KpiBox
                    title="Tỷ lệ hủy đơn"
                    value={`${kpiRates.cancelRate.toFixed(1)}%`}
                    sub="Cancelled / Tổng đơn"
                  />
                  <KpiBox
                    title="Tổng đơn"
                    value={formatCompactNumber(analytics?.totalOrders)}
                    sub="tất cả đơn trong kỳ"
                  />
                  <KpiBox
                    title="Đơn đã xử lý"
                    value={formatCompactNumber(processedOrdersResolved)}
                    sub="Complete + Refund + Cancel"
                  />
                  <KpiBox
                    title="Giá trị TB/Đơn (AOV)"
                    value={formatCurrency(
                      analytics?.totalOrders
                        ? Math.round(
                            toNumber(
                              analytics?.grossRevenue ??
                                analytics?.totalRevenue,
                            ) / analytics.totalOrders,
                          )
                        : 0,
                    )}
                    sub="Doanh thu / Tổng đơn"
                  />
                </div>

                <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4">
                  <div className="text-sm font-medium text-slate-700">
                    Cơ cấu doanh thu đơn hàng
                  </div>
                  <div className="mt-1 text-xs text-slate-500">
                    Khác với biểu đồ trạng thái: phần này đo theo doanh thu
                    (VND).
                  </div>
                  <div className="mt-3">
                    <SimpleTable
                      headers={["Nhóm doanh thu", "Giá trị", "Tỷ trọng"]}
                      rows={revenueGroup.map((item) => [
                        item.label,
                        formatCurrency(item.value),
                        `${item.share}%`,
                      ])}
                    />
                  </div>
                </div>
              </div>
            )}
          </DashboardCard>

          <DashboardCard
            delay={0.24}
            title="Top đơn hàng giá trị cao"
            description="Các đơn hàng có giá trị lớn nhất theo tổng tiền."
            icon={<FiDollarSign className="text-amber-500" size={20} />}
          >
            {loading ? (
              <LoadingBlock />
            ) : (
              <SimpleTable
                headers={["Mã đơn", "Khách hàng", "Số SP", "Tổng tiền"]}
                rows={topOrders.map((item) => [
                  item?.orderCode || "N/A",
                  item?.customerName || "Guest",
                  formatCompactNumber(item?.itemCount),
                  formatCurrency(item?.totalAmount),
                ])}
              />
            )}
          </DashboardCard>

          <DashboardCard
            delay={0.28}
            title="Danh sách đơn bị hủy"
            description="Cho thấy khách hàng nào hủy đơn và giá trị đơn bị hủy."
            icon={<FiRefreshCcw className="text-red-500" size={20} />}
          >
            {loading ? (
              <LoadingBlock />
            ) : (
              <SimpleTable
                headers={["Mã đơn", "Khách hàng", "Số SP", "Tổng tiền"]}
                rows={cancelledOrders.map((item) => [
                  item?.orderCode || "N/A",
                  item?.customerName || "Guest",
                  formatCompactNumber(item?.itemCount),
                  formatCurrency(item?.totalAmount),
                ])}
              />
            )}
          </DashboardCard>
        </div>
      )}

      {type === "products" && (
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
          <DashboardCard
            delay={0.16}
            title="Top sản phẩm theo số lượng"
            description="Top tối đa 8 sản phẩm bán nhiều nhất trong kỳ (chỉ tính đơn Completed). Nếu bảng gọng/lens ít dòng nghĩa là ít sản phẩm phát sinh bán trong kỳ."
            icon={<FiPackage className="text-indigo-500" size={20} />}
          >
            {loading ? (
              <LoadingBlock />
            ) : (
              <div className="space-y-4">
                <Chart
                  options={productQuantityOptions}
                  series={productQuantitySeries}
                  type="bar"
                  height={340}
                />

                <div className="space-y-4">
                  <div className="text-sm font-semibold text-slate-700">
                    Bảng gọng
                  </div>
                  <SimpleTable
                    headers={["Gọng", "Số lượng bán", "Tỉ trọng SL"]}
                    rows={frameQuantityTable.map((item) => [
                      item.name,
                      formatCompactNumber(item.quantitySold),
                      `${item.shareQty}%`,
                    ])}
                  />

                  <div className="pt-4 border-t border-slate-100" />
                  <div className="text-sm font-semibold text-slate-700">
                    Bảng lens
                  </div>
                  <SimpleTable
                    headers={["Lens", "Số lượng bán", "Tỉ trọng SL"]}
                    rows={lensQuantityTable.map((item) => [
                      item.name,
                      formatCompactNumber(item.quantitySold),
                      `${item.shareQty}%`,
                    ])}
                  />
                </div>
              </div>
            )}
          </DashboardCard>

          <DashboardCard
            delay={0.2}
            title="Doanh thu theo sản phẩm"
            description="Tách rõ doanh thu Complete, Refund và Đang xử lý theo từng sản phẩm. Cột Đang xử lý có thể = 0 nhưng vẫn có doanh thu Complete (đã hoàn tất)."
            icon={<FiDollarSign className="text-amber-500" size={20} />}
          >
            {loading ? (
              <LoadingBlock />
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <div className="rounded-xl bg-slate-50 p-4 text-center">
                    <p className="text-sm text-slate-500 mb-1">
                      Tổng doanh thu sản phẩm
                    </p>
                    <p className="text-xl font-bold text-slate-900">
                      {formatCurrency(totalProductRevenue)}
                    </p>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-4 text-center">
                    <p className="text-sm text-slate-500 mb-1">
                      Doanh thu gọng
                    </p>
                    <p className="text-xl font-bold text-indigo-600">
                      {formatCurrency(totalFrameRevenue)}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      Tỷ trọng: {productRevenueBreakdown?.[0]?.share || 0}%
                    </p>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-4 text-center">
                    <p className="text-sm text-slate-500 mb-1">
                      Doanh thu lens
                    </p>
                    <p className="text-xl font-bold text-emerald-600">
                      {formatCurrency(totalLensRevenue)}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      Tỷ trọng: {productRevenueBreakdown?.[1]?.share || 0}%
                    </p>
                  </div>
                </div>

                <Chart
                  options={productRevenueOptions}
                  series={productRevenueSeries}
                  type="bar"
                  height={340}
                />

                <div className="space-y-4">
                  <div className="text-sm font-semibold text-slate-700">
                    Bảng gọng
                  </div>
                  <SimpleTable
                    headers={[
                      "Gọng",
                      "Complete",
                      "Refund",
                      "Đang xử lý",
                      "Tổng",
                      "Tỉ trọng DT",
                    ]}
                    rows={frameRevenueTable.map((item) => [
                      item.name,
                      formatCurrency(item.completed),
                      formatCurrency(item.refunded),
                      formatCurrency(item.pending),
                      formatCurrency(item.total),
                      `${item.shareRev}%`,
                    ])}
                  />

                  <div className="pt-4 border-t border-slate-100" />
                  <div className="text-sm font-semibold text-slate-700">
                    Bảng lens
                  </div>
                  <SimpleTable
                    headers={[
                      "Lens",
                      "Complete",
                      "Refund",
                      "Đang xử lý",
                      "Tổng",
                      "Tỉ trọng DT",
                    ]}
                    rows={lensRevenueTable.map((item) => [
                      item.name,
                      formatCurrency(item.completed),
                      formatCurrency(item.refunded),
                      formatCurrency(item.pending),
                      formatCurrency(item.total),
                      `${item.shareRev}%`,
                    ])}
                  />
                </div>
              </div>
            )}
          </DashboardCard>

          <DashboardCard
            delay={0.24}
            title="Tồn kho và mua hàng"
            description="Chia theo gọng và lens (lens không có pre-order). Màu hiển thị theo biến thể."
            icon={<FiPackage className="text-sky-500" size={20} />}
          >
            {loading ? (
              <LoadingBlock />
            ) : (
              <div className="space-y-4">
                <div className="rounded-xl bg-slate-50 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="text-sm font-semibold text-slate-900">
                      Tổng quan
                    </div>
                    <div className="text-xs text-slate-500">
                      Sell-through = Đã bán / Tổng hàng
                    </div>
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-4">
                    <div className="rounded-2xl border border-slate-200 bg-white p-3">
                      <div className="text-xs text-slate-500">Đã bán</div>
                      <div className="mt-1 text-lg font-semibold text-slate-900">
                        {formatCompactNumber(inventorySummary.total.sold)}
                      </div>
                      <div className="mt-1 text-xs text-slate-500">
                        Gọng {formatCompactNumber(inventorySummary.frame.sold)}{" "}
                        · Lens {formatCompactNumber(inventorySummary.lens.sold)}
                      </div>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white p-3">
                      <div className="text-xs text-slate-500">Bị hủy</div>
                      <div className="mt-1 text-lg font-semibold text-slate-900">
                        {formatCompactNumber(inventorySummary.total.cancelled)}
                      </div>
                      <div className="mt-1 text-xs text-slate-500">
                        Gọng{" "}
                        {formatCompactNumber(inventorySummary.frame.cancelled)}{" "}
                        · Lens{" "}
                        {formatCompactNumber(inventorySummary.lens.cancelled)}
                      </div>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white p-3">
                      <div className="text-xs text-slate-500">Tổng hàng</div>
                      <div className="mt-1 text-lg font-semibold text-slate-900">
                        {formatCompactNumber(inventorySummary.total.items)}
                      </div>
                      <div className="mt-1 text-xs text-slate-500">
                        Gọng{" "}
                        {formatCompactNumber(inventorySummary.frame.totalItems)}{" "}
                        · Lens{" "}
                        {formatCompactNumber(inventorySummary.lens.totalItems)}
                      </div>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white p-3">
                      <div className="text-xs text-slate-500">Sell-through</div>
                      <div className="mt-1 text-lg font-semibold text-slate-900">
                        {inventorySummary.total.soldShareInItems}%
                      </div>
                      <div className="mt-1 text-xs text-slate-500">
                        Gọng {inventorySummary.frame.soldShareInItems}% · Lens{" "}
                        {inventorySummary.lens.soldShareInItems}%
                      </div>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white p-3">
                      <div className="text-xs text-slate-500">Doanh thu</div>
                      <div className="mt-1 text-lg font-semibold text-slate-900">
                        {formatCurrency(inventorySummary.total.revenue)}
                      </div>
                      <div className="mt-1 text-xs text-slate-500">
                        Gọng {inventorySummary.frame.revenueShareInTotal}% ·
                        Lens {inventorySummary.lens.revenueShareInTotal}%
                      </div>
                      <div className="mt-1 text-[11px] text-slate-500">
                        Hoàn tiền:{" "}
                        {formatCurrency(inventorySummary.total.refundedRevenue)}
                      </div>
                      <div className="mt-1 text-[11px] text-slate-500">
                        Hủy:{" "}
                        {formatCurrency(
                          inventorySummary.total.cancelledRevenue,
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="text-sm font-semibold text-slate-700">
                  Bảng gọng
                </div>
                <SimpleTable
                  headers={[
                    "Gọng",
                    "Màu (biến thể)",
                    "Đã bán",
                    "Bị hủy",
                    "Tồn kho",
                    "Pre-order",
                    "Tỷ trọng SL",
                    "Bán/Tổng hàng",
                    "Doanh thu",
                    "Tỷ trọng DT",
                  ]}
                  rows={frameInventoryTable.map((item) => [
                    item.name,
                    item.color,
                    formatCompactNumber(item.sold),
                    formatCompactNumber(item.cancelled),
                    formatCompactNumber(item.stock),
                    formatCompactNumber(item.preorder),
                    `${item.soldShare}%`,
                    `${item.soldInItemsShare}%`,
                    formatCurrency(item.revenue),
                    `${item.revShare}%`,
                  ])}
                />

                <div className="pt-4 border-t border-slate-100" />
                <div className="text-sm font-semibold text-slate-700">
                  Bảng lens
                </div>
                <SimpleTable
                  headers={[
                    "Lens",
                    "Màu (biến thể)",
                    "Đã bán",
                    "Bị hủy",
                    "Tồn kho",
                    "Tỷ trọng SL",
                    "Bán/Tổng hàng",
                    "Doanh thu",
                    "Tỷ trọng DT",
                  ]}
                  rows={lensInventoryTable.map((item) => [
                    item.name,
                    item.color,
                    formatCompactNumber(item.sold),
                    formatCompactNumber(item.cancelled),
                    formatCompactNumber(item.stock),
                    `${item.soldShare}%`,
                    `${item.soldInItemsShare}%`,
                    formatCurrency(item.revenue),
                    `${item.revShare}%`,
                  ])}
                />
              </div>
            )}
          </DashboardCard>

          <DashboardCard
            delay={0.28}
            title="Kết luận sản phẩm"
            description="Tóm nhanh: top theo số lượng, top theo doanh thu và sản phẩm có refund cao nhất."
            icon={<FiTrendingUp className="text-green-500" size={20} />}
          >
            {loading ? (
              <LoadingBlock />
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <KpiBox
                    title="Top theo số lượng"
                    value={productConclusion?.topQty?.productName || "N/A"}
                    sub={`SL: ${formatCompactNumber(
                      productConclusion?.topQty?.quantitySold,
                    )} · ${productConclusion.topQtyShare}% tổng SL`}
                  />
                  <KpiBox
                    title="Top theo doanh thu"
                    value={productConclusion?.topRev?.name || "N/A"}
                    sub={`DT: ${formatCurrency(
                      productConclusion?.topRev?.total,
                    )} · ${productConclusion.topRevShare}% DT sản phẩm`}
                  />
                  <KpiBox
                    title="Refund cao nhất"
                    value={productConclusion?.refundedMax?.name || "N/A"}
                    sub={`Refund: ${formatCurrency(
                      Math.abs(
                        toNumber(
                          productConclusion?.refundedMax?.refunded,
                        ),
                      ),
                    )} · ${productConclusion.refundedMaxShare}% DT sản phẩm`}
                  />
                </div>

                <div className="rounded-xl bg-slate-50 p-4 text-sm text-slate-700">
                  <div className="font-semibold text-slate-900">Tóm tắt</div>
                  <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-3">
                    <div className="rounded-2xl border border-slate-200 bg-white p-3">
                      <div className="text-xs text-slate-500">
                        Tổng số lượng đã bán
                      </div>
                      <div className="mt-1 text-lg font-semibold text-slate-900">
                        {formatCompactNumber(soldQuantitySummary.totalSold)}
                      </div>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white p-3">
                      <div className="text-xs text-slate-500">Gọng đã bán</div>
                      <div className="mt-1 text-lg font-semibold text-slate-900">
                        {formatCompactNumber(soldQuantitySummary.frameSold)}
                      </div>
                      <div className="mt-1 text-xs text-slate-500">
                        {soldQuantitySummary.frameShare}%
                      </div>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white p-3">
                      <div className="text-xs text-slate-500">Lens đã bán</div>
                      <div className="mt-1 text-lg font-semibold text-slate-900">
                        {formatCompactNumber(soldQuantitySummary.lensSold)}
                      </div>
                      <div className="mt-1 text-xs text-slate-500">
                        {soldQuantitySummary.lensShare}%
                      </div>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white p-3">
                      <div className="text-xs text-slate-500">
                        Top theo số lượng
                      </div>
                      <div className="mt-1 text-lg font-semibold text-slate-900">
                        {productConclusion.topQtyShare}%
                      </div>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white p-3">
                      <div className="text-xs text-slate-500">
                        Top theo doanh thu
                      </div>
                      <div className="mt-1 text-lg font-semibold text-slate-900">
                        {productConclusion.topRevShare}%
                      </div>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white p-3">
                      <div className="text-xs text-slate-500">
                        Refund cao nhất
                      </div>
                      <div className="mt-1 text-lg font-semibold text-slate-900">
                        {productConclusion.refundedMaxShare}%
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </DashboardCard>
        </div>
      )}

      {type === "customers" && (
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
          <DashboardCard
            delay={0.16}
            title="Khách hàng chi tiêu nhiều nhất"
            description="Tổng hợp khách hàng có tổng chi tiêu cao nhất."
            icon={<FiUsers className="text-violet-500" size={20} />}
          >
            {loading ? (
              <LoadingBlock />
            ) : (
              <div className="space-y-4">
                <div className="rounded-xl bg-slate-50 p-4">
                  <div className="text-sm font-semibold text-slate-900">
                    Tổng quan khách hàng
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-3">
                    <div className="rounded-2xl border border-slate-200 bg-white p-3">
                      <div className="text-xs text-slate-500">
                        Tổng khách hàng
                      </div>
                      <div className="mt-1 text-lg font-semibold text-slate-900">
                        {formatCompactNumber(customerSummary.totalCustomers)}
                      </div>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-white p-3">
                      <div className="text-xs text-slate-500">Tổng số đơn</div>
                      <div className="mt-1 text-lg font-semibold text-slate-900">
                        {formatCompactNumber(customerSummary.totalOrders)}
                      </div>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-white p-3">
                      <div className="text-xs text-slate-500">
                        TB đơn / khách
                      </div>
                      <div className="mt-1 text-lg font-semibold text-slate-900">
                        {customerSummary.avgOrdersPerCustomer.toLocaleString(
                          "vi-VN",
                          { maximumFractionDigits: 2 },
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <Chart
                  options={customerChartOptions}
                  series={customerChartSeries}
                  type="bar"
                  height={340}
                />
                <SimpleTable
                  headers={[
                    "Khách hàng",
                    "Tổng đơn",
                    "Tỷ trọng đơn",
                    "Đơn hoàn tất",
                    "Đơn hủy",
                    "Tổng chi",
                    "Tỷ trọng chi",
                    "Sản phẩm mua nhiều nhất",
                  ]}
                  rows={topCustomersWithSpendShare.map((item) => {
                    const orderShare =
                      customerSummary.totalOrders > 0
                        ? Number(
                            (
                              (toNumber(item?.totalOrders) /
                                customerSummary.totalOrders) *
                              100
                            ).toFixed(1),
                          )
                        : 0;
                    return [
                      item?.customerName || "Guest",
                      formatCompactNumber(item?.totalOrders),
                      `${orderShare}%`,
                      formatCompactNumber(item?.completedOrders),
                      formatCompactNumber(item?.cancelledOrders),
                      formatCurrency(item?.totalSpent),
                      `${toNumber(item?.spendShare)}%`,
                      `${item?.favoriteProductName || "N/A"} (${formatCompactNumber(
                        item?.favoriteProductQuantity,
                      )})`,
                    ];
                  })}
                />
              </div>
            )}
          </DashboardCard>

          <DashboardCard
            delay={0.2}
            title="Top khách hàng theo chi tiêu"
            description="Danh sách top customer theo spending."
            icon={<FiDollarSign className="text-amber-500" size={20} />}
          >
            {loading ? (
              <LoadingBlock />
            ) : (
              <SimpleTable
                headers={[
                  "Khách hàng",
                  "Số đơn",
                  "Tỷ trọng đơn",
                  "Tổng chi tiêu",
                  "Tỷ trọng chi",
                ]}
                rows={topCustomersBySpending.map((item) => {
                  const orderShare =
                    customerSummary.totalOrders > 0
                      ? Number(
                          (
                            (toNumber(item?.totalOrders) /
                              customerSummary.totalOrders) *
                            100
                          ).toFixed(1),
                        )
                      : 0;
                  return [
                    item?.customerName || "Guest",
                    formatCompactNumber(item?.totalOrders),
                    `${orderShare}%`,
                    formatCurrency(item?.totalSpent),
                    `${toNumber(item?.spendShare)}%`,
                  ];
                })}
              />
            )}
          </DashboardCard>

          <DashboardCard
            delay={0.24}
            title="Khách hàng hủy đơn nhiều"
            description="Sắp xếp theo số đơn hủy để biết khách hàng có xu hướng hủy nhiều."
            icon={<FiRefreshCcw className="text-red-500" size={20} />}
          >
            {loading ? (
              <LoadingBlock />
            ) : (
              <SimpleTable
                headers={[
                  "Khách hàng",
                  "Đơn hủy",
                  "Tỷ trọng hủy",
                  "Tổng đơn",
                  "Tổng chi",
                ]}
                rows={cancelledCustomers.map((item) => [
                  item?.customerName || "Guest",
                  formatCompactNumber(item?.cancelledOrders),
                  `${toNumber(item?.cancelledShare)}%`,
                  formatCompactNumber(item?.totalOrders),
                  formatCurrency(item?.totalSpent),
                ])}
              />
            )}
          </DashboardCard>

          <DashboardCard
            delay={0.28}
            title="Kết luận khách hàng"
            description="Cho thấy khách nào mua nhiều sản phẩm nhất, nhiều đơn nhất và chi nhiều nhất."
            icon={<FiTrendingUp className="text-green-500" size={20} />}
          >
            {loading ? (
              <LoadingBlock />
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <KpiBox
                  title="Chi nhiều nhất"
                  value={
                    [...topCustomers].sort(
                      (a, b) =>
                        toNumber(b?.totalSpent) - toNumber(a?.totalSpent),
                    )?.[0]?.customerName || "N/A"
                  }
                  sub={formatCurrency(
                    [...topCustomers].sort(
                      (a, b) =>
                        toNumber(b?.totalSpent) - toNumber(a?.totalSpent),
                    )?.[0]?.totalSpent,
                  )}
                />
                <KpiBox
                  title="Nhiều đơn nhất"
                  value={
                    [...topCustomers].sort(
                      (a, b) =>
                        toNumber(b?.totalOrders) - toNumber(a?.totalOrders),
                    )?.[0]?.customerName || "N/A"
                  }
                  sub={formatCompactNumber(
                    [...topCustomers].sort(
                      (a, b) =>
                        toNumber(b?.totalOrders) - toNumber(a?.totalOrders),
                    )?.[0]?.totalOrders,
                  )}
                />
                <KpiBox
                  title="Mua SP nhiều nhất"
                  value={
                    [...topCustomers].sort(
                      (a, b) =>
                        toNumber(b?.favoriteProductQuantity) -
                        toNumber(a?.favoriteProductQuantity),
                    )?.[0]?.customerName || "N/A"
                  }
                  sub={formatCompactNumber(
                    [...topCustomers].sort(
                      (a, b) =>
                        toNumber(b?.favoriteProductQuantity) -
                        toNumber(a?.favoriteProductQuantity),
                    )?.[0]?.favoriteProductQuantity,
                  )}
                />
              </div>
            )}
          </DashboardCard>
        </div>
      )}
    </div>
  );
}

function DashboardCard({ title, description, icon, children, delay = 0 }) {
  return (
    <motion.section
      {...fadeUp(delay)}
      className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
    >
      <div className="mb-5 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
          <p className="mt-1 text-sm text-slate-500">{description}</p>
        </div>
        <div className="rounded-2xl bg-slate-100 p-3">{icon}</div>
      </div>
      {children}
    </motion.section>
  );
}

function SimpleTable({ headers, rows }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200">
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50">
            <tr>
              {headers.map((header) => (
                <th
                  key={header}
                  className="whitespace-nowrap px-4 py-3 text-left font-semibold text-slate-600"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows?.length ? (
              rows.map((row, index) => (
                <tr
                  key={index}
                  className="border-t border-slate-100 bg-white hover:bg-slate-50"
                >
                  {row.map((cell, cellIndex) => (
                    <td
                      key={cellIndex}
                      className="whitespace-nowrap px-4 py-3 text-slate-700"
                    >
                      {cell}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={headers.length}
                  className="px-4 py-6 text-center text-slate-400"
                >
                  Không có dữ liệu
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function LoadingBlock() {
  return (
    <div className="flex h-70 items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 text-sm text-slate-400">
      Đang tải dữ liệu...
    </div>
  );
}

function DateField({ label, value, onChange }) {
  return (
    <label className="flex flex-col gap-2">
      <span className="text-sm font-medium text-slate-600">{label}</span>
      <input
        type="date"
        className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-700 shadow-sm outline-none transition focus:border-sky-400"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

function ToggleButton({ children, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
        active
          ? "bg-white text-slate-900 shadow-sm"
          : "text-slate-500 hover:text-slate-800"
      }`}
    >
      {children}
    </button>
  );
}

function KpiBox({ title, value, sub }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div className="text-sm text-slate-500">{title}</div>
      <div className="mt-2 text-xl font-bold leading-snug text-slate-900 break-words">
        {value}
      </div>
      <div className="mt-2 text-sm text-slate-500">{sub}</div>
    </div>
  );
}

function toInputDate(date) {
  return date.toISOString().slice(0, 10);
}

function toNumber(value) {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function applyPercentages(rows, valueKey, outputKey) {
  const scale = 10;
  const total = rows.reduce(
    (sum, item) => sum + Math.max(toNumber(item[valueKey]), 0),
    0,
  );

  if (total <= 0) {
    return rows.map((item) => ({ ...item, [outputKey]: 0 }));
  }

  const ranked = rows.map((item, index) => {
    const value = Math.max(toNumber(item[valueKey]), 0);
    const raw = value > 0 ? (value / total) * 100 : 0;
    const scaledRaw = raw * scale;
    const baseScaled = Math.floor(scaledRaw);
    const remainder = scaledRaw - baseScaled;

    return {
      item,
      index,
      value,
      baseScaled,
      remainder,
    };
  });

  const targetScaled = 100 * scale;
  const currentScaled = ranked.reduce((sum, item) => sum + item.baseScaled, 0);
  let remaining = targetScaled - currentScaled;

  ranked.sort((a, b) => {
    if (b.remainder !== a.remainder) {
      return b.remainder - a.remainder;
    }
    return a.index - b.index;
  });

  const distributable = ranked.filter((entry) => entry.value > 0);

  let pointer = 0;
  while (remaining > 0 && distributable.length > 0) {
    distributable[pointer].baseScaled += 1;
    remaining -= 1;
    pointer = (pointer + 1) % distributable.length;
  }

  ranked.sort((a, b) => a.index - b.index);

  return ranked.map(({ item, baseScaled }) => ({
    ...item,
    [outputKey]: Number((baseScaled / scale).toFixed(1)),
  }));
}

function formatCurrency(value) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(toNumber(value));
}

function formatCompactCurrency(value) {
  const formatted = new Intl.NumberFormat("vi-VN", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(toNumber(value));
  return `${formatted}\u00A0đ`.replace(/\s+/g, "\u00A0");
}

function formatCompactNumber(value) {
  return new Intl.NumberFormat("vi-VN", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(toNumber(value));
}

function formatAxisCurrency(value) {
  const number = toNumber(value);
  if (number >= 1_000_000_000) return `${(number / 1_000_000_000).toFixed(1)}B`;
  if (number >= 1_000_000) return `${(number / 1_000_000).toFixed(1)}M`;
  if (number >= 1_000) return `${(number / 1_000).toFixed(1)}K`;
  return `${number}`;
}

export default AdminReportsDashboard;
