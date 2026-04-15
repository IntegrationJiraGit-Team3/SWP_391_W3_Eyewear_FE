import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import {
  FiShoppingBag,
  FiHeart,
  FiArrowLeft,
  FiCheck,
  FiChevronLeft,
  FiChevronRight,
  FiChevronDown,
  FiStar,
  FiEye,
  FiCalendar,
  FiMapPin,
} from "react-icons/fi";
import { formatPrice } from "../utils/formatPrice.js";
import { getProductById } from "../services/productService.js";
import { addToCartService } from "../services/cartService";
import { getReviewsByProduct, createReview } from "../api/reviewApi";
import { historyOrderApi } from "../api/orderApi";
import { useToast } from "../../context/ToastContext";

/* ─── Star Rating Display ─── */
function StarRow({ rating, size = 14 }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <FiStar
          key={s}
          size={size}
          fill={s <= rating ? "#f59e0b" : "none"}
          className={s <= rating ? "text-amber-400" : "text-stone-200"}
        />
      ))}
    </div>
  );
}

/* ─── MAIN ─── */
function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [activeImg, setActiveImg] = useState(0);
  const [activeColor, setActiveColor] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [wished, setWished] = useState(false);
  const { showToast } = useToast();
  const [token] = useState(localStorage.getItem("token"));
  const [lensOption, setLensOption] = useState(null);
  const [prescription, setPrescription] = useState({
    eyes: {
      right: { sphere: "", cylinder: "", axis: "", add: "" },
      left: { sphere: "", cylinder: "", axis: "", add: "" },
    },
    pd: "",
  });

  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState("");
  const [eligibleOrderId, setEligibleOrderId] = useState(null);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [checkingEligibility, setCheckingEligibility] = useState(true);

  const [productData, setProductData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState([]);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [pData] = await Promise.all([getProductById(id)]);
        setProductData(pData);
        await Promise.all([reloadReviews(), checkReviewEligibility()]);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchInitialData();
  }, [id]);

  const checkReviewEligibility = async () => {
    const currentToken = localStorage.getItem("token");
    if (!currentToken) {
      setCheckingEligibility(false);
      return;
    }
    try {
      const res = await historyOrderApi();
      const orders = res?.data?.data || res?.data || [];
      const match = orders.find(
        (o) =>
          (o?.status?.toUpperCase() === "DELIVERED" ||
            o?.status?.toUpperCase() === "COMPLETED") &&
          (o?.orderItems || o?.items)?.some(
            (item) =>
              (item.productId || item.product?.productId) === parseInt(id),
          ),
      );
      if (match) setEligibleOrderId(match.orderId || match.id);
    } catch (err) {
      if (err.response?.status !== 403)
        console.error("Eligibility check error:", err);
    } finally {
      setCheckingEligibility(false);
    }
  };

  const reloadReviews = async () => {
    try {
      const rData = await getReviewsByProduct(id);
      setReviews(rData?.data?.data || []);
    } catch (err) {
      setReviews([]);
      console.error("Failed to load product details:", err);
    }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!eligibleOrderId || !newComment.trim()) {
      showToast("Please enter a comment");
      return;
    }
    setSubmittingReview(true);
    try {
      await createReview({
        orderId: eligibleOrderId,
        productId: parseInt(id),
        rating: newRating,
        comment: newComment,
      });
      showToast("Review submitted successfully!");
      setNewComment("");
      setNewRating(5);
      await reloadReviews();
      setEligibleOrderId(null);
    } catch (err) {
      showToast(err.response?.data?.message || "Error submitting review");
    } finally {
      setSubmittingReview(false);
    }
  };

  const showToastWrapper = (msg, type) => showToast(msg, type);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-full border-2 border-stone-200 border-t-stone-800 animate-spin" />
          <p className="text-stone-400 text-sm">Loading product...</p>
        </div>
      </div>
    );
  }

  if (!productData) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 rounded-2xl bg-stone-50 flex items-center justify-center mb-6 border border-stone-100">
          <FiShoppingBag size={28} className="text-stone-300" />
        </div>
        <h2 className="text-xl font-semibold text-stone-800 mb-2">
          Product not found
        </h2>
        <p className="text-stone-400 text-sm mb-8 max-w-xs leading-relaxed">
          The product may have been removed or the ID is incorrect.
        </p>
        <button
          onClick={() => navigate("/shop")}
          className="px-7 py-2.5 bg-blue-600 text-white rounded-full text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          Back to Shop
        </button>
      </div>
    );
  }

  // FIX LỖI: Lấy giá trị category đúng chuẩn, chống lỗi undefined
  const product = {
    id: productData.id || productData.productId,
    name: productData.name || "No name",
    price: formatPrice(
      productData.price || productData.variants?.[0]?.price || 0,
    ),
    priceNum: productData.price || productData.variants?.[0]?.price || 0,
    category: (
      productData.category ||
      productData.productType ||
      ""
    ).toLowerCase(),
    description: productData.description,
    images: productData.variants?.map((v) => v.imageUrl) || [
      "https://via.placeholder.com/500",
    ],
    colors: productData.variants?.map((v) => v.color) || [],
    specs: [
      { label: "Brand", value: productData.brand },
      {
        label: "Category",
        value: productData.category || productData.productType,
      },
      {
        label: "Stock",
        value: productData.variants?.reduce(
          (sum, v) => sum + v.stockQuantity,
          0,
        ),
      },
      {
        label: "Prescription Support",
        value: productData.isPrescriptionSupported ? "Yes" : "No",
      },
    ],
  };

  const selectedVariantUI = productData.variants?.[activeColor];
  let stockText = "",
    stockColor = "",
    isOutOfStock = false;

  if (!selectedVariantUI || selectedVariantUI.stockQuantity === 0) {
    stockText = "Out of stock · Pre-order available";
    stockColor = "text-red-500";
    isOutOfStock = true;
  } else if (selectedVariantUI.stockQuantity <= 20) {
    stockText = `Only ${selectedVariantUI.stockQuantity} items left`;
    stockColor = "text-blue-500";
  } else {
    stockText = `${selectedVariantUI.stockQuantity} items in stock`;
    stockColor = "text-emerald-600";
  }

  const maxStock = selectedVariantUI?.stockQuantity || 0;

  const handleAddToCart = async () => {
    const currentUser =
      localStorage.getItem("currentUser") || localStorage.getItem("token");
    if (!currentUser) {
      showToast("Please login to add item to cart.");
      const from = `${location.pathname}${location.search}${location.hash}`;
      navigate("/login", { state: { from } });
      return;
    }

    const productCat = (
      productData.category ||
      productData.productType ||
      ""
    ).toLowerCase();
    const selectedVariant = productData.variants[activeColor];
    if (productCat === "frame") {
      // Go directly to prescription page
      navigate(
        `/prescription/${product.id}?variantId=${selectedVariant.variantId}&quantity=${quantity}`,
      );
      return;
    }

    // FIX LỖI: Bắt buộc chọn tuỳ chọn nếu mua tròng kính
    if (productCat === "lens" && !lensOption) {
      showToast("Please select a prescription entry method!");
      return;
    }

    let cart;
    try {
      cart = JSON.parse(localStorage.getItem("cart")) || [];
    } catch {
      cart = [];
    }

    if (!selectedVariant) {
      showToast("Please select a color");
      return;
    }

    // FIX LỖI: Cập nhật lấy giá đúng theo Variant, chống lỗi undefined / price = 0
    const finalPrice = selectedVariant.price || productData.price || 0;

    const cartItem = {
      productId: productData.id || productData.productId,
      variantId: selectedVariant.variantId,
      name: productData.name,
      productName: productData.name,
      brand: productData.brand,
      price: finalPrice,
      unitPrice: finalPrice,
      imageUrl:
        selectedVariant.imageUrl ||
        productData.imageUrl ||
        productData.img ||
        "",
      quantity,
      variant: selectedVariant,
      variantColor: selectedVariant.color,
      variantSize: selectedVariant.frameSize,
      isPreorder: isOutOfStock,
    };

    const idx = cart.findIndex(
      (item) => item.variant?.variantId === selectedVariant.variantId,
    );

    if (idx !== -1) cart[idx].quantity += quantity;
    else cart.push(cartItem);

    localStorage.setItem("cart", JSON.stringify(cart));
    window.dispatchEvent(new Event("storage"));

    try {
      // Prepare prescription payload if manual entry is selected
      const isLens = lensOption === "manual";

      const apiRes = await addToCartService({
        productId: productData.id || productData.productId,
        variantId: selectedVariant.variantId,
        quantity,
        isLens,
        sphLeft: isLens ? parseFloat(prescription.eyes.left.sphere) || 0 : null,
        sphRight: isLens
          ? parseFloat(prescription.eyes.right.sphere) || 0
          : null,
        cylLeft: isLens
          ? parseFloat(prescription.eyes.left.cylinder) || 0
          : null,
        cylRight: isLens
          ? parseFloat(prescription.eyes.right.cylinder) || 0
          : null,
        axisLeft: isLens ? parseInt(prescription.eyes.left.axis) || 0 : null,
        axisRight: isLens ? parseInt(prescription.eyes.right.axis) || 0 : null,
        addLeft: isLens ? parseFloat(prescription.eyes.left.add) || 0 : null,
        addRight: isLens ? parseFloat(prescription.eyes.right.add) || 0 : null,
        pd: isLens ? parseFloat(prescription.pd) || 0 : null,
      });

      if (apiRes) {
        // Save preorder state locally to bypass backend strict API validation rejection (500)
        if (isOutOfStock) {
          try {
            const preorders =
              JSON.parse(localStorage.getItem("frontend_preorders")) || {};
            preorders[selectedVariant.variantId] = true;
            localStorage.setItem(
              "frontend_preorders",
              JSON.stringify(preorders),
            );
          } catch {
            // ignore
          }
        }
        showToast(`Added ${quantity} items to cart!`);
      } else {
        showToast("Error adding to cart");
      }
    } catch {
      // Keep local cart fallback for transient API errors of logged-in users.
      showToast(`Added ${quantity} items to cart!`);
    }
  };

  const prevImg = () =>
    setActiveImg((p) => (p === 0 ? product.images.length - 1 : p - 1));
  const nextImg = () =>
    setActiveImg((p) => (p === product.images.length - 1 ? 0 : p + 1));

  /* average rating */
  const avgRating = reviews.length
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : null;

  return (
    <>
      <style>{`
        @keyframes slideUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        @keyframes fadeIn  { from{opacity:0} to{opacity:1} }
        @keyframes imgIn   { from{opacity:0;transform:scale(1.03)} to{opacity:1;transform:scale(1)} }
        .thumb-ring { box-shadow: 0 0 0 2px #1c1917; }
        .color-pill-active {  background: #1c1917; color: #fff; border-color: #1c1917; box-shadow: 0 0 0 2px rgba(28,25,23,0.2); transform: scale(1.05); }
        .color-pill { border: 1.5px solid #e7e5e4; padding: 6px 16px; border-radius: 99px; font-size:13px; font-weight:500; transition: all .15s; cursor:pointer; background: white; color: #44403c; }
        .color-pill:hover { border-color: #a8a29e; }
        input[type=number]::-webkit-inner-spin-button, input[type=number]::-webkit-outer-spin-button { -webkit-appearance: none; }
        input[type=number] { -moz-appearance: textfield; }
      `}</style>

      <div
        className="min-h-screen bg-white text-stone-800"
        style={{
          fontFamily:
            "'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif",
        }}
      >
        {/* ── Breadcrumb ── */}
        <div className="border-b border-stone-100 sticky top-0 bg-white/95 backdrop-blur-sm z-30">
          <div className="max-w-6xl mx-auto px-6 py-3.5 flex items-center justify-between">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-stone-400 hover:text-stone-800 text-sm transition-colors group"
            >
              <FiArrowLeft
                size={15}
                className="group-hover:-translate-x-0.5 transition-transform"
              />
              <span>Back</span>
            </button>
            <p className="text-[11px] text-stone-300 uppercase tracking-[0.2em] font-medium hidden sm:block">
              {product.category}
            </p>
            <div className="w-16" />
          </div>
        </div>

        {/* ── Main grid ── */}
        <div className="max-w-6xl mx-auto px-6 py-10 lg:py-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-20">
            {/* ── LEFT: Images ── */}
            <div className="space-y-3" style={{ animation: "fadeIn .5s ease" }}>
              {/* Main image */}
              <div className="relative aspect-square overflow-hidden rounded-3xl bg-white group border border-stone-100 p-4 shadow-sm">
                <img
                  key={activeImg}
                  src={product.images[activeImg] || "https://placehold.co/500"}
                  alt={product.name}
                  className="w-full h-full object-contain mix-blend-multiply"
                  style={{ animation: "imgIn .35s ease" }}
                />
                {/* Image counter pill */}
                {product.images.length > 1 && (
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/40 text-white text-xs px-3 py-1 rounded-full backdrop-blur-sm font-medium tabular-nums">
                    {activeImg + 1} / {product.images.length}
                  </div>
                )}
                {/* Nav arrows */}
                {product.images.length > 1 && (
                  <>
                    <button
                      onClick={prevImg}
                      className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 text-stone-700 flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 hover:bg-white border border-stone-100 shadow-sm"
                    >
                      <FiChevronLeft size={16} />
                    </button>
                    <button
                      onClick={nextImg}
                      className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 text-stone-700 flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 hover:bg-white border border-stone-100 shadow-sm"
                    >
                      <FiChevronRight size={16} />
                    </button>
                  </>
                )}
              </div>

              {/* Thumbnails */}
              {product.images.length > 1 && (
                <div className="flex gap-2.5 overflow-x-auto pb-1">
                  {product.images.map((img, i) => (
                    <button
                      key={i}
                      onClick={() => setActiveImg(i)}
                      className={`w-[72px] h-[72px] flex-shrink-0 rounded-xl overflow-hidden border-2 bg-white p-1 transition-all ${
                        i === activeImg
                          ? "thumb-ring border-stone-900"
                          : "border-stone-100 hover:border-stone-300"
                      }`}
                    >
                      <img
                        src={img}
                        alt=""
                        className="w-full h-full object-contain mix-blend-multiply"
                      />
                    </button>
                  ))}
                </div>
              )}

              {/* Rating summary — only if there are reviews */}
              {reviews.length > 0 && (
                <div className="flex items-center gap-3 px-4 py-3 bg-stone-50 rounded-2xl border border-stone-100">
                  <span className="text-2xl font-semibold text-stone-900 tabular-nums">
                    {avgRating}
                  </span>
                  <div>
                    <StarRow
                      rating={Math.round(parseFloat(avgRating))}
                      size={14}
                    />
                    <p className="text-xs text-stone-400 mt-0.5">
                      {reviews.length} reviews
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* ── RIGHT: Info ── */}
            <div
              className="flex flex-col gap-6"
              style={{ animation: "slideUp .5s ease" }}
            >
              {/* Category + name + price */}
              <div className="space-y-2">
                <p className="text-[10px] text-stone-400 tracking-[0.25em] uppercase font-semibold">
                  {product.category}
                </p>
                <h1 className="text-2xl md:text-3xl font-semibold text-stone-900 leading-snug tracking-tight">
                  {product.name}
                </h1>
                <div className="flex items-baseline gap-3 pt-1">
                  <span className="text-2xl font-bold text-blue-600">
                    {product.price}
                  </span>
                </div>
              </div>

              <div className="h-px bg-stone-100" />

              {/* Description */}
              <p className="text-stone-500 text-sm leading-relaxed">
                {product.description}
              </p>

              {/* Color selector */}
              <div>
                <p className="text-[10px] text-stone-400 tracking-[0.2em] uppercase font-semibold mb-3">
                  Color ·{" "}
                  <span className="text-stone-700 normal-case tracking-normal font-medium">
                    {product.colors[activeColor]}
                  </span>
                </p>
                <div className="flex items-center gap-2 flex-wrap">
                  {productData.variants.map((v, i) => (
                    <button
                      key={v.variantId}
                      onClick={() => setActiveColor(i)}
                      className={`color-pill ${i === activeColor ? "color-pill-active" : ""}`}
                    >
                      {v.color}
                    </button>
                  ))}
                </div>
                {selectedVariantUI && (
                  <p
                    className={`mt-2.5 text-xs font-medium flex items-center gap-1.5 ${stockColor}`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full inline-block ${isOutOfStock ? "bg-red-400" : selectedVariantUI.stockQuantity <= 20 ? "bg-blue-400" : "bg-emerald-500"}`}
                    />
                    {stockText}
                  </p>
                )}
              </div>

              {/* Quantity */}
              <div>
                <p className="text-[10px] text-stone-400 tracking-[0.2em] uppercase font-semibold mb-3">
                  Quantity
                </p>
                <div className="flex items-center border border-stone-200 rounded-full w-fit overflow-hidden bg-stone-50">
                  <button
                    disabled={quantity <= 1}
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-10 h-10 flex items-center justify-center text-stone-500 hover:text-stone-900 hover:bg-stone-100 transition-colors text-xl font-light select-none disabled:opacity-50"
                  >
                    −
                  </button>
                  <span className="w-10 text-center text-sm font-semibold text-stone-900 tabular-nums select-none">
                    {quantity}
                  </span>
                  <button
                    disabled={quantity > maxStock - 1}
                    onClick={() => setQuantity(quantity + 1)}
                    className="w-10 h-10 flex items-center justify-center text-stone-500 hover:text-stone-900 hover:bg-stone-100 transition-colors text-xl font-light select-none disabled:opacity-50"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Lens options */}
              {product.category === "lens" && (
                <div>
                  <LensPurchaseOptions
                    lensOption={lensOption}
                    setLensOption={setLensOption}
                    prescription={prescription}
                    setPrescription={setPrescription}
                  />
                </div>
              )}

              {/* CTA */}
              <div className="flex gap-3 pt-1">
                <button
                  onClick={handleAddToCart}
                  className="flex-1 flex items-center justify-center gap-2.5 bg-blue-600 hover:bg-blue-700 text-white py-3.5 rounded-full text-sm font-semibold tracking-wide transition-all active:scale-[0.98] duration-150"
                >
                  <FiShoppingBag size={16} />
                  {isOutOfStock ? "Pre-order Now" : "Add to Cart"}
                </button>
                <button
                  onClick={() => setWished((p) => !p)}
                  className={`w-12 h-12 flex items-center justify-center rounded-full border-2 transition-all active:scale-95 duration-150 ${
                    wished
                      ? "bg-red-50 border-red-300 text-red-500"
                      : "bg-white border-stone-200 text-stone-400 hover:border-stone-300 hover:text-stone-600"
                  }`}
                >
                  <FiHeart size={16} className={wished ? "fill-red-500" : ""} />
                </button>
              </div>

              {/* Specs */}
              <div className="h-px bg-stone-100" />
              <div className="grid grid-cols-2 gap-2.5">
                {product.specs.map((spec, i) => (
                  <div
                    key={i}
                    className="bg-stone-50 rounded-xl px-4 py-3 border border-stone-100"
                  >
                    <p className="text-[10px] text-stone-400 uppercase tracking-wider font-semibold mb-1">
                      {spec.label}
                    </p>
                    <p className="text-sm font-semibold text-stone-800 truncate">
                      {spec.value ?? "—"}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── Reviews ── */}
        <div className="border-t border-stone-100 mt-4">
          <div className="max-w-6xl mx-auto px-6 py-14">
            {/* Header row */}
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-8 mb-10">
              <div>
                <h2 className="text-xl font-semibold text-stone-900">
                  Product Reviews
                </h2>
                <p className="text-stone-400 text-sm mt-1">
                  {reviews.length > 0
                    ? `${reviews.length} customer reviews`
                    : "No reviews yet"}
                </p>
                {avgRating && (
                  <div className="flex items-center gap-2 mt-2">
                    <StarRow
                      rating={Math.round(parseFloat(avgRating))}
                      size={15}
                    />
                    <span className="text-sm font-semibold text-stone-700">
                      {avgRating} / 5
                    </span>
                  </div>
                )}
              </div>

              {/* Write review / login prompt */}
              {token ? (
                eligibleOrderId ? (
                  <div className="bg-blue-50 rounded-2xl p-5 border border-blue-100 w-full md:max-w-sm">
                    <p className="text-sm font-semibold text-stone-800 mb-4 flex items-center gap-2">
                      <FiStar
                        className="text-blue-600 fill-blue-600"
                        size={14}
                      />
                      Write your review
                    </p>
                    <form onSubmit={handleReviewSubmit} className="space-y-3">
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setNewRating(star)}
                            className="transition-transform active:scale-90"
                          >
                            <FiStar
                              size={20}
                              fill={star <= newRating ? "#f59e0b" : "none"}
                              className={
                                star <= newRating
                                  ? "text-amber-400"
                                  : "text-stone-200"
                              }
                            />
                          </button>
                        ))}
                      </div>
                      <textarea
                        placeholder="Share your experience..."
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        className="w-full px-3.5 py-2.5 text-sm border border-blue-200 rounded-xl focus:ring-1 focus:ring-blue-400 focus:outline-none min-h-[90px] bg-white resize-none text-stone-700 placeholder:text-stone-300"
                        required
                      />
                      <button
                        disabled={submittingReview}
                        type="submit"
                        className="w-full bg-blue-600 text-white text-sm font-medium py-2.5 rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50"
                      >
                        {submittingReview ? "Sending..." : "Submit Review"}
                      </button>
                    </form>
                  </div>
                ) : checkingEligibility ? (
                  <div className="bg-stone-50 rounded-2xl px-5 py-4 border border-stone-100 flex items-center gap-2 text-xs text-stone-400">
                    <div className="w-3.5 h-3.5 rounded-full border-2 border-stone-300 border-t-stone-500 animate-spin" />
                    Checking review eligibility...
                  </div>
                ) : (
                  <div className="bg-stone-50 rounded-2xl p-5 border border-stone-100 text-center md:max-w-xs">
                    <p className="text-xs text-stone-400 leading-relaxed italic">
                      You can only review products you have successfully
                      purchased and received.
                    </p>
                  </div>
                )
              ) : (
                <div className="bg-stone-50 rounded-2xl p-5 border border-stone-100 text-center md:max-w-xs">
                  <p className="text-xs text-stone-500 mb-3">
                    Login to review this product
                  </p>
                  <button
                    onClick={() => {
                      const from = `${location.pathname}${location.search}${location.hash}`;
                      navigate("/login", { state: { from } });
                    }}
                    className="text-white bg-blue-600 px-5 py-2 rounded-full text-xs font-medium hover:bg-blue-700 transition-colors"
                  >
                    Login
                  </button>
                </div>
              )}
            </div>

            {/* Review cards */}
            {reviews.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {reviews.map((review) => (
                  <div
                    key={review.reviewId}
                    className="bg-stone-50 border border-stone-100 rounded-2xl p-5 hover:border-stone-200 transition-colors"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-stone-200 flex items-center justify-center text-xs font-semibold text-stone-600 flex-shrink-0">
                          {review.userName?.charAt(0)?.toUpperCase() || "?"}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-stone-800 leading-tight">
                            {review.userName}
                          </p>
                          <StarRow rating={review.rating} size={12} />
                        </div>
                      </div>
                      <p className="text-[10px] text-stone-300 font-medium">
                        {new Date(review.reviewDate).toLocaleDateString(
                          "en-US",
                        )}
                      </p>
                    </div>
                    <p className="text-sm text-stone-500 leading-relaxed pl-12">
                      {review.comment}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-16 text-center border-2 border-dashed border-stone-100 rounded-2xl">
                <div className="w-12 h-12 rounded-2xl bg-stone-50 flex items-center justify-center mx-auto mb-3 border border-stone-100">
                  <FiStar size={20} className="text-stone-200" />
                </div>
                <p className="text-stone-400 text-sm">
                  No reviews yet for this product
                </p>
              </div>
            )}
          </div>
        </div>

        {/* ── CTA Strip ── */}
        <section className="relative overflow-hidden bg-blue-950 py-20">
          <div className="absolute -top-32 -right-32 w-[400px] h-[400px] rounded-full border border-white/[0.03]" />
          <div className="absolute -bottom-32 -left-32 w-[400px] h-[400px] rounded-full border border-white/[0.03]" />
          <div className="relative max-w-xl mx-auto text-center px-6 z-10">
            <p className="text-blue-300/70 text-[10px] tracking-[0.35em] uppercase font-semibold mb-4">
              Need more advice?
            </p>
            <h2 className="text-3xl font-semibold text-white mb-3 tracking-tight">
              Book a <span className="text-blue-300">free</span> eye exam
            </h2>
            <p className="text-stone-400 text-sm mb-8 leading-relaxed max-w-xs mx-auto">
              Professional technicians are ready to advise and measure your eyes
              at the nearest store.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-3">
              <button className="flex items-center justify-center gap-2 px-7 py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm rounded-full transition-all active:scale-95">
                <FiCalendar size={15} />
                Book Now
              </button>
              <button className="flex items-center justify-center gap-2 px-7 py-3 border border-stone-700 hover:border-stone-500 text-stone-400 hover:text-white font-medium text-sm rounded-full transition-all active:scale-95">
                <FiMapPin size={15} />
                Find a Store
              </button>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}

/* ─── Lens purchase options ─── */
function LensPurchaseOptions({
  lensOption,
  setLensOption,
  prescription,
  setPrescription,
}) {
  const handleEye = (side, field, value) => {
    setPrescription((prev) => ({
      ...prev,
      eyes: { ...prev.eyes, [side]: { ...prev.eyes[side], [field]: value } },
    }));
  };

  return (
    <div className="space-y-2.5">
      {/* Option 1 — Manual */}
      <button
        onClick={() => setLensOption(lensOption === "manual" ? null : "manual")}
        className={`w-full flex items-center gap-3 p-4 rounded-2xl border-2 transition-all text-left ${
          lensOption === "manual"
            ? "border-emerald-400 bg-emerald-50"
            : "border-stone-200 hover:border-emerald-300 bg-white"
        }`}
      >
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${
            lensOption === "manual" ? "bg-emerald-100" : "bg-stone-100"
          }`}
        >
          <FiEye
            size={17}
            className={
              lensOption === "manual" ? "text-emerald-600" : "text-stone-500"
            }
          />
        </div>
        <div className="flex-1 text-left">
          <p className="font-semibold text-sm text-stone-900">
            Manual Prescription Entry
          </p>
          <p
            className={`text-[11px] mt-0.5 ${lensOption === "manual" ? "text-emerald-600" : "text-stone-400"}`}
          >
            Enter SPH · CYL · AXIS · ADD
          </p>
        </div>
        <FiChevronDown
          size={15}
          className={`text-stone-300 transition-transform duration-200 ${lensOption === "manual" ? "rotate-180 text-emerald-400" : ""}`}
        />
      </button>

      {/* Prescription form */}
      {lensOption === "manual" && (
        <div
          className="border-2 border-emerald-200 rounded-2xl overflow-hidden bg-white"
          style={{ animation: "slideUp .2s ease" }}
        >
          {/* Eye grid */}
          <div className="px-4 pt-4 pb-2">
            <table
              className="w-full"
              style={{
                tableLayout: "fixed",
                borderCollapse: "separate",
                borderSpacing: "0 6px",
              }}
            >
              <thead>
                <tr>
                  <th className="text-left text-[10px] font-semibold text-stone-400 uppercase tracking-wider pb-1 w-[16%]">
                    Eye
                  </th>
                  {["SPH", "CYL", "AXIS", "ADD"].map((h) => (
                    <th
                      key={h}
                      className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider pb-1 text-center"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  { side: "right", label: "Eye R" },
                  { side: "left", label: "Eye L" },
                ].map(({ side, label }) => (
                  <tr key={side}>
                    <td>
                      <span className="inline-block text-[11px] font-bold text-stone-500 uppercase bg-stone-100 px-2 py-1 rounded-md">
                        {label}
                      </span>
                    </td>
                    {["sphere", "cylinder", "axis", "add"].map((field) => (
                      <td key={field} className="px-1">
                        <input
                          type="number"
                          step={field === "axis" ? "1" : "0.25"}
                          value={prescription.eyes[side][field]}
                          onChange={(e) =>
                            handleEye(side, field, e.target.value)
                          }
                          placeholder="—"
                          className="w-full border border-stone-200 rounded-lg px-1 py-2 text-sm text-center font-mono bg-stone-50 focus:bg-white focus:border-emerald-400 focus:ring-1 focus:ring-emerald-200 focus:outline-none transition-all"
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Divider */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-stone-100" />
        <span className="text-[10px] text-stone-300 uppercase tracking-[0.2em] font-medium whitespace-nowrap">
          or
        </span>
        <div className="flex-1 h-px bg-stone-100" />
      </div>

      {/* Option 2 — No prescription */}
      <button
        onClick={() =>
          setLensOption(
            lensOption === "no-prescription" ? null : "no-prescription",
          )
        }
        className={`w-full flex items-center gap-3 p-4 rounded-2xl border-2 transition-all text-left ${
          lensOption === "no-prescription"
            ? "border-blue-700 bg-blue-600 text-white"
            : "border-stone-200 hover:border-blue-400 bg-white"
        }`}
      >
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
            lensOption === "no-prescription" ? "bg-white/10" : "bg-stone-100"
          }`}
        >
          <FiCheck
            size={17}
            className={
              lensOption === "no-prescription" ? "text-white" : "text-blue-500"
            }
            strokeWidth={2.5}
          />
        </div>
        <div>
          <p
            className={`font-semibold text-sm ${lensOption === "no-prescription" ? "text-white" : "text-stone-900"}`}
          >
            No Prescription
          </p>
          <p
            className={`text-[11px] mt-0.5 ${lensOption === "no-prescription" ? "text-stone-400" : "text-stone-400"}`}
          >
            Buy non-prescription glasses
          </p>
        </div>
      </button>

      {/* Confirmed label */}
      {lensOption && (
        <p className="text-xs text-stone-400 flex items-center gap-1.5 pl-1">
          <FiCheck size={11} className="text-emerald-500" strokeWidth={3} />
          Selected:{" "}
          <span className="font-semibold text-stone-700">
            {lensOption === "manual" ? "Manual Entry" : "Non-prescription"}
          </span>
        </p>
      )}
    </div>
  );
}

export default ProductDetailPage;
