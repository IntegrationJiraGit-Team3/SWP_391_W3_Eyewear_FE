import { useState } from "react";
import {
  FiX,
  FiPackage,
  FiCheck,
  FiArrowRight,
  FiArrowLeft,
  FiImage,
  FiTag,
  FiDollarSign,
  FiBox,
  FiPlus,
  FiTrash2,
  FiEdit2,
} from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "../../context/ToastContext";
import { createProduct } from "../services/productService";

/* ─────────────────────────────────────────────
   STEPPER
───────────────────────────────────────────── */
const STEPS = ["Category", "Details", "Complete"];

function Stepper({ step }) {
  const progress = step === 1 ? 0 : step === 2 ? 50 : 100;
  return (
    <div className="px-8 pt-5 pb-6 border-b border-slate-100">
      <div className="relative flex items-center justify-between">
        <div className="absolute top-5 left-5 right-5 h-px bg-slate-100">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-500 ease-in-out"
            style={{ width: `${progress}%` }}
          />
        </div>
        {STEPS.map((label, i) => {
          const s = i + 1;
          const done = step > s;
          const active = step === s;
          return (
            <div
              key={s}
              className="relative z-10 flex flex-col items-center gap-2"
            >
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 border-2
                  ${
                    done
                      ? "bg-gradient-to-br from-blue-500 to-indigo-500 border-transparent text-white shadow-lg shadow-blue-200"
                      : active
                        ? "bg-white border-blue-500 text-blue-600 shadow-lg shadow-blue-100 ring-4 ring-blue-50"
                        : "bg-white border-slate-200 text-slate-300"
                  }`}
              >
                {done ? <FiCheck size={15} strokeWidth={3} /> : s}
              </div>
              <span
                className={`text-[11px] font-semibold tracking-wide uppercase
                ${active ? "text-blue-600" : done ? "text-slate-400" : "text-slate-300"}`}
              >
                {label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   CATEGORY CONFIG  — per-category variant fields
───────────────────────────────────────────── */
const CATEGORIES = [
  {
    value: "FRAME",
    label: "Frames",
    desc: "Fashion & Optical Frames",
    emoji: "👓",
    color: "blue",
    variantFields: [
      {
        name: "color",
        label: "Color",
        placeholder: "e.g. Glossy Black, Gold...",
      },
      {
        name: "material",
        label: "Material",
        placeholder: "e.g. Titanium, Acetate...",
      },
      { name: "frameSize", label: "Size", placeholder: "VD: 52-18-140" },
      {
        name: "image",
        label: "Image URL",
        placeholder: "https://…",
        isImage: true,
      },
      { name: "stock", label: "Stock", placeholder: "0", isNumber: true },
    ],
  },
  {
    value: "LENS",
    label: "Lenses",
    desc: "Optical Lenses, Coatings",
    emoji: "🔍",
    color: "violet",
    variantFields: [
      {
        name: "material",
        label: "Material",
        placeholder: "e.g. CR-39, Polycarbonate...",
      },
      {
        name: "color",
        label: "Color / Coating",
        placeholder: "e.g. UV Protection, Photochromic...",
      },
      {
        name: "frameSize",
        label: "Index",
        placeholder: "e.g. SPH -2.00 CYL -0.50",
      },
      {
        name: "image",
        label: "Image URL",
        placeholder: "https://…",
        isImage: true,
      },
      { name: "stock", label: "Stock", placeholder: "0", isNumber: true },
    ],
  },
];

const CATEGORY_MAP = Object.fromEntries(CATEGORIES.map((c) => [c.value, c]));

/* colour tokens per category */
const CC = {
  blue: {
    bg: "bg-blue-50",
    border: "border-blue-400",
    text: "text-blue-700",
    badge: "bg-blue-100 text-blue-700",
    btn: "bg-blue-600 hover:bg-blue-700",
    dashed: "border-blue-300 text-blue-500 hover:bg-blue-50",
  },
  violet: {
    bg: "bg-violet-50",
    border: "border-violet-400",
    text: "text-violet-700",
    badge: "bg-violet-100 text-violet-700",
    btn: "bg-violet-600 hover:bg-violet-700",
    dashed: "border-violet-300 text-violet-500 hover:bg-violet-50",
  },
  emerald: {
    bg: "bg-emerald-50",
    border: "border-emerald-400",
    text: "text-emerald-700",
    badge: "bg-emerald-100 text-emerald-700",
    btn: "bg-emerald-600 hover:bg-emerald-700",
    dashed: "border-emerald-300 text-emerald-500 hover:bg-emerald-50",
  },
};

/* ─────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────── */
const makeVariant = () => ({
  stock: "",
  frameSize: "",
  color: "",
  material: "",
  image: "",
  _done: false,
});

const EMPTY_FORM = {
  type: "",
  name: "",
  brand: "",
  description: "",
  price: "",
  variants: [makeVariant()],
};

const slide = (dir) => ({
  initial: { opacity: 0, x: dir * 32 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: dir * -32 },
  transition: { duration: 0.22, ease: "easeOut" },
});

/* ─────────────────────────────────────────────
   VARIANT CARD
───────────────────────────────────────────── */
function VariantCard({
  variant,
  index,
  cat,
  onChange,
  onMarkDone,
  onEdit,
  onDelete,
}) {
  const cc = CC[cat.color];
  const isDone = variant._done;

  /* ── collapsed (done) ── */
  if (isDone) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.12 }}
        className={`flex items-center gap-3 px-4 py-3 rounded-2xl border-2 ${cc.border} ${cc.bg}`}
      >
        <div
          className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-white ${cc.btn.split(" ")[0]}`}
        >
          <FiCheck size={13} strokeWidth={3} />
        </div>
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-bold truncate ${cc.text}`}>
            Variant {index + 1}
            {variant.color && (
              <span className="font-normal"> — {variant.color}</span>
            )}
          </p>
          <p className="text-xs text-slate-400 truncate mt-0.5">
            {[
              variant.material,
              variant.frameSize,
              variant.stock && `${variant.stock} units`,
            ]
              .filter(Boolean)
              .join(" · ")}
          </p>
        </div>
        <div className="flex gap-1">
          <button
            onClick={onEdit}
            title="Edit"
            className="p-1.5 rounded-lg hover:bg-white/80 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <FiEdit2 size={13} />
          </button>
          {onDelete && (
            <button
              onClick={onDelete}
              title="Delete"
              className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors"
            >
              <FiTrash2 size={13} />
            </button>
          )}
        </div>
      </motion.div>
    );
  }

  /* ── expanded (editing) ── */
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.12 }}
      className={`rounded-2xl border-2 overflow-hidden ${cc.border}`}
    >
      {/* card header */}
      <div className={`flex items-center justify-between px-4 py-2.5 ${cc.bg}`}>
        <span
          className={`text-xs font-extrabold uppercase tracking-widest ${cc.text}`}
        >
          Variant {index + 1}
        </span>
        {onDelete && (
          <button
            onClick={onDelete}
            className="p-1 rounded-md text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
          >
            <FiTrash2 size={13} />
          </button>
        )}
      </div>

      {/* fields grid */}
      <div className="px-4 pt-4 pb-3 grid grid-cols-1 sm:grid-cols-2 gap-3 bg-white">
        {cat.variantFields.map((field) => (
          <FieldInput
            key={field.name}
            label={field.label}
            name={field.name}
            value={variant[field.name]}
            placeholder={field.placeholder}
            type={field.isNumber ? "number" : "text"}
            icon={field.isImage ? <FiImage size={12} /> : undefined}
            onChange={(e) => onChange(index, e)}
          />
        ))}
      </div>

      {/* confirm button */}
      <div className="px-4 pb-4 flex justify-end">
        <button
          onClick={() => onMarkDone(index)}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-white transition-all shadow-sm ${cc.btn}`}
        >
          <FiCheck size={13} strokeWidth={3} /> Confirm Variant
        </button>
      </div>
    </motion.div>
  );
}

/* ─────────────────────────────────────────────
   MAIN MODAL
───────────────────────────────────────────── */
function AddProductModal({ onClose, onAdd }) {
  const [step, setStep] = useState(1);
  const [completed, setCompleted] = useState(false);
  const [direction, setDirection] = useState(1);
  const [form, setForm] = useState(EMPTY_FORM);
  const { showToast } = useToast();

  const cat = CATEGORY_MAP[form.type];
  const accent = cat ? CC[cat.color] : CC.blue;

  const go = (n) => {
    setDirection(n > step ? 1 : -1);
    setStep(n);
  };
  const resetForm = () => {
    setForm(EMPTY_FORM);
    setCompleted(false);
    setStep(1);
    setDirection(1);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "type") {
      setForm({ ...EMPTY_FORM, type: value });
      return;
    }
    setForm((f) => ({ ...f, [name]: value }));
  };

  const handleVariantChange = (index, e) => {
    const { name, value } = e.target;
    setForm((f) => {
      const v = [...f.variants];
      v[index] = { ...v[index], [name]: value };
      return { ...f, variants: v };
    });
  };

  const markVariantDone = (index) =>
    setForm((f) => {
      const v = [...f.variants];
      v[index] = { ...v[index], _done: true };
      return { ...f, variants: v };
    });

  const editVariant = (index) =>
    setForm((f) => {
      const v = [...f.variants];
      v[index] = { ...v[index], _done: false };
      return { ...f, variants: v };
    });

  const addVariant = () =>
    setForm((f) => ({ ...f, variants: [...f.variants, makeVariant()] }));
  const removeVariant = (i) =>
    setForm((f) => ({
      ...f,
      variants: f.variants.filter((_, idx) => idx !== i),
    }));

  const handleSubmit = async () => {
    if (!form.name || !form.type || !form.price) {
      showToast("Missing information!", "error");
      return;
    }
    try {
      const newProduct = await createProduct(form);
      setCompleted(true);
      setStep(3);
      onAdd?.(newProduct);
    } catch (err) {
      console.error(err);
      showToast("Failed to create product!", "error");
    }
  };

  const canNext = step === 1 ? !!form.type : !!form.name && !!form.price;
  const doneCount = form.variants.filter((v) => v._done).length;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 10 }}
        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
        className="bg-white w-full max-w-2xl rounded-3xl flex flex-col max-h-[92vh] overflow-hidden"
        style={{
          boxShadow:
            "0 30px 70px -15px rgba(0,0,0,0.22), 0 0 0 1px rgba(0,0,0,0.05)",
        }}
      >
        {/* ── Header ── */}
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-200">
              <FiPackage size={17} className="text-white" />
            </div>
            <div>
              <h2 className="font-extrabold text-slate-800 text-[15px] leading-tight">
                Add New Product
              </h2>
              <p className="text-[11px] text-slate-400 font-medium">
                Step {step} / {STEPS.length}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <FiX size={16} />
          </button>
        </div>

        <Stepper step={step} />

        {/* ── Content ── */}
        <div className="flex-1 overflow-y-auto">
          <AnimatePresence mode="wait" initial={false}>
            {/* STEP 1 */}
            {step === 1 && !completed && (
              <motion.div
                key="step1"
                {...slide(direction)}
                className="px-6 py-6"
              >
                <p className="text-sm text-slate-500 mb-5 leading-relaxed">
                  Select the type of product you want to add.
                </p>
                <div className="flex flex-col gap-3">
                  {CATEGORIES.map((c) => {
                    const cc = CC[c.color];
                    const sel = form.type === c.value;
                    return (
                      <button
                        key={c.value}
                        onClick={() =>
                          handleChange({
                            target: { name: "type", value: c.value },
                          })
                        }
                        className={`flex items-center gap-4 p-4 rounded-2xl border-2 text-left transition-all duration-200 group
                          ${sel ? `${cc.bg} ${cc.border}` : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"}`}
                      >
                        <div
                          className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 transition-all
                          ${sel ? "bg-white shadow-md" : "bg-slate-100 group-hover:bg-white group-hover:shadow-sm"}`}
                        >
                          {c.emoji}
                        </div>
                        <div className="flex-1">
                          <p
                            className={`font-bold text-sm ${sel ? cc.text : "text-slate-700"}`}
                          >
                            {c.label}
                          </p>
                          <p className="text-xs text-slate-400 mt-0.5">
                            {c.desc}
                          </p>
                        </div>
                        <div
                          className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all
                          ${sel ? `${cc.btn.split(" ")[0]} border-transparent` : "border-slate-200"}`}
                        >
                          {sel && (
                            <FiCheck
                              size={11}
                              strokeWidth={3}
                              className="text-white"
                            />
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* STEP 2 */}
            {step === 2 && !completed && cat && (
              <motion.div
                key="step2"
                {...slide(direction)}
                className="px-6 py-6 space-y-7"
              >
                {/* category badge */}
                <span
                  className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold ${accent.badge}`}
                >
                  {cat.emoji} {cat.label}
                </span>

                {/* basic info */}
                <Section title="Product Information" icon={<FiTag size={13} />}>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FieldInput
                      label="Product Name"
                      name="name"
                      value={form.name}
                      onChange={handleChange}
                      placeholder="e.g. Rayban RB3025"
                      required
                    />
                    <FieldInput
                      label="Brand"
                      name="brand"
                      value={form.brand}
                      onChange={handleChange}
                      placeholder="e.g. Rayban, Oakley…"
                    />
                    <div className="sm:col-span-2">
                      <FieldInput
                        label="Description"
                        name="description"
                        value={form.description}
                        onChange={handleChange}
                        placeholder="Short product description…"
                      />
                    </div>
                  </div>
                </Section>

                {/* price */}
                <Section title="Price" icon={<FiDollarSign size={13} />}>
                  <div className="max-w-xs">
                    <FieldInput
                      label="Price (₫)"
                      name="price"
                      type="number"
                      value={form.price}
                      onChange={handleChange}
                      placeholder="0"
                      suffix="₫"
                      required
                    />
                  </div>
                </Section>

                {/* variants */}
                <Section
                  title="Variants"
                  icon={<FiBox size={13} />}
                  hint={`${doneCount} / ${form.variants.length} verified`}
                >
                  <div className="flex flex-col gap-3">
                    <AnimatePresence>
                      {form.variants.map((v, i) => (
                        <VariantCard
                          key={i}
                          variant={v}
                          index={i}
                          cat={cat}
                          onChange={handleVariantChange}
                          onMarkDone={markVariantDone}
                          onEdit={() => editVariant(i)}
                          onDelete={
                            form.variants.length > 1
                              ? () => removeVariant(i)
                              : null
                          }
                        />
                      ))}
                    </AnimatePresence>

                    <button
                      onClick={addVariant}
                      className={`flex items-center justify-center gap-2 py-3 rounded-2xl border-2 border-dashed text-sm font-bold transition-all ${accent.dashed}`}
                    >
                      <FiPlus size={14} /> Add Variant
                    </button>
                  </div>
                </Section>

                {/* preview */}
                {form.variants.some((v) => v.image) && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="p-4 rounded-2xl bg-slate-50 border border-slate-200"
                  >
                    <div className="flex gap-3 overflow-x-auto mb-3">
                      {form.variants.map((v, i) =>
                        v.image ? (
                          <img
                            key={i}
                            src={v.image}
                            alt=""
                            className="w-16 h-16 object-cover rounded-xl border border-slate-200 shadow-sm flex-shrink-0"
                            onError={(e) => (e.target.style.display = "none")}
                          />
                        ) : null,
                      )}
                    </div>

                    <div>
                      <p className="text-sm font-bold text-slate-700">
                        {form.name || "Product Name"}
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {cat.label}
                      </p>
                      <p className={`text-sm font-bold mt-1 ${accent.text}`}>
                        {form.price
                          ? Number(form.price).toLocaleString("vi-VN") + " ₫"
                          : "—"}
                      </p>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            )}

            {/* STEP 3 — done */}
            {completed && (
              <motion.div
                key="done"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                className="flex flex-col items-center justify-center text-center py-16 px-8"
              >
                <div className="relative mb-6">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-xl shadow-emerald-200">
                    <FiCheck
                      size={34}
                      className="text-white"
                      strokeWidth={2.5}
                    />
                  </div>
                  <div className="absolute -top-1 -right-1 w-7 h-7 rounded-full bg-yellow-400 flex items-center justify-center shadow-md text-sm">
                    ✨
                  </div>
                </div>
                <h3 className="text-xl font-extrabold text-slate-800 mb-2">
                  Successfully added!
                </h3>
                <p className="text-sm text-slate-400 mb-8 max-w-xs leading-relaxed">
                  Product has been saved. You can continue adding others.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={resetForm}
                    className="px-5 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl text-sm font-bold hover:opacity-90 transition-opacity shadow-lg shadow-blue-200"
                  >
                    Add Another Products
                  </button>
                  <button
                    onClick={onClose}
                    className="px-5 py-2.5 border-2 border-slate-200 rounded-xl text-sm font-semibold text-slate-500 hover:bg-slate-50 transition-colors"
                  >
                    Close
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── Footer ── */}
        {!completed && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/60">
            <div>
              {step > 1 && (
                <button
                  onClick={() => go(step - 1)}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-slate-500 border-2 border-slate-200 rounded-xl hover:bg-white transition-colors"
                >
                  <FiArrowLeft size={13} /> Back
                </button>
              )}
            </div>
            <div className="flex items-center gap-4">
              {/* animated dots */}
              <div className="flex gap-1.5">
                {[1, 2].map((s) => (
                  <div
                    key={s}
                    className={`rounded-full transition-all duration-300 ${step === s ? "w-5 h-2 bg-blue-500" : "w-2 h-2 bg-slate-200"}`}
                  />
                ))}
              </div>
              {step === 1 && (
                <button
                  disabled={!canNext}
                  onClick={() => go(2)}
                  className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl text-sm font-bold hover:opacity-90 transition-opacity shadow-md shadow-blue-200 disabled:opacity-30 disabled:pointer-events-none"
                >
                  Next <FiArrowRight size={13} />
                </button>
              )}
              {step === 2 && (
                <button
                  disabled={!canNext}
                  onClick={handleSubmit}
                  className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl text-sm font-bold hover:opacity-90 transition-opacity shadow-md shadow-blue-200 disabled:opacity-30 disabled:pointer-events-none"
                >
                  <FiCheck size={13} strokeWidth={3} /> Complete
                </button>
              )}
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   SECTION
───────────────────────────────────────────── */
function Section({ title, icon, hint, children }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-slate-400">{icon}</span>
          <h3 className="text-sm font-extrabold text-slate-700 uppercase tracking-wide">
            {title}
          </h3>
        </div>
        {hint && (
          <span className="text-xs text-slate-400 font-semibold">{hint}</span>
        )}
      </div>
      {children}
    </div>
  );
}

/* ─────────────────────────────────────────────
   FIELD INPUT
───────────────────────────────────────────── */
function FieldInput({ label, icon, suffix, required, ...props }) {
  return (
    <div className="group">
      <label className="flex items-center gap-1 text-[11px] font-bold text-slate-400 mb-1.5 uppercase tracking-widest">
        {label}
        {required && (
          <span className="text-blue-400 normal-case tracking-normal font-semibold">
            *
          </span>
        )}
      </label>
      <div className="relative">
        {icon && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-400 transition-colors pointer-events-none">
            {icon}
          </span>
        )}
        <input
          {...props}
          className={`w-full border-2 border-slate-200 rounded-xl text-sm py-2.5 bg-white
            text-slate-700 placeholder-slate-300
            focus:outline-none focus:border-blue-400
            hover:border-slate-300 transition-colors
            ${icon ? "pl-9 pr-4" : suffix ? "pl-4 pr-10" : "px-4"}`}
        />
        {suffix && (
          <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-300 text-xs font-bold pointer-events-none">
            {suffix}
          </span>
        )}
      </div>
    </div>
  );
}

export default AddProductModal;
