export default function FrameSummary({ product, variantId }) {
  if (!product) return null;
  const variant = product.variants?.find(v => String(v.variantId) === String(variantId)) || product.variants?.[0] || {};

  return (
    <div className="bg-white rounded-lg p-6 h-fit border border-gray-100 shadow-sm">
      <div className="relative aspect-video mb-6 rounded-xl overflow-hidden bg-gray-50 border border-gray-100">
        <img
          src={variant.imageUrl || "/frames/sample.png"}
          alt={product.name}
          className="w-full h-full object-contain"
          onError={(e) => { e.target.src = "https://placehold.co/300?text=Product+Image"; }}
        />
      </div>

      <div className="space-y-1 mb-4">
        <p className="text-[10px] text-gray-400 uppercase tracking-[0.2em] font-medium font-sans">Frame</p>
        <p className="font-semibold text-gray-800 text-lg leading-tight">{product.name}</p>
        <p className="text-sm text-gray-500">{product.brand} {variant.color ? `· ${variant.color}` : ""}</p>
      </div>

      <div className="h-px bg-gray-100 my-5" />

      <div className="space-y-1 mb-6">
        <p className="text-[10px] text-gray-400 uppercase tracking-[0.2em] font-medium font-sans">Prescription</p>
        <p className="text-sm font-medium text-indigo-600">Category: Prescription Lens</p>
      </div>

      <div className="mt-8 pt-4 border-t border-gray-100 flex justify-between items-end">
        <div>
          <p className="text-[10px] text-gray-400 uppercase tracking-wider font-medium mb-1">Subtotal</p>
          <span className="font-bold text-2xl text-blue-600">
            {(variant.price || product.price || 0).toLocaleString("en-US")}
            <span className="text-sm ml-1">₫</span>
          </span>
        </div>
      </div>
    </div>
  );
}