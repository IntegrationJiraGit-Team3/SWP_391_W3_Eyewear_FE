import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
    FiChevronLeft,
    FiAlertCircle,
    FiRotateCcw,
    FiEdit3,
    FiHelpCircle,
    FiPackage,
    FiShield,
    FiCreditCard,
    FiUser,
    FiHome,
} from "react-icons/fi";
import {
    createReturnRequestApi,
    getReturnRequestsByOrderItemApi,
} from "../api/returnRequestApi";

function ReturnFormPage() {

    const location = useLocation();
    const navigate = useNavigate();
    const queryParams = new URLSearchParams(location.search);
    const orderItemId = queryParams.get("orderItemId");
    const orderId = queryParams.get("orderId");
    const isComboRequest = queryParams.get("combo") === "true";

    const [existingRequest, setExistingRequest] = useState(null);
    const [checking, setChecking] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState("");
    const [bankInfoConfirmed, setBankInfoConfirmed] = useState(false);
    const [formData, setFormData] = useState({
        requestType: "RETURN",
        reason: "",
        details: "",
        returnQuantity: 1,
        imageUrl: "",
        bankAccountNumber: "",
        bankName: "",
        bankAccountHolder: "",
    });

    useEffect(() => {
        const checkExisting = async () => {
            try {
                setChecking(true);
                const res = await getReturnRequestsByOrderItemApi(orderItemId);
                const requests = Array.isArray(res?.data?.data) ? res.data.data : [];

                if (requests.length > 0) {
                    setExistingRequest(requests[0]);
                }
            } catch (error) {
                console.error("Check existing return request error:", error);
            } finally {
                setChecking(false);
            }
        };

        if (orderItemId) checkExisting();
        else setChecking(false);
    }, [orderItemId]);

    const reasons = [
        { value: "Defective/Scratched product", label: "Defective / Scratched product" },
        { value: "Wrong product delivered", label: "Wrong product delivered" },
        { value: "Does not fit / Not suitable", label: "Does not fit / Not suitable" },
        { value: "Other reason", label: "Other reason" },
    ];

    const isReturn = formData.requestType === "RETURN";

    const isSubmitDisabled = useMemo(() => {
        if ((!orderItemId && !orderId) || submitting) return true;
        if (!formData.reason.trim() || !formData.details.trim()) return true;

        if (isReturn) {
            if (!formData.bankAccountNumber.trim()) return true;
            if (!formData.bankName.trim()) return true;
            if (!formData.bankAccountHolder.trim()) return true;
            if (!bankInfoConfirmed) return true;
        }

        return false;
    }, [
        orderItemId,
        orderId,
        submitting,
        formData,
        isReturn,
        bankInfoConfirmed,
    ]);

    const handleChange = (field, value) => {
        setFormData((prev) => ({
            ...prev,
            [field]: value,
        }));
    };

    const handleChangeRequestType = (type) => {
        setFormData((prev) => ({
            ...prev,
            requestType: type,
        }));
        setBankInfoConfirmed(false);
        setSubmitError("");
    };

    const validateForm = () => {
        if (!orderItemId && !orderId) {
            setSubmitError("Missing order reference.");
            return false;
        }

        if (!formData.reason.trim()) {
            setSubmitError("Please select a reason.");
            return false;
        }

        if (!formData.details.trim()) {
            setSubmitError("Please enter more details.");
            return false;
        }

        if (isReturn) {
            if (!formData.bankAccountNumber.trim()) {
                setSubmitError("Bank account number is required for return refund.");
                return false;
            }
            if (!formData.bankName.trim()) {
                setSubmitError("Bank name is required for return refund.");
                return false;
            }
            if (!formData.bankAccountHolder.trim()) {
                setSubmitError("Account holder is required for return refund.");
                return false;
            }
            if (!bankInfoConfirmed) {
                setSubmitError("Please confirm the bank account information is correct.");
                return false;
            }
        }

        setSubmitError("");
        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (existingRequest) return;
        if (!validateForm()) return;

        setSubmitting(true);
        setSubmitError("");

        try {
            const payload = {
                orderItemId: isComboRequest ? null : parseInt(orderItemId, 10),
                orderId: isComboRequest ? parseInt(orderId, 10) : null,
                isComboRequest,
                returnQuantity: Number(formData.returnQuantity) || 1,
                reason: formData.reason,
                description: formData.details,
                imageUrl: formData.imageUrl?.trim() || "",
                requestType: formData.requestType,
                bankAccountNumber: isReturn ? formData.bankAccountNumber.trim() : null,
                bankName: isReturn ? formData.bankName.trim() : null,
                bankAccountHolder: isReturn ? formData.bankAccountHolder.trim() : null,
            };
            console.log("FINAL PAYLOAD =", payload);
            const res = await createReturnRequestApi(payload);

            if (res?.data?.success) {
                navigate("/my-orders");
            } else {
                setSubmitError("Failed to submit request.");
            }
        } catch (error) {
            console.error("Create return request error:", error);
            setSubmitError(
                error?.response?.data?.message || "Failed to submit request. Please try again."
            );
        } finally {
            setSubmitting(false);
        }
    };

    const existingStatusInfo = existingRequest
        ? getExistingRequestStatusInfo(existingRequest.status)
        : null;

    if (checking) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white">
                <div className="w-6 h-6 border-2 border-slate-200 border-t-blue-600 rounded-full animate-spin" />
            </div>
        );
    }

    if (existingRequest) {
        return (
            <div className="min-h-screen bg-[#fcfcfc] pt-24 px-6 pb-16">
                <div className="max-w-md mx-auto bg-white rounded-2xl p-8 shadow-sm border border-slate-100 text-center">
                    <div
                        className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 ${existingStatusInfo?.iconBg}`}
                    >
                        <FiAlertCircle size={32} className={existingStatusInfo?.iconColor} />
                    </div>

                    <h1 className="text-lg font-bold text-slate-900 mb-2">
                        Request Already Exists
                    </h1>

                    <p className="text-sm text-slate-500 leading-relaxed mb-4 font-medium">
                        You have already submitted a request for this item.
                    </p>

                    <div className="bg-slate-50 rounded-xl border border-slate-100 p-4 text-left mb-6">
                        <div className="flex items-center justify-between gap-3 mb-2">
              <span className="text-xs font-bold uppercase tracking-widest text-slate-400">
                Case #{existingRequest.requestId}
              </span>
                            <span
                                className={`px-3 py-1 rounded-full text-[11px] font-bold ${existingStatusInfo?.badgeClass}`}
                            >
                {existingStatusInfo?.label}
              </span>
                        </div>

                        <p className="text-sm text-slate-700 font-medium leading-relaxed">
                            {existingStatusInfo?.message}
                        </p>

                        {existingRequest?.refundNote && (
                            <div className="mt-3 rounded-lg bg-red-50 border border-red-100 p-3 text-sm text-red-600 font-medium">
                                {existingRequest.refundNote}
                            </div>
                        )}

                        {existingRequest?.rejectionReason && (
                            <div className="mt-3 rounded-lg bg-red-50 border border-red-100 p-3 text-sm text-red-600 font-medium">
                                {existingRequest.rejectionReason}
                            </div>
                        )}
                    </div>

                    <button
                        onClick={() => navigate("/my-orders")}
                        className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-slate-800 transition-all"
                    >
                        Return to Orders
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#fcfcfc] pt-24 pb-20 px-6 font-sans">
            <div className="max-w-xl mx-auto">
                <button
                    onClick={() => navigate(-1)}
                    className="inline-flex items-center gap-1.5 text-slate-400 hover:text-slate-900 transition-colors mb-8 text-[11px] font-bold uppercase tracking-widest"
                >
                    <FiChevronLeft /> Back to Order
                </button>

                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8">
                    <div className="flex items-center gap-4 mb-10 pb-6 border-b border-slate-50">
                        <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                            <FiRotateCcw size={22} />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                                Return & Exchange
                            </h1>
                            <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mt-0.5">
                                {isComboRequest ? `Order Ref: #${orderId}` : `Item Ref: #${orderItemId}`}
                            </p>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-8">
                        <div>
                            <label className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">
                                <FiShield /> Request Type
                            </label>

                            <div className="grid grid-cols-2 gap-3">
                                {["RETURN", "EXCHANGE"].map((type) => (
                                    <button
                                        key={type}
                                        type="button"
                                        onClick={() => handleChangeRequestType(type)}
                                        className={`py-3.5 rounded-xl text-[10px] font-bold uppercase tracking-widest border transition-all ${
                                            formData.requestType === type
                                                ? "bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-100"
                                                : "bg-white text-slate-400 border-slate-100 hover:border-slate-300"
                                        }`}
                                    >
                                        {type}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">
                                <FiHelpCircle /> Reason for Request
                            </label>
                            <select
                                value={formData.reason}
                                onChange={(e) => handleChange("reason", e.target.value)}
                                className="w-full p-3.5 bg-slate-50 border border-slate-100 rounded-xl text-sm font-semibold text-slate-700 outline-none focus:bg-white focus:border-blue-200 transition-all appearance-none"
                                required
                            >
                                <option value="" disabled>
                                    -- Select Reason --
                                </option>
                                {reasons.map((r) => (
                                    <option key={r.value} value={r.value}>
                                        {r.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">
                                <FiEdit3 /> More Details
                            </label>
                            <textarea
                                rows="4"
                                placeholder="Describe the issue you're facing..."
                                value={formData.details}
                                onChange={(e) => handleChange("details", e.target.value)}
                                className="w-full p-4 bg-slate-50 border border-slate-100 rounded-xl text-sm font-medium text-slate-700 outline-none focus:bg-white focus:border-blue-200 transition-all resize-none leading-normal"
                                required
                            />
                        </div>

                        {isReturn && (
                            <div className="space-y-5 rounded-2xl border border-blue-100 bg-blue-50/40 p-5">
                                <div>
                                    <h3 className="text-sm font-bold text-slate-900">
                                        Refund Information
                                    </h3>
                                    <p className="text-xs text-slate-500 mt-1 font-medium">
                                        Required for return requests so we can process your refund.
                                    </p>
                                </div>

                                <div>
                                    <label className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
                                        <FiCreditCard /> Bank Account Number
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.bankAccountNumber}
                                        onChange={(e) =>
                                            handleChange("bankAccountNumber", e.target.value)
                                        }
                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-700 outline-none focus:border-blue-300"
                                        placeholder="Enter bank account number"
                                    />
                                </div>

                                <div>
                                    <label className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
                                        <FiHome /> Bank Name
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.bankName}
                                        onChange={(e) => handleChange("bankName", e.target.value)}
                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-700 outline-none focus:border-blue-300"
                                        placeholder="Enter bank name"
                                    />
                                </div>

                                <div>
                                    <label className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
                                        <FiUser /> Account Holder
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.bankAccountHolder}
                                        onChange={(e) =>
                                            handleChange("bankAccountHolder", e.target.value)
                                        }
                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-700 outline-none focus:border-blue-300"
                                        placeholder="Enter account holder name"
                                    />
                                    <div className="pt-1">
                                        <label className="flex items-start gap-3 cursor-pointer select-none">
                                            <input
                                                type="checkbox"
                                                checked={bankInfoConfirmed}
                                                onChange={(e) => setBankInfoConfirmed(e.target.checked)}
                                                className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                            />
                                            <span className="text-sm font-medium text-slate-600 leading-relaxed">
                                                Please check that the bank account information is correct.
                                            </span>
                                        </label>
                                    </div>
                                </div>
                            </div>
                        )}

                        {submitError && (
                            <div className="rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm font-medium text-red-600">
                                {submitError}
                            </div>
                        )}

                        <div className="bg-slate-50/50 rounded-xl p-4 flex gap-3 border border-dashed border-slate-200">
                            <FiPackage
                                className="text-slate-400 mt-0.5 flex-shrink-0"
                                size={14}
                            />
                            <p className="text-[10px] font-semibold text-slate-400 leading-relaxed uppercase tracking-tighter italic">
                                Once submitted, we will process your request within 2-3 business
                                days. Tracking is available in order history.
                            </p>
                        </div>

                        <button
                            type="submit"
                            disabled={isSubmitDisabled}
                            className={`w-full py-4 rounded-xl font-bold text-[11px] uppercase tracking-widest transition-all ${
                                isSubmitDisabled
                                    ? "bg-slate-100 text-slate-300 cursor-not-allowed"
                                    : "bg-slate-900 text-white hover:bg-slate-800 shadow-lg shadow-slate-200 active:scale-[0.98]"
                            }`}
                        >
                            {submitting ? "Processing..." : "Submit My Request"}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}

function getExistingRequestStatusInfo(status) {
    switch (status) {
        case "PENDING":
            return {
                label: "Pending",
                message: "Your request is waiting for review from our support team.",
                badgeClass: "bg-yellow-100 text-yellow-700",
                iconBg: "bg-yellow-50",
                iconColor: "text-yellow-500",
            };
        case "WAITING_CUSTOMER_RETURN":
            return {
                label: "Approved",
                message:
                    "Your return request has been approved. Please pack the item and send it back to the shop.",
                badgeClass: "bg-blue-100 text-blue-700",
                iconBg: "bg-blue-50",
                iconColor: "text-blue-500",
            };
        case "RECEIVED_RETURN":
            return {
                label: "Received",
                message:
                    "We have received your returned item and are checking it for refund processing.",
                badgeClass: "bg-cyan-100 text-cyan-700",
                iconBg: "bg-cyan-50",
                iconColor: "text-cyan-500",
            };
        case "REFUND_INFO_INVALID":
            return {
                label: "Refund Info Invalid",
                message:
                    "Your refund information needs to be updated. Please check order history and submit correct bank information.",
                badgeClass: "bg-red-100 text-red-700",
                iconBg: "bg-red-50",
                iconColor: "text-red-500",
            };
        case "REFUND_PENDING":
            return {
                label: "Refund Pending",
                message: "Your refund is currently being processed.",
                badgeClass: "bg-indigo-100 text-indigo-700",
                iconBg: "bg-indigo-50",
                iconColor: "text-indigo-500",
            };
        case "REFUNDED":
            return {
                label: "Refunded",
                message: "Your refund has been completed successfully.",
                badgeClass: "bg-emerald-100 text-emerald-700",
                iconBg: "bg-emerald-50",
                iconColor: "text-emerald-500",
            };
        case "APPROVED":
            return {
                label: "Approved",
                message: "Your exchange request has been approved.",
                badgeClass: "bg-blue-100 text-blue-700",
                iconBg: "bg-blue-50",
                iconColor: "text-blue-500",
            };
        case "COMPLETED":
            return {
                label: "Completed",
                message: "Your request has been completed.",
                badgeClass: "bg-emerald-100 text-emerald-700",
                iconBg: "bg-emerald-50",
                iconColor: "text-emerald-500",
            };
        case "REJECTED":
            return {
                label: "Rejected",
                message: "Your request was rejected by the shop.",
                badgeClass: "bg-red-100 text-red-700",
                iconBg: "bg-red-50",
                iconColor: "text-red-500",
            };
        default:
            return {
                label: status || "Submitted",
                message: "Your request has already been submitted.",
                badgeClass: "bg-slate-100 text-slate-700",
                iconBg: "bg-slate-50",
                iconColor: "text-slate-500",
            };
    }
}

export default ReturnFormPage;