import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { 
    FiCheck, 
    FiPackage, 
    FiTruck, 
    FiHome, 
    FiChevronLeft, 
    FiShoppingBag, 
    FiUser, 
    FiPhone, 
    FiMail, 
    FiMapPin,
    FiClock,
    FiCalendar,
    FiAlertCircle,
    FiZap,
    FiDollarSign,
    FiFileText
} from "react-icons/fi";
import { getOrderDetails, updatePaymentMethod, cancelOrder } from "../services/orderService";
import { getReturnRequestsByOrderItemApi } from "../api/returnRequestApi";
import { createVNPayPayment } from "../services/checkoutService";
import { addToCartService } from "../services/cartService";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "../../context/ToastContext";
import { useNavigate } from "react-router-dom";

const PrescriptionInfoBlock = ({ item }) => {
  if (!item) return null;
  const rx = item.prescription || item;
  
  if (
    rx.sphLeft == null && rx.sphRight == null &&
    rx.cylLeft == null && rx.cylRight == null &&
    rx.addLeft == null && rx.addRight == null &&
    rx.pd == null
  ) {
    return null;
  }

  return (
    <div className="mt-4 bg-blue-50/60 border border-blue-100 rounded-xl p-4 text-left max-w-lg">
      <div className="flex justify-between items-center mb-3">
        <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest flex items-center gap-1.5 font-sans">
          <FiFileText size={14} /> Prescription Details
        </p>
        {(rx.status === true) && (
          <span className="text-[9px] bg-emerald-500 text-white px-2 py-0.5 rounded-full font-bold uppercase tracking-tight shadow-sm flex items-center gap-1">
            <FiCheck size={10} /> Approved
          </span>
        )}
      </div>
      
      <div className="grid grid-cols-5 gap-2 text-center text-[9px] font-bold text-blue-400 uppercase mb-2">
        <div className="text-left">Eye</div>
        <div>SPH</div>
        <div>CYL</div>
        <div>AXIS</div>
        <div>ADD</div>
      </div>
      
      <div className="grid grid-cols-5 gap-2 text-center text-[11px] font-mono text-slate-700 mb-2 items-center bg-white border border-blue-50/50 rounded-lg p-2 shadow-sm shadow-blue-100/20">
        <div className="text-left font-bold text-slate-500 font-sans text-[10px]">Right (OD)</div>
        <div>{rx.sphRight ?? "—"}</div>
        <div>{rx.cylRight ?? "—"}</div>
        <div>{rx.axisRight != null ? `${rx.axisRight}°` : "—"}</div>
        <div>{rx.addRight ?? "—"}</div>
      </div>
      
      <div className="grid grid-cols-5 gap-2 text-center text-[11px] font-mono text-slate-700 items-center bg-white border border-blue-50/50 rounded-lg p-2 shadow-sm shadow-blue-100/20">
        <div className="text-left font-bold text-slate-500 font-sans text-[10px]">Left (OS)</div>
        <div>{rx.sphLeft ?? "—"}</div>
        <div>{rx.cylLeft ?? "—"}</div>
        <div>{rx.axisLeft != null ? `${rx.axisLeft}°` : "—"}</div>
        <div>{rx.addLeft ?? "—"}</div>
      </div>
      
      {rx.pd && (
        <div className="mt-3 pt-3 border-t border-blue-100/50 text-[10px] text-slate-500 flex items-center gap-2">
          <span className="font-bold text-blue-700/70 uppercase tracking-tighter">Pupillary Distance (PD):</span>
          <span className="font-bold text-blue-800 font-mono tracking-wide bg-white px-2 py-0.5 rounded-md border border-blue-100/50 shadow-sm">{rx.pd} mm</span>
        </div>
      )}
    </div>
  );
};

function ShippingProgressPage() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [returnMap, setReturnMap] = useState({});
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const data = await getOrderDetails(id);
        setOrder(data);

        // Fetch return requests for items
        const map = {};
        for (const item of data.items || []) {
          try {
            const res = await getReturnRequestsByOrderItemApi(item.orderItemId);
            const requests = Array.isArray(res?.data?.data) ? res.data.data : [];
            if (requests.length > 0) {
              map[item.orderItemId] = requests[0];
            }
          } catch {
            // Ignore
          }
        }
        setReturnMap(map);
      } catch (err) {
        console.error("Error fetching order dashboard:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
    const interval = setInterval(fetchOrder, 10000); // 10s
    return () => clearInterval(interval);
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="w-8 h-8 border-2 border-slate-200 border-t-blue-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white p-6">
        <FiShoppingBag size={40} className="text-slate-200 mb-4" />
        <p className="text-slate-400 font-semibold mb-6">Order not found</p>
        <Link to="/my-orders" className="text-sm font-bold text-blue-600 hover:underline">
          Back to My Orders
        </Link>
      </div>
    );
  }

  const steps = [
    { id: 0, title: "Pending", icon: <FiClock />, desc: "Order placed" },
    { id: 1, title: "Processing", icon: <FiPackage />, desc: "Preparing items" },
    { id: 2, title: "Shipping", icon: <FiTruck />, desc: "On the way" },
    { id: 3, title: "Delivered", icon: <FiHome />, desc: "Order completed" },
  ];

  const handlePayBalance = async (method) => {
    if (method === "VNPAY") {
      const remaining = (order.finalTotal || 0) - (order.depositAmount || 0);
      try {
        const url = await createVNPayPayment(remaining, order.orderId || order.id);
        window.location.href = url;
      } catch (err) {
        showToast("Failed to initiate VNPay payment", "error");
      }
    } else {
      try {
        await updatePaymentMethod(order.orderId || order.id, "COD");
        showToast("Balance will be paid via COD upon delivery");
        setTimeout(() => window.location.reload(), 1500);
      } catch (err) {
        showToast("Failed to update payment method", "error");
      }
    }
  };

  const handleBuyAgain = async () => {
    try {
      showToast("Adding items to cart...");
      for (const item of order.items) {
        await addToCartService({
          variantId: item.variantId,
          productId: item.productId,
          quantity: item.quantity,
          lensOptionId: item.lensOptionId,
          isPreorder: item.isPreorder,
          isLens: item.sphLeft != null || item.sphRight != null || item.prescription != null,
          prescriptionId: item.prescriptionId || item.prescription?.prescriptionId || null,
          // Pass full prescription parameters down
          sphLeft: item.sphLeft,
          sphRight: item.sphRight,
          cylLeft: item.cylLeft,
          cylRight: item.cylRight,
          axisLeft: item.axisLeft,
          axisRight: item.axisRight,
          addLeft: item.addLeft,
          addRight: item.addRight,
          pd: item.pd
        });
      }

      // SYNC CART: Fetch latest from backend and update local storage
      try {
        const user = JSON.parse(localStorage.getItem("currentUser"));
        if (user) {
          const res = await getCartByUserService(user.userId);
          const latestCart = Array.isArray(res) ? res : res?.data || [];
          localStorage.setItem("cart", JSON.stringify(latestCart));
          window.dispatchEvent(new Event("storage"));
        }
      } catch (syncErr) {
        console.error("Cart sync failed:", syncErr);
      }

      showToast("Items added to cart! Redirecting to checkout...");
      setTimeout(() => navigate("/checkout"), 1500);
    } catch (err) {
      showToast("Failed to re-order items.", "error");
    }
  };

  const handleCancelOrder = async () => {
    const isPreorder = order.items?.some(i => i.isPreorder);
    const msg = isPreorder
      ? "WARNING: This is a pre-order with a deposit already paid. If you cancel now, your deposit will NOT be refunded. Are you sure you want to proceed?"
      : "Are you sure you want to cancel this order?";
    if (window.confirm(msg)) {
      try {
        const res = await cancelOrder(order.orderId || order.id);
        if (res.success) {
          showToast("Order cancelled successfully!");
          window.location.reload();
        }
      } catch (error) {
        showToast("Cancellation failed: " + (error.response?.data?.message || "System error"), "error");
      }
    }
  };

  const getReturnStatusInfo = (status) => {
    switch (status) {
      case "PENDING": return { text: "Pending", color: "text-amber-600", bg: "bg-amber-50" };
      case "APPROVED": return { text: "Approved", color: "text-blue-600", bg: "bg-blue-50" };
      case "REJECTED": return { text: "Rejected", color: "text-red-600", bg: "bg-red-50" };
      case "COMPLETED": return { text: "Completed", color: "text-emerald-600", bg: "bg-emerald-50" };
      default: return { text: status, color: "text-stone-600", bg: "bg-stone-50" };
    }
  };

  return (
    <div className="min-h-screen bg-[#fcfcfc] pt-24 pb-20 font-sans text-slate-900">
      <div className="max-w-6xl mx-auto px-6">
        
        {/* Simple Breadcrumb */}
        <Link to="/my-orders" className="inline-flex items-center gap-1 text-slate-400 hover:text-slate-900 transition-colors mb-8 text-xs font-bold uppercase tracking-wider">
            <FiChevronLeft /> Back to Orders
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Left Main Content (8 Columns) */}
            <div className="lg:col-span-8 space-y-6">
                
                {/* Order Summary Header Card */}
                <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-slate-50 flex items-center justify-center rounded-xl text-slate-400">
                            <FiShoppingBag size={24} />
                        </div>
                        <div>
                            <div className="flex items-center gap-3">
                                <h1 className="text-xl font-bold tracking-tight text-slate-900">Order #{order.id}</h1>
                                <StatusBadge status={order.rawStatus} />
                            </div>
                            <p className="text-xs font-semibold text-slate-400 mt-1 flex items-center gap-4 uppercase tracking-tighter">
                                <span><FiCalendar className="inline mr-1" /> {order.date}</span>
                                <span className="text-blue-600 font-bold">• Estimated 3-5 days delivery</span>
                            </p>
                        </div>
                    </div>
                    
                    <div className="flex flex-col items-end gap-1.5">
                        {order.rawStatus === "Pending" && (
                            <button 
                                onClick={handleCancelOrder}
                                className="px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-[10px] font-bold border border-red-100 hover:bg-red-100 transition-all uppercase tracking-widest mb-1"
                            >
                                Cancel Order
                            </button>
                        )}
                        {order.rawStatus === "Cancelled" && (
                            <span className="px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-[10px] font-bold border border-red-100 uppercase tracking-widest mb-1 shadow-sm">
                                Order Cancelled
                            </span>
                        )}
                        {order.depositType === "PARTIAL" && (
                            <div className="flex flex-col items-end text-[11px] space-y-1">
                                <span className="text-slate-400 bg-slate-50 px-2 py-0.5 rounded-md font-bold uppercase tracking-tighter">
                                    Paid: {order.depositAmount?.toLocaleString()}₫ ({order.depositPaymentMethod || order.paymentMethod})
                                </span>
                                <span className={`px-2 py-0.5 rounded-md font-bold border tracking-tight ${(order.paymentStatus === "PAID_FULL" || order.remainingPaymentStatus === "PAID" || (order.paymentStatus === "PAID" && order.paymentMethod === "COD")) ? "text-emerald-600 bg-emerald-50 border-emerald-100" : "text-blue-600 bg-blue-50 border-blue-100"}`}>
                                    {(order.paymentStatus === "PAID_FULL" || order.remainingPaymentStatus === "PAID" || (order.paymentStatus === "PAID" && order.paymentMethod === "COD")) ? "SETTLED" : `REMAINING: ${(order.finalTotal - order.depositAmount).toLocaleString()}₫`}
                                </span>
                                {order.rawStatus === "Pending" && <span className="text-amber-600 font-bold italic text-[9px] uppercase tracking-widest">Waiting for stock...</span>}
                            </div>
                        )}
                        {order.depositType === "FULL" && (
                            <div className="flex flex-col items-end space-y-1">
                                <span className="text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md text-[10px] font-bold border border-emerald-100 uppercase tracking-widest shadow-sm">Full Prepayment ({order.paymentMethod})</span>
                                {order.rawStatus === "Pending" && order.items?.some(i => i.isPreorder) && <span className="text-amber-600 font-bold italic text-[9px] uppercase tracking-widest text-right">Waiting for stock arrival...</span>}
                            </div>
                        )}
                    </div>
                </div>

                {/* Progress Card */}
                <div className="bg-white rounded-2xl p-8 border border-slate-100 shadow-sm">
                    <h2 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-10 pb-4 border-b border-slate-50">Shipping Progress</h2>
                    <div className="relative flex justify-between items-center transition-all">
                        {/* Connecting Line */}
                        <div className="absolute top-1/2 -translate-y-1/2 left-0 w-full h-[2px] bg-slate-100 -z-0">
                            <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: order.rawStatus === "Cancelled" ? "0%" : `${(order.status / (steps.length - 1)) * 100}%` }}
                                className={`h-full ${order.rawStatus === "Cancelled" ? "bg-red-400" : "bg-blue-500"}`}
                            />
                        </div>

                        {steps.map((step) => {
                            const isCancelled = order.rawStatus === "Cancelled";
                            const isActive = !isCancelled && order.status >= step.id;
                            const isCurrent = !isCancelled && order.status === step.id;

                            return (
                                <div key={step.id} className="relative z-10 flex flex-col items-center group">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                                        isActive ? "bg-blue-600 text-white shadow-lg shadow-blue-100" : "bg-white border border-slate-100 text-slate-300"
                                    }`}>
                                        {step.icon}
                                    </div>
                                    <div className="absolute top-12 mt-1 text-center min-w-[80px]">
                                        <p className={`text-[11px] font-bold ${isActive ? "text-slate-900" : "text-slate-300"}`}>
                                            {step.title}
                                        </p>
                                        {isCurrent && (
                                            <span className="text-[9px] font-bold text-blue-500 uppercase tracking-tighter block mt-0.5">
                                                Current
                                            </span>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    <div className="h-10" /> 

                    {/* Pre-order Balance Payment UI */}
                    {order.depositType === "PARTIAL" && 
                     order.status >= 1 && order.status < 3 && 
                     order.rawStatus !== "Cancelled" && 
                     order.remainingPaymentStatus !== "PAID" &&
                     order.paymentStatus !== "PAID_FULL" &&
                     order.paymentMethod !== "COD" &&
                     !(order.stockReadyAt && (new Date() - new Date(order.stockReadyAt)) / (1000 * 60 * 60) > 12) && (
                        <div className="mt-8 p-6 bg-blue-50/50 border border-blue-100 rounded-2xl shadow-sm border-dashed">
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                <div className="flex-1">
                                    <h3 className="text-sm font-bold text-blue-900 flex items-center gap-2">
                                        <FiZap className="text-blue-500 animate-pulse" /> ACTION REQUIRED: BALANCE PAYMENT
                                    </h3>
                                    <p className="text-[11px] text-blue-600 mt-1 max-w-lg leading-relaxed">
                                        Your items are ready for shipment! Please settle the remaining balance of 
                                        <span className="font-bold mx-1">{(order.finalTotal - order.depositAmount).toLocaleString()}₫</span> 
                                        to proceed. You can pay via VNPay or switch to COD.
                                    </p>
                                </div>
                                <div className="flex items-center gap-3 w-full sm:w-auto">
                                    <button 
                                        onClick={() => handlePayBalance("VNPAY")}
                                        className="flex-1 sm:flex-none px-5 py-2.5 bg-blue-600 text-white rounded-xl text-[11px] font-bold hover:bg-blue-700 transition-all shadow-md shadow-blue-100 flex items-center justify-center gap-2"
                                    >
                                        <FiDollarSign /> VNPay
                                    </button>
                                    <button 
                                        onClick={() => handlePayBalance("COD")}
                                        className="flex-1 sm:flex-none px-5 py-2.5 bg-white border border-blue-200 text-blue-600 rounded-xl text-[11px] font-bold hover:bg-blue-50 transition-all shadow-md shadow-blue-50/50 flex items-center justify-center gap-2"
                                    >
                                        <FiTruck /> Use COD
                                    </button>
                                </div>
                            </div>
                            <div className="mt-4 pt-4 border-t border-blue-100/50 flex items-start gap-2.5 text-[10px] text-blue-500">
                                <FiClock className="mt-0.5 animate-spin-slow" />
                                <div className="flex flex-col gap-0.5">
                                    <p className="font-bold uppercase tracking-tight">Time remaining: {Math.max(0, 12 - Math.floor((new Date() - new Date(order.stockReadyAt)) / (1000 * 60 * 60)))}h left</p>
                                    <p className="opacity-70">After 12 hours, the payment method will automatically default to COD for shipment.</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Show Auto-COD Info if timed out */}
                    {order.depositType === "PARTIAL" && 
                     order.status >= 1 && 
                     order.paymentMethod !== "COD" &&
                     order.remainingPaymentStatus !== "PAID" &&
                     order.paymentStatus !== "PAID_FULL" &&
                     (order.stockReadyAt && (new Date() - new Date(order.stockReadyAt)) / (1000 * 60 * 60) > 12) && (
                        <div className="mt-8 p-5 bg-emerald-50/50 border border-emerald-100 rounded-2xl flex items-center gap-4">
                            <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 flex-shrink-0">
                                <FiTruck size={20} />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-emerald-800">Payment Period Expired - Defaulting to COD</p>
                                <p className="text-[10px] text-emerald-600 mt-0.5">The 12-hour window has passed. Your remaining 50% will be collected on delivery.</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Order Items Table Card */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-50 bg-[#fafafa]/50">
                        <h3 className="text-[11px] font-bold text-slate-900 uppercase tracking-widest">Order Details</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-50">
                                    <th className="px-6 py-4">Product Info</th>
                                    <th className="px-4 py-4 text-center">Qty</th>
                                    <th className="px-4 py-4 text-right">Price</th>
                                    <th className="px-6 py-4 text-right">Total</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {order.items.map((item, idx) => {
                                    const itReq = returnMap[item.orderItemId];
                                    const itStatus = itReq ? getReturnStatusInfo(itReq.status) : null;
                                    const isCompleted = order.rawStatus === "Delivered" || order.rawStatus === "Completed";

                                    return (
                                        <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <img src={item.image || "https://placehold.co/100"} alt="" className="w-10 h-10 rounded-lg object-cover border border-slate-100" />
                                                    <div>
                                                        <p className="text-sm font-bold text-slate-800 flex items-center gap-2">
                                                            {item.name}
                                                            {item.isPreorder && <span className="px-1.5 py-0.5 bg-amber-50 text-amber-600 rounded text-[8px] font-bold border border-amber-100 uppercase tracking-tighter">Pre-order</span>}
                                                        </p>
                                                        <p className="text-[10px] font-semibold text-slate-400 uppercase mt-0.5">ID: #{item.variantId || item.productId}</p>
                                                        
                                                        {isCompleted && (
                                                            <div className="flex items-center gap-2 mt-3">
                                                                {!itReq ? (
                                                                    <Link 
                                                                        to={`/return-request?orderItemId=${item.orderItemId}&orderId=${order.orderId || order.id}`}
                                                                        className="px-2 py-1 bg-white border border-slate-200 text-slate-600 rounded text-[9px] font-bold hover:bg-slate-50 transition-all uppercase tracking-tight"
                                                                    >
                                                                        Return
                                                                    </Link>
                                                                ) : (
                                                                    <span className={`px-2 py-1 rounded text-[9px] font-bold border uppercase tracking-tight ${itStatus.bg} ${itStatus.color} ${itStatus.color.replace('text', 'border')}`}>
                                                                        Return: {itStatus.text}
                                                                    </span>
                                                                )}
                                                                <Link 
                                                                    to={`/product/${item.productId}#review-form`}
                                                                    className="px-2 py-1 bg-blue-600 text-white rounded text-[9px] font-bold hover:bg-blue-700 transition-all uppercase tracking-tight"
                                                                >
                                                                    Review
                                                                </Link>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                                <PrescriptionInfoBlock item={item} />
                                            </td>
                                            <td className="px-4 py-4 text-center text-sm font-semibold text-slate-600">{item.quantity}</td>
                                            <td className="px-4 py-4 text-right text-xs font-semibold text-slate-500">{(item.unitPrice || 0).toLocaleString()}₫</td>
                                            <td className="px-6 py-4 text-right text-sm font-bold text-slate-900">{(item.total || 0).toLocaleString()}₫</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    <div className="px-8 py-6 bg-[#fafafa]/30 border-t border-slate-100">
                        <div className="flex justify-end">
                            <div className="w-full max-w-[240px] space-y-3">
                                <div className="flex justify-between text-xs font-semibold text-slate-400 font-medium uppercase tracking-tighter">
                                    <span>Sub Total</span>
                                    <span className="text-slate-700">{(order.subTotal || 0).toLocaleString()}₫</span>
                                </div>
                                {order.shippingFee > 0 && (
                                    <div className="flex justify-between text-xs font-semibold text-slate-400 font-medium uppercase tracking-tighter">
                                        <span>Shipping Fee</span>
                                        <span className="text-blue-500 font-bold">+ {(order.shippingFee || 0).toLocaleString()}₫</span>
                                    </div>
                                )}
                                {order.discount > 0 && (
                                    <div className="flex justify-between text-xs font-semibold text-slate-400 font-medium uppercase tracking-tighter">
                                        <span>Discount</span>
                                        <span className="text-emerald-500 font-bold">- {(order.discount || 0).toLocaleString()}₫</span>
                                    </div>
                                )}
                                <div className="h-px bg-slate-100 my-2" />
                                <div className="flex justify-between text-base font-bold text-slate-900 tracking-tight">
                                    <span>Grand Total</span>
                                    <span className="text-blue-600 text-lg">{(order.finalTotal || 0).toLocaleString()}₫</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Sidebar (4 Columns) */}
            <div className="lg:col-span-4 space-y-6">
                
                {/* Customer Details */}
                <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
                    <h3 className="text-[11px] font-bold text-slate-900 uppercase tracking-widest mb-6 border-b border-slate-50 pb-3 flex items-center justify-between">
                        Contact Info
                        <FiUser className="text-slate-300" />
                    </h3>
                    <div className="space-y-4">
                        <div className="flex gap-3">
                            <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400"><FiUser size={14}/></div>
                            <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Name</p>
                                <p className="text-xs font-bold text-slate-700 mt-0.5">{order.userName || "N/A"}</p>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400"><FiMail size={14}/></div>
                            <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Email</p>
                                <p className="text-xs font-bold text-slate-700 mt-0.5 max-w-[200px] truncate">{order.userEmail || "N/A"}</p>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400"><FiPhone size={14}/></div>
                            <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Phone</p>
                                <p className="text-xs font-bold text-slate-700 mt-0.5">{order.phone || "N/A"}</p>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400"><FiMapPin size={14}/></div>
                            <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Delivery Address</p>
                                <p className="text-xs font-bold text-slate-700 mt-0.5 leading-relaxed">{order.address || "N/A"}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Timeline History */}
                <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm relative overflow-hidden">
                    <h3 className="text-[11px] font-bold text-slate-900 uppercase tracking-widest mb-6 border-b border-slate-50 pb-3 flex items-center justify-between">
                        Order Events
                        <FiClock className="text-slate-300" />
                    </h3>
                    
                    <div className="space-y-6 relative ml-2">
                        <div className="absolute top-1 bottom-1 left-[5px] w-[1px] bg-slate-100" />
                        
                        {/* Event: Confirmed */}
                        <div className="flex gap-4">
                            <div className="relative z-10 w-[11px] h-[11px] rounded-full bg-blue-500 border-2 border-white shadow-sm mt-1" />
                            <div>
                                <p className="text-xs font-bold text-slate-800">Order Confirmed</p>
                                <p className="text-[10px] font-medium text-slate-400 mt-1 uppercase leading-none">{order.date}</p>
                            </div>
                        </div>
                        
                        {/* Event: Processing / Stock Availability */}
                        <div className="flex gap-4">
                            <div className={`relative z-10 w-[11px] h-[11px] rounded-full border-2 border-white mt-1 ${order.status >= 1 ? "bg-blue-500 shadow-sm" : "bg-slate-100"}`} />
                            <div>
                                <p className={`text-xs font-bold ${order.status >= 1 ? "text-slate-800" : "text-slate-300"}`}>
                                    {order.stockReadyAt ? "Inventory Prepared" : "Preparing Package"}
                                </p>
                                {order.stockReadyAt ? (
                                    <p className="text-[10px] font-medium text-slate-400 mt-1 uppercase leading-none">
                                        {new Date(order.stockReadyAt).toLocaleString("en-US", { month: 'numeric', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                ) : (
                                    <p className="text-[9px] text-slate-400 mt-1 italic">
                                        {order.items.some(i => i.isPreorder) ? "Waiting for pre-order stock arrival..." : "Our staff is checking and packing your items."}
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Event: Shipping */}
                        <div className="flex gap-4">
                            <div className={`relative z-10 w-[11px] h-[11px] rounded-full border-2 border-white mt-1 ${order.status >= 2 ? "bg-blue-500 shadow-sm" : "bg-slate-100"}`} />
                            <div>
                                <p className={`text-xs font-bold ${order.status >= 2 ? "text-slate-800" : "text-slate-300"}`}>Shipper Pickup</p>
                                {order.status >= 2 && (
                                    <p className="text-[9px] text-blue-500 mt-1 font-bold uppercase tracking-tight">Package handed over to carrier</p>
                                )}
                            </div>
                        </div>

                        {/* Event: Delivered */}
                        <div className="flex gap-4">
                            <div className={`relative z-10 w-[11px] h-[11px] rounded-full border-2 border-white mt-1 ${order.status >= 3 ? "bg-green-500 shadow-sm" : "bg-slate-100"}`} />
                            <div>
                                <p className={`text-xs font-bold ${order.status >= 3 ? "text-green-600" : "text-slate-300"}`}>Delivered</p>
                                {order.status >= 3 && order.deliveredAt && (
                                    <p className="text-[10px] font-medium text-slate-400 mt-1 uppercase leading-none">
                                        {new Date(order.deliveredAt).toLocaleDateString("en-US")}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    {(order.rawStatus === "Cancelled" || order.rawStatus === "Delivered" || order.rawStatus === "Completed") && (
                        <button 
                            onClick={handleBuyAgain}
                            className="w-full mt-4 py-2.5 rounded-xl bg-blue-600 text-white text-[10px] font-bold hover:bg-blue-700 transition-all uppercase tracking-widest shadow-md shadow-blue-500/10"
                        >
                            Buy Again
                        </button>
                    )}
                    <button className="w-full mt-3 py-2.5 rounded-xl border border-slate-100 text-[10px] font-bold text-slate-400 hover:bg-slate-50 transition-all uppercase tracking-widest">
                        Support Center
                    </button>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
    const isCompleted = status === "Delivered" || status === "Completed";
    const isPending = status === "Pending";
    const isCancelled = status === "Cancelled";

    return (
        <span className={`px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest flex items-center gap-1.5 ${
            isCompleted ? "bg-emerald-50 text-emerald-600" :
            isPending ? "bg-amber-50 text-amber-600" :
            isCancelled ? "bg-red-50 text-red-600" :
            "bg-blue-50 text-blue-600"
        }`}>
            <span className={`w-1 h-1 rounded-full ${
                isCompleted ? "bg-emerald-400" :
                isPending ? "bg-amber-400" :
                isCancelled ? "bg-red-400" :
                "bg-blue-400 animate-pulse"
            }`} />
            {status}
        </span>
    );
}

export default ShippingProgressPage;
