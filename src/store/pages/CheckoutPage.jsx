import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiArrowLeft,
  FiCheck,
  FiTruck,
  FiCreditCard,
  FiUser,
  FiPhone,
  FiMapPin,
} from "react-icons/fi";

import {
  clearCartService,
  deleteCartItemService,
  getCartByUserService,
  updateCartItemService,
} from "../services/cartService";

import { checkoutOrder, createVNPayPayment } from "../services/checkoutService";
import {
  cancelPendingPayment,
  getOrderDetails,
} from "../services/orderService";
import { useToast } from "../../context/ToastContext";
import { motion, AnimatePresence } from "framer-motion";

function Toast({ message, visible }) {
  if (!visible) return null;
  return (
    <div
      className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 bg-blue-600 text-white px-5 py-3 rounded-full text-sm font-medium shadow-xl flex items-center gap-2"
      style={{ animation: "slideUp .3s ease" }}
    >
      <FiCheck size={14} className="text-green-400" /> {message}
    </div>
  );
}

function Field({ label, required, icon: Icon, children }) {
  return (
    <div>
      <label className="flex items-center gap-1.5 text-xs text-stone-500 tracking-[0.15em] uppercase font-medium mb-2">
        {Icon && <Icon size={12} />}
        {label} {required && <span className="text-blue-500">*</span>}
      </label>
      {children}
    </div>
  );
}

const isPreorderItem = (item) => {
  const rawType = String(item?.itemType || item?.type || "").toUpperCase();
  const boolFlag = item?.isPreorder ?? item?.isPreOrder;

  if (typeof boolFlag === "boolean") return boolFlag;
  return ["PREORDER", "PRE_ORDER", "REORDER", "RE_ORDER"].includes(rawType);
};

function CheckoutPage() {
  const navigate = useNavigate();
  const { showToast: showGlobalToast } = useToast();
  const southernCities = [
    { name: "Hồ Chí Minh", distance: 1 },
    { name: "Bình Dương", distance: 5 },
    { name: "Đồng Nai", distance: 6 },
    { name: "Bà Rịa - Vũng Tàu", distance: 7 },
    { name: "Long An", distance: 8 },
    { name: "Tiền Giang", distance: 9 },
    { name: "Vĩnh Long", distance: 10 },
    { name: "Cần Thơ", distance: 12 },
    { name: "An Giang", distance: 13 },
    { name: "Sóc Trăng", distance: 14 },
    { name: "Bạc Liêu", distance: 15 },
    { name: "Cà Mau", distance: 16 },
    { name: "Kiên Giang", distance: 18 },
    { name: "Trà Vinh", distance: 11 },
  ];

  const calculateShippingFee = (city, total) => {
    if (!city) return 0;
    if (total > 1000000) return 0;
    const selected = southernCities.find((c) => c.name === city);
    if (!selected) return 0;
    if (city === "Hồ Chí Minh") return 10000;
    return selected.distance * 10000;
  };

  const [cartItems, setCartItems] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState("COD");
  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    address: "",
    note: "",
    depositType: "FULL",
  });
  const [toast, setToast] = useState({ visible: false, message: "" });
  const [placing, setPlacing] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    let user;
    try {
      user = JSON.parse(localStorage.getItem("currentUser"));
    } catch {
      user = null;
    }

    // Allow guest checkout — don't redirect to login
    // we'll just check if there's a local cart if no user
    const fetchCart = async () => {
      try {
        let cartData = [];
        if (user) {
          const res = await getCartByUserService(user.userId);
          cartData = Array.isArray(res) ? res : res?.data || [];
        } else {
          // GUEST FLOW: Load from localStorage
          cartData = JSON.parse(localStorage.getItem("cart")) || [];
        }

        const mapped = cartData.map((item) => {
          const rx = item.prescription || {};
          return {
            cartItemId: item.cartItemId,
            productId: item.productId,
            name: item.productName || item.product?.name || item.name,
            image:
              item.imageUrl ||
              item.product?.imageUrl ||
              item.variant?.imageUrl ||
              "https://placehold.co/100",
            price: item.unitPrice || item.price || 0,
            quantity: item.quantity,
            // Preserving prescription data (flat fields with nested fallback)
            isLens: item.isLens,
            sphLeft: item.sphLeft ?? rx.sphLeft,
            sphRight: item.sphRight ?? rx.sphRight,
            cylLeft: item.cylLeft ?? rx.cylLeft,
            cylRight: item.cylRight ?? rx.cylRight,
            axisLeft: item.axisLeft ?? rx.axisLeft,
            axisRight: item.axisRight ?? rx.axisRight,
            addLeft: item.addLeft ?? rx.addLeft,
            addRight: item.addRight ?? rx.addRight,
            pd: item.pd ?? rx.pd,
            prescription: item.prescription,
            itemType: item.itemType || item.type,
            isPreorder: isPreorderItem(item),
            variant: item.variant || {
              variantId: item.variantId,
              color: item.variantColor,
              frameSize: item.variantSize,
            },
          };
        });

        setCartItems(mapped);
        localStorage.setItem("cart", JSON.stringify(mapped));
        window.dispatchEvent(new Event("storage"));

        if (mapped.length === 0) navigate("/shop");
      } catch (error) {
        console.error("Fetch cart error:", error);
      }
    };

    fetchCart();
    if (user) setFormData((prev) => ({ ...prev, fullName: user.name || "" }));
  }, [navigate]);

  // 🔥 TỰ ĐỘNG CHỌN VNPAY NẾU CÓ PREORDER
  useEffect(() => {
    if (cartItems.some((i) => i.isPreorder)) {
      setPaymentMethod("VNPAY");
    }
  }, [cartItems]);

  const total = cartItems.reduce(
    (acc, item) => acc + Number(item.price) * item.quantity,
    0,
  );
  const shippingFee = calculateShippingFee(formData.city, total);
  const totalWithShipping = total + shippingFee;

  const handleChange = (e) => {
    const { name, value } = e.target;

    let newValue = value;

    // 🔥 CHỈ CHO NHẬP SỐ
    if (name === "phone") {
      newValue = value.replace(/\D/g, "");
    }

    setFormData((prev) => ({
      ...prev,
      [name]: newValue,
    }));
  };
  const showToast = (msg) => {
    setToast({ visible: true, message: msg });
    setTimeout(() => setToast({ visible: false, message: "" }), 3000);
  };

  const _updateQty = async (productId, variantId, delta, cartItemId) => {
    const item = cartItems.find(
      (i) =>
        String(i.cartItemId || i.variant?.variantId) ===
        String(cartItemId || variantId),
    );
    if (!item) return;
    const newQty = item.quantity + delta;
    if (newQty <= 0) {
      await removeItem(productId, variantId, cartItemId);
      return;
    }

    const user =
      localStorage.getItem("currentUser") || localStorage.getItem("token");

    try {
      if (user && cartItemId) {
        await updateCartItemService(cartItemId, newQty);
      }
      const updated = cartItems.map((i) =>
        String(i.cartItemId || i.variant?.variantId) ===
        String(cartItemId || variantId)
          ? { ...i, quantity: newQty }
          : i,
      );
      setCartItems(updated);
      localStorage.setItem("cart", JSON.stringify(updated));
      window.dispatchEvent(new Event("storage"));
    } catch {
      showToast("Quantity update failed!");
    }
  };

  const removeItem = async (productId, variantId, cartItemId) => {
    const user =
      localStorage.getItem("currentUser") || localStorage.getItem("token");

    try {
      if (user && cartItemId) {
        await deleteCartItemService(cartItemId);
      }
      const updated = cartItems.filter(
        (i) =>
          String(i.cartItemId || i.variant?.variantId) !==
          String(cartItemId || variantId),
      );
      setCartItems(updated);
      localStorage.setItem("cart", JSON.stringify(updated));
      window.dispatchEvent(new Event("storage"));
      if (updated.length === 0) navigate("/shop");
    } catch {
      showToast("Failed to remove product!");
    }
  };

  const [paymentWindow, setPaymentWindow] = useState(null);
  const [waitingPayment, setWaitingPayment] = useState(false);
  const [pendingOrderId, setPendingOrderId] = useState(null);
  const paymentHandledRef = useRef(false);

  const clearPaymentState = useCallback(() => {
    setWaitingPayment(false);
    setPlacing(false);
    setPendingOrderId(null);
    setPaymentWindow(null);
  }, []);

  const cancelPendingOrderAndExit = useCallback(
    async (orderId, message) => {
      if (!orderId) {
        paymentHandledRef.current = true;
        clearPaymentState();
        if (message) showToast(message);
        return;
      }

      try {
        await cancelPendingPayment(orderId);
      } catch (err) {
        console.error("Cancel pending payment failed:", err);
      } finally {
        paymentHandledRef.current = true;
        clearPaymentState();
        if (message) showToast(message);
      }
    },
    [clearPaymentState],
  );

  const finalizeVnPaySuccess = useCallback(() => {
    if (paymentHandledRef.current) return;
    paymentHandledRef.current = true;

    setSuccess(true);
    clearPaymentState();

    (async () => {
      try {
        await clearCartService();
      } catch (error) {
        console.error("Cart clear failed:", error);
      }

      localStorage.setItem("cart", JSON.stringify([]));
      window.dispatchEvent(new Event("storage"));
      setTimeout(() => navigate("/my-orders"), 1400);
    })();
  }, [clearPaymentState, navigate]);

  useEffect(() => {
    const handleVnPayResult = async (payload) => {
      if (!payload || payload.type !== "VNPAY_RESULT") return;

      const ok = payload.success === true || payload.responseCode === "00";
      if (ok) {
        finalizeVnPaySuccess();
        return;
      }

      await cancelPendingOrderAndExit(
        pendingOrderId,
        "Payment failed or cancelled.",
      );
    };

    const onMessage = (event) => {
      if (event.origin !== window.location.origin) return;
      handleVnPayResult(event.data);
    };

    const onStorage = (event) => {
      if (event.key !== "vnpay:lastResult" || !event.newValue) return;
      try {
        const payload = JSON.parse(event.newValue);
        handleVnPayResult(payload);
      } catch (err) {
        console.error("Parse VNPay result failed:", err);
      }
    };

    window.addEventListener("message", onMessage);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener("message", onMessage);
      window.removeEventListener("storage", onStorage);
    };
  }, [cancelPendingOrderAndExit, finalizeVnPaySuccess, pendingOrderId]);

  const handlePlaceOrder = async (e) => {
    e.preventDefault();

    const currentUser =
      localStorage.getItem("currentUser") || localStorage.getItem("token");
    if (!currentUser) {
      showGlobalToast("Please log in to place your order.");
      setTimeout(
        () => navigate("/login", { state: { from: "/checkout" } }),
        1500,
      );
      return;
    }

    if (
      !formData.fullName ||
      !formData.phone ||
      !formData.address ||
      !formData.city
    ) {
      showToast("Please fill in all information!");
      return;
    }

    setPlacing(true);

    try {
      const order = await checkoutOrder(
        formData,
        shippingFee,
        cartItems,
        paymentMethod,
      );

      // ✅ VNPay Payment Flow (Popup + Polling)
      if (paymentMethod === "VNPAY") {
        paymentHandledRef.current = false;
        setPendingOrderId(order.orderId);
        let amountToPay = 0;
        const hasPreorder = cartItems.some((i) => i.isPreorder);

        if (hasPreorder && formData.depositType === "PARTIAL") {
          const inStockTotal = cartItems
            .filter((i) => !i.isPreorder)
            .reduce((acc, i) => acc + i.price * i.quantity, 0);
          const preOrderTotal = cartItems
            .filter((i) => i.isPreorder)
            .reduce((acc, i) => acc + i.price * i.quantity, 0);
          amountToPay = inStockTotal + preOrderTotal / 2 + shippingFee;
        } else {
          amountToPay = order.finalPrice;
        }

        const paymentUrl = await createVNPayPayment(amountToPay, order.orderId);

        // Open Popup
        const width = 600,
          height = 700;
        const left = window.innerWidth / 2 - width / 2;
        const top = window.innerHeight / 2 - height / 2;
        const popup = window.open(
          paymentUrl,
          "VNPay Payment",
          `width=${width},height=${height},left=${left},top=${top}`,
        );

        if (!popup) {
          await cancelPendingOrderAndExit(
            order.orderId,
            "Unable to open VNPay window. Please allow popups and try again.",
          );
          return;
        }

        setPaymentWindow(popup);
        setWaitingPayment(true);
        let popupCloseHandled = false;

        // Start Polling backend for payment confirmation
        const pollInterval = setInterval(async () => {
          if (paymentHandledRef.current) {
            clearInterval(pollInterval);
            return;
          }

          if (popup.closed && !popupCloseHandled) {
            popupCloseHandled = true;
            clearInterval(pollInterval);

            (async () => {
              try {
                const latestOrder = await getOrderDetails(order.orderId);
                const isPaid =
                  latestOrder.paymentStatus === "PAID" ||
                  latestOrder.paymentStatus === "PAID_FULL";

                if (isPaid) {
                  finalizeVnPaySuccess();
                  return;
                }
              } catch (statusErr) {
                console.error("Final payment status check failed:", statusErr);
              }

              await cancelPendingOrderAndExit(
                order.orderId,
                "Payment window closed.",
              );
            })();

            return;
          }

          try {
            const updatedOrder = await getOrderDetails(order.orderId);

            if (
              updatedOrder.paymentStatus === "PAID" ||
              updatedOrder.paymentStatus === "PAID_FULL"
            ) {
              clearInterval(pollInterval);
              popup?.close();
              finalizeVnPaySuccess();
              return;
            }
          } catch (pollErr) {
            console.error("Polling error:", pollErr);
          }
        }, 3000);

        // Auto-stop polling after 10 minutes if still unresolved
        setTimeout(() => {
          clearInterval(pollInterval);
          if (!paymentHandledRef.current) {
            clearPaymentState();
            showToast("Payment confirmation timeout. Please check My Orders.");
          }
        }, 600000);
        return;
      }

      // ✅ COD Flow
      setSuccess(true);
      // ✅ Xóa giỏ hàng cho đơn COD (vì đơn này coi như thành công bước đầu)
      try {
        await clearCartService();
      } catch (error) {
        console.error("Cart clear failed:", error);
      }
      localStorage.setItem("cart", JSON.stringify([]));
      window.dispatchEvent(new Event("storage"));
      setTimeout(
        () => navigate("/order-success", { state: { order: order } }),
        2200,
      );
    } catch (error) {
      showToast(error.message || "Order failed");
      setPlacing(false);
    }
  };

  if (success)
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-6">
        <div className="text-center max-w-sm animate-pulse">
          <FiCheck size={40} className="text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-semibold mb-2">Order Successful!</h2>
          <p className="text-stone-400">Redirecting...</p>
        </div>
      </div>
    );

  return (
    <div className="min-h-screen bg-white text-stone-800 font-sans">
      <div className="border-b border-stone-100 px-6 py-4 flex items-center justify-between max-w-5xl mx-auto">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-stone-400 hover:text-stone-800 text-sm"
        >
          <FiArrowLeft size={14} /> Back
        </button>
        <p className="text-[11px] text-stone-400 tracking-widest uppercase font-medium">
          Checkout
        </p>
        <div className="w-16" />
      </div>

      <form
        onSubmit={handlePlaceOrder}
        className="max-w-5xl mx-auto px-6 py-10 grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-10"
      >
        <div className="space-y-8">
          <div className="bg-white border border-stone-100 rounded-2xl p-6 shadow-sm">
            <h2 className="font-semibold text-lg mb-6 flex items-center gap-2">
              <span className="w-6 h-6 bg-black text-white rounded-full flex items-center justify-center text-xs">
                1
              </span>
              Shipping Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <Field label="Full Name" required icon={FiUser}>
                <input
                  type="text"
                  name="fullName"
                  required
                  value={formData.fullName}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl"
                />
              </Field>
              <Field label="Phone Number" required icon={FiPhone}>
                <input
                  type="tel"
                  name="phone"
                  inputMode="numeric"
                  required
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl"
                />
              </Field>
              <Field label="City / Province" required icon={FiMapPin}>
                <select
                  name="city"
                  required
                  value={formData.city || ""}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl"
                >
                  <option value="">Select City/Province</option>
                  {southernCities.map((c) => (
                    <option key={c.name} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Address" required icon={FiMapPin}>
                <input
                  type="text"
                  name="address"
                  required
                  value={formData.address}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl"
                />
              </Field>
            </div>
          </div>

          <div className="bg-white border border-stone-100 rounded-2xl p-6 shadow-sm">
            <h2 className="font-semibold text-lg mb-6 flex items-center gap-2">
              <span className="w-6 h-6 bg-black text-white rounded-full flex items-center justify-center text-xs">
                2
              </span>
              Payment
            </h2>

            {cartItems.some((i) => i.isPreorder) && (
              <div className="mb-6 animate-fadeIn">
                <p className="text-[10px] text-indigo-500 tracking-[0.2em] font-bold uppercase mb-3 px-1">
                  Pre-order Options
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() =>
                      setFormData((p) => ({ ...p, depositType: "FULL" }))
                    }
                    className={`py-3 px-4 rounded-xl border-2 text-sm font-semibold transition-all ${
                      formData.depositType !== "PARTIAL"
                        ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                        : "border-stone-100 text-stone-400"
                    }`}
                  >
                    Full Payment (100%)
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setFormData((p) => ({ ...p, depositType: "PARTIAL" }))
                    }
                    className={`py-3 px-4 rounded-xl border-2 text-sm font-semibold transition-all ${
                      formData.depositType === "PARTIAL"
                        ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                        : "border-stone-100 text-stone-400"
                    }`}
                  >
                    Deposit (50%)
                  </button>
                </div>
                <p className="mt-3 text-[11px] text-stone-400 px-1 italic">
                  * Pre-orders require VNPay payment.
                </p>
              </div>
            )}

            <div className="space-y-3">
              {/* COD */}
              {!cartItems.some((i) => i.isPreorder) && (
                <div
                  onClick={() => setPaymentMethod("COD")}
                  className={`p-4 border rounded-xl flex items-center gap-3 cursor-pointer transition-all ${
                    paymentMethod === "COD"
                      ? "border-black bg-stone-50"
                      : "border-stone-200 hover:border-stone-300"
                  }`}
                >
                  <FiTruck
                    className={
                      paymentMethod === "COD" ? "text-black" : "text-stone-400"
                    }
                  />
                  <div>
                    <p
                      className={`text-sm font-medium ${paymentMethod === "COD" ? "text-black" : "text-stone-500"}`}
                    >
                      Cash on Delivery (COD)
                    </p>
                  </div>
                </div>
              )}

              {/* VNPay */}
              <div
                onClick={() => setPaymentMethod("VNPAY")}
                className={`p-4 border rounded-xl flex items-center gap-3 cursor-pointer transition-all ${
                  paymentMethod === "VNPAY"
                    ? "border-black bg-stone-50"
                    : "border-stone-200 hover:border-stone-300"
                }`}
              >
                <FiCreditCard
                  className={
                    paymentMethod === "VNPAY"
                      ? "text-indigo-600"
                      : "text-stone-400"
                  }
                />
                <div>
                  <p
                    className={`text-sm font-medium ${paymentMethod === "VNPAY" ? "text-black" : "text-stone-500"}`}
                  >
                    VNPay Payment
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white border border-stone-100 rounded-2xl p-6 shadow-sm h-fit sticky top-6">
          <h3 className="font-semibold mb-5">
            Your Order ({cartItems.length})
          </h3>
          <div className="space-y-4 mb-6 max-h-60 overflow-y-auto pr-2">
            {cartItems.map((item) => (
              <div key={item.cartItemId} className="flex gap-3 text-sm">
                <img
                  src={item.image}
                  className="w-12 h-12 rounded-lg object-cover border border-stone-100"
                />
                <div className="flex-1 min-w-0 flex justify-between">
                  <div>
                    <p className="font-medium truncate pr-2">{item.name}</p>
                    <p className="text-xs text-stone-400">
                      Qty: {item.quantity} · {item.price.toLocaleString()}₫
                    </p>
                    {item.isPreorder && (
                      <p className="text-[10px] text-amber-600 font-bold mt-0.5 tracking-tight uppercase">
                        Pre-order item
                      </p>
                    )}
                    {item.isLens && !item.isPreorder && (
                      <p className="text-[10px] text-indigo-500 font-bold mt-0.5 tracking-tight uppercase">
                        Prescription Order
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      removeItem(
                        item.productId,
                        item.variant?.variantId,
                        item.cartItemId,
                      )
                    }
                    className="text-stone-400 hover:text-red-500 p-1 -mt-1 -mr-2 h-fit"
                    title="Remove"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
          <div className="border-t border-stone-100 pt-4 space-y-2 text-sm">
            <div className="flex justify-between text-stone-500">
              <span>Subtotal</span>
              <span>{total.toLocaleString()}₫</span>
            </div>
            <div className="flex justify-between text-stone-500">
              <span>Shipping Fee</span>
              <span>{shippingFee.toLocaleString()}₫</span>
            </div>
            <div className="flex justify-between font-bold text-lg pt-2 border-t border-stone-100">
              <span>Total</span>
              <span className="text-blue-600">
                {totalWithShipping.toLocaleString()}₫
              </span>
            </div>
            {cartItems.some((i) => i.isPreorder) &&
              formData.depositType === "PARTIAL" && (
                <div className="flex justify-between font-bold text-lg pt-2 border-t border-indigo-100 bg-indigo-50/50 -mx-6 px-6 py-2 mt-2">
                  <span className="text-indigo-600 text-sm">
                    Pay Today (Items + Shipping)
                  </span>
                  <span className="text-indigo-600">
                    {(
                      cartItems
                        .filter((i) => !i.isPreorder)
                        .reduce((acc, i) => acc + i.price * i.quantity, 0) +
                      cartItems
                        .filter((i) => i.isPreorder)
                        .reduce((acc, i) => acc + i.price * i.quantity, 0) /
                        2 +
                      shippingFee
                    ).toLocaleString()}
                    ₫
                  </span>
                </div>
              )}
          </div>
          <button
            type="submit"
            disabled={placing}
            className="w-full mt-6 bg-black text-white py-4 rounded-full font-bold hover:bg-stone-800 transition-colors disabled:opacity-50 shadow-lg"
          >
            {placing ? "Processing..." : "Place Order"}
          </button>
        </div>
      </form>

      {/* ── PAYING OVERLAY ── */}
      <AnimatePresence>
        {waitingPayment && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-100 bg-black/60 backdrop-blur-sm flex items-center justify-center p-6 text-center"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl"
            >
              <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <FiCreditCard size={32} className="animate-pulse" />
              </div>
              <h3 className="text-xl font-bold text-stone-900 mb-2">
                Awaiting Payment
              </h3>
              <p className="text-sm text-stone-500 mb-8 leading-relaxed">
                A secure payment window has been opened. Please complete your
                transaction there.
              </p>

              <div className="space-y-3">
                <div className="flex items-center justify-center gap-3 text-blue-600 font-bold text-xs uppercase tracking-widest bg-blue-50 py-3 rounded-2xl">
                  <div className="w-4 h-4 border-2 border-blue-600/30 border-t-blue-600 rounded-full animate-spin" />
                  Waiting for response...
                </div>

                <button
                  onClick={() => paymentWindow?.focus()}
                  className="w-full py-4 text-stone-400 hover:text-stone-900 text-xs font-bold uppercase tracking-widest transition-colors"
                >
                  Click here if window is hidden
                </button>

                <button
                  onClick={async () => {
                    paymentWindow?.close();
                    await cancelPendingOrderAndExit(
                      pendingOrderId,
                      "Payment cancelled.",
                    );
                  }}
                  className="w-full py-3 rounded-2xl border border-stone-200 text-stone-600 hover:bg-stone-50 text-xs font-bold uppercase tracking-widest transition-colors"
                >
                  I cancelled payment
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <Toast message={toast.message} visible={toast.visible} />
    </div>
  );
}

export default CheckoutPage;
