import { useState } from "react";
import { useNavigate } from "react-router-dom";
const frames = [
  {
    id: "f1",
    name: "Aero Classic",
    brand: "OptiCo",
    price: 129,
    image: "/src/image/img1.png",
  },
  {
    id: "f2",
    name: "Urban Edge",
    brand: "VisionX",
    price: 149,
    image: "/src/image/images.jpg",
  },
];

export default function FrameSelectionPage() {
  const [selectedFrame, setSelectedFrame] = useState(null);
  const navigate = useNavigate();

  return (
    <div className="min-h-screen px-8 py-10">
      <h1 className="text-2xl font-semibold mb-6">
        Choose Your Frame
      </h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {frames.map(frame => (
          <button
            key={frame.id}
            onClick={() => setSelectedFrame(frame.id)}
            className={`border rounded-lg p-4 text-left transition
              ${
                selectedFrame === frame.id
                  ? "border-blue-600 ring-2 ring-blue-400"
                  : "border-gray-200 hover:border-gray-400"
              }`}
          >
            <img
              src={frame.image}
              alt={frame.name}
              className="h-32 w-full object-contain mb-4"
            />

            <div className="font-medium">{frame.name}</div>
            <div className="text-sm text-gray-500">{frame.brand}</div>
            <div className="mt-2 font-semibold">${frame.price}</div>
          </button>
        ))}
      </div>

      <div className="flex justify-end mt-8">
        <button
          disabled={!selectedFrame}
          onClick={() => navigate("/prescription")}
          className="bg-blue-600 text-white px-6 py-2 rounded disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  );
}
