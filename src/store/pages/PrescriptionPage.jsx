import { useState, useEffect } from "react";
import {
  useParams,
  useNavigate,
  useSearchParams,
  useLocation,
} from "react-router-dom";
import HeaderBar from "../components/prescription/Headerbar";
import FrameSummary from "../components/prescription/FrameSummary";
import { getProductByIdApi } from "../api/productApi";
import { getAllProducts } from "../services/productService";
import { addToCartApi } from "../api/cartApi";
import { useToast } from "../../context/ToastContext";

export default function PrescriptionPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const variantIdFromUrl = searchParams.get("variantId");
  const quantityFromUrl = Math.max(
    1,
    parseInt(searchParams.get("quantity"), 10) || 1,
  );

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lenses, setLenses] = useState([]);
  const [loadingLenses, setLoadingLenses] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedVariantId, setSelectedVariantId] = useState(
    variantIdFromUrl || "",
  );

  const { showToast } = useToast();

  useEffect(() => {
    const currentUser =
      localStorage.getItem("currentUser") || localStorage.getItem("token");

    if (!currentUser) {
      const from = `${location.pathname}${location.search}${location.hash}`;
      navigate("/login", { state: { from } });
    }
  }, [location.hash, location.pathname, location.search, navigate]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        const frameData = await getProductByIdApi(id);
        setProduct(frameData);

        const defaultVariant =
          frameData?.variants?.find(
            (v) => String(v.variantId) === String(variantIdFromUrl),
          ) || frameData?.variants?.[0];

        if (defaultVariant?.variantId) {
          setSelectedVariantId(String(defaultVariant.variantId));
        }

        setLoadingLenses(true);

        const allProducts = await getAllProducts();
        const lensSummaries = allProducts.filter(
          (p) => (p.category || p.productType || "").toLowerCase() === "lens",
        );

        const lensDetails = await Promise.all(
          lensSummaries.map(async (lens) => {
            try {
              const lensId = lens.productId || lens.id;
              if (!lensId) return null;
              return await getProductByIdApi(lensId);
            } catch (error) {
              console.error("Failed to load lens detail:", lens, error);
              return null;
            }
          }),
        );

        const filteredLenses = lensDetails.filter(
          (lens) =>
            lens &&
            Array.isArray(lens.variants) &&
            lens.variants.length > 0 &&
            lens.variants.some((v) => v?.variantId),
        );

        setLenses(filteredLenses);
      } catch (err) {
        console.error("Error fetching info:", err);
        navigate("/shop");
      } finally {
        setLoading(false);
        setLoadingLenses(false);
      }
    };

    if (id) fetchData();
  }, [id, navigate, variantIdFromUrl]);

  const goCheckout = async (msg) => {
    showToast(msg);
    await new Promise((resolve) => setTimeout(resolve, 300));
    navigate("/checkout");
  };

  const getSelectedFrameVariant = () => {
    return (
      product?.variants?.find(
        (v) => String(v.variantId) === String(selectedVariantId),
      ) || product?.variants?.[0]
    );
  };

  const getSelectedLensVariant = (lens) => {
    if (!lens?.variants?.length) return null;

    return (
      lens.variants.find(
        (v) => v?.variantId && Number(v?.stockQuantity || 0) > 0,
      ) ||
      lens.variants.find((v) => v?.variantId) ||
      null
    );
  };

  const buildFrameItem = (variant, parentId) => {
    const productId = product.productId || product.id;
    const finalPrice = variant?.price || product.price || 0;
    const isOutOfStock = (variant?.stockQuantity || 0) === 0;

    return {
      cartItemId: Date.now(),
      parentId,
      type: "FRAME",
      productId,
      variantId: variant?.variantId,
      name: product.name,
      productName: product.name,
      brand: product.brand,
      imageUrl: variant?.imageUrl || product.imageUrl || product.img || "",
      price: finalPrice,
      unitPrice: finalPrice,
      quantity: quantityFromUrl,
      variant,
      variantColor: variant?.color,
      variantSize: variant?.frameSize,
      isPreorder: isOutOfStock,
      isLens: false,
      prescription: null,
    };
  };

  const buildLensItem = (lens, lensVariant, parentId) => {
    const lensProductId = lens.productId || lens.id;
    const lensPrice = lensVariant?.price || lens.price || 0;

    return {
      cartItemId: Date.now() + 1,
      parentId,
      type: "LENS",
      productId: lensProductId,
      variantId: lensVariant?.variantId,
      name: lens.name,
      productName: lens.name,
      brand: lens.brand,
      imageUrl: lensVariant?.imageUrl || lens.imageUrl || lens.img || "",
      price: lensPrice,
      unitPrice: lensPrice,
      quantity: quantityFromUrl,
      variant: lensVariant,
      variantColor: lensVariant?.color,
      variantSize: lensVariant?.frameSize,
      isPreorder: (lensVariant?.stockQuantity || 0) === 0,
      isLens: true,
      prescription: null,
    };
  };

  const saveToLocalCart = (items) => {
    let cart = [];
    try {
      cart = JSON.parse(localStorage.getItem("cart")) || [];
    } catch {
      cart = [];
    }

    const incomingFrame = items.find((i) => i.type === "FRAME");
    const incomingLens = items.find((i) => i.type === "LENS");

    // 🔥 CASE: chọn frame + lens
    if (incomingFrame && incomingLens) {
      // tìm frame giống
      const existingIndex = cart.findIndex(
        (item) =>
          item.type === "FRAME" &&
          String(item.productId) === String(incomingFrame.productId) &&
          String(item.variantId) === String(incomingFrame.variantId),
      );

      if (existingIndex !== -1) {
        const oldParentId = cart[existingIndex].parentId;

        // ❌ XÓA hết combo cũ (frame + lens)
        cart = cart.filter((i) => i.parentId !== oldParentId);

        // ✅ tạo combo mới
        const newParentId = Date.now();

        cart.push(
          { ...incomingFrame, parentId: newParentId, cartItemId: Date.now() },
          {
            ...incomingLens,
            parentId: newParentId,
            cartItemId: Date.now() + 1,
          },
        );
      } else {
        cart.push(...items);
      }
    }

    // 🔥 CASE: chỉ mua frame
    else if (incomingFrame && !incomingLens) {
      const existingIndex = cart.findIndex(
        (item) =>
          item.type === "FRAME" &&
          String(item.productId) === String(incomingFrame.productId) &&
          String(item.variantId) === String(incomingFrame.variantId),
      );

      if (existingIndex !== -1) {
        cart[existingIndex].quantity += incomingFrame.quantity || 1;
      } else {
        cart.push(incomingFrame);
      }
    }

    localStorage.setItem("cart", JSON.stringify(cart));
    window.dispatchEvent(new Event("storage"));
  };

  const savePreorderFlag = (variant) => {
    if ((variant?.stockQuantity || 0) !== 0) return;

      if (localStorage.getItem("token")) {
        // (Removed dangerous frontend_preorders logic. isPreorder is passed explicitly via API now)
        const payload = {
          productId,
          variantId,
          quantity: quantityFromUrl,
          isLens: false,
          isPreorder: frameItem.isPreorder,
        });
      }

      await goCheckout(`Added ${quantityFromUrl} item(s) to cart!`);
    } catch (err) {
      console.error(err);
      await goCheckout("Frame saved to temporary cart!");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSelectLens = async (lens) => {
    const variant = getSelectedFrameVariant();
    const lensVariant = getSelectedLensVariant(lens);

    if (!variant?.variantId) {
      showToast("Không tìm thấy biến thể của gọng kính.");
      return;
    }

    if (!lensVariant?.variantId) {
      showToast("Lens này chưa có biến thể khả dụng.");
      return;
    }

    const parentId = Date.now();

    const frameItem = buildFrameItem(variant, parentId);
    const lensItem = buildLensItem(lens, lensVariant, parentId);

    setSubmitting(true);
    try {
      saveToLocalCart([frameItem, lensItem]);
      savePreorderFlag(variant);
      savePreorderFlag(lensVariant);

      if (localStorage.getItem("token")) {
        if (form.savePrescription) {
          try {
            const res = await saveUserPrescription(prescriptionData);
            console.log(res);
          } catch (e) {
            console.error("Failed to save prescription", e);
          }
        }

        const isOutOfStock = variant?.stockQuantity === 0;
        // (Removed dangerous frontend_preorders logic. isPreorder is passed explicitly via API now)

        const framePayload = {
          productId: productId,
          variantId: variantId,
          quantity: quantityFromUrl,
          isLens: false,
          isPreorder: frameItem.isPreorder,
        });

        await addToCartApi({
          productId: lensItem.productId,
          variantId: lensItem.variantId,
          quantity: quantityFromUrl,
          isLens: true,
          isPreorder: lensItem.isPreorder,
        });
      }

      await goCheckout("Added frame and lens to cart!");
    } catch (err) {
      console.error(err);
      await goCheckout("Saved to temporary cart!");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!product) return null;

  const selectedVariant = getSelectedFrameVariant();
  const availableSizes =
    product?.variants?.filter((v) => v?.frameSize).map((v) => v.frameSize) ||
    [];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col pb-24">
      <HeaderBar />

      <div className="grid grid-cols-1 lg:grid-cols-[450px_1fr] gap-8 px-8 py-8 flex-1 items-start mt-16">
        <div className="space-y-4 sticky top-[148px]">
          <FrameSummary product={product} variantId={selectedVariantId} />

          {product?.variants?.length > 0 && (
            <div className="rounded-2xl bg-white border border-stone-200 p-5">
              <p className="text-sm font-semibold text-stone-800 mb-3">
                Select Size
              </p>

              <div className="flex flex-wrap gap-2">
                {product.variants.map((variant) => {
                  const isActive =
                    String(variant.variantId) === String(selectedVariantId);

                  const labelRaw = (variant.frameSize || "").trim();
                  let label = labelRaw;
                  const upper = labelRaw.toUpperCase();

                  if (upper === "SMALL") label = "S";
                  else if (upper === "MEDIUM") label = "M";
                  else if (upper === "LARGE") label = "L";

                  return (
                    <button
                      key={variant.variantId}
                      type="button"
                      onClick={() =>
                        setSelectedVariantId(String(variant.variantId))
                      }
                      className={`px-4 py-2 rounded-xl border text-sm font-semibold transition-all ${
                        isActive
                          ? "bg-blue-600 text-white border-blue-600"
                          : "bg-white text-stone-700 border-stone-300 hover:border-blue-400"
                      }`}
                    >
                      {label || "N/A"}
                    </button>
                  );
                })}
              </div>

              <div className="mt-3 text-xs text-stone-500">
                Đang chọn:{" "}
                <span className="font-semibold text-stone-700">
                  {selectedVariant?.frameSize || availableSizes[0] || "N/A"}
                </span>
              </div>
            </div>
          )}
        </div>

        <div style={{ animation: "fadeIn .5s ease" }}>
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-stone-900 tracking-tight">
              Select Lens
            </h1>
            <p className="text-stone-500 mt-2 text-sm">
              Chọn lens là xong, không cần nhập thông số kính.
            </p>
          </div>

          {loadingLenses ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-8 h-8 border-4 border-stone-200 border-t-indigo-600 rounded-full animate-spin" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                onClick={handleBuyFrameOnly}
                disabled={submitting}
                className="group p-5 bg-blue-900 border border-blue-800 rounded-2xl text-left hover:bg-blue-800 hover:shadow-xl transition-all duration-300 active:scale-[0.98] relative overflow-hidden disabled:opacity-60"
              >
                <div className="flex items-center gap-5 relative z-10">
                  <div className="w-20 h-20 bg-blue-800 rounded-xl flex items-center justify-center border border-blue-700">
                    <svg
                      className="w-8 h-8 text-blue-200"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
                      />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-white leading-snug">
                      Buy Frame Only
                    </h3>
                    <p className="text-[11px] text-stone-400 mt-1 uppercase tracking-wider font-semibold">
                      No extra lens selected
                    </p>
                    <div className="mt-2 text-sm font-black text-white">
                      Keep original price
                    </div>
                  </div>
                </div>
              </button>

              {lenses.map((lens) => {
                const lId = lens.productId || lens.id;
                const lensVariant = getSelectedLensVariant(lens);
                const isDisabled = !lensVariant;
                const displayPrice = lensVariant?.price || lens.price || 0;

                return (
                  <button
                    key={lId}
                    onClick={() => !isDisabled && handleSelectLens(lens)}
                    disabled={submitting || isDisabled}
                    className={`group p-5 bg-white border border-stone-200 rounded-2xl text-left transition-all duration-300 active:scale-[0.98] ${
                      isDisabled
                        ? "opacity-50 cursor-not-allowed"
                        : "hover:border-indigo-500 hover:shadow-xl hover:shadow-indigo-500/5"
                    }`}
                  >
                    <div className="flex items-center gap-5">
                      <div className="w-20 h-20 bg-stone-50 rounded-xl overflow-hidden border border-stone-100 group-hover:scale-105 transition-transform duration-300">
                        <img
                          src={
                            lensVariant?.imageUrl ||
                            lens.imageUrl ||
                            lens.img ||
                            lens.variants?.[0]?.imageUrl ||
                            "https://placehold.co/150"
                          }
                          alt={lens.name}
                          className="w-full h-full object-contain p-3"
                        />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-stone-800 leading-snug group-hover:text-indigo-600 transition-colors">
                          {lens.name}
                        </h3>
                        <p className="text-[11px] text-stone-400 mt-1 uppercase tracking-wider font-semibold opacity-70">
                          {lens.brand}
                        </p>
                        <div className="mt-2 text-sm font-black text-blue-600">
                          {toNumber(displayPrice).toLocaleString("vi-VN")}₫
                        </div>
                        {isDisabled && (
                          <p className="mt-2 text-xs text-red-500 font-medium">
                            Lens này chưa có biến thể
                          </p>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function toNumber(value) {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}
