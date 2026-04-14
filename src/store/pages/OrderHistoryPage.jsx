import { getReturnRequestsByOrderItemApi } from "../api/returnRequestApi";
import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
    FiBox,
    FiTruck,
    FiCheckCircle,
    FiShoppingBag,
    FiAlertCircle,
    FiDollarSign,
    FiZap,
    FiFileText,
} from "react-icons/fi";

import { getMyOrders, cancelOrder } from "../services/orderService";
import { createVNPayPayment } from "../services/checkoutService";
import { addToCartService } from "../services/cartService";
import { updatePaymentMethodApi } from "../api/orderApi";
import { useToast } from "../../context/ToastContext";

const isComboOrder = (order) => {
    if (!order?.items || order.items.length === 0) return false;

    return order.items.some(
        (i) =>
            i.variantId != null &&
            (
                i.lensOptionId != null ||
                i.lensType != null ||
                i.prescription != null ||
                i.sphLeft != null ||
                i.sphRight != null ||
                i.cylLeft != null ||
                i.cylRight != null ||
                i.axisLeft != null ||
                i.axisRight != null ||
                i.addLeft != null ||
                i.addRight != null ||
                i.pd != null
            )
    );
};

const getComboRequest = (order, returnMap) => {
    if (!order?.items?.length) return null;
    return order.items
        .map((item) => returnMap[item.orderItemId])
        .find(Boolean) || null;
};

const PrescriptionInfoBlock = ({ item }) => {
    if (!item) return null;
    const rx = item.prescription || item;

    if (
        rx.sphLeft == null &&
        rx.sphRight == null &&
        rx.cylLeft == null &&
        rx.cylRight == null &&
        rx.addLeft == null &&
        rx.addRight == null &&
        rx.pd == null
    ) {
        return null;
    }

    return (
        <div className="mt-4 bg-indigo-50/60 border border-indigo-100 rounded-xl p-4">
            <p className="text-xs font-semibold text-indigo-600 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <FiFileText size={14} /> Prescription Details
            </p>

            <div className="grid grid-cols-5 gap-2 text-center text-[10px] font-bold text-indigo-400 uppercase mb-2">
                <div className="text-left">Eye</div>
                <div>SPH</div>
                <div>CYL</div>
                <div>AXIS</div>
                <div>ADD</div>
            </div>

            <div className="grid grid-cols-5 gap-2 text-center text-xs font-mono text-gray-700 mb-2 items-center bg-white border border-indigo-50/50 rounded-lg p-2 shadow-sm shadow-indigo-100/20">
                <div className="text-left font-semibold text-gray-500 font-sans text-[11px]">
                    Right (OD)
                </div>
                <div>{rx.sphRight ?? "—"}</div>
                <div>{rx.cylRight ?? "—"}</div>
                <div>{rx.axisRight != null ? `${rx.axisRight}°` : "—"}</div>
                <div>{rx.addRight ?? "—"}</div>
            </div>

            <div className="grid grid-cols-5 gap-2 text-center text-xs font-mono text-gray-700 items-center bg-white border border-indigo-50/50 rounded-lg p-2 shadow-sm shadow-indigo-100/20">
                <div className="text-left font-semibold text-gray-500 font-sans text-[11px]">
                    Left (OS)
                </div>
                <div>{rx.sphLeft ?? "—"}</div>
                <div>{rx.cylLeft ?? "—"}</div>
                <div>{rx.axisLeft != null ? `${rx.axisLeft}°` : "—"}</div>
                <div>{rx.addLeft ?? "—"}</div>
            </div>

            {rx.pd && (
                <div className="mt-3 pt-3 border-t border-indigo-100/50 text-[11px] text-gray-500 flex items-center gap-2">
                    <span className="font-medium text-indigo-700/70">
                        Pupillary Distance (PD):
                    </span>
                    <span className="font-bold text-indigo-800 font-mono tracking-wide bg-white px-2 py-0.5 rounded-md border border-indigo-100/50 shadow-sm">
                        {rx.pd} mm
                    </span>
                </div>
            )}
        </div>
    );
};

const getReturnStatusInfo = (status) => {
    switch (status) {
        case "PENDING":
            return { text: "Pending", color: "text-yellow-600", bg: "bg-yellow-100" };
        case "WAITING_CUSTOMER_RETURN":
            return { text: "Approved", color: "text-blue-600", bg: "bg-blue-100" };
        case "RECEIVED_RETURN":
            return { text: "Received", color: "text-cyan-600", bg: "bg-cyan-100" };
        case "REFUND_INFO_INVALID":
            return { text: "Refund Info Invalid", color: "text-red-600", bg: "bg-red-100" };
        case "REFUND_PENDING":
            return { text: "Refund Pending", color: "text-indigo-600", bg: "bg-indigo-100" };
        case "REFUNDED":
            return { text: "Refunded", color: "text-green-600", bg: "bg-green-100" };
        case "APPROVED":
            return { text: "Approved", color: "text-blue-600", bg: "bg-blue-100" };
        case "REJECTED":
            return { text: "Rejected", color: "text-red-600", bg: "bg-red-100" };
        case "COMPLETED":
            return { text: "Completed", color: "text-green-600", bg: "bg-green-100" };
        default:
            return { text: status || "Submitted", color: "text-stone-600", bg: "bg-stone-100" };
    }
};

const getReturnActionLabel = (request) => {
    if (!request) return "Return Request";

    switch (request.status) {
        case "PENDING":
            return "Submitted";
        case "WAITING_CUSTOMER_RETURN":
            return "Approved";
        case "RECEIVED_RETURN":
            return "Received";
        case "REFUND_INFO_INVALID":
            return "Update Refund Info";
        case "REFUND_PENDING":
            return "Refund Pending";
        case "REFUNDED":
            return "Refunded";
        case "APPROVED":
            return "Approved";
        case "REJECTED":
            return "Rejected";
        case "COMPLETED":
            return "Completed";
        default:
            return request.status;
    }
};

const ReturnRequestInfoBlock = ({ request }) => {
    if (!request) return null;

    const statusInfo = getReturnStatusInfo(request.status);
    const rejectMessage =
        request.rejectionReason ||
        request.rejectReason ||
        request.adminNote ||
        request.note;

    return (
        <div className="mt-4 rounded-xl border border-stone-200 bg-white p-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
                <p className="text-sm font-semibold text-stone-800">
                    Return / Exchange Request
                </p>
                <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${statusInfo.bg} ${statusInfo.color}`}
                >
                    {statusInfo.text}
                </span>
            </div>

            {request.reason && (
                <p className="mt-3 text-sm text-stone-700">
                    <span className="font-semibold">Reason: </span>
                    {request.reason}
                </p>
            )}

            {request.description && (
                <p className="mt-2 text-sm text-stone-500">
                    <span className="font-semibold">Description: </span>
                    {request.description}
                </p>
            )}

            {rejectMessage && (
                <p className="mt-3 text-sm text-red-600 font-medium">
                    <span className="font-semibold">Reject reason: </span>
                    {rejectMessage}
                </p>
            )}

            {request.refundNote && (
                <p className="mt-3 text-sm text-red-600 font-medium">
                    <span className="font-semibold">Refund note: </span>
                    {request.refundNote}
                </p>
            )}

            {request.requestType === "RETURN" &&
                (request.bankName || request.bankAccountNumber || request.bankAccountHolder) && (
                    <div className="mt-3 rounded-lg bg-stone-50 border border-stone-100 p-3 text-sm text-stone-600">
                        <div>
                            <span className="font-semibold">Bank: </span>
                            {request.bankName || "-"}
                        </div>
                        <div>
                            <span className="font-semibold">Account No: </span>
                            {request.bankAccountNumber || "-"}
                        </div>
                        <div>
                            <span className="font-semibold">Holder: </span>
                            {request.bankAccountHolder || "-"}
                        </div>
                    </div>
                )}
        </div>
    );
};

function OrderHistoryPage() {
    const [orders, setOrders] = useState([]);
    const [activeTab, setActiveTab] = useState("All");
    const [returnMap, setReturnMap] = useState({});
    const [expandedOrderId, setExpandedOrderId] = useState(null);
    const { showToast } = useToast();
    const navigate = useNavigate();

    const TABS = [
        { id: "All", label: "All" },
        { id: "PENDING", label: "Pending" },
        { id: "PROCESSING", label: "Processing" },
        { id: "SHIPPING", label: "Shipping" },
        { id: "COMPLETED", label: "Completed" },
        { id: "CANCELLED", label: "Cancelled" },
    ];

    useEffect(() => {
        const fetchOrders = async () => {
            try {
                const data = await getMyOrders();
                setOrders(data);

                const map = {};

                for (const order of data) {
                    for (const item of order.items || []) {
                        try {
                            const res = await getReturnRequestsByOrderItemApi(item.orderItemId);
                            const requests = Array.isArray(res?.data?.data) ? res.data.data : [];
                            if (requests.length > 0) {
                                map[item.orderItemId] = requests[0];
                            }
                        } catch {
                            // ignore
                        }
                    }
                }

                setReturnMap(map);
            } catch (err) {
                console.error("Fetch orders error:", err);
            }
        };

        fetchOrders();
        const interval = setInterval(fetchOrders, 10000);
        return () => clearInterval(interval);
    }, []);

    const handleCancelOrder = async (orderId, isPreorder) => {
        const msg = isPreorder
            ? "WARNING: This is a pre-order with a deposit already paid. If you cancel now, your deposit will NOT be refunded. Are you sure you want to proceed?"
            : "Are you sure you want to cancel this order?";

        if (window.confirm(msg)) {
            try {
                const res = await cancelOrder(orderId);
                if (res.success) {
                    setOrders((prev) =>
                        prev.map((o) =>
                            o.orderId === orderId ? { ...o, status: "CANCELLED" } : o
                        )
                    );
                    showToast("Order cancelled successfully!");
                }
            } catch (error) {
                showToast(
                    "Cancellation failed: " +
                    (error.response?.data?.message || "System error"),
                    "error"
                );
            }
        }
    };

    const handlePayRemainingVNPay = async (order) => {
        const remaining = (order.total || 0) - (order.depositAmount || 0);
        if (remaining <= 0) return;

        try {
            const url = await createVNPayPayment(remaining, order.orderId);
            window.location.href = url;
        } catch (err) {
            showToast("Failed to initiate VNPay payment.", "error");
        }
    };

    const handlePayRemainingCOD = async (order) => {
        try {
            await updatePaymentMethodApi(order.orderId, "COD");
            showToast(
                "Remaining balance will be collected on delivery (COD).",
                "success"
            );
            setOrders((prev) =>
                prev.map((o) =>
                    o.orderId === order.orderId ? { ...o, paymentMethod: "COD" } : o
                )
            );
        } catch (err) {
            showToast("Failed to update payment method.", "error");
        }
    };

    const handleBuyAgain = async (orderItems) => {
        try {
            showToast("Adding items to cart...");

            for (const item of orderItems) {
                await addToCartService({
                    variantId: item.variantId,
                    productId: item.productId,
                    quantity: item.quantity,
                    lensOptionId: item.lensOptionId,
                    isPreorder: item.isPreorder,
                    isLens:
                        item.sphLeft != null ||
                        item.sphRight != null ||
                        item.prescription != null,
                    prescriptionId:
                        item.prescriptionId || item.prescription?.prescriptionId || null,
                    sphLeft: item.sphLeft,
                    sphRight: item.sphRight,
                    cylLeft: item.cylLeft,
                    cylRight: item.cylRight,
                    axisLeft: item.axisLeft,
                    axisRight: item.axisRight,
                    addLeft: item.addLeft,
                    addRight: item.addRight,
                    pd: item.pd,
                });
            }

            showToast("Items added to cart!", "success");
            navigate("/checkout");
        } catch (err) {
            showToast("Failed to re-order items.", "error");
        }
    };

    const getStatusInfo = (status) => {
        switch (status) {
            case "SHIPPING":
                return { text: "Shipping", code: 2, color: "text-blue-500" };
            case "PROCESSING":
                return { text: "Processing", code: 1.5, color: "text-blue-500" };
            case "COMPLETED":
                return { text: "Delivered", code: 3, color: "text-green-600" };
            case "CANCELLED":
                return { text: "Cancelled", code: 4, color: "text-red-500" };
            default:
                return { text: "Pending", code: 1, color: "text-stone-500" };
        }
    };

    const filteredOrders = orders.filter(
        (o) => activeTab === "All" || o.status === activeTab
    );

    const toggleOrderDetail = (id) =>
        setExpandedOrderId((prev) => (prev === id ? null : id));

    return (
        <div className="min-h-screen bg-stone-50 pt-24 pb-20 px-6 font-sans">
            <style>{`
                @keyframes fadeUp {
                  from { opacity: 0; transform: translateY(15px); }
                  to { opacity: 1; transform: translateY(0); }
                }
            `}</style>

            <div className="max-w-4xl mx-auto">
                <h1 className="text-2xl font-bold text-stone-900 mb-6 tracking-tight uppercase">
                    Your Orders
                </h1>

                <div className="flex overflow-x-auto hide-scrollbar bg-white rounded-2xl shadow-sm border border-stone-100 mb-8 p-1">
                    {TABS.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex-1 min-w-[120px] py-3 text-sm font-medium rounded-xl transition-all duration-300 ${
                                activeTab === tab.id
                                    ? "bg-blue-600 text-white shadow-md"
                                    : "text-stone-500 hover:text-stone-900 hover:bg-stone-50"
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {filteredOrders.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-stone-100 py-16 flex flex-col items-center shadow-sm">
                        <div className="w-20 h-20 bg-stone-50 rounded-full flex items-center justify-center text-stone-300 mb-4">
                            <FiBox size={32} />
                        </div>
                        <p className="text-stone-500 font-medium">No orders found.</p>
                    </div>
                ) : (
                    <div className="flex flex-col gap-6">
                        {filteredOrders.map((order, index) => {
                            const comboOrder = isComboOrder(order);
                            const comboRequest = comboOrder ? getComboRequest(order, returnMap) : null;
                            const statusInfo = getStatusInfo(order.status);
                            const isExpanded = expandedOrderId === order.id;
                            const itemCount = order.items?.length || 0;
                            const isSingleItemOrder = itemCount === 1;
                            const shouldShowBottomReturnAction = statusInfo.code === 3 && (isSingleItemOrder || comboOrder);
                            const singleItemRequest =
                                isSingleItemOrder
                                    ? (comboOrder ? comboRequest : returnMap[order.items[0]?.orderItemId])
                                    : null;
                            const displayAmount =
                                order.finalPrice ??
                                order.totalPrice ??
                                order.total ??
                                0;
                            return (
                                <div
                                    key={order.id}
                                    className="bg-white p-6 rounded-2xl shadow-sm border border-stone-100 transition-shadow hover:shadow-md"
                                    style={{
                                        animation: `fadeUp 0.4s ease forwards ${index * 0.1}s`,
                                        opacity: 0,
                                    }}
                                >
                                    <div className="flex justify-between items-start border-b border-stone-100 pb-4 mb-5">
                                        <div>
                                            <p className="font-bold text-stone-900 text-sm md:text-base tracking-tight">
                                                #{order.id}
                                            </p>
                                            <p className="text-xs md:text-sm text-stone-500 mt-1">
                                                Ordered on {order.date}
                                            </p>
                                        </div>

                                        <div className="text-right">
                                            <p
                                                className={`font-semibold text-sm ${statusInfo.color} flex items-center justify-end gap-1.5`}
                                            >
                                                {statusInfo.text}
                                            </p>

                                            <div className="flex flex-col items-end mt-1">
                                                <p className="font-bold text-stone-900 text-lg">
                                                    {displayAmount.toLocaleString("en-US")}₫
                                                </p>

                                                {order.depositType === "PARTIAL" && (
                                                    <div className="flex flex-col items-end text-[11px] mt-0.5 space-y-0.5">
                                                        <span className="text-stone-400 bg-stone-100 px-2 py-0.5 rounded-md font-medium">
                                                            Paid: {order.depositAmount?.toLocaleString("en-US")}₫ (
                                                            {order.depositPaymentMethod || order.paymentMethod})
                                                        </span>
                                                        <span
                                                            className={`px-2 py-0.5 rounded-md font-bold border ${
                                                                (order.paymentStatus === "PAID" || order.paymentStatus === "PAID_FULL") &&
                                                                (order.paymentMethod === "COD" ||
                                                                    order.remainingPaymentStatus === "PAID")
                                                                    ? "text-emerald-600 bg-emerald-50 border-emerald-100"
                                                                    : "text-blue-600 bg-blue-50 border-blue-100"
                                                            }`}
                                                        >
                                                            {(order.paymentStatus === "PAID" || order.paymentStatus === "PAID_FULL") &&
                                                            (order.paymentMethod === "COD" ||
                                                                order.remainingPaymentStatus === "PAID")
                                                                ? "Settled"
                                                                : `Remaining: ${(
                                                                    (order.total || order.finalPrice) - order.depositAmount
                                                                ).toLocaleString("en-US")}₫`}
                                                        </span>
                                                        {order.status === "PENDING" && (
                                                            <span className="text-amber-600 font-medium italic mt-1 text-[10px]">
                                                                Waiting for stock...
                                                            </span>
                                                        )}
                                                    </div>
                                                )}

                                                {order.depositType === "FULL" && (
                                                    <div className="flex flex-col items-end mt-1">
                                                        <span className="text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md text-[11px] font-bold border border-emerald-100">
                                                            Full Prepayment ({order.paymentMethod})
                                                        </span>
                                                        {order.status === "PENDING" &&
                                                            order.items?.some((i) => i.isPreorder) && (
                                                                <span className="text-amber-600 font-medium italic mt-1 text-[10px]">
                                                                    Waiting for stock...
                                                                </span>
                                                            )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {order.items?.length > 0 && (
                                        <div className="mb-6">
                                            <div className="flex items-center justify-between gap-4 flex-wrap">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-16 h-16 bg-stone-50 rounded-xl border border-stone-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                                                        {order.items[0]?.image ? (
                                                            <img
                                                                src={order.items[0].image}
                                                                alt={order.items[0].name}
                                                                className="w-full h-full object-cover"
                                                            />
                                                        ) : (
                                                            <FiBox size={24} className="text-stone-300" />
                                                        )}
                                                    </div>

                                                    <div>
                                                        <p className="font-semibold text-stone-800 text-sm md:text-base">
                                                            {order.items[0]?.name}
                                                        </p>
                                                        <p className="text-xs md:text-sm text-stone-500 mt-1">
                                                            {itemCount > 1
                                                                ? `and ${itemCount - 1} more product(s)`
                                                                : `Quantity: ${order.items[0]?.quantity}`}
                                                        </p>
                                                    </div>
                                                </div>

                                                {(itemCount > 1 || order.items[0]?.quantity > 1) && (
                                                    <button
                                                        onClick={() => toggleOrderDetail(order.id)}
                                                        className="px-4 py-2 border border-stone-200 text-stone-700 font-medium rounded-xl hover:bg-stone-50 transition-colors text-sm"
                                                    >
                                                        {isExpanded ? "Hide detail" : "View detail"}
                                                    </button>
                                                )}
                                            </div>

                                            {!isExpanded && <PrescriptionInfoBlock item={order.items[0]} />}

                                            {!isExpanded && order.items?.length === 1 && singleItemRequest && (
                                                <ReturnRequestInfoBlock request={singleItemRequest} />
                                            )}
                                        </div>
                                    )}

                                    {isExpanded && (
                                        <div className="space-y-4 mb-6">
                                            {order.items.map((item) => {
                                                const itemRequest = returnMap[item.orderItemId];
                                                const effectiveRequest = comboOrder ? comboRequest : itemRequest;

                                                return (
                                                    <div
                                                        key={item.orderItemId}
                                                        className="border border-stone-200 rounded-2xl p-4 bg-stone-50"
                                                    >
                                                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                                            <div className="flex items-center gap-4">
                                                                <div className="w-16 h-16 bg-white rounded-xl border border-stone-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                                                                    {item.image ? (
                                                                        <img
                                                                            src={item.image}
                                                                            alt={item.name}
                                                                            className="w-full h-full object-cover"
                                                                        />
                                                                    ) : (
                                                                        <FiBox size={24} className="text-stone-300" />
                                                                    )}
                                                                </div>

                                                                <div>
                                                                    <p className="font-semibold text-stone-800 text-sm md:text-base">
                                                                        {item.name}
                                                                    </p>
                                                                    <p className="text-xs md:text-sm text-stone-500 mt-1 flex items-center gap-2">
                                                                        Quantity: {item.quantity}
                                                                        {item.isPreorder && (
                                                                            <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded text-[10px] font-bold border border-amber-200 uppercase">
                                                                                Pre-order
                                                                            </span>
                                                                        )}
                                                                    </p>
                                                                </div>
                                                            </div>

                                                            <div className="flex flex-wrap gap-3 md:justify-end">
                                                                {statusInfo.code === 3 && !item.isPreorder && (
                                                                    !effectiveRequest ? (
                                                                        comboOrder ? (
                                                                            <Link
                                                                                to={`/return-request?orderId=${order.orderId}&combo=true`}
                                                                                className="px-4 py-2 bg-white border border-stone-200 text-stone-700 font-semibold rounded-xl hover:bg-stone-100 transition-colors text-sm"
                                                                            >
                                                                                Return/Exchange Combo
                                                                            </Link>
                                                                        ) : (
                                                                            <Link
                                                                                to={`/return-request?orderItemId=${item.orderItemId}`}
                                                                                className="px-4 py-2 bg-white border border-stone-200 text-stone-700 font-semibold rounded-xl hover:bg-stone-100 transition-colors text-sm"
                                                                            >
                                                                                Return/Exchange
                                                                            </Link>
                                                                        )
                                                                    ) : (
                                                                        <button
                                                                            disabled
                                                                            className="px-4 py-2 bg-stone-200 border border-stone-200 text-stone-500 font-semibold rounded-xl text-sm cursor-not-allowed"
                                                                        >
                                                                            {getReturnActionLabel(effectiveRequest)}
                                                                        </button>
                                                                    )
                                                                )}

                                                                {statusInfo.code === 3 && (
                                                                    <Link
                                                                        to={`/product/${item.productId}#review-form`}
                                                                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors text-sm"
                                                                    >
                                                                        <FiCheckCircle />
                                                                        Review
                                                                    </Link>
                                                                )}
                                                            </div>
                                                        </div>

                                                        <PrescriptionInfoBlock item={item} />
                                                        {!comboOrder && <ReturnRequestInfoBlock request={itemRequest} />}
                                                    </div>
                                                );
                                            })}

                                            {comboOrder && comboRequest && (
                                                <ReturnRequestInfoBlock request={comboRequest} />
                                            )}
                                        </div>
                                    )}

                                    <div className="flex flex-col gap-4 mt-6 pt-4 border-t border-stone-100">
                                        {order.depositType === "PARTIAL" &&
                                            order.status !== "PENDING" &&
                                            statusInfo.code < 3 && // Not delivered/completed
                                            order.status !== "CANCELLED" &&
                                            order.paymentStatus !== "PAID_FULL" &&
                                            (order.paymentStatus !== "PAID" ||
                                                (order.paymentMethod !== "COD" &&
                                                    order.remainingPaymentStatus !== "PAID")) && (
                                                <div className="bg-blue-50/40 border border-blue-100 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                                    <div className="space-y-1">
                                                        <p className="text-[10px] font-bold text-blue-700 uppercase tracking-widest">
                                                            {order.paymentMethod === "COD" ||
                                                            (order.stockReadyAt &&
                                                                (new Date() - new Date(order.stockReadyAt)) /
                                                                (1000 * 60 * 60) >
                                                                12)
                                                                ? "Automatic Selection: COD"
                                                                : "Action Required: Balance Payment"}
                                                        </p>
                                                        <p className="text-xs text-blue-600/80 leading-relaxed font-medium">
                                                            {order.paymentMethod === "COD" ||
                                                            (order.stockReadyAt &&
                                                                (new Date() - new Date(order.stockReadyAt)) /
                                                                (1000 * 60 * 60) >
                                                                12)
                                                                ? "Remaining balance will be collected on delivery as the 12h payment window passed or COD was selected."
                                                                : "Your items are ready! Please pay the remaining balance via VNPay or switch to COD."}
                                                        </p>
                                                    </div>

                                                    {order.paymentMethod !== "COD" &&
                                                    !(order.stockReadyAt &&
                                                        (new Date() - new Date(order.stockReadyAt)) /
                                                        (1000 * 60 * 60) >
                                                        12) ? (
                                                        <div className="flex gap-2 shrink-0">
                                                            <button
                                                                onClick={() => handlePayRemainingVNPay(order)}
                                                                className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition-all flex items-center gap-1.5 shadow-sm"
                                                            >
                                                                <FiZap size={14} />
                                                                VNPay
                                                            </button>
                                                            <button
                                                                onClick={() => handlePayRemainingCOD(order)}
                                                                className="px-4 py-2 bg-white border border-stone-200 text-stone-700 rounded-xl text-xs font-bold hover:bg-stone-50 transition-all flex items-center gap-1.5 shadow-sm"
                                                            >
                                                                <FiDollarSign size={14} />
                                                                Use COD
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <div className="px-3 py-1.5 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center gap-2 text-[10px] font-bold text-emerald-600 shrink-0">
                                                            <FiCheckCircle size={14} />
                                                            BALANCE VIA COD
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                        <div className="flex flex-wrap items-center justify-end gap-3">
                                            {statusInfo.code === 1 && (
                                                <button
                                                    onClick={() =>
                                                        handleCancelOrder(
                                                            order.orderId,
                                                            order.depositType === "PARTIAL"
                                                        )
                                                    }
                                                    className="px-5 py-2.5 bg-white border border-stone-200 text-stone-500 font-semibold rounded-xl hover:bg-red-50 hover:text-red-500 transition-all text-sm flex items-center gap-2"
                                                >
                                                    <FiAlertCircle size={16} />
                                                    Cancel Order
                                                </button>
                                            )}

                                            <Link
                                                to={`/shipping-progress/${order.orderId}`}
                                                className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-all text-sm shadow-md shadow-blue-500/10"
                                            >
                                                <FiTruck size={16} />
                                                Track Order
                                            </Link>

                                            {shouldShowBottomReturnAction && (
                                                <>
                                                    {comboOrder ? (
                                                        !comboRequest ? (
                                                            <Link
                                                                to={`/return-request?orderId=${order.orderId}&combo=true`}
                                                                className="px-5 py-2.5 bg-white border border-stone-200 text-stone-700 font-semibold rounded-xl hover:bg-stone-50 text-sm"
                                                            >
                                                                Return Combo
                                                            </Link>
                                                        ) : (
                                                            <button
                                                                disabled
                                                                className="px-5 py-2.5 bg-stone-100 border border-stone-200 text-stone-500 rounded-xl text-sm font-semibold"
                                                            >
                                                                {getReturnActionLabel(comboRequest)}
                                                            </button>
                                                        )
                                                    ) : isSingleItemOrder ? (
                                                        !singleItemRequest ? (
                                                            <Link
                                                                to={`/return-request?orderItemId=${order.items[0].orderItemId}`}
                                                                className="px-5 py-2.5 bg-white border border-stone-200 text-stone-700 font-semibold rounded-xl hover:bg-stone-50 text-sm"
                                                            >
                                                                Return Request
                                                            </Link>
                                                        ) : (
                                                            <button
                                                                disabled
                                                                className="px-5 py-2.5 bg-stone-100 border border-stone-200 text-stone-500 rounded-xl text-sm font-semibold"
                                                            >
                                                                {getReturnActionLabel(singleItemRequest)}
                                                            </button>
                                                        )
                                                    ) : null}

                                                    <Link
                                                        to={`/product/${order.items[0].productId}#review-form`}
                                                        className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 text-sm shadow-md"
                                                    >
                                                        <FiCheckCircle />
                                                        Review
                                                    </Link>
                                                </>
                                            )}

                                            {(statusInfo.code === 4 || statusInfo.code === 3) && (
                                                <button
                                                    onClick={() => handleBuyAgain(order.items)}
                                                    className="px-5 py-2.5 bg-stone-100 text-stone-600 font-bold rounded-xl hover:bg-stone-200 transition-all text-sm flex items-center gap-2"
                                                >
                                                    <FiShoppingBag size={16} />
                                                    Buy Again
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}

export default OrderHistoryPage;