import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getReturnRequestByIdApi } from "../api/returnRequestApi";

function ReturnRequestDetailPage() {
    const { requestId } = useParams();
    const navigate = useNavigate();

    const [request, setRequest] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        fetchRequestDetail();
    }, [requestId]);

    const fetchRequestDetail = async () => {
        try {
            setLoading(true);
            setError("");

            const res = await getReturnRequestByIdApi(requestId);
            const data = res?.data?.data || null;

            if (!data) {
                setRequest(null);
                setError("Return request not found");
                return;
            }

            setRequest(data);
        } catch (err) {
            setRequest(null);
            setError(err?.response?.data?.message || "Failed to load request detail");
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div className="p-6">Loading...</div>;
    }

    if (error) {
        return (
            <div className="p-6 bg-stone-50 min-h-screen">
                <div className="max-w-6xl mx-auto">
                    <button
                        onClick={() => navigate("/dashboard/return-requests")}
                        className="mb-4 px-4 py-2 rounded-xl bg-stone-800 text-white hover:bg-stone-700"
                    >
                        Back to List
                    </button>

                    <div className="bg-white border border-red-200 text-red-600 rounded-2xl p-6">
                        {error}
                    </div>
                </div>
            </div>
        );
    }

    if (!request) {
        return (
            <div className="p-6 bg-stone-50 min-h-screen">
                <div className="max-w-6xl mx-auto">
                    <button
                        onClick={() => navigate("/dashboard/return-requests")}
                        className="mb-4 px-4 py-2 rounded-xl bg-stone-800 text-white hover:bg-stone-700"
                    >
                        Back to List
                    </button>

                    <div className="bg-white border border-stone-200 rounded-2xl p-6">
                        No data found
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 bg-stone-50 min-h-screen">
            <div className="max-w-6xl mx-auto space-y-6">
                <div className="flex items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-stone-900">
                            Return Request Detail
                        </h1>
                        <p className="text-stone-500 mt-1">
                            Request #{request.requestId}
                        </p>
                    </div>

                    <button
                        onClick={() => navigate("/dashboard/return-requests")}
                        className="px-4 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-semibold"
                    >
                        Back to List
                    </button>
                </div>

                <div className="bg-white border border-stone-200 rounded-2xl shadow-sm p-6">
                    <div className="flex flex-col md:flex-row gap-6">
                        <img
                            src={request.productImageUrl || "https://via.placeholder.com/180"}
                            alt={request.productName || "Product"}
                            className="w-40 h-40 rounded-2xl object-cover border border-stone-200"
                        />

                        <div className="flex-1">
                            <h2 className="text-xl font-bold text-stone-900">
                                {request.productName || "-"}
                            </h2>

                            <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                                <InfoChip label="Color" value={request.variantColor} />
                                <InfoChip label="Size" value={request.variantSize} />
                                <InfoChip label="Unit Price" value={formatCurrency(request.unitPrice)} />
                                <InfoChip label="Status" value={<StatusBadge status={request.status} />} />
                            </div>
                        </div>
                    </div>
                </div>

                <SectionCard title="Request Information">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <DetailField label="Request ID" value={request.requestId} />
                        <DetailField label="Request Type" value={request.requestType} />
                        <DetailField label="Reason" value={request.reason} />
                        <DetailField label="Description" value={request.description} />
                        <DetailField label="Requested At" value={formatDateTime(request.requestedAt)} />
                        <DetailField label="Resolved At" value={formatDateTime(request.resolvedAt)} />
                    </div>
                </SectionCard>

                <SectionCard title="Source Order">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <DetailField label="Order ID" value={request.orderId} />
                        <DetailField label="Order Item ID" value={request.orderItemId} />
                    </div>
                </SectionCard>

                {request.requestType === "EXCHANGE" && (
                    <SectionCard title="Replacement Order">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <DetailField label="Replacement Order ID" value={request.replacementOrderId} />
                            <DetailField label="Replacement Order Item ID" value={request.replacementOrderItemId} />
                        </div>
                    </SectionCard>
                )}

                {request.requestType === "RETURN" && (
                    <SectionCard title="Bank Information">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <DetailField label="Bank Name" value={request.bankName} />
                            <DetailField label="Bank Account Number" value={request.bankAccountNumber} />
                            <DetailField label="Bank Account Holder" value={request.bankAccountHolder} />
                            <DetailField label="Refund Note" value={request.refundNote} />
                        </div>
                    </SectionCard>
                )}

                <SectionCard title="Admin Notes">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <DetailField label="Rejection Reason" value={request.rejectionReason} />
                        <DetailField label="Refund Note" value={request.refundNote} />
                    </div>
                </SectionCard>
            </div>
        </div>
    );
}

function SectionCard({ title, children }) {
    return (
        <div className="bg-white border border-stone-200 rounded-2xl shadow-sm p-6">
            <h3 className="text-lg font-bold text-stone-900 mb-4">{title}</h3>
            {children}
        </div>
    );
}

function DetailField({ label, value }) {
    const displayValue =
        value === null || value === undefined || value === "" ? "-" : value;

    return (
        <div className="bg-stone-50 rounded-xl p-4 border border-stone-200 min-h-[88px]">
            <div className="text-sm text-stone-500 mb-1">{label}</div>
            <div className="font-medium text-stone-900 break-words">
                {displayValue}
            </div>
        </div>
    );
}

function InfoChip({ label, value }) {
    return (
        <div className="bg-stone-50 rounded-xl px-4 py-3 border border-stone-200">
            <div className="text-xs text-stone-500">{label}</div>
            <div className="font-semibold text-stone-900 mt-1">{value || "-"}</div>
        </div>
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

export default ReturnRequestDetailPage;