import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { updatePaymentStatus } from "../services/orderService";

function PaymentResultPage() {
  const [searchParams] = useSearchParams();

  // Đọc mã "00" (Thành công) hoặc khác "00" (Thất bại) từ chính URL
  const vnp_ResponseCode = searchParams.get("vnp_ResponseCode");
  const vnp_TransactionNo = searchParams.get("vnp_TransactionNo");
  const vnp_OrderInfo = searchParams.get("vnp_OrderInfo");
  const vnp_TransactionStatus = searchParams.get("vnp_TransactionStatus");
  const isSuccess = vnp_ResponseCode === "00";

  const [hasProcessed, setHasProcessed] = useState(false);

  useEffect(() => {
    if (!vnp_OrderInfo || hasProcessed) return;
    
    // Đánh dấu đã xử lý để tránh StrictMode gọi API 2 lần gây race condition
    setHasProcessed(true);

    const handleUpdate = async () => {
        try {
            await updatePaymentStatus(vnp_OrderInfo, vnp_ResponseCode, vnp_TransactionStatus);
        } catch (error) {
            console.error("Payment status update error:", error);
        }
    };

    handleUpdate();
  }, [vnp_OrderInfo, vnp_ResponseCode, vnp_TransactionStatus, hasProcessed]);

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
                ></path>
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              VNPay Payment Successful!
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
                ></path>
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Payment Failed!
            </h2>
            <p className="text-gray-600 mb-6">
              You cancelled the transaction or an error occurred (Error Code:{" "}
              {vnp_ResponseCode})
            </p>
          </>
        )}
        {/* ... Các nút bấm "Xem đơn hàng" / "Về trang chủ" ... */}
      </div>
    </div>
  );
}

export default PaymentResultPage;
