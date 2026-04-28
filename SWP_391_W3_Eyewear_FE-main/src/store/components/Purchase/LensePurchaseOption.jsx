import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function LensPurchaseOptions({ product }) {

  const [type, setType] = useState("lens");
  const navigate = useNavigate();

  const handleContinue = () => {

    if (type === "lens") {
      // add lens to cart
    }

    if (type === "prescription") {
      navigate(`/prescription/${product.id}`);
    }

  };

  return (
    <div className="mt-6">

      <h3 className="font-semibold mb-2">Lens Options</h3>

      <label className="flex gap-2">
        <input
          type="radio"
          value="lens"
          checked={type === "lens"}
          onChange={(e) => setType(e.target.value)}
        />
        Lens Only
      </label>

      <label className="flex gap-2">
        <input
          type="radio"
          value="prescription"
          checked={type === "prescription"}
          onChange={(e) => setType(e.target.value)}
        />
        With Prescription
      </label>

      <button
        onClick={handleContinue}
        className="mt-4 w-full bg-black text-white py-3 rounded-lg"
      >
        Continue
      </button>

    </div>
  );
}