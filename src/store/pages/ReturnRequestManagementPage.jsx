import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    getAllReturnRequestsApi,
    approveReturnRequestApi,
    rejectReturnRequestApi,
    markReceivedReturnApi,
    markRefundPendingApi,
    markRefundInvalidApi,
    markRefundedApi,
    completeExchangeRequestApi,
} from "../api/returnRequestApi";

function ReturnRequestManagementPage() {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [updatingId, setUpdatingId] = useState(null);
    const [error, setError] = useState("");
    const [keyword, setKeyword] = useState("");
    const [statusFilter, setStatusFilter] = useState("ALL");

    const navigate = useNavigate();
    const role = getCurrentRoleFromToken();

    useEffect(() => {
        fetchReturnRequests();
    }, []);

    const fetchReturnRequests = async () => {
        try {
            setLoading(true);
            setError("");
            const res = await getAllReturnRequestsApi();
            setRequests(res?.data?.data || []);
        } catch (err) {
            setError(err?.response?.data?.message || "Failed to load return requests");
        } finally {
            setLoading(false);
        }
    };

    const filteredRequests = useMemo(() => {
        return requests.filter((item) => {
            const matchStatus =
                statusFilter === "ALL" ? true : item.status === statusFilter;

            const q = keyword.trim().toLowerCase();
            const matchKeyword =
                !q ||
                String(item.requestId || "").includes(q) ||
                String(item.orderId || "").includes(q) ||
                String(item.orderItemId || "").includes(q) ||
                String(item.replacementOrderId || "").includes(q) ||
                String(item.replacementOrderItemId || "").includes(q) ||
                (item.productName || "").toLowerCase().includes(q) ||
                (item.variantColor || "").toLowerCase().includes(q) ||
                (item.variantSize || "").toLowerCase().includes(q) ||
                (item.reason || "").toLowerCase().includes(q) ||
                (item.description || "").toLowerCase().includes(q) ||
                (item.rejectionReason || "").toLowerCase().includes(q) ||
                (item.requestType || "").toLowerCase().includes(q) ||
                String(item.returnQuantity || "").includes(q);

            return matchStatus && matchKeyword;
        });
    }, [requests, keyword, statusFilter]);

    const updateLocalItem = (updated) => {
        setRequests((prev) =>
            prev.map((item) =>
                item.requestId === updated.requestId ? { ...item, ...updated } : item
            )
        );
    };

    const callActionApi = async (item, action) => {
        switch (action) {
            case "APPROVE":
                return approveReturnRequestApi(item.requestId);

            case "REJECT": {
                const reason = window.prompt("Enter rejection reason:");
                if (reason === null) return null;
                if (!reason.trim()) {
                    alert("Please enter rejection reason");
                    return null;
                }
                return rejectReturnRequestApi(item.requestId, {
                    rejectionReason: reason.trim(),
                });
            }

            case "RECEIVED":
                return markReceivedReturnApi(item.requestId);

            case "REFUND_PENDING":
                return markRefundPendingApi(item.requestId);

            case "REFUND_INVALID": {
                const note = window.prompt("Enter refund note / invalid bank reason:");
                if (note === null) return null;
                if (!note.trim()) {
                    alert("Please enter refund note");
                    return null;
                }
                return markRefundInvalidApi(item.requestId, {
                    refundNote: note.trim(),
                });
            }

            case "REFUNDED":
                return markRefundedApi(item.requestId);

            case "COMPLETE":
                return completeExchangeRequestApi(item.requestId);

            default:
                return null;
        }
    };

    const handleAction = async (item, action) => {
        try {
            setUpdatingId(item.requestId);
            const res = await callActionApi(item, action);
            if (!res) return;

            const updated = res?.data?.data;
            if (updated) {
                updateLocalItem(updated);
            }
        } catch (err) {
            alert(err?.response?.data?.message || "Failed to update request");
        } finally {
            setUpdatingId(null);
        }
    };

    const openDetail = (requestId) => {
        navigate(`/dashboard/return-requests/${requestId}`);
    };

    const renderWorkflowActions = (item) => {
        const isUpdating = updatingId === item.requestId;
        const canHandle = role === "ADMIN" || role === "OPERATIONAL_STAFF";

        if (!canHandle) return null;

        if (item.requestType === "RETURN") {
            if (item.status === "PENDING") {
                return (
                    <>
                        <ActionButton
                            disabled={isUpdating}
                            onClick={() => handleAction(item, "APPROVE")}
                            type="primary"
                        >
                            Approve
                        </ActionButton>
                        <ActionButton
                            disabled={isUpdating}
                            onClick={() => handleAction(item, "REJECT")}
                            type="danger"
                        >
                            Reject
                        </ActionButton>
                    </>
                );
            }

            if (item.status === "WAITING_CUSTOMER_RETURN") {
                return (
                    <ActionButton
                        disabled={isUpdating}
                        onClick={() => handleAction(item, "RECEIVED")}
                        type="success"
                    >
                        Mark Received
                    </ActionButton>
                );
            }

            if (item.status === "RECEIVED_RETURN") {
                return (
                    <>
                        <ActionButton
                            disabled={isUpdating}
                            onClick={() => handleAction(item, "REFUND_PENDING")}
                            type="primary"
                        >
                            Refund Pending
                        </ActionButton>
                        <ActionButton
                            disabled={isUpdating}
                            onClick={() => handleAction(item, "REFUND_INVALID")}
                            type="danger"
                        >
                            Invalid Bank Info
                        </ActionButton>
                        <ActionButton
                            disabled={isUpdating}
                            onClick={() => handleAction(item, "REFUNDED")}
                            type="success"
                        >
                            Refunded
                        </ActionButton>
                    </>
                );
            }

            if (item.status === "REFUND_PENDING") {
                return (
                    <>
                        <ActionButton
                            disabled={isUpdating}
                            onClick={() => handleAction(item, "REFUNDED")}
                            type="success"
                        >
                            Refunded
                        </ActionButton>
                        <ActionButton
                            disabled={isUpdating}
                            onClick={() => handleAction(item, "REFUND_INVALID")}
                            type="danger"
                        >
                            Invalid Bank Info
                        </ActionButton>
                    </>
                );
            }
        }

        if (item.requestType === "EXCHANGE") {
            if (item.status === "PENDING") {
                return (
                    <>
                        <ActionButton
                            disabled={isUpdating}
                            onClick={() => handleAction(item, "APPROVE")}
                            type="primary"
                        >
                            Approve
                        </ActionButton>
                        <ActionButton
                            disabled={isUpdating}
                            onClick={() => handleAction(item, "REJECT")}
                            type="danger"
                        >
                            Reject
                        </ActionButton>
                    </>
                );
            }

            if (item.status === "APPROVED") {
                return (
                    <ActionButton
                        disabled={isUpdating}
                        onClick={() => handleAction(item, "COMPLETE")}
                        type="success"
                    >
                        Complete
                    </ActionButton>
                );
            }
        }

        return null;
    };

    if (loading) {
        return <div className="p-6">Loading...</div>;
    }

    return (
        <div className="p-6 bg-stone-50 min-h-screen">
            <div className="bg-white border border-stone-200 rounded-2xl shadow-sm">
                <div className="p-6 border-b border-stone-100">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-bold text-stone-900">
                                Return Request Management
                            </h1>
                            <p className="text-stone-500 mt-1">
                                Manage return and exchange workflow
                            </p>
                        </div>

                        <div className="text-sm">
                            <span className="font-semibold text-stone-700">
                                Current Role:
                            </span>{" "}
                            <span className="px-2 py-1 rounded-lg bg-stone-100 text-stone-800">
                                {role || "UNKNOWN"}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="p-6 border-b border-stone-100">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <input
                            type="text"
                            placeholder="Search request, order, product..."
                            value={keyword}
                            onChange={(e) => setKeyword(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border border-stone-200 bg-stone-50"
                        />

                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border border-stone-200 bg-stone-50"
                        >
                            <option value="ALL">All statuses</option>
                            <option value="PENDING">Pending</option>
                            <option value="WAITING_CUSTOMER_RETURN">Waiting customer return</option>
                            <option value="RECEIVED_RETURN">Received return</option>
                            <option value="REFUND_INFO_INVALID">Refund info invalid</option>
                            <option value="REFUND_PENDING">Refund pending</option>
                            <option value="REFUNDED">Refunded</option>
                            <option value="APPROVED">Approved</option>
                            <option value="REJECTED">Rejected</option>
                            <option value="COMPLETED">Completed</option>
                        </select>

                        <button
                            onClick={fetchReturnRequests}
                            className="px-4 py-3 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-semibold"
                        >
                            Reload
                        </button>
                    </div>
                </div>

                {error && <div className="px-6 pt-4 text-red-600">{error}</div>}

                <div className="p-6 overflow-x-auto">
                    <table className="w-full min-w-[1100px] border-separate border-spacing-y-3">
                        <thead>
                        <tr className="text-left text-sm text-stone-500">
                            <th className="px-4">Product</th>
                            <th className="px-4">Type</th>
                            <th className="px-4">Reason</th>
                            <th className="px-4">Status</th>
                            <th className="px-4">Created At</th>
                            <th className="px-4">Resolved At</th>
                            <th className="px-4">Actions</th>
                        </tr>
                        </thead>

                        <tbody>
                        {filteredRequests.length === 0 ? (
                            <tr>
                                <td
                                    colSpan={7}
                                    className="px-4 py-10 text-center text-stone-500 bg-stone-50 rounded-xl"
                                >
                                    No return requests found
                                </td>
                            </tr>
                        ) : (
                            filteredRequests.map((item) => (
                                <tr key={item.requestId} className="bg-stone-50">
                                    <td className="px-4 py-4 min-w-[340px]">
                                        <div className="flex gap-3">
                                            <img
                                                src={item.productImageUrl || "https://via.placeholder.com/64"}
                                                alt={item.productName || "Product"}
                                                className="w-16 h-16 rounded-lg object-cover border border-stone-200"
                                            />

                                            <div>
                                                <div className="font-semibold text-stone-900">
                                                    {item.productName || "-"}
                                                </div>

                                                <div className="text-sm text-stone-500">
                                                    Color: {item.variantColor || "-"} | Size: {item.variantSize || "-"}
                                                </div>

                                                <div className="text-sm text-stone-500">
                                                    Bought: {item.purchasedQuantity ?? "-"} | Return qty: {item.returnQuantity ?? "-"}
                                                </div>

                                                <div className="text-sm text-stone-500">
                                                    Price: {formatCurrency(item.unitPrice)}
                                                </div>
                                            </div>
                                        </div>
                                    </td>

                                    <td className="px-4 py-4">{item.requestType || "-"}</td>

                                    <td className="px-4 py-4">
                                        <div className="max-w-[220px] truncate" title={item.reason || "-"}>
                                            {item.reason || "-"}
                                        </div>
                                    </td>

                                    <td className="px-4 py-4">
                                        <StatusBadge status={item.status} />
                                    </td>

                                    <td className="px-4 py-4 text-sm whitespace-nowrap">
                                        {formatDateTime(item.requestedAt)}
                                    </td>

                                    <td className="px-4 py-4 text-sm whitespace-nowrap">
                                        {formatDateTime(item.resolvedAt)}
                                    </td>

                                    <td className="px-4 py-4 min-w-[300px]">
                                        <div className="flex gap-2 flex-wrap">
                                            <ActionButton
                                                onClick={() => openDetail(item.requestId)}
                                                type="secondary"
                                            >
                                                View Detail
                                            </ActionButton>

                                            {renderWorkflowActions(item)}
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

function ActionButton({ children, onClick, disabled, type = "primary" }) {
    const styles = {
        primary: "bg-blue-600 hover:bg-blue-700 text-white",
        danger: "bg-red-600 hover:bg-red-700 text-white",
        success: "bg-emerald-600 hover:bg-emerald-700 text-white",
        secondary: "bg-stone-700 hover:bg-stone-800 text-white",
    };

    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className={`px-3 py-2 rounded-lg text-sm font-semibold ${
                disabled ? "bg-stone-300 text-white cursor-not-allowed" : styles[type]
            }`}
        >
            {disabled ? "..." : children}
        </button>
    );
}

function StatusBadge({ status }) {
    const map = {
        PENDING: "bg-yellow-100 text-yellow-700",
        WAITING_CUSTOMER_RETURN: "bg-indigo-100 text-indigo-700",
        RECEIVED_RETURN: "bg-cyan-100 text-cyan-700",
        REFUND_INFO_INVALID: "bg-red-100 text-red-700",
        REFUND_PENDING: "bg-blue-100 text-blue-700",
        REFUNDED: "bg-emerald-100 text-emerald-700",
        APPROVED: "bg-blue-100 text-blue-700",
        REJECTED: "bg-red-100 text-red-700",
        COMPLETED: "bg-emerald-100 text-emerald-700",
    };

    return (
        <span
            className={`inline-flex px-3 py-1 rounded-full text-xs font-bold ${
                map[status] || "bg-stone-100 text-stone-700"
            }`}
        >
            {status || "-"}
        </span>
    );
}

function formatDateTime(value) {
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleString("en-US");
}

function formatCurrency(value) {
    if (value == null) return "-";
    return new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
    }).format(value);
}

function getCurrentRoleFromToken() {
    try {
        const token = localStorage.getItem("token");
        if (!token) return null;
        const payload = JSON.parse(atob(token.split(".")[1]));
        return payload.role || null;
    } catch {
        return null;
    }
}

export default ReturnRequestManagementPage;