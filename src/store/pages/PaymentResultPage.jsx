import { useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  processVnpayReturn,
  updatePaymentStatus,
} from "../services/orderService";

function PaymentResultPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const vnp_ResponseCode = searchParams.get("vnp_ResponseCode");
  const vnp_TransactionNo = searchParams.get("vnp_TransactionNo");
  const isSuccess = vnp_ResponseCode === "00";

  useEffect(() => {
    let redirectTimer = null;

    const payload = {
      type: "VNPAY_RESULT",
      success: isSuccess,
      responseCode: vnp_ResponseCode,
      transactionNo: vnp_TransactionNo,
      ts: Date.now(),
    };

    const run = async () => {
      const params = Object.fromEntries(searchParams.entries());

      try {
        localStorage.setItem("vnpay:lastResult", JSON.stringify(payload));
      } catch (err) {
        console.error("Store VNPay result failed:", err);
      }

      // Always forward return params to backend so it can:
      // - verify signature
      // - update order payment status
      // - persist successful Payment records (transaction reference)
      // - cancel pending payment orders on failures
      try {
        await processVnpayReturn(params);
      } catch (err) {
        console.error("Process VNPay return on backend failed:", err);
      }

      try {
        if (window.opener && !window.opener.closed) {
          window.opener.postMessage(payload, window.location.origin);
          setTimeout(() => window.close(), 1200);
        }
      } catch (err) {
        console.error("Post VNPay result failed:", err);
      }

      if (!isSuccess) return;

      try {
        const orderInfo = searchParams.get("vnp_OrderInfo");
        const pendingContextRaw = localStorage.getItem(
          "vnpay:pendingRemainingPayment",
        );
        const pendingContext = pendingContextRaw
          ? JSON.parse(pendingContextRaw)
          : null;

        const orderId = pendingContext?.orderId || orderInfo;

        // Remaining-payment flow expects PAID_FULL. Backend return handler will
        // typically move PAID -> PAID_FULL when called the second time.
        // Keep this as a compatibility fallback in case return handler doesn't
        // update paymentStatus due to environment/config differences.
        if (pendingContext?.orderId) {
          await updatePaymentStatus(pendingContext.orderId, "PAID_FULL");
        }

        const inPopup = !!(window.opener && !window.opener.closed);
        if (!inPopup && orderId) {
          redirectTimer = setTimeout(() => {
            navigate(`/shipping-progress/${orderId}`, { replace: true });
          }, 1000);
        }
      } catch (error) {
        console.error("Finalize paid order failed:", error);
      } finally {
        try {
          localStorage.removeItem("vnpay:pendingRemainingPayment");
        } catch (removeErr) {
          console.error("Clear VNPay context failed:", removeErr);
        }
      }
    };

    run();

    return () => {
      if (redirectTimer) clearTimeout(redirectTimer);
    };
  }, [isSuccess, navigate, searchParams, vnp_ResponseCode, vnp_TransactionNo]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-lg text-center">
        {isSuccess ? (
          <>
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-10 h-10 text-green-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              VNPay Thanh toán thành công!
            </h2>
            <p className="text-gray-600 mb-6">
              Transaction Code: {vnp_TransactionNo}
            </p>
          </>
        ) : (
          <>
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-10 h-10 text-red-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Thanh toán thất bại!
            </h2>
            <p className="text-gray-600 mb-6">
              Bạn đã hủy giao dịch hoặc đã xảy ra lỗi.
            </p>
          </>
        )}

        <div className="flex flex-col gap-3">
          <Link
            to="/my-orders"
            className="w-full rounded-lg bg-black text-white py-3 font-semibold hover:opacity-90"
          >
            View Orders
          </Link>
          <Link
            to="/"
            className="w-full rounded-lg border border-gray-200 py-3 font-semibold text-gray-700 hover:bg-gray-50"
          >
            Quay lai trang chủ
          </Link>
        </div>
      </div>
    </div>
  );
}

export default PaymentResultPage;
