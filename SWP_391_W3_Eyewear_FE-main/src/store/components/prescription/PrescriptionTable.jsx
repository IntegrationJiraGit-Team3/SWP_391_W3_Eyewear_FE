const generateOptions = (min, max, step) => {
  const options = [];
  for (let i = min; i <= max; i += step) {
    options.push(i.toFixed(2));
  }
  return options;
};

const sphOptions = generateOptions(-10.0, 8.0, 0.25);
const cylOptions = generateOptions(-6.0, 0, 0.25);
const axisOptions = Array.from({ length: 181 }, (_, i) => i);
const addOptions = generateOptions(0, 4.0, 0.25);


export default function PrescriptionTable({ form, errors, updateEye }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-stone-50 border-stone-200">
              <th className="px-4 py-3 text-left font-semibold text-stone-700 uppercase tracking-wider text-[10px]"></th>
              <th className="px-4 py-3 text-center font-semibold text-stone-700 uppercase tracking-wider text-[10px]">SPH</th>
              <th className="px-4 py-3 text-center font-semibold text-stone-700 uppercase tracking-wider text-[10px]">CYL</th>
              <th className="px-4 py-3 text-center font-semibold text-stone-700 uppercase tracking-wider text-[10px]">AXIS</th>
              <th className="px-4 py-3 text-center font-semibold text-stone-700 uppercase tracking-wider text-[10px]">ADD</th>

            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            <EyeRow 
              label="OD (Right)" 
              eye="right" 
              form={form} 
              errors={errors} 
              updateEye={updateEye} 
            />
            <EyeRow 
              label="OS (Left)" 
              eye="left" 
              form={form} 
              errors={errors} 
              updateEye={updateEye} 
            />
          </tbody>
        </table>
      </div>
    </div>
  );
}

function EyeRow({ label, eye, form, errors, updateEye }) {
  const data = form[eye];

  return (
    <tr className="hover:bg-stone-50/50 transition-colors">
      <td className="px-4 py-6">
        <span className="font-semibold text-stone-800">{label}</span>
      </td>

      <td className="px-2 py-4">
        <Cell 
          value={data.sph} 
          onChange={(v) => updateEye(eye, "sph", v)} 
          options={sphOptions} 
          error={errors[eye + "Sph"]} 
          placeholder="Sphere"
        />
      </td>
      <td className="px-2 py-4">
        <Cell 
          value={data.cyl} 
          onChange={(v) => updateEye(eye, "cyl", v)} 
          options={cylOptions} 
          placeholder="Cylinder"
        />
      </td>
      <td className="px-2 py-4">
        <Cell 
          value={data.axis} 
          onChange={(v) => updateEye(eye, "axis", v)} 
          options={axisOptions} 
          error={errors[eye + "Axis"]} 
          placeholder="Axis"
        />
      </td>
      <td className="px-2 py-4">
        <Cell 
          value={data.add} 
          onChange={(v) => updateEye(eye, "add", v)} 
          options={addOptions} 
          placeholder="Add"
        />
      </td>

    </tr>
  );
}

function Cell({ value, onChange, options, error, placeholder }) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full bg-white border ${error ? "border-red-400 focus:ring-red-100" : "border-stone-200 focus:ring-stone-100"} rounded-lg px-2 py-2.5 text-xs text-stone-800 focus:outline-none focus:ring-4 transition-all appearance-none cursor-pointer`}
      >
        <option value="">{placeholder || "--"}</option>
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt > 0 ? `+${opt}` : opt}
          </option>
        ))}
      </select>
      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-stone-400">
        <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"/></svg>
      </div>

      {error && (
        <p className="absolute -bottom-5 left-0 text-[9px] text-red-500 font-medium whitespace-nowrap">
          {error}
        </p>
      )}
    </div>
  );
}