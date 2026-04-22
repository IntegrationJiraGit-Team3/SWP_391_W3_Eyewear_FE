import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import {
  FiShoppingBag,
  FiHeart,
  FiArrowLeft,
  FiChevronLeft,
  FiChevronRight,
  FiStar,
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

  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState("");
  const [eligibleOrderId, setEligibleOrderId] = useState(null);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [checkingEligibility, setCheckingEligibility] = useState(true);

  const [selectedSize, setSelectedSize] = useState("");
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
              (item.productId || item.product?.productId) === parseInt(id, 10),
          ),
      );
      if (match) setEligibleOrderId(match.orderId || match.id);
    } catch (err) {
      if (err.response?.status !== 403) {
        console.error("Eligibility check error:", err);
      }
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
        productId: parseInt(id, 10),
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

  const availableSizes = useMemo(() => {
    return [
      ...new Set(
        (productData?.variants || [])
          .map((v) => (v.frameSize || "").trim())
          .filter(Boolean),
      ),
    ];
  }, [productData]);

  useEffect(() => {
    if (!selectedSize && availableSizes.length > 0) {
      setSelectedSize(availableSizes[0]);
    }
  }, [selectedSize, availableSizes]);

  const product = useMemo(() => {
    if (!productData) return null;

    return {
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
            (sum, v) => sum + (v.stockQuantity || 0),
            0,
          ),
        },
        {
          label: "Prescription Support",
          value: productData.isPrescriptionSupported ? "Yes" : "No",
        },
      ],
    };
  }, [productData]);

  const selectedColor = productData?.variants?.[activeColor]?.color;

  const selectedVariantUI = useMemo(() => {
    if (!productData?.variants?.length) return null;

    return (
      productData.variants.find(
        (v) =>
          v.color === selectedColor &&
          (v.frameSize || "").trim().toLowerCase() ===
            (selectedSize || "").trim().toLowerCase(),
      ) || productData.variants[activeColor]
    );
  }, [productData, activeColor, selectedColor, selectedSize]);

  let stockText = "";
  let stockColor = "";
  let isOutOfStock = false;

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

    const selectedVariant = selectedVariantUI;

    if (!selectedVariant) {
      showToast("Please select a variant");
      return;
    }

    if (productCat === "frame") {
      navigate(
        `/prescription/${product.id}?variantId=${selectedVariant.variantId}&quantity=${quantity}`,
      );
      return;
    }

    let cart;
    try {
      cart = JSON.parse(localStorage.getItem("cart")) || [];
    } catch {
      cart = [];
    }

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
      isLens: productCat === "lens",
    };

    const idx = cart.findIndex(
      (item) => item.variant?.variantId === selectedVariant.variantId,
    );

    if (idx !== -1) {
      cart[idx].quantity += quantity;
    } else {
      cart.push(cartItem);
    }

    localStorage.setItem("cart", JSON.stringify(cart));
    window.dispatchEvent(new Event("storage"));

    try {
      const apiRes = await addToCartService({
        productId: productData.id || productData.productId,
        variantId: selectedVariant.variantId,
        quantity,
        isLens: productCat === "lens",
        isPreorder: isOutOfStock,
      });

      if (apiRes) {
        // Save preorder state locally to bypass backend strict API validation rejection (500)
        // (Removed dangerous frontend_preorders logic. isPreorder is passed explicitly via API now)
        showToast(`Added ${quantity} items to cart!`);
      } else {
        showToast("Error adding to cart");
      }
    } catch {
      showToast(`Added ${quantity} items to cart!`);
    }
  };

  const prevImg = () =>
    setActiveImg((p) => (p === 0 ? product.images.length - 1 : p - 1));

  const nextImg = () =>
    setActiveImg((p) => (p === product.images.length - 1 ? 0 : p + 1));

  const avgRating = reviews.length
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : null;

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

  if (!productData || !product) {
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

  return (
    <>
      <style>{`
        @keyframes slideUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        @keyframes fadeIn  { from{opacity:0} to{opacity:1} }
        @keyframes imgIn   { from{opacity:0;transform:scale(1.03)} to{opacity:1;transform:scale(1)} }
        .thumb-ring { box-shadow: 0 0 0 2px #1c1917; }
        .color-pill-active { background: #1c1917; color: #fff; border-color: #1c1917; box-shadow: 0 0 0 2px rgba(28,25,23,0.2); transform: scale(1.05); }
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
              <div className="relative aspect-square overflow-hidden rounded-3xl bg-white group border border-stone-100 p-4 shadow-sm">
                <img
                  key={activeImg}
                  src={product.images[activeImg] || "https://placehold.co/500"}
                  alt={product.name}
                  className="w-full h-full object-contain mix-blend-multiply"
                  style={{ animation: "imgIn .35s ease" }}
                />

                {product.images.length > 1 && (
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/40 text-white text-xs px-3 py-1 rounded-full backdrop-blur-sm font-medium tabular-nums">
                    {activeImg + 1} / {product.images.length}
                  </div>
                )}

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
                      className={`color-pill ${
                        i === activeColor ? "color-pill-active" : ""
                      }`}
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
                      className={`w-1.5 h-1.5 rounded-full inline-block ${
                        isOutOfStock
                          ? "bg-red-400"
                          : selectedVariantUI.stockQuantity <= 20
                            ? "bg-blue-400"
                            : "bg-emerald-500"
                      }`}
                    />
                    {stockText}
                  </p>
                )}
              </div>

              {/* Size selector */}
              {availableSizes.length > 0 && (
                <div>
                  <p className="text-[10px] text-stone-400 tracking-[0.2em] uppercase font-semibold mb-3">
                    Size ·{" "}
                    <span className="text-stone-700 normal-case tracking-normal font-medium">
                      {selectedSize || "N/A"}
                    </span>
                  </p>

                  <div className="flex items-center gap-2 flex-wrap">
                    {availableSizes.map((size) => {
                      const lower = size.toLowerCase();
                      const label =
                        lower === "small"
                          ? "S"
                          : lower === "medium"
                            ? "M"
                            : lower === "large"
                              ? "L"
                              : size;

                      return (
                        <button
                          key={size}
                          onClick={() => setSelectedSize(size)}
                          className={`color-pill ${
                            selectedSize === size ? "color-pill-active" : ""
                          }`}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

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
                    disabled={!isOutOfStock && quantity >= maxStock}
                    onClick={() => setQuantity(quantity + 1)}
                    className="w-10 h-10 flex items-center justify-center text-stone-500 hover:text-stone-900 hover:bg-stone-100 transition-colors text-xl font-light select-none disabled:opacity-50"
                  >
                    +
                  </button>
                </div>
              </div>

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

export default ProductDetailPage;
