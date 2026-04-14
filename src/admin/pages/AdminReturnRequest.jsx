import React, { useEffect, useMemo, useState } from "react";
import {
    getAllReturnRequestsApi,
    updateReturnRequestStatusApi,
} from "../../store/api/returnRequestApi";
import { 
    FiEye, 
    FiSearch, 
    FiX, 
    FiRefreshCw, 
    FiFilter, 
    FiCheckCircle, 
    FiAlertCircle,
    FiClock,
    FiCornerDownLeft
} from "react-icons/fi";
import { useToast } from "../../context/ToastContext";
import { motion, AnimatePresence } from "framer-motion";

function AdminReturnRequest() {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [keyword, setKeyword] = useState("");
    const [statusFilter, setStatusFilter] = useState("ALL");
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [updating, setUpdating] = useState(false);
    const { showToast } = useToast();

    const role = getCurrentRoleFromToken();

    useEffect(() => {
        fetchRequests();
    }, []);

    const fetchRequests = async () => {
        try {
            setLoading(true);
            const res = await getAllReturnRequestsApi();
            setRequests(res?.data?.data || []);
        } catch (err) {
            console.error("Lỗi tải return requests:", err);
            showToast(err?.response?.data?.message || "Không tải được danh sách đổi/trả", "error");
        } finally {
            setLoading(false);
        }
    };

    const filteredRequests = useMemo(() => {
        return requests.filter((item) => {
            const q = keyword.trim().toLowerCase();

            const matchKeyword =
                !q ||
                String(item.requestId || "").includes(q) ||
                String(item.orderId || "").includes(q) ||
                String(item.orderItemId || "").includes(q) ||
                (item.reason || "").toLowerCase().includes(q) ||
                (item.description || "").toLowerCase().includes(q);

            const matchStatus =
                statusFilter === "ALL" ? true : item.status === statusFilter;

            return matchKeyword && matchStatus;
        });
    }, [requests, keyword, statusFilter]);

    const handleUpdateStatus = async (requestId, newStatus) => {
        if (!window.confirm(getConfirmText(newStatus))) return;

        try {
            setUpdating(true);
            const res = await updateReturnRequestStatusApi(requestId, newStatus);
            const updated = res?.data?.data;

            setRequests((prev) =>
                prev.map((item) =>
                    item.requestId === requestId ? { ...item, ...updated } : item
                )
            );

            if (selectedRequest?.requestId === requestId) {
                setSelectedRequest((prev) => ({ ...prev, ...updated }));
            }

            showToast("Status updated successfully!", "success");
        } catch (err) {
            console.error("Error update status:", err);
            showToast(err?.response?.data?.message || "Failed to update status", "error");
        } finally {
            setUpdating(false);
        }
    };

    const counts = {
        ALL: requests.length,
        PENDING: requests.filter((r) => r.status === "PENDING").length,
        APPROVED: requests.filter((r) => r.status === "APPROVED").length,
        REJECTED: requests.filter((r) => r.status === "REJECTED").length,
        COMPLETED: requests.filter((r) => r.status === "COMPLETED").length,
    };

    return (
        <div className="p-6 bg-[#f8fafc] min-h-screen font-sans">
            {/* Header Section */}
            <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8"
            >
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
                        <span className="p-2 bg-blue-600 rounded-xl text-white shadow-lg shadow-blue-200">
                             <FiCornerDownLeft size={24} />
                        </span>
                        Return Requests
                    </h1>
                    <p className="text-slate-500 mt-1 font-medium italic">
                        Streamline customer returns and exchange workflows
                    </p>
                </div>

                <div className="flex items-center gap-3">
                     <div className="bg-white px-4 py-2 rounded-xl shadow-sm border border-slate-200 text-sm font-semibold flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        Role: <span className="text-blue-600 uppercase">{role || "Staff"}</span>
                    </div>
                    <button 
                        onClick={fetchRequests}
                        disabled={loading}
                        className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-slate-800 transition-all shadow-lg shadow-slate-200 disabled:opacity-50"
                    >
                        <FiRefreshCw className={loading ? "animate-spin" : ""} />
                        RELOAD
                    </button>
                </div>
            </motion.div>

            {/* Stat Cards */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
                {[
                    { val: "ALL", label: "All Requests", color: "blue", icon: <FiFilter /> },
                    { val: "PENDING", label: "Pending", color: "amber", icon: <FiClock /> },
                    { val: "APPROVED", label: "Approved", color: "indigo", icon: <FiCheckCircle /> },
                    { val: "COMPLETED", label: "Completed", color: "emerald", icon: <FiCheckCircle /> },
                    { val: "REJECTED", label: "Rejected", color: "red", icon: <FiAlertCircle /> },
                ].map((item) => (
                    <motion.button
                        key={item.val}
                        whileHover={{ y: -4 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setStatusFilter(item.val)}
                        className={`relative overflow-hidden group p-4 rounded-2xl border transition-all duration-300 text-left ${
                            statusFilter === item.val
                                ? `bg-white border-blue-500 shadow-xl shadow-blue-100 ring-2 ring-blue-500/10`
                                : "bg-white border-slate-200 hover:border-slate-300 shadow-sm"
                        }`}
                    >
                        <div className={`p-2 w-fit rounded-lg mb-3 ${
                             statusFilter === item.val ? `bg-blue-500 text-white` : "bg-slate-100 text-slate-500"
                        }`}>
                            {item.icon}
                        </div>
                        <div className="flex flex-col">
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{item.label}</span>
                            <span className={`text-2xl font-black ${
                                statusFilter === item.val ? `text-slate-900` : "text-slate-700"
                            }`}>
                                {counts[item.val]}
                            </span>
                        </div>
                        {statusFilter === item.val && (
                            <motion.div 
                                layoutId="active-pill"
                                className={`absolute bottom-0 left-0 w-full h-1 bg-blue-500`} 
                            />
                        )}
                    </motion.button>
                ))}
            </div>

            {/* Main Content Area */}
            <motion.div 
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-200/60 overflow-hidden backdrop-blur-sm bg-white/80"
            >
                <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="relative group w-full max-w-md">
                        <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                        <input
                            value={keyword}
                            onChange={(e) => setKeyword(e.target.value)}
                            placeholder="Find by Request ID, Order ID, Reason..."
                            className="w-full h-11 pl-11 pr-4 bg-slate-50 border border-slate-100 rounded-xl text-sm focus:bg-white focus:ring-4 focus:ring-blue-50 focus:border-blue-200 outline-none transition-all"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50">
                                <th className="text-left px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">Request</th>
                                <th className="text-left px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">Order Context</th>
                                <th className="text-left px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">Reason</th>
                                <th className="text-left px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">Status</th>
                                <th className="text-left px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">Created At</th>
                                <th className="text-center px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            <AnimatePresence mode="popLayout">
                                {loading ? (
                                    <tr>
                                        <td colSpan="6" className="py-20 text-center">
                                            <div className="inline-flex flex-col items-center gap-3">
                                                <div className="w-10 h-10 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin" />
                                                <span className="text-sm font-bold text-slate-400">Loading requests...</span>
                                            </div>
                                        </td>
                                    </tr>
                                ) : filteredRequests.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" className="py-20 text-center">
                                            <div className="flex flex-col items-center opacity-40">
                                                <FiFilter size={48} className="text-slate-300 mb-4" />
                                                <p className="text-sm font-bold text-slate-900">No requests found</p>
                                                <p className="text-xs text-slate-500">Try adjusting your filters or search keywords</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredRequests.map((item) => (
                                        <motion.tr
                                            layout
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            key={item.requestId}
                                            className="hover:bg-slate-50/50 transition-colors group"
                                        >
                                            <td className="px-6 py-4">
                                                <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-blue-50 text-blue-700 font-black text-xs">
                                                    #{item.requestId}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col">
                                                    <span className="text-xs font-bold text-slate-700">Order: #{item.orderId ?? "N/A"}</span>
                                                    <span className="text-[10px] font-medium text-slate-400 mt-0.5">Item: #{item.orderItemId ?? "N/A"}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <p className="text-sm font-semibold text-slate-700 max-w-[200px] truncate" title={item.reason}>
                                                    {item.reason || "-"}
                                                </p>
                                            </td>
                                            <td className="px-6 py-4">
                                                <StatusBadge status={item.status} />
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2 text-slate-500">
                                                    <FiClock className="text-slate-300" />
                                                    <span className="text-[11px] font-bold">{formatDateTime(item.requestedAt)}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <button
                                                    onClick={() => setSelectedRequest(item)}
                                                    className="w-9 h-9 inline-flex items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-400 hover:text-blue-600 hover:border-blue-200 hover:shadow-lg hover:shadow-blue-50 transition-all"
                                                >
                                                    <FiEye size={16} />
                                                </button>
                                            </td>
                                        </motion.tr>
                                    ))
                                )}
                            </AnimatePresence>
                        </tbody>
                    </table>
                </div>
            </motion.div>

            {/* Modal */}
            <AnimatePresence>
                {selectedRequest && (
                    <ReturnRequestModal
                        item={selectedRequest}
                        role={role}
                        updating={updating}
                        onClose={() => setSelectedRequest(null)}
                        onUpdate={handleUpdateStatus}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}

function ReturnRequestModal({ item, role, updating, onClose, onUpdate }) {
    return (
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 font-sans"
        >
            <motion.div 
                initial={{ scale: 0.95, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 20 }}
                className="w-full max-w-3xl bg-white rounded-[2rem] shadow-2xl overflow-hidden"
            >
                {/* Modal Header */}
                <div className="px-8 py-6 bg-slate-50/80 border-b border-slate-100 flex items-start justify-between">
                    <div>
                        <div className="flex items-center gap-3">
                            <h2 className="text-2xl font-black text-slate-900">Request Detail</h2>
                            <StatusBadge status={item.status} />
                        </div>
                        <div className="mt-1 flex items-center gap-4 text-sm font-bold text-slate-400 uppercase tracking-widest">
                            <span>ID: #{item.requestId}</span>
                            <span className="w-1 h-1 rounded-full bg-slate-300" />
                            <span>Order: #{item.orderId}</span>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2.5 rounded-xl border border-slate-200 hover:bg-white transition-colors"
                    >
                        <FiX size={20} className="text-slate-400" />
                    </button>
                </div>

                {/* Modal Body */}
                <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-6 text-sm">
                        <div>
                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">Reason for Return</h3>
                            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 font-bold text-slate-900 italic">
                                "{item.reason || "-"}"
                            </div>
                        </div>

                        <div>
                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">Customer Description</h3>
                            <div className="p-4 bg-white rounded-2xl border border-slate-200 font-medium text-slate-700 min-h-[100px] whitespace-pre-line leading-relaxed">
                                {item.description || "No description provided."}
                            </div>
                        </div>

                        {item.imageUrl && (
                            <div>
                                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">Attached Evidence</h3>
                                <a
                                    href={item.imageUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-2 px-4 py-2 border-2 border-dashed border-blue-200 rounded-xl text-blue-600 font-bold hover:bg-blue-50 transition-colors"
                                >
                                    <FiEye /> View Image Evidence
                                </a>
                            </div>
                        )}
                    </div>

                    <div className="space-y-6">
                        <section className="p-6 bg-slate-900 rounded-3xl text-white">
                            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Timeline & Info</h3>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs text-slate-400">Created At</span>
                                    <span className="text-xs font-bold font-mono">{formatDateTime(item.requestedAt)}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-xs text-slate-400">Resolved At</span>
                                    <span className="text-xs font-bold font-mono">{item.resolvedAt ? formatDateTime(item.resolvedAt) : "Pending"}</span>
                                </div>
                                <div className="h-px bg-slate-800 my-2" />
                                <div className="flex items-center justify-between">
                                    <span className="text-xs text-slate-400">Handled By</span>
                                    <span className="text-xs font-black text-blue-400 uppercase">{role || "Staff"}</span>
                                </div>
                            </div>
                        </section>

                        <div className="flex flex-col gap-3">
                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Workflow Actions</h3>
                            {item.status === "PENDING" && (role === "ADMIN" || role === "OPERATIONAL_STAFF") ? (
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        disabled={updating}
                                        onClick={() => onUpdate(item.requestId, "APPROVED")}
                                        className="flex items-center justify-center gap-2 py-3.5 bg-blue-600 text-white rounded-2xl text-xs font-black hover:bg-blue-700 shadow-xl shadow-blue-200 transition-all disabled:grayscale disabled:opacity-50"
                                    >
                                        <FiCheckCircle /> APPROVE
                                    </button>
                                    <button
                                        disabled={updating}
                                        onClick={() => onUpdate(item.requestId, "REJECTED")}
                                        className="flex items-center justify-center gap-2 py-3.5 bg-red-500 text-white rounded-2xl text-xs font-black hover:bg-red-600 shadow-xl shadow-red-100 transition-all disabled:grayscale disabled:opacity-50"
                                    >
                                        <FiX /> REJECT
                                    </button>
                                </div>
                            ) : (
                                <div className="p-4 bg-slate-100 text-center rounded-2xl text-[10px] font-bold text-slate-400 italic">
                                    {item.status === "PENDING" ? "Insufficient role permissions" : "Request has been processed"}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-8 py-5 bg-slate-50/50 border-t border-slate-100 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-6 py-2.5 rounded-xl border border-slate-300 text-slate-600 text-xs font-bold hover:bg-white hover:border-slate-400 transition-all"
                    >
                        CLOSE
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );
}

function StatusBadge({ status }) {
    const styles = {
        PENDING: "bg-amber-100 text-amber-700 border-amber-200",
        APPROVED: "bg-blue-100 text-blue-700 border-blue-200",
        REJECTED: "bg-red-100 text-red-700 border-red-200",
        COMPLETED: "bg-emerald-100 text-emerald-700 border-emerald-200",
    };

    return (
        <span
            className={`inline-flex items-center px-4 py-1.5 rounded-full border text-[10px] font-black uppercase tracking-widest ${
                styles[status] || "bg-slate-100 text-slate-700 border-slate-200"
            }`}
        >
            <span className={`w-1.5 h-1.5 rounded-full mr-2 ${
                status === "PENDING" ? "bg-amber-400" :
                status === "APPROVED" ? "bg-blue-400" :
                status === "COMPLETED" ? "bg-emerald-400" : "bg-red-400"
            }`} />
            {status}
        </span>
    );
}

function formatDateTime(value) {
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
    });
}

function getConfirmText(status) {
    switch (status) {
        case "APPROVED":
            return "Are you sure you want to approve this request?";
        case "REJECTED":
            return "Are you sure you want to reject this request?";
        case "COMPLETED":
            return "Are you sure you want to complete this request?";
        default:
            return "Are you sure you want to update the status?";
    }
}

function getCurrentRoleFromToken() {
    try {
        const token = localStorage.getItem("token");
        if (!token) return null;

        const payloadBase64 = token.split(".")[1];
        const payloadJson = atob(payloadBase64);
        const payload = JSON.parse(payloadJson);

        return payload.role || null;
    } catch (error) {
        console.error("Không đọc được role từ token:", error);
        return null;
    }
}

export default AdminReturnRequest;