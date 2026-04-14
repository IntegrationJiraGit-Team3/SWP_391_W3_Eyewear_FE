const pdOptions = Array.from({ length: 41 }, (_, i) => i + 40);

export default function PDSection({ form, errors, updateField }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
      <h3 className="text-sm font-semibold text-stone-800 uppercase tracking-wider mb-4 border-b border-stone-50 pb-3 flex items-center justify-between">
        Pupillary Distance (PD)
        <span className="text-[10px] text-indigo-500 font-normal lowercase tracking-normal">Pupillary Distance</span>
      </h3>

      <div className="flex flex-col sm:flex-row gap-6 sm:items-center">
        <div className="relative flex-1 max-w-[200px]">
          <select
            value={form.pd}
            onChange={(e) => updateField("pd", e.target.value)}
            className={`w-full bg-stone-50 border ${errors.pd ? "border-red-400 focus:ring-red-100" : "border-stone-200 focus:ring-indigo-100"} rounded-lg px-4 py-3 text-sm text-stone-800 focus:outline-none focus:ring-4 transition-all appearance-none cursor-pointer`}
          >
            <option value="">Select PD (mm)</option>
            {pdOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt} mm
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-stone-400">
            <svg className="h-5 w-5 fill-current" viewBox="0 0 20 20">
              <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
            </svg>
          </div>
          {errors.pd && (
            <p className="absolute -bottom-5 left-0 text-[10px] text-red-500 font-medium">
              {errors.pd}
            </p>
          )}
        </div>


      </div>

      <div className="mt-6 bg-blue-50 rounded-lg p-4 border border-blue-100">
        <p className="text-[11px] text-blue-700 leading-relaxed italic">
          * PD is the distance between the centers of your pupils. If you don't know it, you can measure it with a ruler or ask your eye doctor.
        </p>
      </div>
    </div>
  );
}