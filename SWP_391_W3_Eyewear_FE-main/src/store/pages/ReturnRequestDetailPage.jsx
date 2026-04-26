import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  confirmRefundReceivedApi,
  getReturnRequestByIdApi,
  updateRefundBankInfoApi,
  adminConfirmRefundFinalApi,
} from "../api/returnRequestApi";
import { updateOrderStatusApi } from "../api/orderApi";

const CUSTOMER_REFUND_CONFIRMED_STATUSES = [
  "REFUND_RECEIVED_CONFIRMED",
  "CUSTOMER_CONFIRMED_REFUND",
  "CUSTOMER_REFUND_CONFIRMED",
  "WAITING_ADMIN_REFUND_CONFIRM",
];

function ReturnRequestDetailPage() {
  const { requestId } = useParams();
  const navigate = useNavigate();

  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [bankForm, setBankForm] = useState({
    bankName: "",
    bankAccountNumber: "",
    bankAccountHolder: "",
  });

  const role = getCurrentRoleFromToken();
  const backPath =
    role === "ADMIN" || role === "OPERATIONAL_STAFF"
      ? "/dashboard/return-requests"
      : "/my-orders";

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
      setBankForm({
        bankName: data.bankName || "",
        bankAccountNumber: data.bankAccountNumber || "",
        bankAccountHolder: data.bankAccountHolder || "",
      });
    } catch (err) {
      setRequest(null);
      setError(err?.response?.data?.message || "Failed to load request detail");
    } finally {
      setLoading(false);
    }
  };

  const lastRefundTransaction = useMemo(() => {
    if (!Array.isArray(request?.transactions)) return null;
    return (
      [...request.transactions]
        .reverse()
        .find((tx) => tx.action === "REFUNDED") || null
    );
  }, [request]);

  const handleConfirmReceived = async () => {
    if (!window.confirm("Confirm that you have received the refund?")) return;

    try {
      setSubmitting(true);
      const res = await confirmRefundReceivedApi(requestId);
      setRequest(res?.data?.data || request);
      alert("Refund confirmed successfully");
    } catch (err) {
      alert(err?.response?.data?.message || "Failed to confirm refund");
    } finally {
      setSubmitting(false);
    }
  };

  const handleAdminFinalRefundConfirm = async () => {
    if (!window.confirm("Confirm final refund completion for this request?"))
      return;

    try {
      setSubmitting(true);
      const res = await adminConfirmRefundFinalApi(requestId);
      const updatedRequest = res?.data?.data || request;

      const orderId = updatedRequest?.orderId || request?.orderId;
      if (orderId) {
        await updateOrderStatusApi(orderId, "REFUND");
      }

      setRequest(updatedRequest);
      alert("Final refund confirmed successfully");
    } catch (err) {
      alert(err?.response?.data?.message || "Failed to finalize refund");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateBankInfo = async (e) => {
    e.preventDefault();

    if (
      !bankForm.bankName.trim() ||
      !bankForm.bankAccountNumber.trim() ||
      !bankForm.bankAccountHolder.trim()
    ) {
      alert("Please fill in all bank information fields");
      return;
    }

    try {
      setSubmitting(true);
      const res = await updateRefundBankInfoApi(requestId, {
        bankName: bankForm.bankName.trim(),
        bankAccountNumber: bankForm.bankAccountNumber.trim(),
        bankAccountHolder: bankForm.bankAccountHolder.trim(),
      });
      setRequest(res?.data?.data || request);
      alert("Bank information updated successfully");
    } catch (err) {
      alert(
        err?.response?.data?.message || "Failed to update bank information",
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="p-6">Loading...</div>;

  if (error) {
    return (
      <div className="p-6 bg-stone-50 min-h-screen">
        <div className="max-w-6xl mx-auto">
          <button
            onClick={() => navigate(backPath)}
            className="mb-4 px-4 py-2 rounded-xl bg-stone-800 text-white hover:bg-stone-700"
          >
            Back
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
            onClick={() => navigate(backPath)}
            className="mb-4 px-4 py-2 rounded-xl bg-stone-800 text-white hover:bg-stone-700"
          >
            Back
          </button>

          <div className="bg-white border border-stone-200 rounded-2xl p-6">
            No data found
          </div>
        </div>
      </div>
    );
  }

  const canCustomerConfirmRefund =
    request.requestType === "RETURN" &&
    request.status === "REFUNDED" &&
    role !== "ADMIN" &&
    role !== "OPERATIONAL_STAFF";

  const canAdminFinalConfirmRefund =
    request.requestType === "RETURN" &&
    CUSTOMER_REFUND_CONFIRMED_STATUSES.includes(request.status) &&
    role === "ADMIN";

  const canUpdateBankInfo =
    request.requestType === "RETURN" &&
    request.status === "REFUND_INFO_INVALID" &&
    role !== "ADMIN" &&
    role !== "OPERATIONAL_STAFF";

  return (
    <div className="p-6 bg-stone-50 min-h-screen">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-stone-900">
              Return Request Detail
            </h1>
            <p className="text-stone-500 mt-1">Request #{request.requestId}</p>
          </div>

          <button
            onClick={() => navigate(backPath)}
            className="px-4 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-semibold"
          >
            Back
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
                <InfoChip
                  label="Unit Price"
                  value={formatCurrency(request.unitPrice)}
                />
                <InfoChip
                  label="Status"
                  value={<StatusBadge status={request.status} />}
                />
                <InfoChip
                  label="Return Quantity"
                  value={request.returnQuantity}
                />
                <InfoChip label="Request Type" value={request.requestType} />
              </div>
            </div>
          </div>
        </div>

        {request.requestType === "RETURN" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <HighlightCard
              title="Refund Amount"
              value={formatCurrency(request.refundAmount)}
            />
            <HighlightCard
              title="Transfer Reference"
              value={lastRefundTransaction?.transactionReference || "-"}
            />
            <HighlightCard
              title="Transferred At"
              value={formatDateTime(lastRefundTransaction?.createdAt)}
            />
          </div>
        )}

        {canCustomerConfirmRefund && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-emerald-900">
                Refund has been transferred
              </h3>
              <p className="text-emerald-700 mt-1">
                Please confirm after you receive the money in your bank account.
              </p>
            </div>

            <button
              disabled={submitting}
              onClick={handleConfirmReceived}
              className="px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold disabled:opacity-50"
            >
              I have received the refund
            </button>
          </div>
        )}

        {request.requestType === "RETURN" &&
          CUSTOMER_REFUND_CONFIRMED_STATUSES.includes(request.status) &&
          !(role === "ADMIN" || role === "OPERATIONAL_STAFF") && (
            <div className="bg-violet-50 border border-violet-200 rounded-2xl p-6">
              <h3 className="text-lg font-bold text-violet-900">
                Refund received confirmation submitted
              </h3>
              <p className="text-violet-700 mt-1">
                Waiting for admin final confirmation to complete refund process.
              </p>
            </div>
          )}

        {canAdminFinalConfirmRefund && (
          <div className="bg-fuchsia-50 border border-fuchsia-200 rounded-2xl p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-fuchsia-900">
                Customer confirmed refund received
              </h3>
              <p className="text-fuchsia-700 mt-1">
                Please do final confirmation to close refund and sync order
                status to REFUND.
              </p>
            </div>

            <button
              disabled={submitting}
              onClick={handleAdminFinalRefundConfirm}
              className="px-5 py-3 rounded-xl bg-fuchsia-600 hover:bg-fuchsia-700 text-white font-semibold disabled:opacity-50"
            >
              Final Confirm Refund
            </button>
          </div>
        )}

        {canUpdateBankInfo && (
          <SectionCard title="Update Refund Bank Information">
            <form
              onSubmit={handleUpdateBankInfo}
              className="grid grid-cols-1 md:grid-cols-2 gap-4"
            >
              <InputField
                label="Bank Name"
                value={bankForm.bankName}
                onChange={(value) =>
                  setBankForm((prev) => ({ ...prev, bankName: value }))
                }
              />
              <InputField
                label="Bank Account Number"
                value={bankForm.bankAccountNumber}
                onChange={(value) =>
                  setBankForm((prev) => ({ ...prev, bankAccountNumber: value }))
                }
              />
              <InputField
                label="Bank Account Holder"
                value={bankForm.bankAccountHolder}
                onChange={(value) =>
                  setBankForm((prev) => ({ ...prev, bankAccountHolder: value }))
                }
              />

              <div className="md:col-span-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold disabled:opacity-50"
                >
                  Update Bank Info
                </button>
              </div>
            </form>
          </SectionCard>
        )}

        <SectionCard title="Request Information">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <DetailField label="Request ID" value={request.requestId} />
            <DetailField label="Request Type" value={request.requestType} />
            <DetailField label="Reason" value={request.reason} />
            <DetailField label="Description" value={request.description} />
            <DetailField
              label="Requested At"
              value={formatDateTime(request.requestedAt)}
            />
            <DetailField
              label="Resolved At"
              value={formatDateTime(request.resolvedAt)}
            />
          </div>
        </SectionCard>

        <SectionCard title="Source Order">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <DetailField label="Order ID" value={request.orderId} />
            <DetailField label="Order Item ID" value={request.orderItemId} />
          </div>
        </SectionCard>

        {request.requestType === "RETURN" && (
          <SectionCard title="Bank Information">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <DetailField label="Bank Name" value={request.bankName} />
              <DetailField
                label="Bank Account Number"
                value={request.bankAccountNumber}
              />
              <DetailField
                label="Bank Account Holder"
                value={request.bankAccountHolder}
              />
              <DetailField label="Refund Note" value={request.refundNote} />
            </div>
          </SectionCard>
        )}

        {request.requestType === "EXCHANGE" && (
          <SectionCard title="Replacement Order">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <DetailField
                label="Replacement Order ID"
                value={request.replacementOrderId}
              />
              <DetailField
                label="Replacement Order Item ID"
                value={request.replacementOrderItemId}
              />
            </div>
          </SectionCard>
        )}

        <SectionCard title="Transaction History">
          {!Array.isArray(request.transactions) ||
          request.transactions.length === 0 ? (
            <div className="text-stone-500">No transaction history</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-sm">
                <thead>
                  <tr className="text-left text-stone-500 border-b border-stone-200">
                    <th className="py-3 pr-4">Time</th>
                    <th className="py-3 pr-4">Action</th>
                    <th className="py-3 pr-4">Before</th>
                    <th className="py-3 pr-4">After</th>
                    <th className="py-3 pr-4">Amount</th>
                    <th className="py-3 pr-4">Payment Method</th>
                    <th className="py-3 pr-4">Transaction Ref</th>
                    <th className="py-3 pr-4">Note</th>
                  </tr>
                </thead>
                <tbody>
                  {request.transactions.map((tx) => (
                    <tr
                      key={tx.transactionId}
                      className="border-b border-stone-100 align-top"
                    >
                      <td className="py-3 pr-4 whitespace-nowrap">
                        {formatDateTime(tx.createdAt)}
                      </td>
                      <td className="py-3 pr-4 font-semibold">
                        {tx.action || "-"}
                      </td>
                      <td className="py-3 pr-4">{tx.statusBefore || "-"}</td>
                      <td className="py-3 pr-4">{tx.statusAfter || "-"}</td>
                      <td className="py-3 pr-4 text-emerald-700 font-semibold">
                        {formatCurrency(tx.amount)}
                      </td>
                      <td className="py-3 pr-4">{tx.paymentMethod || "-"}</td>
                      <td className="py-3 pr-4">
                        {tx.transactionReference || "-"}
                      </td>
                      <td className="py-3 pr-4 whitespace-pre-line">
                        {tx.note || "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
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

function HighlightCard({ title, value }) {
  return (
    <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5">
      <div className="text-sm text-emerald-700">{title}</div>
      <div className="text-2xl font-bold text-emerald-900 mt-1">
        {value || "-"}
      </div>
    </div>
  );
}

function InputField({ label, value, onChange }) {
  return (
    <label className="block">
      <div className="text-sm text-stone-600 mb-2">{label}</div>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-4 py-3 rounded-xl border border-stone-200 bg-stone-50"
      />
    </label>
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
    REFUND_RECEIVED_CONFIRMED: "bg-violet-100 text-violet-700",
    CUSTOMER_CONFIRMED_REFUND: "bg-violet-100 text-violet-700",
    CUSTOMER_REFUND_CONFIRMED: "bg-violet-100 text-violet-700",
    WAITING_ADMIN_REFUND_CONFIRM: "bg-violet-100 text-violet-700",
    REFUND: "bg-fuchsia-100 text-fuchsia-700",
    REFUND_COMPLETED: "bg-fuchsia-100 text-fuchsia-700",
    REFUND_FINALIZED: "bg-fuchsia-100 text-fuchsia-700",
    APPROVED: "bg-blue-100 text-blue-700",
    REJECTED: "bg-red-100 text-red-700",
    COMPLETED: "bg-emerald-100 text-emerald-700",
  };

  return (
    <span
      className={`inline-flex px-3 py-1 rounded-full text-xs font-bold ${map[status] || "bg-stone-100 text-stone-700"}`}
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
    return payload?.role || payload?.authorities?.[0] || null;
  } catch {
    return null;
  }
}

export default ReturnRequestDetailPage;
