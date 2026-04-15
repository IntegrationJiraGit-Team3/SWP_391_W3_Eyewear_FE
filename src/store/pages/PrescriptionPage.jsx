import { useState, useEffect } from "react";
import {
  useParams,
  useNavigate,
  useSearchParams,
  useLocation,
} from "react-router-dom";
import HeaderBar from "../components/prescription/Headerbar";
import FrameSummary from "../components/prescription/FrameSummary";
import PrescriptionTable from "../components/prescription/PrescriptionTable";
import ExtrasSection from "../components/prescription/ExtrasSection";
import SubmitBar from "../components/prescription/SubmitBar";
import { getProductByIdApi } from "../api/productApi";
import { getAllProducts } from "../services/productService";
import { addToCartApi } from "../api/cartApi";

import {
  getMyUserPrescriptions,
  saveUserPrescription,
  deleteUserPrescription,
} from "../services/userPrescriptionService";

import { FiCheck } from "react-icons/fi";
import { useToast } from "../../context/ToastContext";
export default function PrescriptionPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const lensId = searchParams.get("lensId");
  const variantIdFromUrl = searchParams.get("variantId");
  const quantityFromUrl = Math.max(
    1,
    parseInt(searchParams.get("quantity")) || 1,
  );

  const [product, setProduct] = useState(null);
  const [lensProduct, setLensProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lenses, setLenses] = useState([]);
  const [loadingLenses, setLoadingLenses] = useState(false);

  const [savedPrescriptions, setSavedPrescriptions] = useState([]);
  const [loadingRx, setLoadingRx] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { showToast } = useToast();

  const handleSuccess = (msg) => {
    showToast(msg);
    setTimeout(() => {
      navigate("/checkout");
    }, 1200);
  };

  const [form, setForm] = useState({
    right: { sph: "", cyl: "", axis: "", add: "" },
    left: { sph: "", cyl: "", axis: "", add: "" },
    savePrescription: false,
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    const currentUser =
      localStorage.getItem("currentUser") || localStorage.getItem("token");
    if (!currentUser) {
      const from = `${location.pathname}${location.search}${location.hash}`;
      navigate("/login", { state: { from } });
    }
  }, [location.hash, location.pathname, location.search, navigate]);

  /* ---------- LOAD PRODUCTS ---------- */
  useEffect(() => {
    const fetchData = async () => {
      try {
        const frameData = await getProductByIdApi(id);
        setProduct(frameData);

        if (lensId) {
          const lData = await getProductByIdApi(lensId);
          setLensProduct(lData);
        } else {
          setLoadingLenses(true);
          const allProducts = await getAllProducts();
          const filteredLenses = allProducts.filter(
            (p) => (p.category || p.productType || "").toLowerCase() === "lens",
          );
          setLenses(filteredLenses);
          setLoadingLenses(false);
        }
      } catch (err) {
        console.error("Error fetching info:", err);
        navigate("/shop");
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchData();
  }, [id, lensId, navigate]);

  /* ---------- LOAD SAVED PRESCRIPTIONS ---------- */
  useEffect(() => {
    const fetchPrescriptions = async () => {
      setLoadingRx(true);
      try {
        const res = await getMyUserPrescriptions();
        const data = res || [];
        console.log(res);
        setSavedPrescriptions(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Error loading saved prescriptions:", err);
        setSavedPrescriptions([]);
      } finally {
        setLoadingRx(false);
      }
    };
    fetchPrescriptions();
  }, []);

  const format = (val) =>
    val !== null && val !== undefined ? Number(val).toFixed(2) : "";

  /* ---------- APPLY SAVED PRESCRIPTION ---------- */
  const applySavedPrescription = (rx) => {
    console.log(rx);

    setForm({
      right: {
        sph: format(rx.sphRight),
        cyl: format(rx.cylRight),
        axis: rx.axisRight ?? "",
        add: format(rx.addRight),
      },
      left: {
        sph: format(rx.sphLeft),
        cyl: format(rx.cylLeft),
        axis: rx.axisLeft ?? "",
        add: format(rx.addLeft),
      },
      savePrescription: false,
    });

    setErrors({});
  };
  /* ---------- DELETE PRESCRIPTION ---------- */
  const handleDeletePrescription = async (rxId) => {
    if (!rxId) return;
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this prescription from your account?",
    );
    if (!confirmDelete) return;

    try {
      await deleteUserPrescription(rxId);
      // Xóa thành công thì lọc cái đơn đó ra khỏi màn hình
      setSavedPrescriptions((prev) =>
        prev.filter((rx) => rx.id !== rxId && rx.prescriptionId !== rxId),
      );
      showToast("Prescription deleted successfully!");
    } catch (error) {
      console.error("Delete prescription error:", error);
      showToast(
        "Cannot delete prescription right now. Please try again later.",
        "error",
      );
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

  /* ---------- UPDATE HELPERS ---------- */

  const updateEye = (eye, field, value) => {
    setForm((prev) => ({
      ...prev,
      [eye]: { ...prev[eye], [field]: value },
    }));
  };

  const updateField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  /* ---------- VALIDATION ---------- */

  const validate = () => {
    const e = {};
    if (!form.right.sph) e.rightSph = "Required";
    if (!form.left.sph) e.leftSph = "Required";

    if (form.right.cyl && !form.right.axis)
      e.rightAxis = "Axis is required if CYL is entered";

    if (form.left.cyl && !form.left.axis)
      e.leftAxis = "Axis is required if CYL is entered";

    return e;
  };

  const handleBuyFrameOnly = async () => {
    const variant =
      product.variants?.find(
        (v) => String(v.variantId) === String(variantIdFromUrl),
      ) || product.variants?.[0];
    const variantId = variant?.variantId;
    const productId = product.productId || product.id;
    const finalPrice = variant?.price || product.price || 0;
    const isOutOfStock = variant?.stockQuantity === 0;

    setSubmitting(true);
    try {
      let cart = [];
      try {
        cart = JSON.parse(localStorage.getItem("cart")) || [];
      } catch {
        /* ignore */
      }

      const cartItem = {
        cartItemId: Date.now(),
        productId: productId,
        variantId: variantId,
        name: product.name,
        productName: product.name,
        brand: product.brand,
        imageUrl: variant?.imageUrl || product.imageUrl || product.img,
        price: finalPrice,
        unitPrice: finalPrice,
        quantity: quantityFromUrl,
        variant: variant,
        variantColor: variant?.color,
        variantSize: variant?.frameSize,
        isPreorder: isOutOfStock,
        isLens: false,
      };

      cart.push(cartItem);
      localStorage.setItem("cart", JSON.stringify(cart));
      window.dispatchEvent(new Event("storage"));

      if (localStorage.getItem("token")) {
        if (isOutOfStock) {
          try {
            const preorders =
              JSON.parse(localStorage.getItem("frontend_preorders")) || {};
            preorders[variant.variantId] = true;
            localStorage.setItem(
              "frontend_preorders",
              JSON.stringify(preorders),
            );
          } catch (e) {
            // ignore
          }
        }
        const payload = {
          productId,
          variantId,
          quantity: quantityFromUrl,
          isLens: false,
          isPreorder: isOutOfStock,
        };
        await addToCartApi(payload);
      }
      handleSuccess(`Added ${quantityFromUrl} item(s) to cart!`);
    } catch (err) {
      console.error(err);
      handleSuccess("Frame saved to temporary cart!");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = async () => {
    const v = validate();
    setErrors(v);

    if (Object.keys(v).length > 0) return;

    const toNum = (val) =>
      val === "" || val === null || val === undefined ? null : parseFloat(val);
    const toInt = (val) =>
      val === "" || val === null || val === undefined
        ? null
        : parseInt(val, 10);

    const variant =
      product.variants?.find(
        (v) => String(v.variantId) === String(variantIdFromUrl),
      ) || product.variants?.[0];
    const lensVariant = lensProduct?.variants?.[0];

    const variantId = variant?.variantId;
    const lensVariantId = lensVariant?.variantId;

    const productId = product.productId || product.id;

    const prescriptionData = {
      sphLeft: toNum(form.left.sph),
      sphRight: toNum(form.right.sph),
      cylLeft: toNum(form.left.cyl),
      cylRight: toNum(form.right.cyl),
      axisLeft: toInt(form.left.axis),
      axisRight: toInt(form.right.axis),
      addLeft: toNum(form.left.add),
      addRight: toNum(form.right.add),
    };

    setSubmitting(true);
    try {
      let cart = [];
      try {
        cart = JSON.parse(localStorage.getItem("cart")) || [];
      } catch {
        /* ignore */
      }

      const framePrice = variant?.price || product.price || 0;

      const cartItemFrame = {
        cartItemId: Date.now(), // Temp ID for guest
        productId: productId,
        variantId: variantId,
        name: product.name,
        productName: product.name,
        brand: product.brand,
        imageUrl: variant?.imageUrl || product.imageUrl || product.img,
        price: framePrice,
        unitPrice: framePrice, // For CheckoutPage mapping compatibility
        quantity: quantityFromUrl,
        variant: variant,
        variantColor: variant?.color,
        variantSize: variant?.frameSize,
        isPreorder: variant?.stockQuantity === 0,
        isLens: false,
        prescription: null,
      };

      cart.push(cartItemFrame);

      if (lensProduct) {
        const lensPrice = lensVariant?.price || lensProduct?.price || 0;
        const cartItemLens = {
          cartItemId: Date.now() + 1, // Temp ID for guest
          productId: lensProduct.id || lensProduct.productId,
          variantId: lensVariantId,
          name: lensProduct.name,
          productName: lensProduct.name,
          brand: lensProduct.brand,
          imageUrl:
            lensVariant?.imageUrl || lensProduct.imageUrl || lensProduct.img,
          price: lensPrice,
          unitPrice: lensPrice,
          quantity: quantityFromUrl,
          variant: lensVariant,
          variantColor: lensVariant?.color,
          variantSize: lensVariant?.frameSize,
          isPreorder: lensVariant?.stockQuantity === 0,
          isLens: true,
          prescription: prescriptionData,
          ...prescriptionData,
        };
        cart.push(cartItemLens);
      }

      localStorage.setItem("cart", JSON.stringify(cart));
      window.dispatchEvent(new Event("storage"));

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
        if (isOutOfStock) {
          try {
            const preorders =
              JSON.parse(localStorage.getItem("frontend_preorders")) || {};
            preorders[variant.variantId] = true;
            localStorage.setItem(
              "frontend_preorders",
              JSON.stringify(preorders),
            );
          } catch (e) {
            // ignore
          }
        }

        const framePayload = {
          productId: productId,
          variantId: variantId,
          quantity: quantityFromUrl,
          isLens: false,
          isPreorder: isOutOfStock,
        };
        await addToCartApi(framePayload);

        if (lensProduct) {
          const lensOutOfStock = lensVariant?.stockQuantity === 0;
          const lensPayload = {
            productId: lensProduct.id || lensProduct.productId,
            variantId: lensVariantId,
            quantity: quantityFromUrl,
            isLens: true,
            isPreorder: lensOutOfStock,
            ...prescriptionData,
          };
          await addToCartApi(lensPayload);
        }
      }

      handleSuccess(`Added ${quantityFromUrl} item(s) to cart!`);
    } catch (err) {
      console.error("Lỗi thêm vào giỏ hàng:", err);
      handleSuccess("Saved to temporary cart!");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div className="min-h-screen bg-gray-50 flex flex-col pb-24">
        <HeaderBar />

        <div className="grid grid-cols-1 lg:grid-cols-[450px_1fr] gap-8 px-8 py-8 flex-1 items-start mt-16">
          <div className="space-y-4 sticky top-[148px]">
            <FrameSummary product={product} variantId={variantIdFromUrl} />
            {lensProduct && (
              <div
                className="bg-white rounded-lg p-6 border border-gray-100 shadow-sm"
                style={{ animation: "slideUp .4s ease" }}
              >
                <p className="text-[10px] text-gray-400 uppercase tracking-[0.2em] font-medium font-sans mb-3">
                  Selected Lens
                </p>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-stone-50 rounded-lg overflow-hidden border border-stone-100">
                    <img
                      src={
                        lensProduct.variants?.[0]?.imageUrl ||
                        lensProduct.img ||
                        "https://placehold.co/100"
                      }
                      className="w-full h-full object-contain p-2"
                    />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-800 text-sm leading-tight">
                      {lensProduct.name}
                    </p>
                    <p className="text-xs text-blue-600 font-bold mt-1">
                      {(
                        lensProduct.price ||
                        lensProduct.variants?.[0]?.price ||
                        0
                      ).toLocaleString("vi-VN")}
                      ₫
                    </p>
                  </div>
                </div>
                <button
                  onClick={() =>
                    navigate(
                      `/prescription/${id}?variantId=${variantIdFromUrl}&quantity=${quantityFromUrl}`,
                    )
                  }
                  className="w-full mt-4 py-2 border border-stone-200 rounded-lg text-[11px] font-semibold text-stone-500 hover:bg-stone-50 transition-all active:scale-[0.98]"
                >
                  Change Lens
                </button>
              </div>
            )}
          </div>

          <div className="relative">
            {!lensId ? (
              <div style={{ animation: "fadeIn .5s ease" }}>
                <div className="mb-8">
                  <h1 className="text-3xl font-bold text-stone-900 tracking-tight">
                    Select Lens
                  </h1>
                  <p className="text-stone-500 mt-2 text-sm">
                    Please select a lens type that suits your needs
                  </p>
                </div>

                {loadingLenses ? (
                  <div className="flex items-center justify-center py-20">
                    <div className="w-8 h-8 border-4 border-stone-200 border-t-indigo-600 rounded-full animate-spin" />
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Option: No Lens (Frame Only) */}
                    <button
                      onClick={handleBuyFrameOnly}
                      className="group p-5 bg-blue-900 border border-blue-800 rounded-2xl text-left hover:bg-blue-800 hover:shadow-xl transition-all duration-300 active:scale-[0.98] relative overflow-hidden"
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
                            No prescription lenses included
                          </p>
                          <div className="mt-2 text-sm font-black text-white">
                            Keep original price
                          </div>
                        </div>
                      </div>
                      <div className="absolute top-0 right-0 p-4 opacity-10">
                        <svg
                          className="w-20 h-20 text-white"
                          fill="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8 0-1.85.63-3.55 1.69-4.9L16.9 18.31C15.55 19.37 13.85 20 12 20zm6.31-4.1L5.69 5.69C7.05 4.63 8.75 4 10.5 4c4.41 0 8 3.59 8 8 0 1.85-.63 3.55-1.69 4.9z" />
                        </svg>
                      </div>
                    </button>

                    {lenses.map((lens) => {
                      const lId = lens.productId || lens.id;
                      return (
                        <button
                          key={lId}
                          onClick={() =>
                            navigate(
                              `/prescription/${id}?variantId=${variantIdFromUrl}&quantity=${quantityFromUrl}&lensId=${lId}`,
                            )
                          }
                          className="group p-5 bg-white border border-stone-200 rounded-2xl text-left hover:border-indigo-500 hover:shadow-xl hover:shadow-indigo-500/5 transition-all duration-300 active:scale-[0.98]"
                        >
                          <div className="flex items-center gap-5">
                            <div className="w-20 h-20 bg-stone-50 rounded-xl overflow-hidden border border-stone-100 group-hover:scale-105 transition-transform duration-300">
                              <img
                                src={
                                  lens.imageUrl ||
                                  lens.img ||
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
                                {(lens.price || 0).toLocaleString("vi-VN")}₫
                              </div>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : (
              <div style={{ animation: "fadeIn .5s ease" }}>
                <div className="flex items-baseline justify-between mb-6">
                  <h1 className="text-3xl font-bold text-stone-900 tracking-tight">
                    Prescription Details
                  </h1>
                  <span className="text-[10px] bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded uppercase font-bold tracking-widest">
                    Final Step
                  </span>
                </div>

                {savedPrescriptions.length > 0 && (
                  <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-5 mb-8 shadow-sm">
                    <p className="text-xs font-bold text-indigo-900 uppercase tracking-widest mb-4 opacity-70">
                      Use Saved Prescription
                    </p>
                    <div className="flex flex-wrap gap-2.5">
                      {savedPrescriptions.map((rx, idx) => {
                        const rxId = rx.id || rx.prescriptionId;
                        return (
                          <div
                            key={rxId || idx}
                            className="flex items-stretch bg-white border border-indigo-100 rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-all active:scale-[0.98]"
                          >
                            <button
                              onClick={() => applySavedPrescription(rx)}
                              className="px-4 py-2.5 text-indigo-700 text-[13px] hover:bg-indigo-50 transition-colors font-semibold text-left"
                            >
                              Prescription #{idx + 1} — OD: {rx.sphRight ?? "—"}{" "}
                              / OS: {rx.sphLeft ?? "—"}
                            </button>
                            {rxId && (
                              <button
                                onClick={() => handleDeletePrescription(rxId)}
                                className="px-3 flex items-center justify-center text-rose-400 hover:bg-rose-50 hover:text-rose-600 transition-colors border-l border-indigo-50"
                                title="Remove"
                              >
                                ✕
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="bg-white rounded-3xl shadow-sm border border-stone-200 p-8">
                  <div className="flex justify-between items-center mb-10">
                    <h2 className="text-xl font-bold text-stone-900 tracking-tight">
                      Detailed Eye Specifications
                    </h2>
                    {loadingRx && (
                      <div className="flex items-center gap-2 text-xs text-stone-400">
                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-indigo-600"></div>
                        Loading profile...
                      </div>
                    )}
                  </div>

                  <div className="space-y-12">
                    <PrescriptionTable
                      form={form}
                      errors={errors}
                      updateEye={updateEye}
                    />

                    <div className="h-px bg-stone-100" />
                  </div>

                  <div className="mt-12 flex items-center gap-4 p-5 bg-stone-50 rounded-2xl border border-stone-200/50">
                    <input
                      type="checkbox"
                      id="saveRx"
                      className="w-5 h-5 rounded-lg border-stone-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer transition-all"
                      checked={form.savePrescription}
                      onChange={(e) =>
                        setForm({ ...form, savePrescription: e.target.checked })
                      }
                    />
                    <label
                      htmlFor="saveRx"
                      className="text-sm font-semibold text-stone-700 cursor-pointer select-none"
                    >
                      Save this prescription to my profile for future use
                    </label>
                  </div>
                </div>

                <SubmitBar onSubmit={handleSubmit} submitting={submitting} />
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
