import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function FramePurchaseOptions({ product }) {

  const [type, setType] = useState("frame");
  const navigate = useNavigate();

  const handleContinue = () => {

    if (type === "frame") {
      // add frame to cart
    }

    if (type === "lens") {
      navigate(`/lens-options/${product.id}`);
    }

    if (type === "prescription") {
      navigate(`/prescription/${product.id}`);
    }

  };

  return (
    <div className="mt-6">

      <h3 className="font-semibold mb-2">Purchase Options</h3>

      <div className="flex flex-col gap-2">

        <label className="flex gap-2">
          <input
            type="radio"
            value="frame"
            checked={type === "frame"}
            onChange={(e) => setType(e.target.value)}
          />
          Frame Only
        </label>

        <label className="flex gap-2">
          <input
            type="radio"
            value="lens"
            checked={type === "lens"}
            onChange={(e) => setType(e.target.value)}
          />
          Frame + Lens
        </label>

        <label className="flex gap-2">
          <input
            type="radio"
            value="prescription"
            checked={type === "prescription"}
            onChange={(e) => setType(e.target.value)}
          />
          Frame + Prescription
        </label>

      </div>

      <button
        onClick={handleContinue}
        className="mt-4 w-full bg-black text-white py-3 rounded-lg"
      >
        Continue
      </button>

    </div>
  );
}